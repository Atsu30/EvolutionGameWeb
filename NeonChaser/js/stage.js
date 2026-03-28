// --- Stage System ---
const STAGES = [
    {
        name: 'ネオンシティ',
        dist: 0, bossDist: 9,
        cityVisible: true,
        fogColor: 0x050510,
        fogDensity: 0.015,
        floorCol1: [0.0, 0.1, 0.3],
        floorCol2: [0.0, 0.4, 0.8],
        floorWave: 0,
        pillarColor: 0x8b5cf6,
        pillarEmit: 0xa855f7,
        bgColors: [0x38bdf8, 0xf43f5e, 0xa855f7],
        bgOpacity: 0.4,
        ambientColor: 0xffffff,
        hemiSky: 0x0f172a,
        hemiGround: 0xec4899,
        enemyHpMul: 1,
        enemyAtkMul: 1,
        bgGeos: ['octa', 'torus', 'icosa'],
        enemyColors: {
            unbreak: [0xbe123c, 0x9f1239], neonU: [0xff0055, 0xe11d48],
            break: [0x064e3b, 0x022c22], neonB: [0x10b981, 0x059669],
            zigzag: [0xd97706, 0x92400e], zigzagNeon: [0xfbbf24, 0xfbbf24],
        },
        enemyPool: [{ type: 'drone', weight: 80 }, { type: 'shard', weight: 15 }, { type: 'sentinel', weight: 5 }],
        zigzag: false,
        rocket: false,
    },
    {
        name: 'ディープオーシャン',
        cityVisible: false,
        dist: 10, bossDist: 23,
        fogColor: 0x001a2c,
        fogDensity: 0.018,
        floorCol1: [0.0, 0.15, 0.2],
        floorCol2: [0.0, 0.35, 0.5],
        floorWave: 1.0,
        pillarColor: 0x0d9488,
        pillarEmit: 0x14b8a6,
        bgColors: [0x06b6d4, 0x22d3ee, 0x2dd4bf],
        bgOpacity: 0.3,
        ambientColor: 0x67e8f9,
        hemiSky: 0x042f2e,
        hemiGround: 0x06b6d4,
        enemyHpMul: 2,
        enemyAtkMul: 1.5,
        bgGeos: ['sphere', 'torusS', 'sphereS'],
        enemyColors: {
            unbreak: [0x0e7490, 0x155e75], neonU: [0x06b6d4, 0x0891b2],
            break: [0x064e3b, 0x022c22], neonB: [0x2dd4bf, 0x14b8a6],
            zigzag: [0x0d9488, 0x065f53], zigzagNeon: [0x22d3ee, 0x22d3ee],
        },
        enemyPool: [{ type: 'drone', weight: 70 }, { type: 'shard', weight: 10 }, { type: 'jellyfish', weight: 10 }, { type: 'fish', weight: 10 }],
        zigzag: true,
        rocket: true,
    },
    {
        name: 'ヴォルケーノ',
        cityVisible: false,
        dist: 25, bossDist: 45,
        fogColor: 0x1a0500,
        fogDensity: 0.020,
        floorCol1: [0.3, 0.05, 0.0],
        floorCol2: [0.8, 0.2, 0.0],
        floorWave: 0.5,
        pillarColor: 0xdc2626,
        pillarEmit: 0xef4444,
        bgColors: [0xef4444, 0xf97316, 0xfbbf24],
        bgOpacity: 0.35,
        ambientColor: 0xfca5a5,
        hemiSky: 0x450a0a,
        hemiGround: 0xdc2626,
        enemyHpMul: 3,
        enemyAtkMul: 2,
        bgGeos: ['tetra', 'cone', 'dodeca'],
        enemyColors: {
            unbreak: [0x991b1b, 0x7f1d1d], neonU: [0xef4444, 0xdc2626],
            break: [0x78350f, 0x451a03], neonB: [0xfbbf24, 0xd97706],
            zigzag: [0xea580c, 0x9a3412], zigzagNeon: [0xfb923c, 0xfb923c],
        },
        enemyPool: [{ type: 'drone', weight: 20 }, { type: 'shard', weight: 35 }, { type: 'sentinel', weight: 45 }],
        zigzag: true,
        rocket: true,
    },
];

let _currentStage = 0;
let _stageTransitioning = false;

function getCurrentStageIdx() { return _currentStage; }
function getStageDef() { return STAGES[_currentStage]; }

function resetStage() {
    _currentStage = 0;
    _stageTransitioning = false;
    applyStage(0);
}

function checkStageTransition(dist) {
    if (_stageTransitioning) return;
    const st = game.st;
    // Check boss trigger before stage transition
    if (typeof initBossFight === 'function' && st.boss && !st.boss.active) {
        const s = STAGES[_currentStage];
        if (s.bossDist && dist >= s.bossDist && !(st.bossesDefeated && st.bossesDefeated[_currentStage])) {
            initBossFight(_currentStage);
            return;
        }
    }
    for (let i = STAGES.length - 1; i > _currentStage; i--) {
        if (dist >= STAGES[i].dist) {
            _stageTransitioning = true;
            triggerStageTransition(i);
            return;
        }
    }
}

function triggerStageTransition(idx) {
    // Flash effect
    flashScreen('rgba(0,255,255,.6)');
    shakeCamera(0.5, 3);

    // Animate transition over 1 second
    const from = STAGES[_currentStage];
    const to = STAGES[idx];
    const duration = 1000;
    const start = performance.now();

    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpColor(c1, c2, t) {
        const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
        const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
        return (floor(lerp(r1, r2, t)) << 16) | (floor(lerp(g1, g2, t)) << 8) | floor(lerp(b1, b2, t));
    }

    function animateStep(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        // Fog
        scene.fog.color.setHex(lerpColor(from.fogColor, to.fogColor, ease));
        scene.fog.density = lerp(from.fogDensity, to.fogDensity, ease);

        // Floor shader
        const u = floorMat.uniforms;
        for (let i = 0; i < 3; i++) {
            u.col1.value.setComponent(i, lerp(from.floorCol1[i], to.floorCol1[i], ease));
            u.col2.value.setComponent(i, lerp(from.floorCol2[i], to.floorCol2[i], ease));
        }
        u.wave.value = lerp(from.floorWave, to.floorWave, ease);

        // Pillars
        const pc = lerpColor(from.pillarColor, to.pillarColor, ease);
        const pe = lerpColor(from.pillarEmit, to.pillarEmit, ease);
        matPil.color.setHex(pc);
        matPil.emissive.setHex(pe);

        // Background objects
        game.pts.forEach((p, i) => {
            const ci = i % 3;
            const c = lerpColor(from.bgColors[ci], to.bgColors[ci], ease);
            p.material.color.setHex(c);
            p.material.opacity = lerp(from.bgOpacity, to.bgOpacity, ease);
        });

        // Lights
        const lights = scene.children.filter(c => c.isLight);
        lights.forEach(l => {
            if (l.isAmbientLight) l.color.setHex(lerpColor(from.ambientColor, to.ambientColor, ease));
            if (l.isHemisphereLight) {
                l.color.setHex(lerpColor(from.hemiSky, to.hemiSky, ease));
                l.groundColor.setHex(lerpColor(from.hemiGround, to.hemiGround, ease));
            }
        });

        if (t < 1) {
            requestAnimationFrame(animateStep);
        } else {
            if (typeof updateBgGeos === 'function') updateBgGeos(to.bgGeos);
            if (typeof updateEnemyColors === 'function') updateEnemyColors(to.enemyColors);
            if (typeof setCityVisible === 'function') setCityVisible(!!to.cityVisible);
            _currentStage = idx;
            _stageTransitioning = false;
        }
    }
    requestAnimationFrame(animateStep);

    // Show stage name popup
    showStagePopup(to.name);
}

function applyStage(idx) {
    const s = STAGES[idx];
    _currentStage = idx;

    // Fog
    scene.fog.color.setHex(s.fogColor);
    scene.fog.density = s.fogDensity;

    // Floor
    const u = floorMat.uniforms;
    u.col1.value.set(s.floorCol1[0], s.floorCol1[1], s.floorCol1[2]);
    u.col2.value.set(s.floorCol2[0], s.floorCol2[1], s.floorCol2[2]);
    u.wave.value = s.floorWave;

    // Pillars
    matPil.color.setHex(s.pillarColor);
    matPil.emissive.setHex(s.pillarEmit);

    // Background
    game.pts.forEach((p, i) => {
        p.material.color.setHex(s.bgColors[i % 3]);
        p.material.opacity = s.bgOpacity;
    });

    // Lights
    const lights = scene.children.filter(c => c.isLight);
    lights.forEach(l => {
        if (l.isAmbientLight) l.color.setHex(s.ambientColor);
        if (l.isHemisphereLight) { l.color.setHex(s.hemiSky); l.groundColor.setHex(s.hemiGround); }
    });

    // Background geos
    if (typeof updateBgGeos === 'function') updateBgGeos(s.bgGeos);
    // Enemy colors
    if (typeof updateEnemyColors === 'function') updateEnemyColors(s.enemyColors);
    // City buildings
    if (typeof setCityVisible === 'function') setCityVisible(!!s.cityVisible);
}

function showStagePopup(name) {
    const popup = el('stage-popup');
    if (!popup) return;
    popup.textContent = name;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 3000);
}
