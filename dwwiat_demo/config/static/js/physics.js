const EARTH_RADIUS_KM    = 6_371;
const G                  = 9.81;
const TNT_J_PER_KG       = 4_184_000;

export function haversine(lat1, lon1, lat2, lon2) {
    const r   = Math.PI / 180;
    const p1  = lat1 * r,  p2 = lat2 * r;
    const dp  = (lat2 - lat1) * r;
    const dl  = (lon2 - lon1) * r;
    const a   = Math.sin(dp / 2) ** 2
              + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function kineticEnergy(massKg, velocityMs) {
    return 0.5 * massKg * velocityMs ** 2;
}

export function joulesToTNT(joules) {
    return joules / TNT_J_PER_KG;
}

export function totalEnergyTNT(massKg, velocityMs, payloadTNTkg) {
    return joulesToTNT(kineticEnergy(massKg, velocityMs)) + payloadTNTkg;
}

export function terminalVelocity(cruiseMs, diveAltM) {
    return Math.sqrt(cruiseMs ** 2 + 2 * G * Math.max(diveAltM, 0));
}

export function flightTime(distKm, speedKmh) {
    if (speedKmh <= 0) return Infinity;
    return (distKm / speedKmh) * 3_600;
}

export function fuelConsumption(rateKgH, timeSec) {
    return rateKgH * (timeSec / 3_600);
}

const _GUIDANCE_FACTOR = { gps: 1.00, ai: 0.55, ir: 1.35, radar: 1.10 };

export function cep(baseCEP_m, distKm, guidanceType) {
    const factor = _GUIDANCE_FACTOR[guidanceType] ?? 1.5;
    return baseCEP_m * factor * (1 + distKm * 0.002);
}

export function overpressure(tntKg, distanceM) {
    if (tntKg <= 0) return 0;
    const d = Math.max(distanceM, 0.1);
    const Z = d / tntKg ** (1 / 3);
    return (0.84 / Z + 2.7 / Z ** 2 + 7.94 / Z ** 3) * 100;
}

export function craterRadius(tntKg) {
    return 0.8 * tntKg ** (1 / 3);
}

export function craterDepth(tntKg) {
    return 0.5 * tntKg ** (1 / 3);
}

export function fragmentVelocity(tntKg, casingKg) {
    if (tntKg <= 0 || casingKg <= 0) return 0;
    return 0.6 * Math.sqrt(2 * tntKg * TNT_J_PER_KG / casingKg);
}

export function fragmentRange(tntKg) {
    if (tntKg <= 0) return 0;
    return 15 * tntKg ** 0.4;
}

export function thermalRadius(tntKg) {
    if (tntKg <= 0) return 0;
    return 2.5 * tntKg ** (1 / 3);
}

function _zoneRadius(tntKg, thresholdKPa) {
    if (overpressure(tntKg, 0.1) < thresholdKPa) return 0;
    let lo = 0.1, hi = 200_000;
    for (let i = 0; i < 52; i++) {
        const mid = (lo + hi) / 2;
        if (overpressure(tntKg, mid) > thresholdKPa) lo = mid;
        else hi = mid;
    }
    return Math.round((lo + hi) / 2);
}

export function damageZones(tntKg) {
    if (tntKg <= 0) return { total: 0, severe: 0, moderate: 0, light: 0, glass: 0 };
    return {
        total:    _zoneRadius(tntKg, 350),
        severe:   _zoneRadius(tntKg, 100),
        moderate: _zoneRadius(tntKg,  35),
        light:    _zoneRadius(tntKg,   7),
        glass:    _zoneRadius(tntKg,   3.5),
    };
}

export function overpressureCurve(tntKg, steps = 60) {
    if (tntKg <= 0) return [];
    const maxDist = Math.max(thermalRadius(tntKg) * 8, 200);
    const out = [];
    for (let i = 1; i <= steps; i++) {
        const dist = (i / steps) * maxDist;
        out.push({ dist: Math.round(dist), op: +overpressure(tntKg, dist).toFixed(2) });
    }
    return out;
}