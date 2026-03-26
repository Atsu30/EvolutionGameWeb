// --- Gacha & Economy ---
const _WALLET_KEY = 'wallet-v1';

function getWallet() { return storageLoad(_WALLET_KEY, { miles: 0, scrap: 0 }); }
function _saveWallet(w) { storageSave(_WALLET_KEY, w); }

function calcMilesEarned(distKm) {
    const bonus = 1 + Math.floor(distKm / 10) * 0.2;
    return Math.floor(distKm * MILE_RATE * bonus);
}

function addMiles(amount) {
    const w = getWallet(); w.miles += Math.floor(amount); _saveWallet(w); return w;
}

function canPull() { return getWallet().miles >= GACHA_COST; }

function gachaPull() {
    const w = getWallet();
    if (w.miles < GACHA_COST) return null;
    w.miles -= GACHA_COST;
    const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * total, rarity = 'C';
    for (const r of RARITY_WEIGHTS) { roll -= r.weight; if (roll <= 0) { rarity = r.rarity; break; } }
    const candidates = GACHA_POOL.filter(i => i.rarity === rarity);
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    const isDupe = ownsItem(item.id);
    if (isDupe) w.scrap += SCRAP_DUPE[rarity]; else addItem(item.id);
    _saveWallet(w);
    return { item, isDupe, scrapGained: isDupe ? SCRAP_DUPE[rarity] : 0, rarity };
}

function buyWithScrap(itemId) {
    const poolItem = GACHA_POOL.find(p => p.id === itemId);
    if (!poolItem) return false;
    const price = SCRAP_PRICE[poolItem.rarity];
    const w = getWallet();
    if (w.scrap < price || ownsItem(itemId)) return false;
    w.scrap -= price; _saveWallet(w); addItem(itemId); return true;
}

function getShopItems() {
    return GACHA_POOL.filter(p => !ownsItem(p.id)).map(p => ({ ...p, price: SCRAP_PRICE[p.rarity] }));
}
