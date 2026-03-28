// --- Entity Management ---
function addEntity(type, mesh, lx, zs = 0, def = null, isWall = false, defName = '') {
    scene.add(mesh);
    // Apply stage multiplier to enemy stats
    let curHp = def ? def.hp : 1;
    if (def && (type === 'enemy' || type === 'rocket' || type === 'zigzag') && typeof getStageDef === 'function') {
        const s = getStageDef();
        if (def.hp < 999) curHp = ceil(def.hp * s.enemyHpMul);
    }
    game.ents.push({
        type, def, defName, mesh, lX: lx, box: new THREE.Box3(),
        state: 'A', v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: zs, xS: 0, cTmr: 0, isWall, mS: 'U',
        zigTime: 0, zigBase: lx, curHp
    });
}

function spawnBullet(x, y, z, offsetX, dmg) {
    const mesh = new THREE.Mesh(geoBullet, matBullet.clone());
    const sc = 1 + (dmg - 1) * 0.25;
    mesh.scale.setScalar(sc);
    mesh.position.set(x + offsetX, y + 1, z);
    scene.add(mesh);
    game.ents.push({
        type: 'bullet', def: null, mesh, lX: x + offsetX, box: new THREE.Box3(),
        state: 'A', v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: 0, xS: 0, cTmr: 0, isWall: false, mS: '', zigTime: 0, zigBase: 0, curHp: 1
    });
}

function getEnemyType() {
    const pool = typeof getStageDef === 'function' ? getStageDef().enemyPool : [{ type: 'drone', weight: 60 }, { type: 'shard', weight: 40 }];
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let r = R() * total;
    for (const e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
}

function spawnMul() { return 1.0; }
function rocketInterval() { return 15 + R() * 10; }

function spawnEntity() {
    const st = game.st, dist = st.dist || 0;
    if (R() < CFG.dashRatio) {
        const lx = R_Sign() * (CFG.laneW - 2);
        const mesh = new THREE.Mesh(geoDash, matDash);
        mesh.position.set(lx, 0, -200);
        addEntity('dash', mesh, lx);
    } else {
        const typeName = getEnemyType(), def = ENEMY_TYPES[typeName];
        const meshFactory = { drone: createDroneMesh, shard: createShardMesh, sentinel: createSentinelMesh, jellyfish: createJellyfishMesh, fish: createFishMesh }[typeName];
        const mesh = meshFactory(matEnemyUnbreak, matEnemyNeonU);
        const lx = R_Sign() * (CFG.laneW - def.w / 2);
        mesh.scale.set(def.w, def.w * 1.2, def.w * 1.5);
        mesh.position.set(lx, 0, -200);
        addEntity('enemy', mesh, lx, st.maxSpd * (def.speed + R() * 0.2), def, false, typeName);
    }
}

function spawnZigzagEntity() {
    const st = game.st, def = ZIGZAG_DEF;
    const mesh = createZigzagMesh(matZigzagBody, matZigzagNeon);
    mesh.scale.set(def.w, def.w, def.w);
    const lx = R_Sign() * (CFG.laneW * 0.5);
    mesh.position.set(lx, 0, -200);
    addEntity('zigzag', mesh, lx, st.maxSpd * (0.5 + R() * 0.3), def, false, 'zigzag');
}

function spawnJumpEvent() {
    const st = game.st, ji = floor(R() * 5), wSpd = st.maxSpd * 0.4;
    for (let i = 0; i < 8; i++) {
        const lx = -14 + i * 4;
        if (i >= ji && i <= ji + 3) {
            const m = new THREE.Mesh(geoJump, matJump);
            m.position.set(lx, 0.25, -200); m.rotation.x = -PI / 16;
            addEntity('jmp', m, lx, wSpd);
        } else {
            const def = ENEMY_TYPES.sentinel, mesh = createSentinelMesh(matEnemyUnbreak, matEnemyNeonU);
            mesh.scale.set(def.w, def.w * 1.2, def.w * 1.5);
            mesh.position.set(lx, 0, -200);
            addEntity('enemy', mesh, lx, wSpd, def, true, 'sentinel');
        }
    }
}

function spawnRocketWarning() {
    const lanes = [-8, 0, 8], lx = lanes[floor(R() * lanes.length)];
    const mesh = new THREE.Mesh(geoWarn, matWarnBase.clone());
    mesh.position.set(lx, 0.1, 0); scene.add(mesh);
    game.ents.push({
        type: 'warning', def: null, mesh, lX: lx, box: new THREE.Box3(),
        state: 'A', v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: 0, xS: 0, cTmr: 1.5, isWall: false, mS: 'U', zigTime: 0, zigBase: lx
    });
}

function spawnRocketsFromWarning(e) {
    const speed = -game.st.maxSpd * 0.8;
    for (let j = 0; j < 4; j++) {
        const rX = e.lX - 6 + j * 4, rm = createRocket(matEnemyUnbreak, matEnemyNeonU);
        rm.scale.set(ROCKET_DEF.w, ROCKET_DEF.w, ROCKET_DEF.w);
        rm.position.set(rX, 1.5, -250);
        addEntity('rocket', rm, rX, speed, ROCKET_DEF, false, 'rocket');
    }
}

function spawnHealItem(lx, z) {
    const hm = new THREE.Mesh(geoHeart, matHeart);
    hm.position.set(lx, 1.5, z - 30); hm.rotation.set(R() * PI, 0, R() * PI);
    addEntity('heal', hm, lx, 0);
}
