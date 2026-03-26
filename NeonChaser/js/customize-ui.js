// --- Customize & Shop UI ---
let _currentCustomTab = 'color';

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
    if (!items.length) { list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">全アイテム取得済み！</div>'; return; }
    list.innerHTML = items.map(item => {
        const cb = w.scrap >= item.price, cl = { color: 'カラー', tire: 'タイヤ', body: 'ボディ', trail: 'トレイル' }[item.category] || 'ITEM';
        return `<div class="shop-row"><div><span class="rarity-${item.rarity}">[${item.rarity}] ${cl}</span><span style="color:#fff;font-weight:bold;margin-left:8px;">${item.name}</span></div><button class="shop-buy-btn ${cb?'':'disabled'}" onclick="shopBuy('${item.id}')" ${cb?'':'disabled'}>${item.price} Scrap</button></div>`;
    }).join('');
}
function shopBuy(itemId) { if (buyWithScrap(itemId)) _renderShop(); }
