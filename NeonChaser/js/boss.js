// --- Boss Battle System ---

function _defaultBossState() {
    return { active: false, entity: null, hp: 0, maxHp: 0, phase: 0,
             patternTimer: 0, stageIdx: 0, introTimer: 0, deathTimer: 0,
             defeated: false, swayT: 0 };
}

function initBossFight(stageIdx) {
    const st = game.st;
    if (st.boss && st.boss.active) return;

    // Clear all existing entities
    game.ents.forEach(e => scene.remove(e.mesh));
    game.ents.length = 0;

    // Straighten road
    st.tCrv = 0; st.crv = 0;
    st.sCrvSt = 'B'; // block curves

    // Init boss state
    st.boss = _defaultBossState();
    st.boss.active = true;
    st.boss.stageIdx = stageIdx;

    const def = BOSS_DEFS[stageIdx];
    const _bk = 'boss' + stageIdx;
    const _bossHpMul = (typeof _bestiaryDebuffs !== 'undefined' && _bestiaryDebuffs[_bk]) ? _bestiaryDebuffs[_bk].hpMul : 1;
    st.boss.hp = ceil(def.hp * _bossHpMul);
    st.boss.maxHp = ceil(def.hp * _bossHpMul);
    st.boss.introTimer = 2.5;

    // Show warning
    showBossWarning(def.name);

    // Spawn boss after warning
    setTimeout(() => {
        if (!st.boss.active) return;
        _spawnBossEntity(stageIdx);
    }, 2000);
}

function _spawnBossEntity(stageIdx) {
    const def = BOSS_DEFS[stageIdx];
    const matBody = new THREE.MeshPhongMaterial({ color: def.colors.body, emissive: def.colors.emit, emissiveIntensity: 0.5, wireframe: false, transparent: true, opacity: 0.7 });
    const matNeon = new THREE.LineBasicMaterial({ color: def.colors.neon, linewidth: 2 });

    let mesh;
    if (stageIdx === 0) mesh = _createBoss1Mesh(matBody, matNeon);
    else if (stageIdx === 1) mesh = _createBoss2Mesh(matBody, matNeon);
    else mesh = _createBoss3Mesh(matBody, matNeon);

    // Scale up bosses for visual impact
    const bossScales = [3.5, 6.0, 7.0];
    mesh.scale.setScalar(bossScales[stageIdx] || 3.5);
    mesh.position.set(0, 5, -200);
    scene.add(mesh);

    const ent = {
        type: 'boss', def, defName: 'boss', mesh, lX: 0,
        box: new THREE.Box3(), state: 'A',
        v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: 0, xS: 0, cTmr: 0, isWall: false, mS: 'U',
        zigTime: 0, zigBase: 0, curHp: def.hp
    };
    game.ents.push(ent);
    game.st.boss.entity = ent;
}

// --- Boss Mesh Factories ---
function _createBoss1Mesh(bodyMat, neonMat) {
    // Neon Hydra: thick trunk at bottom, branching upward tentacles
    const grp = new THREE.Group();

    // Trunk (thick base column)
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.9, 3.0, 8);
    const trunk = new THREE.Mesh(trunkGeo, bodyMat);
    const trunkEdge = new THREE.LineSegments(new THREE.EdgesGeometry(trunkGeo), neonMat);
    trunk.position.y = -1.5;
    trunkEdge.position.y = -1.5;
    grp.add(trunk, trunkEdge);

    // Mid-body bulge
    const bulgeGeo = new THREE.SphereGeometry(0.7, 8, 6);
    const bulge = new THREE.Mesh(bulgeGeo, bodyMat);
    const bulgeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(bulgeGeo), neonMat);
    grp.add(bulge, bulgeEdge);

    // Upward branching tentacles
    const allSegs = [];
    const branches = [
        // [angleX, angleZ, length multiplier] — spread outward and upward
        { ax: -0.3, az: 0,    len: 1.0 },
        { ax: -0.2, az: 0.5,  len: 0.9 },
        { ax: -0.2, az: -0.5, len: 0.9 },
        { ax: -0.4, az: 0.3,  len: 1.1 },
        { ax: -0.4, az: -0.3, len: 1.1 },
        { ax: -0.1, az: 0.8,  len: 0.7 },
        { ax: -0.1, az: -0.8, len: 0.7 },
    ];
    const SEG_COUNT = 7;

    branches.forEach((br, bIdx) => {
        const tentGrp = new THREE.Group();
        tentGrp.position.y = 0.3;
        tentGrp.rotation.x = br.ax;
        tentGrp.rotation.z = br.az;
        const segs = [];

        for (let s = 0; s < SEG_COUNT; s++) {
            const t = s / SEG_COUNT;
            const topR = Math.max(0.03, 0.3 * (1 - t * 0.9));
            const botR = Math.max(0.04, 0.3 * (1 - (t - 0.14) * 0.9));
            const segH = 0.7 * br.len;
            const segGeo = new THREE.CylinderGeometry(topR, botR, segH, 6);
            const seg = new THREE.Mesh(segGeo, bodyMat);
            const segEdge = new THREE.LineSegments(new THREE.EdgesGeometry(segGeo), neonMat);
            seg.position.y = s * segH * 0.9;
            segEdge.position.y = s * segH * 0.9;
            tentGrp.add(seg, segEdge);
            segs.push({ mesh: seg, edge: segEdge, idx: s, bIdx });
        }

        // Sub-branches at segment 3-4 for larger tentacles
        if (br.len >= 0.9 && bIdx < 5) {
            const subGrp = new THREE.Group();
            subGrp.position.y = 3 * 0.7 * br.len * 0.9;
            subGrp.rotation.z = (bIdx % 2 === 0 ? 0.6 : -0.6);
            for (let s = 0; s < 4; s++) {
                const t2 = s / 4;
                const r2 = Math.max(0.02, 0.15 * (1 - t2));
                const sg = new THREE.CylinderGeometry(r2, r2 + 0.02, 0.5, 5);
                const sm = new THREE.Mesh(sg, bodyMat);
                const se = new THREE.LineSegments(new THREE.EdgesGeometry(sg), neonMat);
                sm.position.y = s * 0.45;
                se.position.y = s * 0.45;
                subGrp.add(sm, se);
                segs.push({ mesh: sm, edge: se, idx: s + SEG_COUNT, bIdx });
            }
            tentGrp.add(subGrp);
        }

        allSegs.push(segs);
        grp.add(tentGrp);
    });

    grp.userData = {
        changeMat: (b, n) => { grp.traverse(c => { if (c.isMesh) c.material = b; if (c.isLineSegments) c.material = n; }); },
        allSegs,
        animate: (dt) => {
            const t = performance.now() * 0.001;
            // Slow body sway
            trunk.rotation.z = Math.sin(t * 0.4) * 0.08;
            trunkEdge.rotation.z = trunk.rotation.z;
            // Tentacle writhing — larger amplitude, varied speeds
            for (const segs of allSegs) {
                for (const s of segs) {
                    const depth = s.idx * 0.6;
                    const phase = t * 1.8 + s.bIdx * 1.5 + depth;
                    const amp = 0.15 + s.idx * 0.08;  // tips sway more
                    s.mesh.rotation.x = Math.sin(phase) * amp;
                    s.mesh.rotation.z = Math.cos(phase * 0.6 + s.bIdx) * amp * 0.8;
                    s.edge.rotation.copy(s.mesh.rotation);
                }
            }
        }
    };
    return grp;
}

function _createBoss2Mesh(bodyMat, neonMat) {
    // Abyssal Leviathan: elongated body + tentacle-like dangling parts
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), bodyMat);
    body.scale.set(1, 0.7, 2);
    const bodyEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(2.5, 8, 6)), neonMat);
    bodyEdge.scale.copy(body.scale);
    grp.add(body, bodyEdge);
    // Tentacles
    for (let i = 0; i < 6; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 3, 6), bodyMat);
        const tEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.1, 0.3, 3, 6)), neonMat);
        const angle = (i / 6) * Math.PI * 2;
        t.position.set(Math.cos(angle) * 1.5, -1.5, Math.sin(angle) * 2);
        tEdge.position.copy(t.position);
        t.userData._baseY = t.position.y;
        t.userData._phase = i;
        grp.add(t, tEdge);
    }
    grp.userData = {
        changeMat: (b, n) => { grp.children.forEach(c => { if (c.isMesh) c.material = b; if (c.isLineSegments) c.material = n; }); },
        animate: (dt) => {
            const t = performance.now() * 0.001;
            grp.children.forEach(c => {
                if (c.isMesh && c.userData._baseY !== undefined) {
                    c.position.y = c.userData._baseY + Math.sin(t * 2 + c.userData._phase) * 0.5;
                }
            });
            grp.rotation.y += 0.3 * dt;
        }
    };
    return grp;
}

function _createBoss3Mesh(bodyMat, neonMat) {
    // Inferno Sentinel: massive rotating core + orbiting shards
    const grp = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 0), bodyMat);
    const coreEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(2.5, 0)), neonMat);
    grp.add(core, coreEdge);
    // Orbiting shards
    const orbitGrp = new THREE.Group();
    for (let i = 0; i < 8; i++) {
        const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.8, 0), bodyMat);
        const shardEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(0.8, 0)), neonMat);
        const angle = (i / 8) * Math.PI * 2;
        shard.position.set(Math.cos(angle) * 4, Math.sin(angle) * 1.5, Math.sin(angle) * 4);
        shardEdge.position.copy(shard.position);
        orbitGrp.add(shard, shardEdge);
    }
    grp.add(orbitGrp);
    grp.userData = {
        changeMat: (b, n) => { grp.traverse(c => { if (c.isMesh) c.material = b; if (c.isLineSegments) c.material = n; }); },
        orbitGrp,
        animate: (dt) => {
            core.rotation.x += 0.4 * dt; core.rotation.y += 0.6 * dt;
            coreEdge.rotation.copy(core.rotation);
            orbitGrp.rotation.y += 0.8 * dt;
            orbitGrp.rotation.x += 0.2 * dt;
        }
    };
    return grp;
}

// --- Boss Update (called from gameloop) ---
function updateBoss(dt) {
    const boss = game.st.boss;
    if (!boss || !boss.active) return;
    const ent = boss.entity;
    if (!ent) return;

    // Intro: slide boss in
    if (boss.introTimer > 0) {
        boss.introTimer -= dt;
        const t = 1 - Math.max(0, boss.introTimer / 2.5);
        ent.mesh.position.z = -200 + t * 120; // -200 → -80
        ent.mesh.position.y = 6;
        if (ent.mesh.userData.animate) ent.mesh.userData.animate(dt);
        return;
    }

    // Death animation
    if (boss.deathTimer > 0) {
        boss.deathTimer -= dt;
        ent.mesh.scale.multiplyScalar(1 + dt * 0.5);
        ent.mesh.rotation.y += 5 * dt;
        ent.mesh.children.forEach(c => {
            if (c.material && c.material.opacity !== undefined) {
                c.material.transparent = true;
                c.material.opacity = Math.max(0, boss.deathTimer / 2);
            }
        });
        if (boss.deathTimer <= 0) {
            _onBossDefeated();
        }
        return;
    }

    // Combat phase
    const def = BOSS_DEFS[boss.stageIdx];

    // Boss sway (moves left/right slowly)
    boss.swayT += dt;
    const swayX = Math.sin(boss.swayT * 0.5) * 8;
    ent.mesh.position.x = swayX;
    ent.lX = swayX;
    ent.mesh.position.z = -80;
    ent.mesh.position.y = 6;

    // Animate mesh
    if (ent.mesh.userData.animate) ent.mesh.userData.animate(dt);

    // Update bounding box
    const sc = ent.mesh.scale.x;
    ent.box.setFromCenterAndSize(
        ent.mesh.position,
        new THREE.Vector3(4 * sc, 4 * sc, 4 * sc)
    );

    // Attack patterns
    const phaseInfo = def.phases[boss.phase];
    boss.patternTimer -= dt;
    if (boss.patternTimer <= 0) {
        boss.patternTimer = phaseInfo.interval;
        _fireBossPattern(phaseInfo.pattern, def, ent);
    }
}

// --- Boss Attack Patterns ---
function _fireBossPattern(pattern, def, ent) {
    const bx = ent.mesh.position.x;
    const bz = ent.mesh.position.z;
    const by = 1.5; // fire at player height, not boss height
    const px = game.st.pLx;
    const spd = def.bulletSpd;

    switch (pattern) {
        case 'straight':
            _spawnBossBullet(bx, by, bz + 5, (px - bx) * 0.3, 0, spd);
            break;
        case 'spread3':
            for (let i = -1; i <= 1; i++)
                _spawnBossBullet(bx + i * 2, by, bz + 5, (px - bx) * 0.2 + i * 8, 0, spd);
            break;
        case 'burst':
            _spawnBossBullet(bx, by, bz + 5, (px - bx) * 0.35, 0, spd);
            setTimeout(() => {
                if (game.st.boss.active)
                    _spawnBossBullet(bx, by, bz + 5, (game.st.pLx - bx) * 0.35, 0, spd);
            }, 300);
            break;
        case 'wave5':
            for (let i = -2; i <= 2; i++)
                _spawnBossBullet(bx + i * 3, by, bz + 5, i * 5, 0, spd, true);
            break;
        case 'homing':
            for (let i = 0; i < 2; i++)
                _spawnBossBullet(bx + (i === 0 ? -3 : 3), by, bz + 5, 0, 0, spd * 0.7, false, true);
            break;
        case 'rain':
            for (let i = 0; i < 8; i++) {
                const rx = -14 + R() * 28;
                _spawnBossBullet(rx, by + 2, bz + 5, 0, 0, spd * (0.8 + R() * 0.4));
            }
            break;
        case 'ring': {
            const gap = R() * Math.PI * 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + gap;
                if (i === 0) continue; // one gap
                _spawnBossBullet(bx, by, bz + 5, Math.cos(angle) * 15, Math.sin(angle) * 8, spd * 0.8);
            }
            break;
        }
        case 'sweep': {
            const side = R() < 0.5 ? -1 : 1;
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    if (!game.st.boss.active) return;
                    _spawnBossBullet(side * 15, by, bz + 5, -side * 20, 0, spd * 0.9);
                }, i * 150);
            }
            break;
        }
        case 'chaos':
            // Alternating ring + spread
            _fireBossPattern('ring', def, ent);
            setTimeout(() => {
                if (game.st.boss.active) _fireBossPattern('spread3', def, ent);
            }, 500);
            break;
    }
}

// --- Boss Bullet ---
const _geoBossBullet = new THREE.SphereGeometry(0.4, 8, 8);
const _matBossBullet = new THREE.MeshBasicMaterial({
    color: 0xff3333, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
});

function _spawnBossBullet(x, y, z, vx, vy, vz, wave, homing) {
    const mesh = new THREE.Mesh(_geoBossBullet, _matBossBullet.clone());
    mesh.position.set(x, y, z);
    scene.add(mesh);
    game.ents.push({
        type: 'bossBullet', def: null, defName: 'bossBullet', mesh, lX: x,
        box: new THREE.Box3(), state: 'A',
        v: new THREE.Vector3(vx, vy, vz),
        aV: new THREE.Vector3(), zS: 0, xS: 0, cTmr: 0,
        isWall: false, mS: '', zigTime: 0, zigBase: x, curHp: 1,
        _wave: !!wave, _homing: !!homing, _age: 0
    });
}

// --- Boss Damage ---
function damageBoss(amount, source) {
    const boss = game.st.boss;
    if (!boss || !boss.active || boss.deathTimer > 0) return;

    boss.hp -= amount;
    if (boss.entity && boss.entity.mesh.userData.changeMat) {
        // Flash white
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const flashNeon = new THREE.LineBasicMaterial({ color: 0xffffff });
        boss.entity.mesh.userData.changeMat(flashMat, flashNeon);
        const def = BOSS_DEFS[boss.stageIdx];
        setTimeout(() => {
            if (boss.entity) {
                const matB = new THREE.MeshPhongMaterial({ color: def.colors.body, emissive: def.colors.emit, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
                const matN = new THREE.LineBasicMaterial({ color: def.colors.neon });
                boss.entity.mesh.userData.changeMat(matB, matN);
            }
        }, 100);
    }

    // Check phase transition
    const ratio = boss.hp / boss.maxHp;
    const newPhase = ratio <= BOSS_PHASE_THRESHOLDS[1] ? 2 : ratio <= BOSS_PHASE_THRESHOLDS[0] ? 1 : 0;
    if (newPhase > boss.phase) {
        boss.phase = newPhase;
        game.st.hStop = 0.3; // brief slow-mo
        flashScreen('rgba(255,100,100,.4)');
        shakeCamera(0.3, 2);
    }

    // Check death
    if (boss.hp <= 0) {
        boss.hp = 0;
        boss.deathTimer = 2.0;
        // Remove all boss bullets
        for (let i = game.ents.length - 1; i >= 0; i--) {
            if (game.ents[i].type === 'bossBullet') {
                scene.remove(game.ents[i].mesh);
                game.ents.splice(i, 1);
            }
        }
        flashScreen('rgba(255,255,255,.6)');
        shakeCamera(1.0, 4);
    }
}

// --- Boss Passive Rewards (3-pick) ---
const BOSS_PASSIVES = [
    { id: 'bp-vampire', i: 'droplets', t: 'ヴァンパイア', d: '敵を倒すたびHP+1回復',
      apply: st => { st._passive_vampire = true; } },
    { id: 'bp-second', i: 'rotate-ccw', t: 'セカンドチャンス', d: 'HP0で一度だけ50%復活',
      apply: st => { st._passive_secondChance = true; } },
    { id: 'bp-pierce', i: 'arrow-right-to-line', t: 'ピアシングショット', d: 'ブラスター弾が敵を貫通',
      apply: st => { st._passive_pierce = true; } },
    { id: 'bp-chain', i: 'zap', t: 'チェインライトニング', d: '敵撃破時に周囲へ連鎖ダメージ',
      apply: st => { st._passive_chain = true; } },
    { id: 'bp-overclock', i: 'brain', t: 'オーバークロック', d: 'レベルアップの選択肢が4つに',
      apply: st => { st._passive_overclock = true; } },
    { id: 'bp-explode', i: 'flame', t: 'エクスプロージョン', d: '敵撃破時に爆発AoEダメージ',
      apply: st => { st._passive_explode = true; } },
    { id: 'bp-timeDist', i: 'hourglass', t: 'タイムディストーション', d: '被弾時の無敵時間が2倍に',
      apply: st => { st._passive_longInv = true; } },
    { id: 'bp-dashExt', i: 'wind', t: 'ダッシュブースト', d: 'ダッシュ持続時間1.5倍',
      apply: st => { st._passive_dashExt = true; } },
];

function _onBossDefeated() {
    const boss = game.st.boss;
    const stageIdx = boss.stageIdx;
    const def = BOSS_DEFS[stageIdx];

    // Remove boss entity
    if (boss.entity) {
        scene.remove(boss.entity.mesh);
        const idx = game.ents.indexOf(boss.entity);
        if (idx >= 0) game.ents.splice(idx, 1);
    }

    // Award cores
    addCores(def.coreReward);
    game.st.coresEarned = (game.st.coresEarned || 0) + def.coreReward;
    if (!game.st.bossesDefeated) game.st.bossesDefeated = [];
    game.st.bossesDefeated[stageIdx] = true;
    addCumulStat('bossesKilled');
    recordEnemyTypeKill('boss' + stageIdx);

    // Pause game and show victory modal with passive selection
    game.st.isP = true;
    boss.active = false;
    boss.entity = null;

    _showBossRewardModal(def.coreReward, stageIdx);
}

function _showBossRewardModal(coreReward, stageIdx) {
    const modal = el('boss-reward-modal');
    if (!modal) return;

    el('boss-reward-cores').innerText = '+' + coreReward;

    // Pick 3 random passives
    const shuffled = [...BOSS_PASSIVES].sort(() => 0.5 - R());
    // Ensure blaster-related only if player has blaster
    const filtered = shuffled.filter(p => {
        if ((p.id === 'bp-blaster' || p.id === 'bp-bnum') && game.st.blasterCount <= 0) return false;
        return true;
    });
    const chosen = filtered.slice(0, 3);

    const container = el('boss-reward-picks');
    container.innerHTML = '';
    chosen.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => _selectBossPassive(p, stageIdx);
        card.innerHTML = `<div class="card-icon"><i data-lucide="${p.i}"></i></div><div><div class="card-title">${p.t}</div><div class="card-desc">${p.d}</div></div>`;
        container.appendChild(card);
    });

    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Stagger card reveal
    const cards = container.querySelectorAll('.card');
    cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('card-reveal'), 800 + i * 200);
    });
}

function _selectBossPassive(passive, stageIdx) {
    // Apply passive
    passive.apply(game.st);

    // Close modal
    const modal = el('boss-reward-modal');
    modal.classList.remove('active');
    modal.querySelectorAll('.card.card-reveal').forEach(c => c.classList.remove('card-reveal'));

    // Resume game
    game.st.sCrvSt = 'N';
    game.st.sCrvCd = CFG.sCrvBase + R() * CFG.sCrvRnd;
    game.clock.getDelta();
    game.st.isP = false;

    // Transition to next stage
    if (stageIdx < STAGES.length - 1) {
        setTimeout(() => triggerStageTransition(stageIdx + 1), 500);
    }
}
