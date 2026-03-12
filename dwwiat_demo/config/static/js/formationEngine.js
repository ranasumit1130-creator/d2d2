import {
    cep, flightTime, fuelConsumption, kineticEnergy, joulesToTNT,
    totalEnergyTNT, terminalVelocity, fragmentVelocity, fragmentRange,
    thermalRadius, craterRadius, craterDepth, damageZones, overpressureCurve,
} from './physics.js';

// ── MAPPERS ──

const _BASE_CEP = { gps: 10, ai: 4, ir: 25, radar: 18 };

export function mapDroneToEngine(dbDrone) {
    const fuelRateKgH = dbDrone.weight_kg * 0.05;
    const casingKg = Math.max(dbDrone.weight_kg - (dbDrone.payload_capacity_kg ?? 0), dbDrone.weight_kg * 0.30);
    return {
        id: dbDrone.id, name: dbDrone.name, role: dbDrone.category,
        massKg: dbDrone.weight_kg,
        cruiseMs: dbDrone.cruise_speed_kmh / 3.6,
        maxSpeedMs: dbDrone.max_speed_kmh / 3.6,
        rangeKm: dbDrone.max_range_km,
        serviceAltM: dbDrone.service_ceiling_m,
        enduranceHours: dbDrone.endurance_hours,
        payloadKg: dbDrone.payload_capacity_kg,
        payloadTNTkg: dbDrone.warhead_weight_kg ?? 0,
        casingKg,
        guidanceType: dbDrone.guidance_system,
        baseCEP_m: _BASE_CEP[dbDrone.guidance_system] ?? 15,
        stealthRating: dbDrone.stealth_rating,
        antiJamPct: dbDrone.anti_jam_resistance_pct,
        aiEnabled: dbDrone.ai_enabled,
        baseSuccessRate: dbDrone.base_success_rate_pct / 100,
        evasionProbability: dbDrone.evasion_probability_pct / 100,
        radarCrossSection: dbDrone.radar_cross_section,
        unitCostUSD: dbDrone.unit_cost_usd,
        launchCostUSD: dbDrone.launch_cost_usd,
        fuelRateKgH,
    };
}

export function mapTargetToEngine(dbTarget, configOpts = {}) {
    const _HARDNESS = { low: 0.2, medium: 0.5, high: 0.9 };
    const _ADS_LEVEL = { none: 0.0, low: 0.2, medium: 0.5, high: 0.85 };
    const _MOBILITY = { fixed: 0.0, area: 0.25, mobile: 1.0 };
    const protectionLevel = configOpts.protection_level ?? 'medium';
    const adsDensityKey = configOpts.ads_density ?? 'medium';
    const adsPlacements = configOpts.ads_placement_count ?? 0;
    const airDefenseLevel = adsPlacements > 0
        ? Math.min(adsPlacements / 10, 1.0)
        : (_ADS_LEVEL[adsDensityKey] ?? 0.5);
    return {
        name: dbTarget.name, latitude: dbTarget.latitude, longitude: dbTarget.longitude,
        targetType: dbTarget.target_type,
        category: configOpts.category ?? 'FIXED',
        hardness: _HARDNESS[protectionLevel] ?? 0.5,
        airDefenseLevel,
        mobilityFactor: _MOBILITY[dbTarget.target_type] ?? 0,
    };
}

// ── INTERNAL HELPERS ──

function _requiredTNT(hardness) {
    if (hardness < 0.33) return 25;
    if (hardness < 0.67) return 200;
    return 2000;
}

function _inRange(inventory, distKm) {
    return inventory.filter(d => d.rangeKm >= distKm);
}

function _weightedCEP(drones, distKm) {
    const totalTNT = drones.reduce((s, d) => s + (d.payloadTNTkg ?? 0), 0);
    if (totalTNT === 0) return Infinity;
    return drones.reduce((s, d) =>
        s + cep(d.baseCEP_m, distKm, d.guidanceType) * ((d.payloadTNTkg ?? 0) / totalTNT), 0);
}

function _avgStealth(drones) {
    if (!drones.length) return 5;
    return drones.reduce((s, d) => s + (d.stealthRating ?? 5), 0) / drones.length;
}

function _effectiveness(totalTNT, required, airDefenseLevel, avgStealth) {
    const tntScore = Math.min((totalTNT / required) * 60, 60);
    const stealthBonus = (avgStealth / 10) * 20;
    const adsPenalty = airDefenseLevel * 30;
    return Math.max(0, Math.min(100, tntScore + stealthBonus - adsPenalty));
}

function _riskLevel(airDefenseLevel, avgStealth) {
    const risk = airDefenseLevel - avgStealth / 10;
    if (risk < -0.2) return 'LOW';
    if (risk < 0.2) return 'MODERATE';
    if (risk < 0.5) return 'HIGH';
    return 'CRITICAL';
}

function _etaString(drones, distKm) {
    if (!drones.length) return '—';
    const minSpeedKmh = Math.min(...drones.map(d => d.cruiseMs * 3.6));
    const sec = Math.round(flightTime(distKm, minSpeedKmh));
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function _stats(attackDrones, supportDrones, distKm, required, airDefenseLevel) {
    const totalTNT = attackDrones.reduce((s, d) => s + (d.payloadTNTkg ?? 0), 0);
    const avgStealth = _avgStealth([...attackDrones, ...supportDrones]);
    const avgCEP = attackDrones.length ? _weightedCEP(attackDrones, distKm) : Infinity;
    return {
        totalTNT: +totalTNT.toFixed(3),
        avgCEP_m: avgCEP === Infinity ? null : +avgCEP.toFixed(1),
        effectiveness: +_effectiveness(totalTNT, required, airDefenseLevel, avgStealth).toFixed(1),
        ETA: _etaString([...attackDrones, ...supportDrones], distKm),
        zones: damageZones(totalTNT),
        riskLevel: _riskLevel(airDefenseLevel, avgStealth),
    };
}

// ── FORMATION BUILDERS ──

function _precisionStrike(eligible, target, distKm) {
    const required = _requiredTNT(target.hardness);
    const candidates = eligible
        .filter(d => ['attack', 'kamikaze', 'ATK'].includes(d.role))
        .sort((a, b) => (b.payloadTNTkg ?? 0) - (a.payloadTNTkg ?? 0));
    const attackDrones = [];
    let tntAcc = 0;
    for (const d of candidates) {
        attackDrones.push(d);
        tntAcc += d.payloadTNTkg ?? 0;
        if (tntAcc >= required * 1.2) break;
    }
    const supportDrones = [];
    const com = eligible.find(d => ['COM', 'ew'].includes(d.role));
    const nav = eligible.find(d => d.role === 'NAV');
    if (com) supportDrones.push(com);
    if (nav) supportDrones.push(nav);
    return {
        name: 'PRECISION STRIKE', attackDrones, supportDrones,
        stats: _stats(attackDrones, supportDrones, distKm, required, target.airDefenseLevel),
    };
}

function _saturationAssault(eligible, target, distKm) {
    const required = _requiredTNT(target.hardness);
    const attackCandidates = eligible
        .filter(d => ['attack', 'kamikaze', 'ATK'].includes(d.role))
        .sort((a, b) => (b.payloadTNTkg ?? 0) - (a.payloadTNTkg ?? 0));
    const attackDrones = [];
    let tntAcc = 0;
    for (const d of attackCandidates) {
        attackDrones.push(d);
        tntAcc += d.payloadTNTkg ?? 0;
        if (tntAcc >= required * 2.5) break;
    }
    const supportDrones = [];
    if (target.airDefenseLevel > 0.3) {
        eligible.filter(d => ['DEC', 'surveillance'].includes(d.role)).slice(0, 3).forEach(d => supportDrones.push(d));
    }
    if (target.airDefenseLevel > 0.5) {
        eligible.filter(d => ['EW', 'ew'].includes(d.role)).slice(0, 2).forEach(d => supportDrones.push(d));
    }
    const com = eligible.find(d => d.role === 'COM');
    if (com) supportDrones.push(com);
    return {
        name: 'SATURATION ASSAULT', attackDrones, supportDrones,
        stats: _stats(attackDrones, supportDrones, distKm, required, target.airDefenseLevel),
    };
}

function _shadowReconStrike(eligible, target, distKm) {
    const required = _requiredTNT(target.hardness);
    const attackCandidates = eligible
        .filter(d => ['attack', 'kamikaze', 'ATK'].includes(d.role))
        .sort((a, b) => {
            const cepa = cep(a.baseCEP_m, distKm, a.guidanceType);
            const cepb = cep(b.baseCEP_m, distKm, b.guidanceType);
            return cepa - cepb;
        });
    const aiFirst = [
        ...attackCandidates.filter(d => d.aiEnabled || d.guidanceType === 'ai'),
        ...attackCandidates.filter(d => !d.aiEnabled && d.guidanceType !== 'ai'),
    ];
    const attackDrones = [];
    let tntAcc = 0;
    for (const d of aiFirst) {
        attackDrones.push(d);
        tntAcc += d.payloadTNTkg ?? 0;
        if (tntAcc >= required) break;
    }
    const supportDrones = [
        ...eligible.filter(d => ['REC', 'surveillance'].includes(d.role)).slice(0, 4),
    ];
    const cmd = eligible.find(d => d.role === 'CMD');
    if (cmd) supportDrones.push(cmd);
    return {
        name: 'SHADOW RECON STRIKE', attackDrones, supportDrones,
        stats: _stats(attackDrones, supportDrones, distKm, required, target.airDefenseLevel),
    };
}

// ── PUBLIC API ──

export function suggestFormations(targetProfile, droneInventory, distanceKm) {
    const eligible = _inRange(droneInventory, distanceKm);
    if (eligible.length === 0) {
        const none = (name) => ({
            name, attackDrones: [], supportDrones: [], stats: null,
            error: 'No drones in inventory can reach this target.',
        });
        return {
            PRECISION_STRIKE: none('PRECISION STRIKE'),
            SATURATION_ASSAULT: none('SATURATION ASSAULT'),
            SHADOW_RECON_STRIKE: none('SHADOW RECON STRIKE'),
        };
    }
    return {
        PRECISION_STRIKE: _precisionStrike(eligible, targetProfile, distanceKm),
        SATURATION_ASSAULT: _saturationAssault(eligible, targetProfile, distanceKm),
        SHADOW_RECON_STRIKE: _shadowReconStrike(eligible, targetProfile, distanceKm),
    };
}

export function computeImpact(formation, distanceKm) {
    const attackDrones = formation.attackDrones ?? [];
    const supportDrones = formation.supportDrones ?? [];
    const allDrones = [...attackDrones, ...supportDrones];

    const perDrone = allDrones.map((drone) => {
        const speedKmh = drone.cruiseMs * 3.6;
        const flightTimeSec = flightTime(distanceKm, speedKmh);
        const fuelBurned = fuelConsumption(drone.fuelRateKgH ?? drone.massKg * 0.05, flightTimeSec);
        const massOnImpact = Math.max(drone.massKg - fuelBurned, drone.massKg * 0.25);
        const impactVel = terminalVelocity(drone.cruiseMs, drone.serviceAltM ?? 500);
        const ke = kineticEnergy(massOnImpact, impactVel);
        const tnt = totalEnergyTNT(massOnImpact, impactVel, drone.payloadTNTkg ?? 0);
        const cepVal = cep(drone.baseCEP_m ?? 15, distanceKm, drone.guidanceType ?? 'gps');
        const fragVel = fragmentVelocity(tnt, drone.casingKg ?? drone.massKg * 0.30);
        return {
            id: drone.id, name: drone.name, role: drone.role,
            isAttack: attackDrones.includes(drone),
            massOnImpact_kg: +massOnImpact.toFixed(2),
            fuelBurned_kg: +fuelBurned.toFixed(2),
            impactVelocity_ms: +impactVel.toFixed(1),
            kineticEnergy_J: +ke.toFixed(0),
            kineticEnergy_TNT_kg: +joulesToTNT(ke).toFixed(4),
            payloadTNT_kg: drone.payloadTNTkg ?? 0,
            totalTNT_kg: +tnt.toFixed(4),
            cep_m: +cepVal.toFixed(1),
            fragmentVelocity_ms: +fragVel.toFixed(1),
            flightTime_sec: +flightTimeSec.toFixed(0),
        };
    });

    const attackRows = perDrone.filter(d => d.isAttack);
    const totalTNT = attackRows.reduce((s, d) => s + d.totalTNT_kg, 0);
    const totalKE = perDrone.reduce((s, d) => s + d.kineticEnergy_J, 0);
    const totalPayload = attackRows.reduce((s, d) => s + d.payloadTNT_kg, 0);
    const avgCEP = attackRows.length && totalPayload > 0
        ? attackRows.reduce((s, d) => s + d.cep_m * (d.payloadTNT_kg / totalPayload), 0)
        : null;

    return {
        perDrone,
        combined: {
            totalTNT_kg: +totalTNT.toFixed(3),
            totalKE_joules: +totalKE.toFixed(0),
            avgCEP_m: avgCEP !== null ? +avgCEP.toFixed(1) : null,
            craterRadius_m: +craterRadius(totalTNT).toFixed(1),
            craterDepth_m: +craterDepth(totalTNT).toFixed(1),
            fragmentRange_m: +fragmentRange(totalTNT).toFixed(1),
            thermalRadius_m: +thermalRadius(totalTNT).toFixed(1),
            damageZones: damageZones(totalTNT),
            overpressureCurve: overpressureCurve(totalTNT),
        },
    };
}
