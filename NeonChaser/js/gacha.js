import { load, save } from './storage.js';
import { GACHA_COST, MILE_RATE, RARITY_WEIGHTS, SCRAP_DUPE, SCRAP_PRICE } from './config.js';
import { GACHA_POOL, getInventory, addItem, ownsItem } from './customization.js';

const WALLET_KEY = 'wallet-v1';

export function getWallet() {
    return load(WALLET_KEY, { miles: 0, scrap: 0 });
}

function saveWallet(w) {
    save(WALLET_KEY, w);
}

export function calcMilesEarned(distKm) {
    const bonus = 1 + Math.floor(distKm / 10) * 0.2;
    return Math.floor(distKm * MILE_RATE * bonus);
}

export function addMiles(amount) {
    const w = getWallet();
    w.miles += Math.floor(amount);
    saveWallet(w);
    return w;
}

export function canPull() {
    return getWallet().miles >= GACHA_COST;
}

export function pull() {
    const w = getWallet();
    if (w.miles < GACHA_COST) return null;
    w.miles -= GACHA_COST;

    // Pick rarity
    const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * total;
    let rarity = 'C';
    for (const r of RARITY_WEIGHTS) {
        roll -= r.weight;
        if (roll <= 0) { rarity = r.rarity; break; }
    }

    // Pick item
    const candidates = GACHA_POOL.filter(i => i.rarity === rarity);
    const item = candidates[Math.floor(Math.random() * candidates.length)];

    // Duplicate check
    const isDupe = ownsItem(item.id);
    if (isDupe) {
        w.scrap += SCRAP_DUPE[rarity];
    } else {
        addItem(item.id);
    }

    saveWallet(w);
    return { item, isDupe, scrapGained: isDupe ? SCRAP_DUPE[rarity] : 0, rarity };
}

export function buyWithScrap(itemId) {
    const poolItem = GACHA_POOL.find(p => p.id === itemId);
    if (!poolItem) return false;
    const price = SCRAP_PRICE[poolItem.rarity];
    const w = getWallet();
    if (w.scrap < price) return false;
    if (ownsItem(itemId)) return false;
    w.scrap -= price;
    saveWallet(w);
    addItem(itemId);
    return true;
}

export function getShopItems() {
    return GACHA_POOL.filter(p => !ownsItem(p.id)).map(p => ({
        ...p,
        price: SCRAP_PRICE[p.rarity]
    }));
}
