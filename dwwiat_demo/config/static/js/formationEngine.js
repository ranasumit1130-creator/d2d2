import {
    cep,
    flightTime,
    fuelConsumption,
    kineticEnergy,
    joulesToTNT,
    totalEnergyTNT,
    terminalVelocity,
    fragmentVelocity,
    fragmentRange,
    thermalRadius,
    craterRadius,
    craterDepth,
    damageZones,
    overpressure,
    overpressureCurve,
} from './physics.js';

const BASE_CEP_BY_GUIDANCE = { gps: 12, ai: 4, ir: 20, radar: 10 };
const ATTACK_ROLES = new Set(['attack', 'kamikaze', 'atk']);
const SUPPORT_ISR_ROLES = new Set(['surveillance', 'rec']);
const SUPPORT_EW_ROLES = new Set(['ew', 'decoy', 'dec']);

function _normRole(role) {
    return String(role ?? '').trim().toLowerCase();
}

// ------------------------
// MAPPERS (DB -> Engine)
// ------------------------

export function mapDroneToEngine(myDbDrone) {
    const guidance = String(myDbDrone.guidance_system ?? 'gps').toLowerCase();
    const massKg = Number(myDbDrone.weight_kg ?? 0);
    const payloadKg = Number(myDbDrone.payload_capacity_kg ?? 0);

    return {
        id: myDbDrone.id,
        name: myDbDrone.name,
        role: String(myDbDrone.category ?? '').toLowerCase(),
        massKg,
        cruiseMs: Number(myDbDrone.cruise_speed_kmh ?? 0) / 3.6,
        maxSpeedMs: Number(myDbDrone.max_speed_kmh ?? 0) / 3.6,
        rangeKm: Number(myDbDrone.max_range_km ?? 0),
        serviceAltM: Number(myDbDrone.service_ceiling_m ?? 0),
        enduranceHours: Number(myDbDrone.endurance_hours ?? 0),
        payloadKg,
        payloadTNTkg: Number(myDbDrone.warhead_weight_kg ?? 0),
        casingKg: Math.max(massKg - payloadKg, massKg * 0.25),
        guidanceType: guidance,
        baseCEP_m: BASE_CEP_BY_GUIDANCE[guidance] ?? 14,
        stealthRating: Number(myDbDrone.stealth_rating ?? 5),
        antiJamPct: Number(myDbDrone.anti_jam_resistance_pct ?? 0),
        aiEnabled: Boolean(myDbDrone.ai_enabled),
        baseSuccessRate: Number(myDbDrone.base_success_rate_pct ?? 70) / 100,
        evasionProbability: Number(myDbDrone.evasion_probability_pct ?? 30) / 100,
        radarCrossSection: Number(myDbDrone.radar_cross_section ?? 1),
        unitCostUSD: Number(myDbDrone.unit_cost_usd ?? 0),
        launchCostUSD: Number(myDbDrone.launch_cost_usd ?? 0),
        fuelRateKgH: Math.max(massKg * 0.045, 0.2),
    };
}

export function mapTargetToEngine(myDbTarget) {
    const details = myDbTarget.details ?? {};
    const typeRaw = String(details.type ?? 'SOFT').toUpperCase();
    const ctrCapScale = Math.max(0, Math.min(5, Number(details.ctr_cap_scale ?? 0)));
    const hardness = typeRaw === 'HARD' ? 0.85 : 0.35;

    return {
        id: myDbTarget.id,
        name: myDbTarget.name,
        latitude: Number(myDbTarget.lat ?? myDbTarget.latitude ?? 0),
        longitude: Number(myDbTarget.lon ?? myDbTarget.longitude ?? 0),
        hardness,
        airDefenseLevel: ctrCapScale / 5,
        targetType: typeRaw,
        dimensions: {
            width: Number(details.width ?? 0),
            length: Number(details.length ?? 0),
            height: Number(details.height ?? 0),
        },
        disposition: String(details.disposition ?? 'static').toLowerCase(),
    };
}

function _requiredOverpressureKPa(targetProfile) {
    const hardness = Math.max(0, Math.min(1, Number(targetProfile.hardness ?? 0.5)));
    return 35 + hardness * 265;
}

function _filterByRange(droneInventory, distanceKm) {
    return (droneInventory ?? []).filter((d) => Number(d.rangeKm ?? 0) >= distanceKm);
}

function _weightedAvgCEP(attackDrones, distanceKm) {
    const weighted = attackDrones.map((d) => {
        const tnt = Number(d.payloadTNTkg ?? 0);
        return { w: tnt, v: cep(Number(d.baseCEP_m ?? 12), distanceKm, d.guidanceType) };
    });
    const sumW = weighted.reduce((s, x) => s + x.w, 0);
    if (sumW <= 0) return null;
    return weighted.reduce((s, x) => s + x.v * (x.w / sumW), 0);
}

function _etaSeconds(allDrones, distanceKm) {
    const speedKmh = Math.min(...allDrones.map((d) => (d.cruiseMs ?? 0) * 3.6).filter((v) => v > 0));
    if (!Number.isFinite(speedKmh)) return null;
    return flightTime(distanceKm, speedKmh);
}

function _effectiveness(totalTNT, requiredKPa, targetProfile, avgCep, attackCount) {
    const representativeRadius = 25 + (targetProfile.hardness ?? 0.5) * 35;
    const achievedKPa = overpressure(totalTNT, representativeRadius);
    const pressureScore = Math.min(65, (achievedKPa / requiredKPa) * 65);
    const cepScore = avgCep == null ? 8 : Math.max(0, 20 - avgCep * 0.12);
    const saturationScore = Math.min(15, attackCount * 2.5);
    const airDefensePenalty = (targetProfile.airDefenseLevel ?? 0) * 20;
    return Math.max(0, Math.min(100, pressureScore + cepScore + saturationScore - airDefensePenalty));
}

function _riskLevel(targetProfile, allDrones) {
    const ads = targetProfile.airDefenseLevel ?? 0;
    const avgStealth = allDrones.length
        ? allDrones.reduce((s, d) => s + Number(d.stealthRating ?? 5), 0) / allDrones.length
        : 5;
    const risk = ads * 1.25 - avgStealth / 10;
    if (risk < -0.1) return 'LOW';
    if (risk < 0.22) return 'MODERATE';
    return 'HIGH';
}

function _buildStats(attackDrones, supportDrones, targetProfile, distanceKm) {
    const totalTNT = attackDrones.reduce((s, d) => s + Number(d.payloadTNTkg ?? 0), 0);
    const avgCEP = _weightedAvgCEP(attackDrones, distanceKm);
    const all = [...attackDrones, ...supportDrones];
    const etaSec = _etaSeconds(all, distanceKm);
    const requiredKPa = _requiredOverpressureKPa(targetProfile);
    return {
        totalTNT: +totalTNT.toFixed(3),
        avgCEP_m: avgCEP == null ? null : +avgCEP.toFixed(2),
        effectiveness: +_effectiveness(totalTNT, requiredKPa, targetProfile, avgCEP, attackDrones.length).toFixed(1),
        ETA: etaSec == null ? '—' : `${Math.floor(etaSec / 60)}m ${Math.round(etaSec % 60)}s`,
        zones: damageZones(totalTNT),
        riskLevel: _riskLevel(targetProfile, all),
    };
}

function _pickUnique(pool, usedIds, limit, predicate = () => true) {
    const out = [];
    for (const d of pool) {
        if (out.length >= limit) break;
        if (usedIds.has(d.instanceId ?? `${d.id}`)) continue;
        if (!predicate(d)) continue;
        usedIds.add(d.instanceId ?? `${d.id}`);
        out.push(d);
    }
    return out;
}

function _precisionStrike(eligible, targetProfile, distanceKm) {
    const requiredKPa = _requiredOverpressureKPa(targetProfile);
    const threshold = requiredKPa * 1.2;
    const requiredRadius = 25 + (targetProfile.hardness ?? 0.5) * 35;

    const attackPool = eligible
        .filter((d) => ATTACK_ROLES.has(_normRole(d.role)))
        .sort((a, b) => (b.payloadTNTkg ?? 0) - (a.payloadTNTkg ?? 0));

    const used = new Set();
    const attackDrones = [];
    let totalTNT = 0;
    for (const d of attackPool) {
        attackDrones.push(d);
        used.add(d.instanceId ?? `${d.id}`);
        totalTNT += Number(d.payloadTNTkg ?? 0);
        if (overpressure(totalTNT, requiredRadius) >= threshold) break;
    }

    const supportDrones = _pickUnique(
        eligible,
        used,
        2,
        (d) => SUPPORT_EW_ROLES.has(_normRole(d.role)) || SUPPORT_ISR_ROLES.has(_normRole(d.role)),
    );

    return {
        name: 'PRECISION STRIKE',
        attackDrones,
        supportDrones,
        stats: _buildStats(attackDrones, supportDrones, targetProfile, distanceKm),
    };
}

function _saturationAssault(eligible, targetProfile, distanceKm) {
    const attackPool = eligible
        .filter((d) => ATTACK_ROLES.has(_normRole(d.role)))
        .sort((a, b) => (b.payloadTNTkg ?? 0) - (a.payloadTNTkg ?? 0));

    const used = new Set();
    const attackDrones = _pickUnique(attackPool, used, Math.min(Math.max(6, Math.ceil(attackPool.length * 0.55)), 12));

    const supportDrones = [];
    const ewSlots = (targetProfile.airDefenseLevel ?? 0) > 0.3 ? 3 : 1;
    supportDrones.push(..._pickUnique(eligible, used, ewSlots, (d) => SUPPORT_EW_ROLES.has(_normRole(d.role))));
    supportDrones.push(..._pickUnique(eligible, used, 3, (d) => SUPPORT_ISR_ROLES.has(_normRole(d.role))));

    return {
        name: 'SATURATION ASSAULT',
        attackDrones,
        supportDrones,
        stats: _buildStats(attackDrones, supportDrones, targetProfile, distanceKm),
    };
}

function _shadowReconStrike(eligible, targetProfile, distanceKm) {
    const attackPool = eligible
        .filter((d) => ATTACK_ROLES.has(_normRole(d.role)))
        .sort((a, b) => {
            const aCEP = cep(a.baseCEP_m ?? 12, distanceKm, a.guidanceType);
            const bCEP = cep(b.baseCEP_m ?? 12, distanceKm, b.guidanceType);
            const aScore = (a.guidanceType === 'ai' ? 2 : 1) / Math.max(aCEP, 1);
            const bScore = (b.guidanceType === 'ai' ? 2 : 1) / Math.max(bCEP, 1);
            return bScore - aScore;
        });

    const used = new Set();
    const attackDrones = _pickUnique(attackPool, used, Math.min(4, attackPool.length));

    const supportDrones = [];
    supportDrones.push(..._pickUnique(eligible, used, 4, (d) => SUPPORT_ISR_ROLES.has(_normRole(d.role))));
    if ((targetProfile.airDefenseLevel ?? 0) > 0.2) {
        supportDrones.push(..._pickUnique(eligible, used, 1, (d) => SUPPORT_EW_ROLES.has(_normRole(d.role))));
    }

    return {
        name: 'SHADOW RECON STRIKE',
        attackDrones,
        supportDrones,
        stats: _buildStats(attackDrones, supportDrones, targetProfile, distanceKm),
    };
}

export function suggestFormations(targetProfile, droneInventory, distanceKm) {
    const eligible = _filterByRange(droneInventory, distanceKm);
    const noReach = (name) => ({
        name,
        attackDrones: [],
        supportDrones: [],
        stats: {
            totalTNT: 0,
            avgCEP_m: null,
            effectiveness: 0,
            ETA: '—',
            zones: damageZones(0),
            riskLevel: 'HIGH',
        },
        error: 'No drones in inventory can reach this target.',
    });

    if (!eligible.length) {
        return {
            PRECISION_STRIKE: noReach('PRECISION STRIKE'),
            SATURATION_ASSAULT: noReach('SATURATION ASSAULT'),
            SHADOW_RECON_STRIKE: noReach('SHADOW RECON STRIKE'),
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

    const perDrone = allDrones.map((d) => {
        const cruiseKmh = Math.max((d.cruiseMs ?? 0) * 3.6, 1);
        const tSec = flightTime(distanceKm, cruiseKmh);
        const fuelBurnKg = fuelConsumption(d.fuelRateKgH ?? (d.massKg ?? 0) * 0.045, tSec);
        const massOnImpact = Math.max((d.massKg ?? 0) - fuelBurnKg, (d.massKg ?? 0) * 0.2);
        const impactVelocity = terminalVelocity(d.cruiseMs ?? 0, d.serviceAltM ?? 0);
        const ke = kineticEnergy(massOnImpact, impactVelocity);
        const totalTNT = totalEnergyTNT(massOnImpact, impactVelocity, d.payloadTNTkg ?? 0);
        const fragV = fragmentVelocity(d.payloadTNTkg ?? 0, d.casingKg ?? (d.massKg ?? 0) * 0.25);

        return {
            id: d.id,
            name: d.name,
            role: d.role,
            isAttack: attackDrones.includes(d),
            massOnImpact_kg: +massOnImpact.toFixed(2),
            impactVelocity_ms: +impactVelocity.toFixed(2),
            kineticEnergy_J: +ke.toFixed(0),
            kineticEnergy_TNT_kg: +joulesToTNT(ke).toFixed(6),
            payloadTNT_kg: +(d.payloadTNTkg ?? 0).toFixed(3),
            totalTNT_kg: +totalTNT.toFixed(6),
            cep_m: +cep(d.baseCEP_m ?? 12, distanceKm, d.guidanceType).toFixed(2),
            fragmentVelocity_ms: +fragV.toFixed(2),
            flightTimeSec: +tSec.toFixed(2),
        };
    });

    const attackRows = perDrone.filter((r) => r.isAttack);
    const totalTNT = attackRows.reduce((s, r) => s + r.totalTNT_kg, 0);
    const totalKE = perDrone.reduce((s, r) => s + r.kineticEnergy_J, 0);
    const avgCEP = attackRows.length
        ? attackRows.reduce((s, r) => s + r.cep_m, 0) / attackRows.length
        : null;

    return {
        perDrone,
        combined: {
            totalTNT_kg: +totalTNT.toFixed(4),
            totalKE_joules: +totalKE.toFixed(0),
            avgCEP_m: avgCEP == null ? null : +avgCEP.toFixed(2),
            damageZones: damageZones(totalTNT),
            craterRadius_m: +craterRadius(totalTNT).toFixed(3),
            craterDepth_m: +craterDepth(totalTNT).toFixed(3),
            fragmentRange_m: +fragmentRange(totalTNT).toFixed(3),
            thermalRadius_m: +thermalRadius(totalTNT).toFixed(3),
            overpressureCurve: overpressureCurve(totalTNT),
        },
    };
}
