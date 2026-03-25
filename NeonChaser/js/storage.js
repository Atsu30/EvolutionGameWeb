const PREFIX = 'nc-';

export function load(key, fallback) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

export function save(key, data) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(data)); }
    catch { /* quota exceeded */ }
}
