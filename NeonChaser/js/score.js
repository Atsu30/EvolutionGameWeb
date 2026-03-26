// --- Score & Ranking ---
function getScores() {
    return storageLoad('scores-v1', []);
}

function addScore(dist, lv) {
    const scores = getScores();
    scores.push({ dist: Math.round(dist * 100) / 100, lv, date: Date.now() });
    scores.sort((a, b) => b.dist - a.dist);
    if (scores.length > 10) scores.length = 10;
    storageSave('scores-v1', scores);
    return scores;
}
