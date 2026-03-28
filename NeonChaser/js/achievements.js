// --- Achievements ---
function getAchievementProgress() {
    return storageLoad('achievements-v1', {});
}

// --- Cumulative Stats (persistent across runs) ---
const _CUMUL_KEY = 'cumul-stats-v1';
function getCumulStats() {
    return storageLoad(_CUMUL_KEY, {
        totalKills: 0, totalRuns: 0, gachaPulls: 0, shopPurchases: 0,
        customChanged: false, enemyTypesKilled: {}, ownedItemCount: 0
    });
}
function _saveCumulStats(s) { storageSave(_CUMUL_KEY, s); }

/** Increment a numeric cumulative stat */
function addCumulStat(key, amount) {
    const s = getCumulStats();
    s[key] = (s[key] || 0) + (amount || 1);
    _saveCumulStats(s);
    return s;
}

/** Set a boolean flag in cumulative stats */
function setCumulFlag(key) {
    const s = getCumulStats();
    if (!s[key]) { s[key] = true; _saveCumulStats(s); }
}

/** Record a killed enemy type */
function recordEnemyTypeKill(typeName) {
    const s = getCumulStats();
    s.totalKills = (s.totalKills || 0) + 1;
    if (!s.enemyTypesKilled) s.enemyTypesKilled = {};
    s.enemyTypesKilled[typeName] = true;
    _saveCumulStats(s);
}

/** Update owned item count (called after gacha/shop acquire) */
function updateOwnedCount() {
    const inv = getInventory();
    const s = getCumulStats();
    s.ownedItemCount = inv.colors.length + inv.tires.length + inv.bodies.length + (inv.trails || []).length;
    _saveCumulStats(s);
}

function checkAchievements(currentDist, stats) {
    const progress = getAchievementProgress();
    const cumul = getCumulStats();
    const newlyUnlocked = [];
    for (const a of ACHIEVEMENTS) {
        if (progress[a.id]) continue;
        let met = false;
        if (a.type === 'dist') {
            met = currentDist >= a.dist;
        } else if (a.type === 'stat') {
            const val = a.stat === 'lv' ? (stats.lv || 0) : (stats[a.stat] || 0);
            met = val >= a.val;
        } else if (a.type === 'nodmg') {
            met = currentDist >= a.dist && (stats.damageTaken || 0) === 0;
        } else if (a.type === 'cumul') {
            // Cumulative stat check (persistent across runs)
            met = (cumul[a.stat] || 0) >= a.val;
        } else if (a.type === 'flag') {
            // Boolean flag check
            met = !!cumul[a.stat];
        } else if (a.type === 'enemyType') {
            // Specific enemy type killed
            met = !!(cumul.enemyTypesKilled && cumul.enemyTypesKilled[a.enemyName]);
        } else if (a.type === 'collection') {
            // Item collection count
            met = (cumul.ownedItemCount || 0) >= a.val;
        } else if (a.type === 'collectAll') {
            // All items in gacha pool collected
            met = (cumul.ownedItemCount || 0) >= GACHA_POOL.length;
        }
        if (met) {
            progress[a.id] = { unlocked: true, unlockedAt: Date.now() };
            newlyUnlocked.push(a);
        }
    }
    if (newlyUnlocked.length > 0) storageSave('achievements-v1', progress);
    return newlyUnlocked;
}

/** Check cumulative achievements (called outside gameplay loop) */
function checkCumulAchievements() {
    return checkAchievements(0, { destroyedEnemies: 0, damageTaken: 0, dashCount: 0, jumpCount: 0, lv: 0 });
}

function claimReward(achieveId) {
    const progress = getAchievementProgress();
    const entry = progress[achieveId];
    if (!entry || !entry.unlocked || entry.claimed) return 0;
    const def = ACHIEVEMENTS.find(a => a.id === achieveId);
    if (!def || !def.reward) return 0;
    progress[achieveId].claimed = true;
    storageSave('achievements-v1', progress);
    addMiles(def.reward);
    return def.reward;
}
