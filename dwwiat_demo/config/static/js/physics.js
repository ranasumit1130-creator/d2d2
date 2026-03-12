const EARTH_RADIUS_KM = 6371;
const G = 9.81;
const TNT_J_PER_KG = 4_184_000;

export function haversine(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const p1 = lat1 * toRad;
    const p2 = lat2 * toRad;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function kineticEnergy(massKg, velocityMs) {
    return 0.5 * Math.max(massKg, 0) * Math.max(velocityMs, 0) ** 2;
}

export function joulesToTNT(joules) {
    return Math.max(joules, 0) / TNT_J_PER_KG;
}

export function totalEnergyTNT(massKg, velocityMs, payloadTNTkg) {
    return joulesToTNT(kineticEnergy(massKg, velocityMs)) + Math.max(payloadTNTkg ?? 0, 0);
}

export function overpressure(tntKg, distanceM) {
    if (tntKg <= 0) return 0;
    const dist = Math.max(distanceM, 0.1);
    const Z = dist / Math.cbrt(tntKg);
    return (0.84 / Z + 2.7 / (Z ** 2) + 7.94 / (Z ** 3)) * 100;
}

export function craterRadius(tntKg) {
    return tntKg > 0 ? 0.8 * Math.cbrt(tntKg) : 0;
}

export function craterDepth(tntKg) {
    return tntKg > 0 ? 0.5 * Math.cbrt(tntKg) : 0;
}

export function fragmentVelocity(tntKg, casingKg) {
    if (tntKg <= 0 || casingKg <= 0) return 0;
    const explosiveEnergyJ = tntKg * TNT_J_PER_KG;
    return 0.6 * Math.sqrt((2 * explosiveEnergyJ) / casingKg);
}

export function fragmentRange(tntKg) {
    return tntKg > 0 ? 15 * (tntKg ** 0.4) : 0;
}

export function thermalRadius(tntKg) {
    return tntKg > 0 ? 2.5 * Math.cbrt(tntKg) : 0;
}

export function terminalVelocity(cruiseMs, diveAltM) {
    return Math.sqrt(Math.max(cruiseMs, 0) ** 2 + 2 * G * Math.max(diveAltM, 0));
}

export function flightTime(distKm, speedKmh) {
    if (speedKmh <= 0) return Infinity;
    return (Math.max(distKm, 0) / speedKmh) * 3600;
}

export function fuelConsumption(rateKgH, timeSec) {
    return Math.max(rateKgH, 0) * (Math.max(timeSec, 0) / 3600);
}

const GUIDANCE_FACTOR = {
    gps: 1.0,
    ir: 1.2,
    radar: 1.08,
    ai: 0.6,
};

export function cep(baseCEP, distKm, guidanceType) {
    const g = GUIDANCE_FACTOR[(guidanceType ?? '').toLowerCase()] ?? 1.15;
    return Math.max(baseCEP, 0) * g * (1 + Math.max(distKm, 0) * 0.0025);
}

function _binaryZoneRadius(tntKg, thresholdKPa) {
    if (tntKg <= 0 || overpressure(tntKg, 0.1) < thresholdKPa) return 0;
    let lo = 0.1;
    let hi = 250_000;
    for (let i = 0; i < 56; i++) {
        const mid = (lo + hi) / 2;
        if (overpressure(tntKg, mid) >= thresholdKPa) lo = mid;
        else hi = mid;
    }
    return Math.round((lo + hi) / 2);
}

export function damageZones(tntKg) {
    if (tntKg <= 0) {
        return { total: 0, severe: 0, moderate: 0, light: 0, glass: 0 };
    }
    return {
        total: _binaryZoneRadius(tntKg, 350),
        severe: _binaryZoneRadius(tntKg, 100),
        moderate: _binaryZoneRadius(tntKg, 35),
        light: _binaryZoneRadius(tntKg, 7),
        glass: _binaryZoneRadius(tntKg, 3.5),
    };
}

export function overpressureCurve(tntKg, steps = 60) {
    if (tntKg <= 0 || steps <= 0) return [];
    const maxDist = Math.max(damageZones(tntKg).glass * 1.25, 200);
    const result = [];
    for (let i = 1; i <= steps; i++) {
        const dist = (i / steps) * maxDist;
        result.push({
            dist: +dist.toFixed(1),
            op: +overpressure(tntKg, dist).toFixed(3),
        });
    }
    return result;
}
