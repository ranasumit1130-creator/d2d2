function _bearing(lat1, lon1, lat2, lon2) {
    const r  = Math.PI / 180;
    const p1 = lat1 * r, p2 = lat2 * r;
    const dl = (lon2 - lon1) * r;
    const y  = Math.sin(dl) * Math.cos(p2);
    const x  = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function _destPoint(lat, lon, bearingDeg, distKm) {
    const R = 6371, d = distKm / R, r = Math.PI / 180;
    const p1 = lat * r, l1 = lon * r, th = bearingDeg * r;
    const p2 = Math.asin(Math.sin(p1)*Math.cos(d) + Math.cos(p1)*Math.sin(d)*Math.cos(th));
    const l2 = l1 + Math.atan2(Math.sin(th)*Math.sin(d)*Math.cos(p1), Math.cos(d)-Math.sin(p1)*Math.sin(p2));
    return { lat: p2/r, lng: (((l2/r)+540)%360)-180 };
}

function _flightTimeSec(distKm, speedKmh) {
    return speedKmh > 0 ? (distKm / speedKmh) * 3600 : Infinity;
}

export function buildSimulationData(formation, impact, base, target, distanceKm) {
    const zones = impact.combined.damageZones;
    const outerRadius = Math.max(zones.glass??0, zones.light??0, zones.moderate??0, zones.severe??0, zones.total??0, 100);

    const pdMap = new Map();
    for (const pd of impact.perDrone) {
        if (pd.id != null) pdMap.set(String(pd.id), pd);
        if (pd.name != null) pdMap.set(pd.name, pd);
    }

    const bearingToTarget = _bearing(base.latitude, base.longitude, target.latitude, target.longitude);
    const bearingFromTarget = (bearingToTarget + 180) % 360;
    const APPROACH_KM = 2;
    const approachGeo = _destPoint(target.latitude, target.longitude, bearingFromTarget, APPROACH_KM);

    const attackSet = new Set(
        (formation.attackDrones ?? []).map(d => d.id != null ? String(d.id) : d.name)
    );
    const allDrones = [...(formation.attackDrones ?? []), ...(formation.supportDrones ?? [])];

    const flights = allDrones.map(drone => {
        const key = drone.id != null ? String(drone.id) : drone.name;
        const pd = pdMap.get(key) ?? pdMap.get(drone.name) ?? {};
        const isAttack = attackSet.has(key) || attackSet.has(drone.name);
        const cruiseMs = drone.cruiseMs ?? 100;
        const cruiseKmh = cruiseMs * 3.6;
        const cruiseAltM = drone.serviceAltM ?? 500;
        const impactVelMs = pd.impactVelocity_ms ?? cruiseMs;
        const cruiseDist = Math.max(distanceKm - APPROACH_KM, 0.1);
        const totalFlightSec = pd.flightTime_sec ?? Math.round(_flightTimeSec(distanceKm, cruiseKmh));
        const cruiseTimeSec = Math.round(_flightTimeSec(cruiseDist, cruiseKmh));
        const diveTimeSec = Math.max(totalFlightSec - cruiseTimeSec, 1);
        const diveAngleDeg = +((Math.atan2(cruiseAltM, APPROACH_KM * 1000) * 180 / Math.PI).toFixed(1));
        const orbitRadiusM = isAttack ? 0 : outerRadius * 2;
        const orbitAltM = isAttack ? 0 : Math.round(cruiseAltM * 0.6);

        return {
            droneId: drone.id ?? null, droneName: drone.name ?? '—', role: drone.role,
            launchPoint: { lat: base.latitude, lng: base.longitude, altitudeM: 0 },
            cruiseAltitudeM: cruiseAltM,
            approachPoint: { lat: approachGeo.lat, lng: approachGeo.lng, altitudeM: cruiseAltM },
            targetPoint: { lat: target.latitude, lng: target.longitude, altitudeM: 0 },
            cruiseSpeedMs: +cruiseMs.toFixed(1), impactVelocityMs: +impactVelMs.toFixed(1),
            totalFlightTimeSec: totalFlightSec, cruiseTimeSec, diveTimeSec,
            diveAltitudeM: cruiseAltM, diveAngleDeg,
            isAttackDrone: isAttack, orbitRadiusM, orbitAltitudeM: orbitAltM,
            payloadTNTkg: drone.payloadTNTkg ?? 0, totalTNTkg: pd.totalTNT_kg ?? 0,
            kineticEnergyJ: pd.kineticEnergy_J ?? 0, cep_m: pd.cep_m ?? null,
        };
    });

    const attackFlights = flights.filter(f => f.isAttackDrone);
    attackFlights.sort((a, b) => a.totalFlightTimeSec - b.totalFlightTimeSec);
    const baseTimeSec = attackFlights[0]?.totalFlightTimeSec ?? 0;
    const impactSequence = attackFlights.map((f, i) => ({
        droneId: f.droneId, droneName: f.droneName,
        impactTimeSec: Math.round(baseTimeSec + i * 2.5),
        tntKg: f.totalTNTkg, kineticEnergyJ: f.kineticEnergyJ,
    }));

    return {
        flights,
        impact: {
            impactPoint: { lat: target.latitude, lng: target.longitude },
            craterRadiusM: impact.combined.craterRadius_m,
            craterDepthM: impact.combined.craterDepth_m,
            blastZones: { total: zones.total??0, severe: zones.severe??0, moderate: zones.moderate??0, light: zones.light??0, glass: zones.glass??0 },
            fragmentRangeM: impact.combined.fragmentRange_m,
            thermalRadiusM: impact.combined.thermalRadius_m,
            totalTNTkg: impact.combined.totalTNT_kg,
            suggestedCameraDistance: Math.round(outerRadius * 2.5),
            suggestedCameraAltitude: Math.round(outerRadius * 1.2),
            impactSequence,
        },
        mission: {
            formationName: formation.name,
            totalDrones: flights.length,
            attackCount: (formation.attackDrones ?? []).length,
            supportCount: (formation.supportDrones ?? []).length,
            distanceKm: +distanceKm.toFixed(2),
            effectiveness: formation.stats?.effectiveness ?? 0,
            riskLevel: formation.stats?.riskLevel ?? 'UNKNOWN',
            maxFlightTimeSec: Math.max(...flights.map(f => f.totalFlightTimeSec).filter(t => isFinite(t)), 0),
        },
    };
}

window.buildSimulationData = buildSimulationData;
