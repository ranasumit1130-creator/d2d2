const _PREFIX   = 'dwwiat_sim_';
const _CURR_KEY = 'dwwiat_current_mission';

function _strip(state) {
    const copy = JSON.parse(JSON.stringify(state));
    if (copy.impact?.combined?.overpressureCurve) {
        copy.impact.combined.overpressureCurve = [];
    }
    return copy;
}

function _trySet(key, value) {
    const raw = JSON.stringify(value);
    try {
        sessionStorage.setItem(key, raw);
    } catch (e) {
        try {
            sessionStorage.setItem(key, JSON.stringify(_strip(value)));
        } catch (_) {
            console.warn('[simState] sessionStorage quota exceeded');
            return false;
        }
    }
    return true;
}

export const simState = {
    save(missionId, data) {
        const payload = { ...data, missionId: String(missionId), savedAt: new Date().toISOString() };
        const ok = _trySet(_PREFIX + missionId, payload);
        if (ok) sessionStorage.setItem(_CURR_KEY, String(missionId));
        return ok;
    },
    load(missionId) {
        try {
            const raw = sessionStorage.getItem(_PREFIX + missionId);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    },
    loadCurrent() {
        const id = sessionStorage.getItem(_CURR_KEY);
        return id ? this.load(id) : null;
    },
    patch(missionId, patch) {
        const current = this.load(missionId) ?? {};
        return this.save(missionId, { ...current, ...patch });
    },
    isReady(missionId) {
        const s = this.load(missionId);
        return Boolean(s?.simulationData?.flights?.length);
    },
    clear(missionId) {
        if (missionId != null) {
            sessionStorage.removeItem(_PREFIX + missionId);
        } else {
            Object.keys(sessionStorage).filter(k => k.startsWith(_PREFIX)).forEach(k => sessionStorage.removeItem(k));
            sessionStorage.removeItem(_CURR_KEY);
        }
    },
    getSimulationData(missionId) {
        return this.load(missionId)?.simulationData ?? null;
    },
    listMissions() {
        return Object.keys(sessionStorage).filter(k => k.startsWith(_PREFIX)).map(k => k.slice(_PREFIX.length));
    },
};

window.simState = simState;