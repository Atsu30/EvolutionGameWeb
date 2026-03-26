import { game, R, R_Sign, PI } from './state.js';
import { CFG, ENEMY_DEFS, ROCKET_DEF, ZIGZAG_DEF } from './config.js';
import {
    scene, createBike, createRocket, createZigzagMesh,
    matEnemyUnbreak, matEnemyNeonU, matZigzagBody, matZigzagNeon,
    matDash, matHeart, matJump,
    geoDash, geoHeart, geoJump, geoWarn, matWarnBase
} from './renderer.js';

export function addEntity(type, mesh, lx, zs = 0, def = null, isWall = false) {
    scene.add(mesh);
    game.ents.push({
        type, def, mesh, lX: lx, box: new THREE.Box3(),
        state: 'A', v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: zs, xS: 0, cTmr: 0, isWall, mS: 'U',
        zigTime: 0, zigBase: lx
    });
}

// Distance-based enemy level selection
function getEnemyLevel(dist) {
    const r = R();
    if (dist < 2)       return r < 0.7 ? 0 : 1;
    else if (dist < 5)  return r < 0.4 ? 0 : r < 0.75 ? 1 : 2;
    else if (dist < 10) return r < 0.25 ? 0 : r < 0.55 ? 1 : r < 0.8 ? 2 : 3;
    else if (dist < 20) return r < 0.1 ? 0 : r < 0.3 ? 1 : r < 0.6 ? 2 : r < 0.85 ? 3 : 4;
    else if (dist < 50) return r < 0.05 ? 0 : r < 0.2 ? 1 : r < 0.45 ? 2 : r < 0.75 ? 3 : 4;
    else                return r < 0.1 ? 1 : r < 0.3 ? 2 : r < 0.6 ? 3 : 4;
}

// Distance-based spawn interval multiplier
export function spawnMul(dist) {
    if (dist < 10) return 1.0;
    if (dist < 20) return 0.8;
    return 0.65;
}

// Distance-based rocket interval
export function rocketInterval(dist) {
    if (dist < 20) return 20 + R() * 10;
    if (dist < 50) return 15 + R() * 5;
    return 10 + R() * 5;
}

export function spawnEntity() {
    const st = game.st;
    const dist = st.dist || 0;

    if (R() < CFG.dashRatio) {
        const lx = R_Sign() * (CFG.laneW - 2);
        const mesh = new THREE.Mesh(geoDash, matDash);
        mesh.position.set(lx, 0, -200);
        addEntity('dash', mesh, lx);
    } else {
        const lvi = getEnemyLevel(dist);
        const def = ENEMY_DEFS[lvi];
        const mesh = createBike(matEnemyUnbreak, matEnemyNeonU);
        const lx = R_Sign() * (CFG.laneW - def.w / 2);
        mesh.scale.set(def.w, def.w * 1.2, def.w * 1.5);
        mesh.position.set(lx, 0, -200);
        addEntity('enemy', mesh, lx, st.maxSpd * (0.6 + R() * 0.3), def);
    }
}

export function spawnZigzagEntity() {
    const st = game.st;
    const def = ZIGZAG_DEF;
    const mesh = createZigzagMesh(matZigzagBody, matZigzagNeon);
    mesh.scale.set(def.w, def.w, def.w);
    const lx = R_Sign() * (CFG.laneW * 0.5);
    mesh.position.set(lx, 0, -200);
    const e = addEntity('zigzag', mesh, lx, st.maxSpd * (0.5 + R() * 0.3), def);
}

export function spawnJumpEvent() {
    const st = game.st;
    const ji = Math.floor(R() * 5);
    const wSpd = st.maxSpd * 0.4;
    for (let i = 0; i < 8; i++) {
        const lx = -14 + i * 4;
        if (i >= ji && i <= ji + 3) {
            const m = new THREE.Mesh(geoJump, matJump);
            m.position.set(lx, 0.25, -200);
            m.rotation.x = -PI / 16;
            addEntity('jmp', m, lx, wSpd);
        } else {
            const def = ENEMY_DEFS[4];
            const mesh = createBike(matEnemyUnbreak, matEnemyNeonU);
            mesh.scale.set(def.w, def.w * 1.2, def.w * 1.5);
            mesh.position.set(lx, 0, -200);
            addEntity('enemy', mesh, lx, wSpd, def, true);
        }
    }
}

export function spawnRocketWarning() {
    const lanes = [-8, 0, 8];
    const lx = lanes[Math.floor(R() * lanes.length)];
    const mesh = new THREE.Mesh(geoWarn, matWarnBase.clone());
    mesh.position.set(lx, 0.1, 0);
    scene.add(mesh);
    game.ents.push({
        type: 'warning', def: null, mesh, lX: lx, box: new THREE.Box3(),
        state: 'A', v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: 0, xS: 0, cTmr: 1.5, isWall: false, mS: 'U',
        zigTime: 0, zigBase: lx
    });
}

export function spawnRocketsFromWarning(e) {
    const st = game.st;
    const speed = -st.maxSpd * 0.8;
    for (let j = 0; j < 4; j++) {
        const rX = e.lX - 6 + j * 4;
        const rm = createRocket(matEnemyUnbreak, matEnemyNeonU);
        rm.scale.set(ROCKET_DEF.w, ROCKET_DEF.w, ROCKET_DEF.w);
        rm.position.set(rX, 1.5, -250);
        addEntity('rocket', rm, rX, speed, ROCKET_DEF);
    }
}

export function spawnHealItem(lx, z) {
    const hm = new THREE.Mesh(geoHeart, matHeart);
    hm.position.set(lx, 1.5, z - 30);
    hm.rotation.set(R() * PI, 0, R() * PI);
    addEntity('heal', hm, lx, 0);
}
