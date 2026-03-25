import { game, R, R_Sign, PI } from './state.js';
import { CFG, ENEMY_DEFS, ROCKET_DEF } from './config.js';
import {
    scene, createBike, createRocket,
    matEnemyUnbreak, matEnemyNeonU, matDash, matHeart, matJump,
    geoDash, geoHeart, geoJump, geoWarn, matWarnBase
} from './renderer.js';

export function addEntity(type, mesh, lx, zs = 0, def = null, isWall = false) {
    scene.add(mesh);
    game.ents.push({
        type, def, mesh, lX: lx, box: new THREE.Box3(),
        state: 'A', v: new THREE.Vector3(), aV: new THREE.Vector3(),
        zS: zs, xS: 0, cTmr: 0, isWall, mS: 'U'
    });
}

export function spawnEntity() {
    const st = game.st;
    if (R() < CFG.dashRatio) {
        const lx = R_Sign() * (CFG.laneW - 2);
        const mesh = new THREE.Mesh(geoDash, matDash);
        mesh.position.set(lx, 0, -200);
        addEntity('dash', mesh, lx);
    } else {
        const r = R();
        const lvi = r < 0.4 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : r < 0.95 ? 3 : 4;
        const def = ENEMY_DEFS[lvi];
        const mesh = createBike(matEnemyUnbreak, matEnemyNeonU);
        const lx = R_Sign() * (CFG.laneW - def.w / 2);
        mesh.scale.set(def.w, def.w * 1.2, def.w * 1.5);
        mesh.position.set(lx, 0, -200);
        addEntity('enemy', mesh, lx, st.maxSpd * (0.6 + R() * 0.3), def);
    }
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
        zS: 0, xS: 0, cTmr: 1.5, isWall: false, mS: 'U'
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
