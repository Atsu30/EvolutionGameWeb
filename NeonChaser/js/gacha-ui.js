// --- Gacha UI ---
let _gachaPulling = false;

function showGacha() {
    _gachaPulling = false;
    _updateGachaDisplay();
    const res = el('gacha-result');
    res.style.display = 'none';
    res.className = 'gacha-result';
    el('gacha-flash').className = 'gacha-flash';
    _showModal('gacha-modal');
}
function _updateGachaDisplay(animateFrom) {
    const w = getWallet();
    if (animateFrom && typeof animateNumber === 'function') {
        animateNumber(el('gacha-miles'), animateFrom.miles, w.miles, 600, '');
        animateNumber(el('gacha-scrap'), animateFrom.scrap, w.scrap, 600, '');
    } else {
        el('gacha-miles').innerText = w.miles.toLocaleString();
        el('gacha-scrap').innerText = w.scrap.toLocaleString();
    }
    const btn = el('gacha-pull-btn'); btn.disabled = !canPull(); btn.style.opacity = canPull() ? '1' : '0.4';
}
function doPull() {
    if (!canPull() || _gachaPulling) return;
    _gachaPulling = true;
    const _walletBefore = getWallet();
    const result = gachaPull(); if (!result) { _gachaPulling = false; return; }

    const btn = el('gacha-pull-btn');
    const res = el('gacha-result');
    const flash = el('gacha-flash');
    const burst = el('gacha-burst');
    const rays = el('gacha-rays');
    const r = result.rarity;
    const rc = `rarity-${r}`;
    const cl = { color: 'カラー', tire: 'タイヤ', body: 'ボディ', trail: 'トレイル' }[result.item.category] || 'ITEM';

    // Reset state
    res.style.display = 'none';
    res.className = 'gacha-result';
    flash.className = 'gacha-flash';
    burst.innerHTML = '';
    rays.innerHTML = '';
    rays.style.display = 'none';

    // Stage 1: Button pulse
    btn.classList.add('pulling');
    btn.addEventListener('animationend', function onPulse() {
        btn.classList.remove('pulling');
        btn.removeEventListener('animationend', onPulse);

        // Stage 2: Show result with rarity animation
        res.style.display = 'block';
        res.classList.add(`glow-${r}`);

        // Build content
        const rollClass = `gacha-roll roll-${r}`;
        if (result.isDupe) {
            res.innerHTML = `<div class="gacha-burst-container" id="gacha-burst"></div><div class="gacha-rays" id="gacha-rays"></div>`
                + `<div class="${rollClass}"><div class="${rc}" style="font-size:14px;margin-bottom:4px;">[${r}] ${cl}</div>`
                + `<div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:8px;">${result.item.name}</div>`
                + `<div class="gacha-dupe" style="color:#fbbf24;">重複！ +${result.scrapGained} スクラップ</div></div>`;
        } else {
            res.innerHTML = `<div class="gacha-burst-container" id="gacha-burst"></div><div class="gacha-rays" id="gacha-rays"></div>`
                + `<div class="${rollClass}"><div class="${rc}" style="font-size:14px;margin-bottom:4px;">[${r}] ${cl}</div>`
                + `<div class="gacha-new-badge" id="gacha-new-badge">NEW!</div>`
                + `<div style="font-size:20px;font-weight:bold;" class="${rc}">${result.item.name}</div></div>`;
        }

        // Re-acquire burst/rays refs after innerHTML
        const burstEl = res.querySelector('.gacha-burst-container');
        const raysEl = res.querySelector('.gacha-rays');

        // Particles: count by rarity
        const pCounts = { C: 0, R: 4, E: 8, L: 16 };
        const pColors = { C: ['#94a3b8'], R: ['#60a5fa', '#3b82f6', '#93c5fd'], E: ['#a78bfa', '#7c3aed', '#c4b5fd', '#e879f9'], L: ['#fbbf24', '#f59e0b', '#fcd34d', '#fff'] };
        const count = pCounts[r] || 0;
        const colors = pColors[r] || ['#fff'];
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'g-particle';
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
            const dist = 60 + Math.random() * 80;
            p.style.setProperty('--gx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--gy', Math.sin(angle) * dist + 'px');
            p.style.background = colors[i % colors.length];
            p.style.width = p.style.height = (3 + Math.random() * 5) + 'px';
            p.style.animationDelay = (0.6 + Math.random() * 0.2) + 's';
            burstEl.appendChild(p);
        }

        // Screen flash for E/L
        if (r === 'E' || r === 'L') {
            const flashEl = el('gacha-flash');
            flashEl.className = 'gacha-flash flash-' + r;
        }

        // Shake for L
        if (r === 'L') {
            res.classList.add('gacha-shake');

            // Light rays for L
            raysEl.style.display = '';
            for (let i = 0; i < 12; i++) {
                const ray = document.createElement('div');
                ray.className = 'gacha-ray';
                ray.style.transform = `rotate(${i * 30}deg)`;
                raysEl.appendChild(ray);
            }
        }

        // Stage 3: NEW badge bounce (delayed)
        if (!result.isDupe) {
            const delay = { C: 1100, R: 1400, E: 1600, L: 1800 }[r] || 1200;
            setTimeout(() => {
                const badge = document.getElementById('gacha-new-badge');
                if (badge) badge.classList.add('show');
            }, delay);
        }

        // Re-enable pull
        const unlockDelay = { C: 1200, R: 1600, E: 2000, L: 2400 }[r] || 1500;
        setTimeout(() => { _gachaPulling = false; }, unlockDelay);

        _updateGachaDisplay(_walletBefore);
        // Check cumulative achievements after pull
        if (typeof checkCumulAchievements === 'function') {
            checkCumulAchievements().forEach(a => { if (typeof showAchievementPopup === 'function') showAchievementPopup(a); });
        }
    }, { once: true });
}
