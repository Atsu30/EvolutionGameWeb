import { load, save } from './storage.js';
import { ACHIEVEMENTS } from './config.js';

const KEY = 'achievements-v1';

export function getProgress() {
    return load(KEY, {});
}

export function checkAchievements(currentDist) {
    const progress = getProgress();
    const newlyUnlocked = [];
    for (const a of ACHIEVEMENTS) {
        if (!progress[a.id] && currentDist >= a.dist) {
            progress[a.id] = { unlocked: true, unlockedAt: Date.now() };
            newlyUnlocked.push(a);
        }
    }
    if (newlyUnlocked.length > 0) save(KEY, progress);
    return newlyUnlocked;
}
