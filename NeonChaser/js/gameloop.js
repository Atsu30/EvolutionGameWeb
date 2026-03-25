import { game, el, min, max, abs, sign, pow, atan, floor, R, R_Sign, PI } from './state.js';
import { CFG, DISTANCE_SCALE } from './config.js';
import {
    scene, cam, composer, sPass, floorMat, playerMesh, playerBox,
    matEnemyBreak, matEnemyNeonB, matEnemyUnbreak, matEnemyNeonU,
    matEnemyKnock, matEnemyNeonK, createRocket
} from './renderer.js';
import { spawnEntity, spawnJumpEvent, spawnRocketWarning, spawnRocketsFromWarning, addEntity, spawnHealItem } from './entities.js';
import { flashScreen, shakeCamera } from './effects.js';
import { updateUI, showUpgradeUI, triggerGameOver } from './ui.js';
import { checkAchievements } from './achievements.js';
import { showAchievementPopup } from './menu.js';
import { updateRainbowEffect } from './customization.js';

export function animate() {
    requestAnimationFrame(animate);

    const st = game.st;
    const ents = game.ents;
    const clock = game.clock;

    if (st.isP || st.isG) return composer.render();

    const rDt = min(clock.getDelta(), 0.1);
    let dt = rDt;
    if (st.hStop > 0) { st.hStop -= rDt; dt = rDt * 0.05; }

    // --- Curve & Spawn Events ---
    if (st.sCrvSt === 'N') {
        st.sCrvCd -= dt;
        if (st.sCrvCd <= 0) {
            st.sCrvSt = 'W'; st.sCrvTmr = CFG.sCrvWarn;
            st.sCrvDir = R() < 0.5 ? 1 : -1;
            el('warning-container').classList.add('active');
            el('w-text').innerText = st.sCrvDir > 0 ? "SHARP TURN RIGHT" : "SHARP TURN LEFT";
            el('w-icon').innerText = st.sCrvDir > 0 ? "≫" : "≪";
            st.tCrv = 0;
        } else {
            st.cTmr -= dt;
            if (st.cTmr <= 0) { st.cTmr = CFG.crvInt + R(); st.tCrv = R() < 0.3 ? 0 : R_Sign() * CFG.maxCrv; }
        }

        st.rocketTmr -= dt;
        st.spwnT += dt;
        const spwnInt = max(0.1, CFG.spwnInt * (CFG.maxSpd / max(10, st.spd)));
        if (st.spwnT > spwnInt) {
            if (st.rocketTmr <= 0) {
                spawnRocketWarning();
                st.rocketTmr = 20 + R() * 10;
                st.spwnT = -0.5;
            } else if (R() < CFG.jmpRatio) {
                spawnJumpEvent();
                st.spwnT = -1.0;
            } else {
                spawnEntity();
                st.spwnT = 0;
            }
        }
    } else if (st.sCrvSt === 'W') {
        st.sCrvTmr -= dt; st.tCrv = 0;
        if (st.sCrvTmr <= 0) { st.sCrvSt = 'A'; st.sCrvTmr = CFG.sCrvDur; el('warning-container').classList.remove('active'); st.tCrv = st.sCrvDir * CFG.sCrvFrc; }
    } else if (st.sCrvSt === 'A') {
        st.sCrvTmr -= dt;
        if (st.sCrvTmr <= 0) { st.sCrvSt = 'R'; st.tCrv = 0; }
    } else {
        if (abs(st.crv) < 0.0001) { st.crv = 0; st.sCrvSt = 'N'; st.sCrvCd = CFG.sCrvBase + R() * CFG.sCrvRnd; }
    }

    const cSpd = st.sCrvSt === 'A' || st.sCrvSt === 'R' ? CFG.sCrvSpd : (st.sCrvSt === 'W' ? 0.004 : 0.002);
    st.crv = st.crv < st.tCrv ? min(st.tCrv, st.crv + cSpd * dt) : max(st.tCrv, st.crv - cSpd * dt);

    // --- Shockwave Shader Update ---
    const sU = sPass.uniforms;
    for (let i = 0; i < 3; i++) { if (sU.a.value[i] === 1) { sU.t.value[i] += dt; if (sU.t.value[i] > 0.6) sU.a.value[i] = 0; } }

    // --- Player State ---
    const isDash = st.dTimer > 0;
    if (isDash) {
        st.dTimer -= dt; st.spd = st.maxSpd * CFG.dashSpdMul;
        el('speed-lines').style.opacity = '1'; game.pts.forEach(p => p.scale.z = 4);
        if (st.dTimer <= 0) { st.spd = st.maxSpd; el('speed-lines').style.opacity = '0'; game.pts.forEach(p => p.scale.z = 1); }
    } else {
        st.spd = min(st.maxSpd, st.spd + CFG.acc * dt);
    }

    // Distance accumulation
    st.dist += st.spd * dt * DISTANCE_SCALE;

    // Achievement check (throttled to 0.5s)
    st._achTimer = (st._achTimer || 0) + dt;
    if (st._achTimer > 0.5) {
        st._achTimer = 0;
        const unlocked = checkAchievements(st.dist);
        unlocked.forEach(a => showAchievementPopup(a));
    }

    // Rainbow effect
    updateRainbowEffect(dt);

    if (st.invT > 0) {
        st.invT -= dt;
        playerMesh.children.forEach(c => { if (c.material) { c.material.opacity = floor(st.invT * 15) % 2 ? 0.3 : 1.0; c.material.transparent = true; } });
    } else {
        playerMesh.children.forEach(c => { if (c.material) { c.material.opacity = 1.0; c.material.transparent = false; } });
    }

    cam.fov += ((isDash ? 110 : 75) - cam.fov) * 5 * dt;
    cam.updateProjectionMatrix();
    playerMesh.userData.tires.forEach(t => t.rotation.x -= st.spd * dt * 0.2);

    // --- Player Movement & Physics ---
    let trgBank = 0;
    if (game.keys.l) trgBank += 0.8;
    if (game.keys.r) trgBank -= 0.8;
    st.pBank += (trgBank - st.pBank) * (3 + st.steer * 0.1) * dt;
    st.pLx += (-st.pBank * st.steer * 1.5 - st.crv * CFG.cfForce * st.spd * 100 + st.bVX) * dt;
    st.bVX *= pow(0.01, dt);

    if (abs(st.pLx) > CFG.laneW) {
        st.pLx = sign(st.pLx) * CFG.laneW; st.bVX = 0; st.pBank *= 0.5;
        if (!isDash) { st.spd = max(0, st.spd - CFG.wallDecel * dt); st.hp -= CFG.guardDmg * dt; shakeCamera(0.1, 1); if (st.hp <= 0) triggerGameOver(); }
        else shakeCamera(0.1, 0.3);
    }
    if (st.pY > 0 || st.pVY !== 0) {
        st.pVY -= CFG.pGrav * dt; st.pY = max(0, st.pY + st.pVY * dt);
        if (st.pY === 0) { st.pVY = 0; shakeCamera(0.15, 0.5); }
    }

    playerMesh.position.set(st.pLx, st.pY, 0);
    playerMesh.rotation.y += (atan(2 * st.crv * -30) + st.pBank * 0.35 - playerMesh.rotation.y) * 10 * dt;
    playerMesh.rotation.z = st.pBank - st.crv * 20;
    playerBox.setFromObject(playerMesh);

    st.cB_Y += (8 + st.pY * 0.8 - st.cB_Y) * 10 * dt;
    st.cB_X += (st.pLx * 0.25 - st.cB_X) * 5 * dt;
    cam.rotation.z += (st.crv * 30 - st.pBank * 0.2 - cam.rotation.z) * 3 * dt;

    // --- Environment ---
    floorMat.uniforms.time.value += dt * st.spd * 0.05;
    floorMat.uniforms.crv.value = st.crv;
    game.road.forEach(p => {
        p.z += st.spd * dt; if (p.z > 10) p.z -= 220;
        const cx = st.crv * p.z * p.z;
        p.L.position.set(-CFG.laneW - 1 + cx, 1.5, p.z);
        p.R.position.set(CFG.laneW + 1 + cx, 1.5, p.z);
        const a = Math.atan2(cx, abs(p.z)); p.L.rotation.y = a; p.R.rotation.y = a;
    });
    game.pts.forEach(p => {
        p.rotation.x += p.userData.rX * dt; p.rotation.y += p.userData.rY * dt; p.rotation.z += p.userData.rZ * dt;
        p.position.z += (st.spd * 0.8 + 20) * dt;
        if (p.position.z > 20) p.position.set(R_Sign() * 60, R() * 40 + 5, R_Sign() * 150 - 50);
    });

    // --- Entity Collision & Logic ---
    for (let i = ents.length - 1; i >= 0; i--) {
        const e = ents[i];
        if (e.state === 'A') {
            // Warning lane
            if (e.type === 'warning') {
                e.mesh.position.x = e.lX;
                e.mesh.material.uniforms.crv.value = st.crv;
                e.mesh.material.uniforms.op.value = (Math.sin(clock.elapsedTime * 20) * 0.5 + 0.5) * 0.4;
                e.cTmr -= dt;
                if (e.cTmr <= 0) {
                    e.state = 'B';
                    spawnRocketsFromWarning(e);
                }
                continue;
            }

            e.mesh.position.z += (st.spd - e.zS) * dt;
            if (e.xS !== 0) { e.lX += e.xS * dt; e.xS *= pow(0.01, dt); if (abs(e.lX) > CFG.laneW) { e.lX = sign(e.lX) * CFG.laneW; e.xS *= -0.5; } }
            e.mesh.position.x = e.lX + st.crv * e.mesh.position.z * e.mesh.position.z;

            if (e.type === 'enemy' || e.type === 'rocket') {
                if (e.type === 'rocket') e.mesh.userData.orbs.rotation.z += 10 * dt;
                else e.mesh.userData.tires.forEach(t => t.rotation.x -= e.zS * dt * 0.2);
                e.mesh.rotation.y = atan(2 * st.crv * e.mesh.position.z);
                e.mesh.rotation.z += (st.crv * -40 - e.mesh.rotation.z) * 10 * dt;
                if (e.cTmr > 0) e.cTmr -= dt;

                const canBreak = isDash || st.kb >= e.def.kb;
                if (canBreak && e.mS !== 'B') { e.mesh.userData.changeMat(matEnemyBreak, matEnemyNeonB); e.mS = 'B'; }
                else if (!canBreak && e.mS !== 'U') { e.mesh.userData.changeMat(matEnemyUnbreak, matEnemyNeonU); e.mS = 'U'; }
            } else if (e.type === 'heal') { e.mesh.rotation.y += 3 * dt; e.mesh.rotation.z += dt; }

            e.box.setFromObject(e.mesh);

            // Player VS Entity
            if (playerBox.intersectsBox(e.box)) {
                if (e.type === 'dash') {
                    e.state = 'B'; st.dTimer = CFG.dashDur; flashScreen('rgba(0,255,255,.4)'); shakeCamera(0.2, 0.8); st.stats.dashCount++;
                } else if (e.type === 'heal') {
                    e.state = 'B'; st.hp = min(st.maxHp, st.hp + CFG.healAmt); flashScreen('rgba(52,211,153,.4)');
                } else if (e.type === 'jmp') {
                    if (st.pY < 0.5) { st.pVY = CFG.jmpPow * (isDash ? 1.2 : 1); flashScreen('rgba(16,185,129,.3)'); st.stats.jumpCount++; }
                } else if (e.type === 'enemy' || e.type === 'rocket') {
                    if (isDash || st.kb >= e.def.kb) {
                        e.state = 'K'; e.mesh.userData.changeMat(matEnemyKnock, matEnemyNeonK);
                        if (!isDash) { st.spd = max(0, st.spd - CFG.hitDecel); st.hStop = 0.05 + e.def.lv * 0.03; } else st.hStop = 0.02;
                        const dfX = e.lX - st.pLx, dx = abs(dfX) < 0.5 ? R_Sign() : dfX, m = isDash ? 2 : 1;
                        e.v.set(dx * 15 * st.kb * m, (30 + R() * 40) * st.kb * m, -((st.spd - e.zS) * 0.8 + R() * 50) * st.kb * m);
                        e.aV.set(R_Sign() * 10, R_Sign() * 10, R_Sign() * 10);

                        // Shockwave
                        const p = e.mesh.position.clone(); p.project(cam);
                        if (p.z <= 1.0) {
                            const ui = game.shockIdx;
                            sU.c.value[ui].set((p.x + 1) / 2, (p.y + 1) / 2);
                            sU.t.value[ui] = 0.001; sU.a.value[ui] = 1;
                            game.shockIdx = (ui + 1) % 3;
                        }
                        flashScreen('rgba(255,255,255,.3)');
                        st.exp += e.def.exp; st.stats.destroyedEnemies++;
                        if (st.exp >= st.nExp) {
                            st.isP = true; st.lv++; st.exp -= st.nExp; st.nExp = floor(st.nExp * CFG.expMul);
                            showUpgradeUI(); el('levelup-modal').classList.add('active');
                        }
                        if (R() < CFG.healRate) spawnHealItem(e.lX, e.mesh.position.z);
                    } else {
                        if (st.invT <= 0) {
                            const dfX = st.pLx - e.lX, dx = abs(dfX) < 0.5 ? R_Sign() : dfX, pf = 30 + e.def.lv * 5;
                            st.bVX = sign(dx) * pf; e.xS = -sign(dx) * pf * 0.5; e.cTmr = 0.5;
                            st.spd = max(0, st.spd - (15 + e.def.lv * 5)); st.hp -= e.def.dmg;
                            st.invT = 0.5; st.hStop = 0.1; shakeCamera(0.3, 2.5); flashScreen('rgba(255,0,0,.5)');
                            st.stats.damageTaken++;
                            if (st.hp <= 0 && !st.isG) triggerGameOver();
                        }
                    }
                }
                continue;
            }
            if (e.mesh.position.z > 15 || e.mesh.position.z < -250) { scene.remove(e.mesh); ents.splice(i, 1); continue; }

            // Enemy VS Enemy
            if (e.type === 'enemy' || e.type === 'rocket') {
                for (let j = i - 1; j >= 0; j--) {
                    const o = ents[j];
                    if (o.state === 'A' && (o.type === 'enemy' || o.type === 'rocket') && e.cTmr <= 0 && o.cTmr <= 0 && e.box.intersectsBox(o.box)) {
                        if (e.isWall && o.isWall) continue;
                        if (e.def.lv !== o.def.lv) {
                            const v = e.def.lv > o.def.lv ? o : e, a = e.def.lv > o.def.lv ? e : o;
                            if (!v.isWall) {
                                v.state = 'K'; v.mesh.userData.changeMat(matEnemyKnock, matEnemyNeonK);
                                v.v.set(sign(v.lX - a.lX || R_Sign()) * 20, 20 + R() * 20, a.zS - v.zS + 30);
                                v.aV.set(R_Sign() * 5, R_Sign() * 5, R_Sign() * 5);
                            }
                        } else {
                            const dx = e.lX - o.lX || R_Sign();
                            if (!e.isWall) e.xS = sign(dx) * 20;
                            if (!o.isWall) o.xS = -sign(dx) * 20;
                            e.cTmr = 0.2; o.cTmr = 0.2;
                        }
                    }
                }
            }
        } else if (e.state === 'K') {
            e.mesh.position.addScaledVector(e.v, dt);
            e.mesh.rotation.x += e.aV.x * dt; e.mesh.rotation.y += e.aV.y * dt; e.mesh.rotation.z += e.aV.z * dt;
            e.v.y -= CFG.pGrav * dt;
            if (e.mesh.position.y < -20 || e.mesh.position.z < -300) { scene.remove(e.mesh); ents.splice(i, 1); }
        } else if (e.state === 'B') {
            e.mesh.scale.multiplyScalar(0.8);
            if (e.mesh.scale.x < 0.1) { scene.remove(e.mesh); ents.splice(i, 1); }
        }
    }

    updateUI();

    // --- Camera Shake ---
    if (st.cShkT > 0) {
        st.cShkT -= rDt;
        cam.position.x = st.cB_X + R_Sign() * st.cShkI;
        cam.position.y = st.cB_Y + R_Sign() * st.cShkI;
        st.cShkI *= pow(0.01, rDt);
    } else {
        cam.position.x = st.cB_X;
        cam.position.y = st.cB_Y;
    }

    composer.render();
}
