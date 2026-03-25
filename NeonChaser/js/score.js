import { load, save } from './storage.js';

const KEY = 'scores-v1';
const MAX = 10;

export function getScores() {
    return load(KEY, []);
}

export function addScore(dist, lv) {
    const scores = getScores();
    scores.push({ dist: Math.round(dist * 100) / 100, lv, date: Date.now() });
    scores.sort((a, b) => b.dist - a.dist);
    if (scores.length > MAX) scores.length = MAX;
    save(KEY, scores);
    return scores;
}
