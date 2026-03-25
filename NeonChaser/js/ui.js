import { el, game, min, max, ceil, floor, R } from './state.js';
import { CFG, UPGRADES } from './config.js';
import { cam, playerMesh, scene } from './renderer.js';
import { fetchAIFeedback } from './ai.js';
import { addScore } from './score.js';
import { calcMilesEarned, addMiles } from './gacha.js';
import { applyCustomization } from './customization.js';

export function updateUI() {
    const st = game.st;
    el('ui-lv').innerText = `Lv ${st.lv}`;
    el('ui-spd').innerText = floor(st.spd);
    el('ui-hp').innerText = ceil(st.hp);
    el('ui-dist').innerText = (st.dist || 0).toFixed(2) + ' km';
    el('exp-fill').style.width = `${min(100, st.exp / st.nExp * 100)}%`;
    el('speed-fill').style.width = `${min(100, st.spd / st.maxSpd * 100)}%`;

    const hpRatio = max(0, min(100, st.hp / st.maxHp * 100));
    el('hp-fill').style.width = `${hpRatio}%`;
    el('ui-hp').style.color = hpRatio < 30 ? '#f87171' : '#86efac';
    el('hp-fill').style.background = hpRatio < 30
        ? 'linear-gradient(90deg, #ef4444, #f87171)'
        : 'linear-gradient(90deg, #22c55e, #86efac)';

    const isD = st.dTimer > 0;
    el('ui-spd').style.color = isD ? '#22d3ee' : '#60a5fa';
    el('speed-fill').style.background = isD
        ? 'linear-gradient(90deg, #06b6d4, #22d3ee)'
        : 'linear-gradient(90deg, #3b82f6, #60a5fa)';
}

export function showUpgradeUI() {
    const container = el('upgrades');
    container.innerHTML = '';
    [...UPGRADES].sort(() => 0.5 - R()).slice(0, 3).forEach(u => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => selectUpgrade(u.id);
        card.innerHTML = `<div class="card-icon">${u.i}</div><div><div class="card-title">${u.t}</div><div class="card-desc">${u.d}</div></div>`;
        container.appendChild(card);
    });
}

export function selectUpgrade(id) {
    const st = game.st;
    if (id === 'spd') st.maxSpd += 20;
    if (id === 'grp') st.steer += 12;
    if (id === 'siz') { st.size += 0.3; playerMesh.scale.setScalar(1.5 * st.size); }
    if (id === 'atk') st.kb += 1.0;

    el('levelup-modal').classList.remove('active');
    st.cB_X = 0; st.cB_Y = 8;
    cam.position.set(0, 8, 15);
    game.clock.getDelta();
    st.isP = false;
}

export function triggerGameOver() {
    const st = game.st;
    if (st.isG) return;
    st.isG = true;

    // Score & miles
    const dist = st.dist || 0;
    const milesEarned = calcMilesEarned(dist);
    addMiles(milesEarned);
    addScore(dist, st.lv);

    el('res-lv').innerText = st.lv;
    el('res-dist').innerText = dist.toFixed(2) + ' km';
    el('res-miles').innerText = '+' + milesEarned;

    el('ai-feedback').style.display = 'block';
    el('ai-loading').style.display = 'block';
    el('ai-result').style.display = 'none';

    fetchAIFeedback({
        lv: st.lv, destroyed: st.stats.destroyedEnemies, damage: st.stats.damageTaken,
        dash: st.stats.dashCount, jump: st.stats.jumpCount
    }).then(res => {
        if (el('gameover-modal').classList.contains('active')) {
            el('ai-loading').style.display = 'none';
            el('ai-result').style.display = 'block';
            el('ai-title').innerText = `"${res.title}"`;
            el('ai-desc').innerText = res.feedback;
        }
    });

    el('gameover-modal').classList.add('active');
}

export function restartGame() {
    const st = game.st;
    Object.assign(st, {
        spd: 0, maxSpd: CFG.maxSpd, steer: CFG.steer, size: CFG.size, kb: CFG.kb, hp: CFG.hp, maxHp: CFG.hp,
        dTimer: 0, pY: 0, pVY: 0, bVX: 0, invT: 0, pBank: 0, hStop: 0, cShkT: 0, cShkI: 0, cB_X: 0, cB_Y: 8,
        lv: 1, exp: 0, nExp: CFG.lvExp, crv: 0, tCrv: 0, cTmr: 0,
        sCrvSt: 'N', sCrvCd: CFG.sCrvBase + R() * CFG.sCrvRnd, sCrvTmr: 0, sCrvDir: 1, pLx: 0,
        isP: false, isG: false, spwnT: 0,
        rocketTmr: 20 + R() * 10,
        dist: 0, _achTimer: 0,
        stats: { destroyedEnemies: 0, damageTaken: 0, dashCount: 0, jumpCount: 0 }
    });
    el('warning-container').classList.remove('active');
    playerMesh.scale.setScalar(1.5);
    playerMesh.position.setScalar(0);
    cam.rotation.z = 0; cam.fov = 75; cam.position.set(0, 8, 15);
    el('speed-lines').style.opacity = '0';
    game.pts.forEach(p => p.scale.z = 1);

    game.ents.forEach(e => scene.remove(e.mesh));
    game.ents.length = 0;
    el('gameover-modal').classList.remove('active');
    game.clock.getDelta();

    applyCustomization();
}

// Expose to window for onclick handlers in HTML
window.selectUpgrade = selectUpgrade;
window.restartGame = restartGame;
