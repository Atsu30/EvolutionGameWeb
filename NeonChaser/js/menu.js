// --- Menu System ---
let _menuStack = [];
let _currentCustomTab = 'color';

function _showModal(id) { _menuStack.push(id); el(id).classList.add('active'); }
function _hideModal(id) { el(id).classList.remove('active'); _menuStack = _menuStack.filter(m => m !== id); }

function showMenu() { game.st.isP = true; _showModal('menu-modal'); }
function hideMenu() {
    if (_menuStack.includes('custom-modal') && typeof hidePreview === 'function') hidePreview();
    _menuStack.forEach(id => el(id).classList.remove('active')); _menuStack = [];
    if (!game.st.isG) { game.st.isP = false; game.clock.getDelta(); }
}
function goBack() {
    const top = _menuStack[_menuStack.length - 1];
    if (top === 'custom-modal' && typeof hidePreview === 'function') hidePreview();
    _menuStack.length > 1 ? _hideModal(top) : hideMenu();
}

function showRanking() {
    const scores = getScores(), list = el('ranking-list');
    if (scores.length === 0) { list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">No records yet</div>'; }
    else {
        list.innerHTML = scores.map((s, i) => {
            const rc = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#64748b';
            const d = new Date(s.date);
            return `<div class="rank-row"><span class="rank-num" style="color:${rc}">#${i+1}</span><span class="rank-dist">${s.dist.toFixed(2)} km</span><span class="rank-lv">Lv ${s.lv}</span><span class="rank-date">${d.getMonth()+1}/${d.getDate()}</span></div>`;
        }).join('');
    }
    _showModal('ranking-modal');
}

function showAchievements() {
    const progress = getAchievementProgress();
    const unlocked = ACHIEVEMENTS.filter(a => progress[a.id]).length;
    el('achieve-progress').innerText = `${unlocked} / ${ACHIEVEMENTS.length}`;
    el('achieve-list').innerHTML = ACHIEVEMENTS.map(a => {
        const entry = progress[a.id];
        const done = !!entry;
        const claimed = entry && entry.claimed;
        let rightCol;
        if (!done) {
            rightCol = `<span class="achieve-check">🔒</span>`;
        } else if (claimed) {
            rightCol = `<span class="achieve-claimed">+${a.reward}mi</span>`;
        } else {
            rightCol = `<button class="achieve-claim-btn" onclick="achieveClaim('${a.id}')">CLAIM<br><span class="achieve-reward-text">+${a.reward}mi</span></button>`;
        }
        return `<div class="achieve-row ${done ? (claimed ? 'unlocked claimed' : 'unlocked claimable') : 'locked'}"><span class="achieve-icon">${a.icon}</span><div class="achieve-info"><div class="achieve-name">${a.name}</div><div class="achieve-desc">${a.desc}</div></div>${rightCol}</div>`;
    }).join('');
    _showModal('achieve-modal');
}

function achieveClaim(id) {
    if (claimReward(id)) showAchievements();
}

function showGacha() {
    _gachaPulling = false;
    _updateGachaDisplay();
    const res = el('gacha-result');
    res.style.display = 'none';
    res.className = 'gacha-result';
    el('gacha-flash').className = 'gacha-flash';
    _showModal('gacha-modal');
}
function _updateGachaDisplay() {
    const w = getWallet();
    el('gacha-miles').innerText = w.miles.toLocaleString();
    el('gacha-scrap').innerText = w.scrap.toLocaleString();
    const btn = el('gacha-pull-btn'); btn.disabled = !canPull(); btn.style.opacity = canPull() ? '1' : '0.4';
}
let _gachaPulling = false;
function doPull() {
    if (!canPull() || _gachaPulling) return;
    _gachaPulling = true;
    const result = gachaPull(); if (!result) { _gachaPulling = false; return; }

    const btn = el('gacha-pull-btn');
    const res = el('gacha-result');
    const flash = el('gacha-flash');
    const burst = el('gacha-burst');
    const rays = el('gacha-rays');
    const r = result.rarity;
    const rc = `rarity-${r}`;
    const cl = { color: 'COLOR', tire: 'TIRE', body: 'BODY', trail: 'TRAIL' }[result.item.category] || 'ITEM';

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
                + `<div class="gacha-dupe" style="color:#fbbf24;">DUPLICATE! +${result.scrapGained} Scrap</div></div>`;
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

        _updateGachaDisplay();
    }, { once: true });
}

function showCustomize() {
    _currentCustomTab = 'color';
    _renderCustomize();
    _showModal('custom-modal');
    if (typeof showPreview === 'function') showPreview();
}
function switchCustomTab(tab) {
    _currentCustomTab = tab;
    _renderCustomize();
    if (typeof updatePreviewBike === 'function') {
        const eq = getEquipped();
        updatePreviewBike(eq.colorId, eq.tireId, eq.bodyId);
    }
}
function _renderCustomize() {
    ['color', 'tire', 'body', 'trail'].forEach(tab => { const t = el(`custom-tab-${tab}`); if (t) t.classList.toggle('active', tab === _currentCustomTab); });
    const inv = getInventory(), eq = getEquipped(), grid = el('custom-grid');
    let items, equippedId, allDefs;
    if (_currentCustomTab === 'color') { allDefs = getAllColors(); equippedId = eq.colorId; items = ['color-default', ...inv.colors]; }
    else if (_currentCustomTab === 'tire') { allDefs = getAllTires(); equippedId = eq.tireId; items = ['tire-default', ...inv.tires]; }
    else if (_currentCustomTab === 'body') { allDefs = getAllBodies(); equippedId = eq.bodyId; items = ['body-default', ...inv.bodies]; }
    else { allDefs = getAllTrails(); equippedId = eq.trailId; items = ['trail-default', ...(inv.trails || [])]; }
    grid.innerHTML = items.map(id => {
        const def = allDefs[id]; if (!def) return '';
        const isEq = id === equippedId, rc = def.rarity !== '-' ? `rarity-${def.rarity}` : '';
        let swatch = '';
        if (_currentCustomTab === 'color' && def.neon) swatch = `<div class="color-swatch" style="background:#${def.neon.toString(16).padStart(6,'0')};box-shadow:0 0 10px #${def.neon.toString(16).padStart(6,'0')};"></div>`;
        else if (_currentCustomTab === 'trail' && def.color) swatch = `<div class="color-swatch" style="background:#${def.color.toString(16).padStart(6,'0')};box-shadow:0 0 10px #${def.color.toString(16).padStart(6,'0')};"></div>`;
        return `<div class="item-card ${isEq?'equipped':''}" onclick="equipItem('${_currentCustomTab}','${id}')">${swatch}<div class="item-name ${rc}">${def.name}</div>${isEq?'<div class="item-equipped">EQUIPPED</div>':''}</div>`;
    }).join('');
}
function equipItem(category, id) {
    setEquipped(category, id);
    applyCustomization();
    _renderCustomize();
    if (typeof updatePreviewBike === 'function') {
        const eq = getEquipped();
        updatePreviewBike(eq.colorId, eq.tireId, eq.bodyId);
    }
}

function showShop() { _renderShop(); _showModal('shop-modal'); }
function _renderShop() {
    const w = getWallet(); el('shop-scrap').innerText = w.scrap.toLocaleString();
    const items = getShopItems(), list = el('shop-list');
    if (!items.length) { list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">All items owned!</div>'; return; }
    list.innerHTML = items.map(item => {
        const cb = w.scrap >= item.price, cl = { color: 'COLOR', tire: 'TIRE', body: 'BODY', trail: 'TRAIL' }[item.category] || 'ITEM';
        return `<div class="shop-row"><div><span class="rarity-${item.rarity}">[${item.rarity}] ${cl}</span><span style="color:#fff;font-weight:bold;margin-left:8px;">${item.name}</span></div><button class="shop-buy-btn ${cb?'':'disabled'}" onclick="shopBuy('${item.id}')" ${cb?'':'disabled'}>${item.price} Scrap</button></div>`;
    }).join('');
}
function shopBuy(itemId) { if (buyWithScrap(itemId)) _renderShop(); }

let _popupQueue = [], _popupActive = false;
function showAchievementPopup(a) { _popupQueue.push(a); if (!_popupActive) _processPopup(); }
function _processPopup() {
    if (!_popupQueue.length) { _popupActive = false; return; }
    _popupActive = true; const a = _popupQueue.shift();
    const p = el('achieve-popup');
    p.innerHTML = `<span>${a.icon}</span> <strong>${a.name}</strong><br><small>${a.desc}</small>`;
    p.classList.add('show');
    setTimeout(() => { p.classList.remove('show'); setTimeout(_processPopup, 400); }, 3000);
}
