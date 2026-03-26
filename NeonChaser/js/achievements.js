// --- Achievements ---
function getAchievementProgress() {
    return storageLoad('achievements-v1', {});
}

function checkAchievements(currentDist, stats) {
    const progress = getAchievementProgress();
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
        }
        if (met) {
            progress[a.id] = { unlocked: true, unlockedAt: Date.now() };
            newlyUnlocked.push(a);
        }
    }
    if (newlyUnlocked.length > 0) storageSave('achievements-v1', progress);
    return newlyUnlocked;
}

function claimReward(achieveId) {
    const progress = getAchievementProgress();
    const entry = progress[achieveId];
    if (!entry || !entry.unlocked || entry.claimed) return false;
    const def = ACHIEVEMENTS.find(a => a.id === achieveId);
    if (!def || !def.reward) return false;
    progress[achieveId].claimed = true;
    storageSave('achievements-v1', progress);
    addMiles(def.reward);
    return true;
}
