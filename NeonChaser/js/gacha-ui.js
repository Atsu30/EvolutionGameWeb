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
    const r = result.rarity;
    const rc = `rarity-${r}`;
    const cl = { color: 'カラー', tire: 'タイヤ', body: 'ボディ', trail: 'トレイル' }[result.item.category] || 'ITEM';

    // Reset state
    res.style.display = 'none';
    res.className = 'gacha-result';
    el('gacha-flash').className = 'gacha-flash';

    // Stage 1: Button charge-up animation
    btn.classList.add('pulling');
    btn.addEventListener('animationend', function onPulse() {
        btn.classList.remove('pulling');
        btn.removeEventListener('animationend', onPulse);

        // Stage 2: Reveal
        res.style.display = 'block';
        res.classList.add('has-border');

        // Build content with stacked-fill border
        const rollClass = `gacha-roll roll-${r}`;
        const nameClass = `gacha-item-name name-${r}`;
        if (result.isDupe) {
            res.innerHTML = `<div class="gacha-result-border glow-${r}"></div>`
                + `<div class="gacha-burst-container" id="gacha-burst"></div><div class="gacha-rays" id="gacha-rays"></div>`
                + `<div class="${rollClass}"><div class="${rc}" style="font-size:14px;margin-bottom:4px;font-family:'Rajdhani',sans-serif;">[${r}] ${cl}</div>`
                + `<div class="${nameClass}">${result.item.name}</div>`
                + `<div class="gacha-dupe" style="color:#fbbf24;">重複！ +${result.scrapGained} スクラップ</div></div>`;
        } else {
            res.innerHTML = `<div class="gacha-result-border glow-${r}"></div>`
                + `<div class="gacha-burst-container" id="gacha-burst"></div><div class="gacha-rays" id="gacha-rays"></div>`
                + `<div class="${rollClass}"><div class="${rc}" style="font-size:14px;margin-bottom:4px;font-family:'Rajdhani',sans-serif;">[${r}] ${cl}</div>`
                + `<div class="gacha-new-badge" id="gacha-new-badge">NEW!</div>`
                + `<div class="${nameClass}">${result.item.name}</div></div>`;
        }

        const burstEl = res.querySelector('.gacha-burst-container');
        const raysEl = res.querySelector('.gacha-rays');

        // Particles — ramp up dramatically by rarity
        const pCounts = { C: 3, R: 10, E: 20, L: 36 };
        const pColors = {
            C: ['#94a3b8', '#cbd5e1'],
            R: ['#60a5fa', '#3b82f6', '#93c5fd', '#dbeafe'],
            E: ['#a78bfa', '#7c3aed', '#c4b5fd', '#e879f9', '#d946ef'],
            L: ['#fbbf24', '#f59e0b', '#fcd34d', '#fef08a', '#fff', '#fde68a']
        };
        const count = pCounts[r] || 3;
        const colors = pColors[r] || ['#fff'];
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = i % 3 === 0 ? 'g-particle g-spark' : 'g-particle';
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 50 + Math.random() * 100;
            p.style.setProperty('--gx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--gy', Math.sin(angle) * dist + 'px');
            p.style.background = colors[i % colors.length];
            p.style.width = p.style.height = (3 + Math.random() * 6) + 'px';
            p.style.animationDelay = (0.3 + Math.random() * 0.4) + 's';
            burstEl.appendChild(p);
        }

        // Screen flash — R and above
        if (r === 'R' || r === 'E' || r === 'L') {
            el('gacha-flash').className = 'gacha-flash flash-' + r;
        }

        // Shake — R and above with increasing intensity
        if (r === 'R') res.classList.add('gacha-shake-R');
        if (r === 'E') res.classList.add('gacha-shake-E');
        if (r === 'L') res.classList.add('gacha-shake-L');

        // Light rays for E and L
        if (r === 'E' || r === 'L') {
            raysEl.style.display = '';
            if (r === 'E') raysEl.classList.add('rays-E');
            const rayCount = r === 'L' ? 24 : 12;
            for (let i = 0; i < rayCount; i++) {
                const ray = document.createElement('div');
                ray.className = 'gacha-ray';
                ray.style.transform = `rotate(${(i / rayCount) * 360}deg)`;
                if (r === 'L') ray.style.opacity = (0.4 + Math.random() * 0.6).toString();
                raysEl.appendChild(ray);
            }
        }

        // L: second wave of particles after delay
        if (r === 'L') {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const p = document.createElement('div');
                    p.className = 'g-particle';
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 30 + Math.random() * 120;
                    p.style.setProperty('--gx', Math.cos(angle) * dist + 'px');
                    p.style.setProperty('--gy', Math.sin(angle) * dist + 'px');
                    p.style.background = colors[Math.floor(Math.random() * colors.length)];
                    p.style.width = p.style.height = (2 + Math.random() * 5) + 'px';
                    p.style.animationDelay = (Math.random() * 0.3) + 's';
                    burstEl.appendChild(p);
                }
            }, 800);
        }

        // NEW badge bounce (delayed)
        if (!result.isDupe) {
            const delay = { C: 800, R: 1100, E: 1400, L: 1800 }[r] || 1000;
            setTimeout(() => {
                const badge = document.getElementById('gacha-new-badge');
                if (badge) badge.classList.add('show');
            }, delay);
        }

        // Re-enable pull
        const unlockDelay = { C: 1200, R: 1800, E: 2200, L: 3000 }[r] || 1500;
        setTimeout(() => { _gachaPulling = false; }, unlockDelay);

        _updateGachaDisplay(_walletBefore);
        // Check cumulative achievements after pull
        if (typeof checkCumulAchievements === 'function') {
            checkCumulAchievements().forEach(a => { if (typeof showAchievementPopup === 'function') showAchievementPopup(a); });
        }
    }, { once: true });
}
