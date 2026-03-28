// --- Customize & Shop UI ---
let _currentCustomTab = 'color';

function showCustomize() {
    _currentCustomTab = 'color';
    _renderCustomize();
    _showModal('custom-modal');
    if (typeof showPreview === 'function') showPreview('preview-canvas');
}
function switchCustomTab(tab) {
    _currentCustomTab = tab;
    _renderCustomize();
    const eq = getEquipped();
    if (typeof updatePreviewBike === 'function') updatePreviewBike(eq.colorId, eq.tireId, eq.bodyId);
    if (typeof updatePreviewTrail === 'function') updatePreviewTrail(_currentCustomTab === 'trail' ? eq.trailId : null);
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
    setCumulFlag('customChanged');
    _renderCustomize();
    const eq = getEquipped();
    if (typeof updatePreviewBike === 'function') updatePreviewBike(eq.colorId, eq.tireId, eq.bodyId);
    if (typeof updatePreviewTrail === 'function' && _currentCustomTab === 'trail') updatePreviewTrail(eq.trailId);
}

let _currentShopTab = 'color';

function showShop() {
    _currentShopTab = 'color';
    _renderShopGrid();
    _showModal('shop-modal');
    if (typeof showPreview === 'function') showPreview('shop-preview-canvas');
}

function switchShopTab(tab) {
    _currentShopTab = tab;
    _renderShopGrid();
    if (typeof resetShopPreview === 'function') resetShopPreview();
}

function _renderShopGrid() {
    const w = getWallet();
    el('shop-scrap').innerText = w.scrap.toLocaleString();

    // Update tab active states
    ['color', 'tire', 'body', 'trail'].forEach(tab => {
        const t = el(`shop-tab-${tab}`);
        if (t) t.classList.toggle('active', tab === _currentShopTab);
    });

    // Get all definitions for current category
    let allDefs;
    if (_currentShopTab === 'color') allDefs = getAllColors();
    else if (_currentShopTab === 'tire') allDefs = getAllTires();
    else if (_currentShopTab === 'body') allDefs = getAllBodies();
    else allDefs = getAllTrails();

    const shopItems = getShopItems().filter(item => item.category === _currentShopTab);
    const grid = el('shop-grid');

    if (!shopItems.length) {
        grid.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;grid-column:1/-1;">このカテゴリは全て取得済み！</div>';
        return;
    }

    grid.innerHTML = shopItems.map(item => {
        const def = allDefs[item.id];
        if (!def) return '';
        const canBuy = w.scrap >= item.price;
        const rc = def.rarity !== '-' ? `rarity-${def.rarity}` : '';

        let swatch = '';
        if (_currentShopTab === 'color' && def.neon)
            swatch = `<div class="color-swatch" style="background:#${def.neon.toString(16).padStart(6,'0')};box-shadow:0 0 10px #${def.neon.toString(16).padStart(6,'0')};"></div>`;
        else if (_currentShopTab === 'trail' && def.color)
            swatch = `<div class="color-swatch" style="background:#${def.color.toString(16).padStart(6,'0')};box-shadow:0 0 10px #${def.color.toString(16).padStart(6,'0')};"></div>`;

        return `<div class="item-card" onmouseenter="previewShopItem('${item.id}')" onmouseleave="resetShopPreview()" ontouchstart="previewShopItem('${item.id}')">
            ${swatch}
            <div class="item-name ${rc}">${def.name}</div>
            <div class="shop-item-price">${item.price} ⚙</div>
            <button class="shop-card-buy-btn ${canBuy?'':'disabled'}" onclick="event.stopPropagation();shopBuy('${item.id}')" ${canBuy?'':'disabled'}>購入</button>
        </div>`;
    }).join('');
}

function shopBuy(itemId) {
    if (buyWithScrap(itemId)) {
        _renderShopGrid();
        if (typeof resetShopPreview === 'function') resetShopPreview();
        if (typeof checkCumulAchievements === 'function') {
            checkCumulAchievements().forEach(a => { if (typeof showAchievementPopup === 'function') showAchievementPopup(a); });
        }
    }
}
