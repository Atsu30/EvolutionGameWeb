// --- Menu System ---
let _menuStack = [];
let _currentCustomTab = 'color';

function _showModal(id) { _menuStack.push(id); el(id).classList.add('active'); }
function _hideModal(id) { el(id).classList.remove('active'); _menuStack = _menuStack.filter(m => m !== id); }

function showMenu() { game.st.isP = true; _showModal('menu-modal'); }
function hideMenu() {
    _menuStack.forEach(id => el(id).classList.remove('active')); _menuStack = [];
    if (!game.st.isG) { game.st.isP = false; game.clock.getDelta(); }
}
function goBack() { _menuStack.length > 1 ? _hideModal(_menuStack[_menuStack.length - 1]) : hideMenu(); }

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
        const done = progress[a.id];
        return `<div class="achieve-row ${done ? 'unlocked' : 'locked'}"><span class="achieve-icon">${a.icon}</span><div class="achieve-info"><div class="achieve-name">${a.name}</div><div class="achieve-desc">${a.desc}</div></div><span class="achieve-check">${done ? '✅' : '🔒'}</span></div>`;
    }).join('');
    _showModal('achieve-modal');
}

function showGacha() {
    _updateGachaDisplay(); el('gacha-result').style.display = 'none'; _showModal('gacha-modal');
}
function _updateGachaDisplay() {
    const w = getWallet();
    el('gacha-miles').innerText = w.miles.toLocaleString();
    el('gacha-scrap').innerText = w.scrap.toLocaleString();
    const btn = el('gacha-pull-btn'); btn.disabled = !canPull(); btn.style.opacity = canPull() ? '1' : '0.4';
}
function doPull() {
    if (!canPull()) return;
    const result = gachaPull(); if (!result) return;
    const res = el('gacha-result'); res.style.display = 'block';
    const rc = `rarity-${result.rarity}`;
    const cl = { color: 'COLOR', tire: 'TIRE', body: 'BODY', trail: 'TRAIL' }[result.item.category] || 'ITEM';
    res.innerHTML = result.isDupe
        ? `<div class="${rc}" style="font-size:14px;margin-bottom:4px;">[${result.rarity}] ${cl}</div><div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:8px;">${result.item.name}</div><div style="color:#fbbf24;">DUPLICATE! +${result.scrapGained} Scrap</div>`
        : `<div class="${rc}" style="font-size:14px;margin-bottom:4px;">[${result.rarity}] ${cl}</div><div style="font-size:24px;font-weight:900;color:#fff;margin-bottom:8px;">NEW!</div><div style="font-size:20px;font-weight:bold;" class="${rc}">${result.item.name}</div>`;
    _updateGachaDisplay();
}

function showCustomize() { _currentCustomTab = 'color'; _renderCustomize(); _showModal('custom-modal'); }
function switchCustomTab(tab) { _currentCustomTab = tab; _renderCustomize(); }
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
function equipItem(category, id) { setEquipped(category, id); applyCustomization(); _renderCustomize(); }

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
