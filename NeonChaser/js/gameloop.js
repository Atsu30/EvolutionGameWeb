// --- Main Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    const st = game.st, ents = game.ents, clock = game.clock;
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
            el('w-text').innerText = st.sCrvDir > 0 ? "急カーブ 右" : "急カーブ 左";
            el('w-icon').innerText = st.sCrvDir > 0 ? "≫" : "≪";
            st.tCrv = 0;
        } else {
            st.cTmr -= dt;
            if (st.cTmr <= 0) { st.cTmr = CFG.crvInt + R(); st.tCrv = R() < 0.3 ? 0 : R_Sign() * CFG.maxCrv; }
        }

        st.rocketTmr -= dt;
        st.spwnT += dt;
        const _sd = typeof getStageDef === 'function' ? getStageDef() : {};
        const spwnInt = max(0.1, CFG.spwnInt * (CFG.maxSpd / max(10, st.spd)) * spawnMul());
        if (st.spwnT > spwnInt) {
            if (_sd.rocket && st.rocketTmr <= 0) {
                spawnRocketWarning(); st.rocketTmr = rocketInterval(); st.spwnT = -0.5;
            } else if (R() < CFG.jmpRatio) {
                spawnJumpEvent(); st.spwnT = -1.0;
            } else if (_sd.zigzag && R() < 0.12) {
                spawnZigzagEntity(); st.spwnT = 0;
            } else {
                spawnEntity(); st.spwnT = 0;
            }
        }
    } else if (st.sCrvSt === 'W') {
        st.sCrvTmr -= dt; st.tCrv = 0;
        if (st.sCrvTmr <= 0) { st.sCrvSt = 'A'; st.sCrvTmr = CFG.sCrvDur; el('warning-container').classList.remove('active'); st.tCrv = st.sCrvDir * CFG.sCrvFrc; }
    } else if (st.sCrvSt === 'A') {
        st.sCrvTmr -= dt; if (st.sCrvTmr <= 0) { st.sCrvSt = 'R'; st.tCrv = 0; }
    } else {
        if (abs(st.crv) < 0.0001) { st.crv = 0; st.sCrvSt = 'N'; st.sCrvCd = CFG.sCrvBase + R() * CFG.sCrvRnd; }
    }

    const cSpd = st.sCrvSt === 'A' || st.sCrvSt === 'R' ? CFG.sCrvSpd : (st.sCrvSt === 'W' ? 0.004 : 0.002);
    st.crv = st.crv < st.tCrv ? min(st.tCrv, st.crv + cSpd * dt) : max(st.tCrv, st.crv - cSpd * dt);

    // --- Shockwave Shader ---
    const sU = sPass.uniforms;
    for (let i = 0; i < 3; i++) { if (sU.a.value[i] === 1) { sU.t.value[i] += dt; if (sU.t.value[i] > 0.6) sU.a.value[i] = 0; } }

    // --- Player State ---
    const isDash = st.dTimer > 0;
    if (isDash) {
        st.dTimer -= dt; st.spd = st.maxSpd * CFG.dashSpdMul;
        el('speed-lines').style.opacity = '1'; game.pts.forEach(p => p.scale.z = 4);
        if (st.dTimer <= 0) { st.spd = st.maxSpd; el('speed-lines').style.opacity = '0'; game.pts.forEach(p => p.scale.z = 1); }
    } else { st.spd = min(st.maxSpd, st.spd + CFG.acc * dt); }

    // Distance & achievements & stage
    st.dist += st.spd * dt * DISTANCE_SCALE;
    if (typeof checkStageTransition === 'function') checkStageTransition(st.dist);
    st._achTimer = (st._achTimer || 0) + dt;
    if (st._achTimer > 0.5) {
        st._achTimer = 0;
        checkAchievements(st.dist, { ...st.stats, lv: st.lv }).forEach(a => showAchievementPopup(a));
    }
    updateRainbowEffect(dt);

    if (st.invT > 0) {
        st.invT -= dt;
        playerMesh.children.forEach(c => { if (c.material) { c.material.opacity = floor(st.invT * 15) % 2 ? 0.3 : 1.0; c.material.transparent = true; } });
    } else { playerMesh.children.forEach(c => { if (c.material) { c.material.opacity = 1.0; c.material.transparent = false; } }); }

    cam.fov += ((isDash ? 110 : 75) - cam.fov) * 5 * dt;
    cam.updateProjectionMatrix();
    playerMesh.userData.tires.forEach(t => t.rotation.x -= st.spd * dt * 0.2);

    // --- Player Movement ---
    let trgBank = 0; if (game.keys.l) trgBank += 0.8; if (game.keys.r) trgBank -= 0.8;
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

    if (st._crashSpin) {
        st._crashZ = (st._crashZ || 0) + st.spd * dt * 0.8;
    }
    playerMesh.position.set(st.pLx, st.pY, st._crashSpin ? st._crashZ : 0);
    if (st._crashSpin) {
        playerMesh.rotation.x += 4 * dt;
        playerMesh.rotation.z += 6 * dt;
    } else {
        playerMesh.rotation.y += (atan(2 * st.crv * -30) + st.pBank * 0.35 - playerMesh.rotation.y) * 10 * dt;
        playerMesh.rotation.z = st.pBank - st.crv * 20;
    }
    playerBox.setFromObject(playerMesh);

    st.cB_Y += (8 + st.pY * 0.8 - st.cB_Y) * 10 * dt;
    st.cB_X += (st.pLx * 0.25 - st.cB_X) * 5 * dt;
    cam.rotation.z += (st.crv * 30 - st.pBank * 0.2 - cam.rotation.z) * 3 * dt;

    // --- Blaster ---
    if (st.blasterCount > 0) {
        st.blasterTimer += dt;
        if (st.blasterTimer >= st.blasterInterval) {
            st.blasterTimer = 0;
            for (let b = 0; b < st.blasterCount; b++) {
                const spread = (b - (st.blasterCount - 1) / 2) * 2.0;
                spawnBullet(st.pLx, st.pY, playerMesh.position.z, spread, st.blasterDmg);
            }
        }
    }

    // --- Environment ---
    floorMat.uniforms.time.value += dt * st.spd * 0.05;
    floorMat.uniforms.crv.value = st.crv;
    game.road.forEach(p => {
        p.z += st.spd * dt; if (p.z > 10) p.z -= 220;
        const cx = st.crv * p.z * p.z;
        p.L.position.set(-CFG.laneW - 1 + cx, 1.5, p.z); p.R.position.set(CFG.laneW + 1 + cx, 1.5, p.z);
        const a = Math.atan2(cx, abs(p.z)); p.L.rotation.y = a; p.R.rotation.y = a;
    });
    // Near buildings scroll
    if (typeof _nearBuildings !== 'undefined') {
        for (const b of _nearBuildings) {
            if (!b.visible) continue;
            b.position.z += st.spd * dt;
            if (b.position.z > 15) {
                b.position.z -= 220;
            }
            const cx = st.crv * b.position.z * b.position.z;
            b.position.x = b.userData._side * (CFG.laneW + 10) + cx;
        }
    }
    game.pts.forEach(p => {
        p.rotation.x += p.userData.rX * dt; p.rotation.y += p.userData.rY * dt; p.rotation.z += p.userData.rZ * dt;
        p.position.z += (st.spd * 0.8 + 20) * dt;
        if (p.position.z > 20) p.position.set(R_Sign() * 60, R() * 40 + 5, R_Sign() * 150 - 50);
    });

    // --- Entity Logic ---
    for (let i = ents.length - 1; i >= 0; i--) {
        const e = ents[i];
        if (e.state === 'A') {
            if (e.type === 'warning') {
                e.mesh.position.x = e.lX; e.mesh.material.uniforms.crv.value = st.crv;
                e.mesh.material.uniforms.op.value = (Math.sin(clock.elapsedTime * 20) * 0.5 + 0.5) * 0.4;
                e.cTmr -= dt; if (e.cTmr <= 0) { e.state = 'B'; spawnRocketsFromWarning(e); } continue;
            }

            if (e.type === 'bullet') {
                e.mesh.position.z -= CFG.blasterSpeed * dt;
                if (e.mesh.position.z < -260) { scene.remove(e.mesh); ents.splice(i, 1); continue; }
                e.box.setFromObject(e.mesh);
                // Bullet VS Enemy
                let bulletHit = false;
                for (let j = ents.length - 1; j >= 0; j--) {
                    const t = ents[j];
                    if (j === i || t.state !== 'A') continue;
                    if (t.type !== 'enemy' && t.type !== 'rocket' && t.type !== 'zigzag') continue;
                    if (e.box.intersectsBox(t.box)) {
                        t.curHp -= st.blasterDmg;
                        if (t.curHp <= 0) {
                            t.state = 'K'; t.mesh.userData.changeMat(matEnemyKnock, matEnemyNeonK);
                            t.v.set(R_Sign() * 10, 20 + R() * 30, -(st.spd * 0.5 + R() * 30));
                            t.aV.set(R_Sign() * 10, R_Sign() * 10, R_Sign() * 10);
                            const _xpMul1 = typeof getStageDef === 'function' ? getStageDef().enemyHpMul : 1;
                            const _xp1 = floor(t.def.exp * _xpMul1);
                            st.exp += _xp1; st.stats.destroyedEnemies++;
                            recordEnemyTypeKill(t.defName || t.type);
                            showXpPopup(t.mesh.position, _xp1, t.def.hp > 1 ? 4 : 1);
                            spawnDestroyEffect(t.mesh.position, t.def.hp > 1 ? 4 : 1, 0x00ffff);
                            if (st.exp >= st.nExp) { st.isP = true; st.lv++; st.exp -= st.nExp; st.nExp = floor(st.nExp * CFG.expMul); showUpgradeUI(); el('levelup-modal').classList.add('active'); }
                        } else {
                            // Hit flash: enemy glows white briefly
                            bulletHitFlash(t);
                            // Small hit sparks at impact point
                            spawnDestroyEffect(e.mesh.position, 1, 0x00ffff);
                            // Light knockback
                            const dx = t.lX - st.pLx;
                            t.xS += (abs(dx) < 0.5 ? R_Sign() : sign(dx)) * 5;
                        }
                        bulletHit = true; break;
                    }
                }
                if (bulletHit) { scene.remove(e.mesh); ents.splice(i, 1); }
                continue;
            }

            e.mesh.position.z += (st.spd - e.zS) * dt;
            if (e.xS !== 0) { e.lX += e.xS * dt; e.xS *= pow(0.01, dt); if (abs(e.lX) > CFG.laneW) { e.lX = sign(e.lX) * CFG.laneW; e.xS *= -0.5; } }
            e.mesh.position.x = e.lX + st.crv * e.mesh.position.z * e.mesh.position.z;

            if (e.type === 'zigzag') {
                e.zigTime = (e.zigTime || 0) + dt;
                e.lX = e.zigBase + Math.sin(e.zigTime * e.def.zigFreq) * e.def.zigAmp;
                if (abs(e.lX) > CFG.laneW) e.lX = sign(e.lX) * CFG.laneW;
                e.mesh.position.x = e.lX + st.crv * e.mesh.position.z * e.mesh.position.z;
                e.mesh.rotation.z += 5 * dt;
                if (e.cTmr > 0) e.cTmr -= dt;
                const canBreak = isDash || e.curHp <= 1;
                if (canBreak && e.mS !== 'B') { e.mesh.userData.changeMat(matEnemyBreak, matEnemyNeonB); e.mS = 'B'; }
                else if (!canBreak && e.mS !== 'U') { e.mesh.userData.changeMat(matZigzagBody, matZigzagNeon); e.mS = 'U'; }
            } else if (e.type === 'enemy' || e.type === 'rocket') {
                if (e.type === 'rocket') e.mesh.userData.orbs.rotation.z += 10 * dt;
                else {
                    // Geometric enemy rotation / animation
                    if (e.def === ENEMY_TYPES.drone) { e.mesh.rotation.x += 1.5 * dt; e.mesh.rotation.y += 2 * dt; }
                    else if (e.def === ENEMY_TYPES.sentinel) { e.mesh.rotation.z += 0.8 * dt; }
                    else if (e.def === ENEMY_TYPES.jellyfish) {
                        // Floating bob
                        e.mesh.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.4 + 0.2;
                        e.mesh.rotation.y += 0.3 * dt;
                        // Leg sway
                        const legs = e.mesh.userData.legs;
                        if (legs) legs.forEach((lg, li) => {
                            const phase = clock.elapsedTime * 2 + li * 0.7;
                            lg.position.y = lg.userData._baseY + Math.sin(phase) * 0.15;
                            lg.rotation.x = Math.sin(phase * 0.8) * 0.4;
                            lg.rotation.z = Math.cos(phase * 0.6) * 0.3;
                        });
                    }
                    else if (e.def === ENEMY_TYPES.fish) {
                        const tail = e.mesh.userData.tail;
                        if (tail) tail.rotation.y = Math.sin(clock.elapsedTime * 8) * 0.6;
                    }
                    else { e.mesh.rotation.y += 3 * dt; }
                }
                if (e.cTmr > 0) e.cTmr -= dt;
                const canBreak = isDash || e.curHp <= 1;
                if (canBreak && e.mS !== 'B') { e.mesh.userData.changeMat(matEnemyBreak, matEnemyNeonB); e.mS = 'B'; }
                else if (!canBreak && e.mS !== 'U') { e.mesh.userData.changeMat(matEnemyUnbreak, matEnemyNeonU); e.mS = 'U'; }
            } else if (e.type === 'heal') { e.mesh.rotation.y += 3 * dt; e.mesh.rotation.z += dt; }

            e.box.setFromObject(e.mesh);

            // Player VS Entity
            if (playerBox.intersectsBox(e.box)) {
                if (e.type === 'dash') { e.state = 'B'; st.dTimer = CFG.dashDur; flashScreen('rgba(0,255,255,.4)'); shakeCamera(0.2, 0.8); st.stats.dashCount++; }
                else if (e.type === 'heal') { e.state = 'B'; st.hp = min(st.maxHp, st.hp + CFG.healAmt); flashScreen('rgba(52,211,153,.4)'); }
                else if (e.type === 'jmp') { if (st.pY < 0.5) { st.pVY = CFG.jmpPow * (isDash ? 1.2 : 1); flashScreen('rgba(16,185,129,.3)'); st.stats.jumpCount++; } }
                else if (e.type === 'enemy' || e.type === 'rocket' || e.type === 'zigzag') {
                    if (isDash || e.curHp <= 1) {
                        e.state = 'K'; e.mesh.userData.changeMat(matEnemyKnock, matEnemyNeonK);
                        if (!isDash) { st.spd = max(0, st.spd - CFG.hitDecel); st.hStop = 0.05; } else st.hStop = 0.02;
                        const dfX = e.lX - st.pLx, dx = abs(dfX) < 0.5 ? R_Sign() : dfX, m = isDash ? 2 : 1;
                        e.v.set(dx * 15 * m, (30 + R() * 40) * m, -((st.spd - e.zS) * 0.8 + R() * 50) * m);
                        e.aV.set(R_Sign() * 10, R_Sign() * 10, R_Sign() * 10);
                        const p = e.mesh.position.clone(); p.project(cam);
                        if (p.z <= 1.0) { const ui = game.shockIdx; sU.c.value[ui].set((p.x+1)/2,(p.y+1)/2); sU.t.value[ui]=0.001; sU.a.value[ui]=1; game.shockIdx=(ui+1)%3; }
                        const _xpMul2 = typeof getStageDef === 'function' ? getStageDef().enemyHpMul : 1;
                        const _xp2 = floor(e.def.exp * _xpMul2);
                        flashScreen('rgba(255,255,255,.3)'); st.exp += _xp2; st.stats.destroyedEnemies++;
                        recordEnemyTypeKill(e.defName || e.type);
                        showXpPopup(e.mesh.position, _xp2, e.def.hp > 1 ? 4 : 1);
                        spawnDestroyEffect(e.mesh.position, e.def.hp > 1 ? 4 : 1, e.type === 'zigzag' ? 0xfbbf24 : 0x00ffff);
                        if (st.exp >= st.nExp) { st.isP = true; st.lv++; st.exp -= st.nExp; st.nExp = floor(st.nExp * CFG.expMul); showUpgradeUI(); el('levelup-modal').classList.add('active'); }
                    } else {
                        if (st.invT <= 0) {
                            const sMul = typeof getStageDef === 'function' ? getStageDef().enemyAtkMul : 1;
                            const dmg = e.def.atk * sMul * (1 - st.def);
                            const dfX = st.pLx - e.lX, dx = abs(dfX) < 0.5 ? R_Sign() : dfX, pf = 35;
                            st.bVX = sign(dx) * pf; e.xS = -sign(dx) * pf * 0.5; e.cTmr = 0.5;
                            st.spd = max(0, st.spd - 20); st.hp -= dmg;
                            st.invT = 0.5; st.hStop = 0.1; shakeCamera(0.3, 2.5); flashScreen('rgba(255,0,0,.5)');
                            st.stats.damageTaken++;
                            if (st.hp <= 0 && !st.isG) triggerGameOver();
                        }
                    }
                } continue;
            }
            if (e.mesh.position.z > 15 || e.mesh.position.z < -250) { scene.remove(e.mesh); ents.splice(i, 1); continue; }

            // Enemy VS Enemy
            if (e.type === 'enemy' || e.type === 'rocket' || e.type === 'zigzag') {
                for (let j = i - 1; j >= 0; j--) {
                    const o = ents[j];
                    if (o.state === 'A' && (o.type === 'enemy' || o.type === 'rocket' || o.type === 'zigzag') && e.cTmr <= 0 && o.cTmr <= 0 && e.box.intersectsBox(o.box)) {
                        if (e.isWall && o.isWall) continue;
                        if (e.def.hp !== o.def.hp) {
                            const v = e.def.hp > o.def.hp ? o : e, a = e.def.hp > o.def.hp ? e : o;
                            if (!v.isWall) { v.state = 'K'; v.mesh.userData.changeMat(matEnemyKnock, matEnemyNeonK); v.v.set(sign(v.lX - a.lX || R_Sign()) * 20, 20 + R() * 20, a.zS - v.zS + 30); v.aV.set(R_Sign() * 5, R_Sign() * 5, R_Sign() * 5); }
                        } else {
                            const dx = e.lX - o.lX || R_Sign();
                            if (!e.isWall) e.xS = sign(dx) * 20; if (!o.isWall) o.xS = -sign(dx) * 20;
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
    if (st.cShkT > 0) { st.cShkT -= rDt; cam.position.x = st.cB_X + R_Sign() * st.cShkI; cam.position.y = st.cB_Y + R_Sign() * st.cShkI; st.cShkI *= pow(0.01, rDt); }
    else { cam.position.x = st.cB_X; cam.position.y = st.cB_Y; }

    // --- Trail Particles ---
    if (trailPool.length > 0 && st.spd > 10) {
        const tc = _trailCfg;
        const spawnCount = (isDash ? 2 : 1) * tc.count;
        for (let s = 0; s < spawnCount; s++) {
            const free = trailPool.find(p => p.life <= 0);
            if (free) {
                free.mesh.position.set(
                    playerMesh.position.x + R_Sign() * tc.spread,
                    playerMesh.position.y + 0.5 + R() * 0.5,
                    playerMesh.position.z + 1.5 + R()
                );
                free.life = free.maxLife;
                free.mesh.visible = true;
                free.mesh.material.opacity = 0.8;
                free.mesh.scale.setScalar((isDash ? 2 : 1) * tc.size);
                if (tc.animated) free.mesh.material.color.setHSL(R(), 1, 0.6);
            }
        }
        for (const p of trailPool) {
            if (p.life > 0) {
                p.life -= dt;
                p.mesh.material.opacity = max(0, p.life / p.maxLife) * 0.8;
                p.mesh.position.z += st.spd * dt * 0.5;
                if (tc.animated) { const h = (p.life * 3) % 1; p.mesh.material.color.setHSL(h, 1, 0.6); }
                if (p.life <= 0) p.mesh.visible = false;
            }
        }
    }

    updateDestroyParticles(dt);
    composer.render();
}
