import { el, game, floor } from './state.js';
import { ACHIEVEMENTS, SCRAP_PRICE } from './config.js';
import { getScores } from './score.js';
import { getProgress } from './achievements.js';
import { getWallet, canPull, pull, buyWithScrap, getShopItems } from './gacha.js';
import {
    getInventory, getEquipped, setEquipped, applyCustomization,
    getAllColors, getAllTires, getAllBodies, GACHA_POOL
} from './customization.js';

let menuStack = [];
let currentCustomTab = 'color';

function showModal(id) {
    menuStack.push(id);
    el(id).classList.add('active');
}

function hideModal(id) {
    el(id).classList.remove('active');
    menuStack = menuStack.filter(m => m !== id);
}

// --- Menu ---
export function showMenu() {
    game.st.isP = true;
    showModal('menu-modal');
}

export function hideMenu() {
    menuStack.forEach(id => el(id).classList.remove('active'));
    menuStack = [];
    if (!game.st.isG) {
        game.st.isP = false;
        game.clock.getDelta();
    }
}

export function goBack() {
    if (menuStack.length > 1) {
        hideModal(menuStack[menuStack.length - 1]);
    } else {
        hideMenu();
    }
}

// --- Ranking ---
export function showRanking() {
    const scores = getScores();
    const list = el('ranking-list');
    if (scores.length === 0) {
        list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">No records yet</div>';
    } else {
        list.innerHTML = scores.map((s, i) => {
            const rankColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#64748b';
            const d = new Date(s.date);
            const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
            return `<div class="rank-row">
                <span class="rank-num" style="color:${rankColor}">#${i + 1}</span>
                <span class="rank-dist">${s.dist.toFixed(2)} km</span>
                <span class="rank-lv">Lv ${s.lv}</span>
                <span class="rank-date">${dateStr}</span>
            </div>`;
        }).join('');
    }
    showModal('ranking-modal');
}

// --- Achievements ---
export function showAchievements() {
    const progress = getProgress();
    const total = ACHIEVEMENTS.length;
    const unlocked = ACHIEVEMENTS.filter(a => progress[a.id]).length;
    el('achieve-progress').innerText = `${unlocked} / ${total}`;
    const list = el('achieve-list');
    list.innerHTML = ACHIEVEMENTS.map(a => {
        const done = progress[a.id];
        return `<div class="achieve-row ${done ? 'unlocked' : 'locked'}">
            <span class="achieve-icon">${a.icon}</span>
            <div class="achieve-info">
                <div class="achieve-name">${a.name}</div>
                <div class="achieve-desc">${a.desc}</div>
            </div>
            <span class="achieve-check">${done ? '✅' : '🔒'}</span>
        </div>`;
    }).join('');
    showModal('achieve-modal');
}

// --- Gacha ---
export function showGacha() {
    updateGachaDisplay();
    el('gacha-result').style.display = 'none';
    showModal('gacha-modal');
}

function updateGachaDisplay() {
    const w = getWallet();
    el('gacha-miles').innerText = w.miles.toLocaleString();
    el('gacha-scrap').innerText = w.scrap.toLocaleString();
    const btn = el('gacha-pull-btn');
    btn.disabled = !canPull();
    btn.style.opacity = canPull() ? '1' : '0.4';
}

export function doPull() {
    if (!canPull()) return;
    const result = pull();
    if (!result) return;

    const res = el('gacha-result');
    res.style.display = 'block';
    const rarityClass = `rarity-${result.rarity}`;
    const categoryLabel = result.item.category === 'color' ? 'COLOR' : result.item.category === 'tire' ? 'TIRE' : 'BODY';

    if (result.isDupe) {
        res.innerHTML = `
            <div class="${rarityClass}" style="font-size:14px;margin-bottom:4px;">[${result.rarity}] ${categoryLabel}</div>
            <div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:8px;">${result.item.name}</div>
            <div style="color:#fbbf24;">DUPLICATE! +${result.scrapGained} Scrap</div>`;
    } else {
        res.innerHTML = `
            <div class="${rarityClass}" style="font-size:14px;margin-bottom:4px;">[${result.rarity}] ${categoryLabel}</div>
            <div style="font-size:24px;font-weight:900;color:#fff;margin-bottom:8px;">NEW!</div>
            <div style="font-size:20px;font-weight:bold;" class="${rarityClass}">${result.item.name}</div>`;
    }
    updateGachaDisplay();
}

// --- Customize ---
export function showCustomize() {
    currentCustomTab = 'color';
    renderCustomize();
    showModal('custom-modal');
}

function renderCustomize() {
    // Sub-tabs
    ['color', 'tire', 'body'].forEach(tab => {
        const tabEl = el(`custom-tab-${tab}`);
        tabEl.classList.toggle('active', tab === currentCustomTab);
    });

    const inv = getInventory();
    const eq = getEquipped();
    const grid = el('custom-grid');
    let items, equippedId, allDefs;

    if (currentCustomTab === 'color') {
        allDefs = getAllColors();
        equippedId = eq.colorId;
        items = ['color-default', ...inv.colors];
    } else if (currentCustomTab === 'tire') {
        allDefs = getAllTires();
        equippedId = eq.tireId;
        items = ['tire-default', ...inv.tires];
    } else {
        allDefs = getAllBodies();
        equippedId = eq.bodyId;
        items = ['body-default', ...inv.bodies];
    }

    grid.innerHTML = items.map(id => {
        const def = allDefs[id];
        if (!def) return '';
        const isEquipped = id === equippedId;
        const rarityClass = def.rarity !== '-' ? `rarity-${def.rarity}` : '';
        const colorSwatch = currentCustomTab === 'color'
            ? `<div class="color-swatch" style="background:#${def.neon.toString(16).padStart(6, '0')};box-shadow:0 0 10px #${def.neon.toString(16).padStart(6, '0')};"></div>`
            : '';
        return `<div class="item-card ${isEquipped ? 'equipped' : ''}" onclick="equipItem('${currentCustomTab}','${id}')">
            ${colorSwatch}
            <div class="item-name ${rarityClass}">${def.name}</div>
            ${isEquipped ? '<div class="item-equipped">EQUIPPED</div>' : ''}
        </div>`;
    }).join('');
}

export function switchCustomTab(tab) {
    currentCustomTab = tab;
    renderCustomize();
}

export function equipItem(category, id) {
    setEquipped(category, id);
    applyCustomization();
    renderCustomize();
}

// --- Shop ---
export function showShop() {
    renderShop();
    showModal('shop-modal');
}

function renderShop() {
    const w = getWallet();
    el('shop-scrap').innerText = w.scrap.toLocaleString();
    const items = getShopItems();
    const list = el('shop-list');
    if (items.length === 0) {
        list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">All items owned!</div>';
    } else {
        list.innerHTML = items.map(item => {
            const canBuy = w.scrap >= item.price;
            const catLabel = item.category === 'color' ? 'COLOR' : item.category === 'tire' ? 'TIRE' : 'BODY';
            return `<div class="shop-row">
                <div>
                    <span class="rarity-${item.rarity}">[${item.rarity}] ${catLabel}</span>
                    <span style="color:#fff;font-weight:bold;margin-left:8px;">${item.name}</span>
                </div>
                <button class="shop-buy-btn ${canBuy ? '' : 'disabled'}" onclick="shopBuy('${item.id}')" ${canBuy ? '' : 'disabled'}>
                    ${item.price} Scrap
                </button>
            </div>`;
        }).join('');
    }
}

export function shopBuy(itemId) {
    if (buyWithScrap(itemId)) {
        renderShop();
    }
}

// --- Achievement Popup ---
let popupQueue = [];
let popupActive = false;

export function showAchievementPopup(achievement) {
    popupQueue.push(achievement);
    if (!popupActive) processPopupQueue();
}

function processPopupQueue() {
    if (popupQueue.length === 0) { popupActive = false; return; }
    popupActive = true;
    const a = popupQueue.shift();
    const popup = el('achieve-popup');
    popup.innerHTML = `<span>${a.icon}</span> <strong>${a.name}</strong><br><small>${a.desc}</small>`;
    popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => processPopupQueue(), 400);
    }, 3000);
}

// --- Expose to window ---
window.showMenu = showMenu;
window.hideMenu = hideMenu;
window.goBack = goBack;
window.showRanking = showRanking;
window.showAchievements = showAchievements;
window.showGacha = showGacha;
window.doPull = doPull;
window.showCustomize = showCustomize;
window.switchCustomTab = switchCustomTab;
window.equipItem = equipItem;
window.showShop = showShop;
window.shopBuy = shopBuy;
