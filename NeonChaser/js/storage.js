// --- localStorage Wrapper ---
const STORAGE_PREFIX = 'nc-';

function storageLoad(key, fallback) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function storageSave(key, data) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); }
    catch { /* quota exceeded */ }
}
