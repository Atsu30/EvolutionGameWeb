import { load, save } from './storage.js';
import { ACHIEVEMENTS } from './config.js';

const KEY = 'achievements-v1';

export function getProgress() {
    return load(KEY, {});
}

export function checkAchievements(currentDist, stats) {
    const progress = getProgress();
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
    if (newlyUnlocked.length > 0) save(KEY, progress);
    return newlyUnlocked;
}
