// --- Input Controls ---
function setupControls() {
    const hKey = (k, v) => { if (k === 'ArrowLeft' || k === 'a') game.keys.l = v; if (k === 'ArrowRight' || k === 'd') game.keys.r = v; };
    window.onkeydown = e => hKey(e.key, true);
    window.onkeyup = e => hKey(e.key, false);
    const addTouch = (id, k) => {
        const e = el(id); if (!e) return;
        e.addEventListener('pointerdown', ev => { ev.preventDefault(); game.keys[k] = true; });
        e.addEventListener('pointerup', ev => { ev.preventDefault(); game.keys[k] = false; });
        e.addEventListener('pointercancel', () => game.keys[k] = false);
        // Prevent iOS double-tap zoom on touch zones
        e.addEventListener('touchstart', ev => { ev.preventDefault(); }, { passive: false });
        e.addEventListener('touchend', ev => { ev.preventDefault(); }, { passive: false });
    };
    addTouch('t-left', 'l'); addTouch('t-right', 'r');
}
