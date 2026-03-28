// --- UI: HUD, Modals, Game Over, Restart ---
let _hpCritical = false;
let _pendingLevelUps = 0;

/** Check for level-up(s) and queue them. Call after adding EXP. */
function checkLevelUp() {
    const st = game.st;
    while (st.exp >= st.nExp) {
        st.lv++;
        st.exp -= st.nExp;
        st.nExp = floor(st.nExp * CFG.expMul);
        _pendingLevelUps++;
    }
    if (_pendingLevelUps > 0 && !st.isP) {
        _triggerNextLevelUp();
    }
}

function _triggerNextLevelUp() {
    if (_pendingLevelUps <= 0) return;
    _pendingLevelUps--;
    game.st.isP = true;
    showUpgradeUI();
    el('levelup-modal').classList.add('active');
}
function updateUI() {
    const st = game.st;
    el('ui-lv').innerText = `Lv ${st.lv}`;
    // Speed meter
    const spdVal = floor(st.spd);
    el('ui-spd').innerText = spdVal;
    const spdRatio = min(1, st.spd / st.maxSpd);
    el('meter-arc').style.strokeDashoffset = 245 - spdRatio * 245;
    el('meter-needle').style.transform = `rotate(${-135 + spdRatio * 270}deg)`;
    // HP
    el('ui-hp').innerText = ceil(st.hp);
    const hpRatio = max(0, min(100, st.hp / st.maxHp * 100));
    el('hp-fill').style.width = `${hpRatio}%`;
    // HP critical class toggle (20%)
    const isCritical = hpRatio < 20 && hpRatio > 0;
    const hpRow = document.querySelector('.hud-hp-row');
    if (hpRow) hpRow.classList.toggle('hp-critical', isCritical);
    _hpCritical = isCritical;
    // Boss HP bar
    const bossHud = el('boss-hud');
    if (bossHud) {
        if (st.boss && st.boss.active && st.boss.hp > 0) {
            bossHud.style.display = '';
            el('boss-name').innerText = BOSS_DEFS[st.boss.stageIdx].name;
            el('boss-hp-fill').style.width = `${max(0, st.boss.hp / st.boss.maxHp * 100)}%`;
        } else {
            bossHud.style.display = 'none';
        }
    }
    // Distance
    el('ui-dist').innerText = (st.dist || 0).toFixed(2) + ' km';
    // EXP
    el('exp-fill').style.width = `${min(100, st.exp / st.nExp * 100)}%`;
    // Speed meter color
    const isD = st.dTimer > 0;
    el('ui-spd').style.color = isD ? '#22d3ee' : '#60a5fa';
    el('meter-arc').style.stroke = isD ? '#22d3ee' : '#3b82f6';
}

function showUpgradeUI() {
    const container = el('upgrades'); container.innerHTML = '';
    const modal = el('levelup-modal');
    const st = game.st;

    // Block clicks during celebration
    modal.classList.add('no-interact');

    // Show big level number in background
    const lvBig = el('levelup-lv-big');
    if (lvBig) lvBig.innerText = st.lv;

    // Build light rays
    const raysEl = el('levelup-rays');
    if (raysEl) {
        raysEl.innerHTML = '';
        for (let i = 0; i < 18; i++) {
            const ray = document.createElement('div');
            ray.className = 'levelup-ray';
            ray.style.transform = `rotate(${(i / 18) * 360}deg)`;
            ray.style.opacity = (0.3 + Math.random() * 0.7).toString();
            raysEl.appendChild(ray);
        }
    }

    // Spawn burst particles — wave 1 (circles + sparks)
    const burst = el('levelup-burst');
    burst.innerHTML = '';
    const colors = ['#d946ef','#e879f9','#f0abfc','#a855f7','#fbbf24','#22d3ee','#fff'];
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = i % 4 === 0 ? 'burst-particle burst-spark' : 'burst-particle';
        const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 100 + Math.random() * 200;
        p.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--by', Math.sin(angle) * dist + 'px');
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.4) + 's';
        p.style.width = p.style.height = (3 + Math.random() * 7) + 'px';
        burst.appendChild(p);
    }

    // Wave 2 particles (delayed)
    setTimeout(() => {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'burst-particle';
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 160;
            p.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--by', Math.sin(angle) * dist + 'px');
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDelay = (Math.random() * 0.2) + 's';
            p.style.width = p.style.height = (2 + Math.random() * 5) + 'px';
            burst.appendChild(p);
        }
    }, 600);

    // Build cards
    const available = UPGRADES.filter(u => !u.cond || u.cond(st));
    const chosen = [...available].sort(() => 0.5 - R()).slice(0, 3);
    chosen.forEach(u => {
        const card = document.createElement('div'); card.className = 'card';
        card.onclick = () => selectUpgrade(u.id);
        card.innerHTML = `<div class="card-icon">${u.i}</div><div><div class="card-title">${u.t}</div><div class="card-desc">${u.d}</div></div>`;
        container.appendChild(card);
    });

    // Stagger-reveal cards
    const cards = container.querySelectorAll('.card');
    const staggerDelay = 250;
    const startDelay = 1400;

    cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('card-reveal'), startDelay + i * staggerDelay);
    });

    const totalRevealTime = startDelay + cards.length * staggerDelay + 500;
    setTimeout(() => modal.classList.remove('no-interact'), totalRevealTime);
}

function selectUpgrade(id) {
    const st = game.st;
    // Ignore clicks if still in celebration phase
    if (el('levelup-modal').classList.contains('no-interact')) return;
    if (id === 'spd') st.maxSpd += 20;
    if (id === 'grp') st.steer += 12;
    if (id === 'siz') { st.size += 0.3; playerMesh.scale.setScalar(1.5 * st.size); }
    if (id === 'def') st.def = min(0.5, st.def + 0.05);
    if (id === 'bls') { st.blasterCount = 1; st.blasterDmg = 1; }
    if (id === 'heal') st.hp = min(st.maxHp, st.hp + st.maxHp * 0.5);
    if (id === 'bpow') st.blasterInterval = max(0.08, st.blasterInterval * 0.75);
    if (id === 'bnum') st.blasterCount = min(3, st.blasterCount + 1);
    const modal = el('levelup-modal');
    modal.classList.remove('active');
    modal.classList.remove('no-interact');
    // Reset animations so they replay next time
    modal.querySelectorAll('.card.card-reveal').forEach(c => c.classList.remove('card-reveal'));
    const raysEl = el('levelup-rays');
    if (raysEl) raysEl.innerHTML = '';
    const burstEl = el('levelup-burst');
    if (burstEl) burstEl.innerHTML = '';
    st.cB_X = 0; st.cB_Y = 8; cam.position.set(0, 8, 15);
    game.clock.getDelta();
    // Check for queued level-ups
    if (_pendingLevelUps > 0) {
        setTimeout(() => _triggerNextLevelUp(), 300);
    } else {
        st.isP = false;
    }
}

function triggerGameOver() {
    const st = game.st;
    if (st.isG || st._crashSlow) return;

    // Phase 1: Slow-motion crash (2 seconds)
    st._crashSlow = true;
    st.hStop = 2.0; // extreme slow-mo via existing hStop system
    shakeCamera(2.0, 3);
    flashScreen('rgba(255,0,0,.6)');

    // Fling the player bike
    st._crashSpin = true;
    st.pVY = 30;
    st.bVX = (R() < 0.5 ? -1 : 1) * 40;

    setTimeout(() => {
        // Phase 2: Show game over screen
        st._crashSlow = false;
        st._crashSpin = false;
        st.isG = true;
        st.hStop = 0;

        const dist = st.dist || 0;
        const milesEarned = calcMilesEarned(dist);
        addMiles(milesEarned);
        addScore(dist, st.lv);
        el('res-lv').innerText = st.lv;
        el('res-dist').innerText = '0.00 km';
        el('res-miles').innerText = '+0';
        setTimeout(() => {
            animateNumber(el('res-dist'), 0, dist, 1200, ' km');
            animateNumber(el('res-miles'), 0, milesEarned, 1000, '');
            const _origMiles = el('res-miles');
            const _milesUpdate = setInterval(() => {
                if (!_origMiles.innerText.startsWith('+')) _origMiles.innerText = '+' + _origMiles.innerText;
            }, 16);
            setTimeout(() => clearInterval(_milesUpdate), 1100);
        }, 400);
        // Cores display
        const coresRow = el('go-cores-row');
        const coresEarned = st.coresEarned || 0;
        if (coresRow) {
            if (coresEarned > 0) { coresRow.style.display = ''; el('res-cores').innerText = '+' + coresEarned; }
            else { coresRow.style.display = 'none'; }
        }
        el('gameover-modal').classList.add('active');
    }, 2000);
}

// --- Boss Warning / Victory UI ---
function showBossWarning(name) {
    const w = el('boss-warning');
    if (!w) return;
    w.innerHTML = `<div class="boss-warning-text">WARNING</div><div class="boss-warning-name">${name}</div>`;
    w.classList.add('active');
    setTimeout(() => w.classList.remove('active'), 2000);
}

function showBossVictory(cores, name) {
    // Legacy — now handled by boss-reward-modal
}

function goToMenu() {
    el('title-page').classList.remove('active');
    el('menu-page').classList.add('active');
    _updateMenuMiles();
}

function goToMenuPage() {
    game.st.isP = true;
    // Close any open sub-modals
    if (typeof hidePreview === 'function') hidePreview();
    _menuStack.forEach(id => el(id).classList.remove('active'));
    _menuStack = [];
    el('gameover-modal').classList.remove('active');
    _showTitleScreen();
    el('menu-page').classList.add('active');
    _updateMenuMiles();
}

function _showGameScreen() {
    if (typeof stopTitleBg === 'function') stopTitleBg();
    el('game-canvas').style.display = 'block';
    el('ui-layer').style.display = '';
    el('speed-meter').style.display = '';
}

function _showTitleScreen() {
    el('game-canvas').style.display = 'none';
    el('ui-layer').style.display = 'none';
    el('speed-meter').style.display = 'none';
    if (typeof showTitleBg === 'function') showTitleBg();
}

const _TUTORIAL_KEY = 'nc-tutorial-done-v1';

function _isTutorialDone() {
    try { return localStorage.getItem(_TUTORIAL_KEY) === '1'; } catch { return false; }
}
function _markTutorialDone() {
    try { localStorage.setItem(_TUTORIAL_KEY, '1'); } catch {}
}

function _isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function _showTutorial(onDone) {
    const overlay = el('tutorial-overlay');
    const isTouch = _isTouchDevice();

    // Toggle mobile/PC content
    const mobileEl = overlay.querySelector('.tutorial-mobile');
    const pcEl = overlay.querySelector('.tutorial-pc');
    const hintEl = el('tutorial-hint');
    if (isTouch) {
        if (mobileEl) mobileEl.classList.remove('hidden');
        if (pcEl) pcEl.classList.remove('active');
        if (hintEl) hintEl.textContent = 'タップしてスタート';
    } else {
        if (mobileEl) mobileEl.classList.add('hidden');
        if (pcEl) pcEl.classList.add('active');
        if (hintEl) hintEl.textContent = 'クリックまたはキーを押してスタート';
    }

    overlay.classList.add('active');

    const dismiss = function() {
        overlay.classList.remove('active');
        overlay.removeEventListener('pointerdown', dismiss);
        window.removeEventListener('keydown', dismissKey);
        _markTutorialDone();
        onDone();
    };
    const dismissKey = function(e) {
        if (e.key === 'a' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            dismiss();
        }
    };
    overlay.addEventListener('pointerdown', dismiss);
    if (!isTouch) window.addEventListener('keydown', dismissKey);
}

function startGame() {
    el('menu-page').classList.remove('active');
    if (game.st.isG) restartGame();
    _showGameScreen();
    addCumulStat('totalRuns');
    // Countdown 3→2→1→GO
    game.st.isP = true;
    const cd = el('countdown');
    const nums = ['3', '2', '1', 'GO'];
    let i = 0;
    cd.textContent = nums[0];
    cd.classList.add('show');
    const tick = setInterval(() => {
        i++;
        if (i < nums.length) {
            cd.textContent = nums[i];
            cd.classList.remove('show');
            void cd.offsetWidth; // force reflow
            cd.classList.add('show');
        } else {
            clearInterval(tick);
            cd.classList.remove('show');
            // Show tutorial on first play, then warp
            if (!_isTutorialDone()) {
                _showTutorial(() => triggerWarpEffect());
            } else {
                triggerWarpEffect();
            }
        }
    }, 700);
}

function triggerWarpEffect() {
    const COUNT = 250;
    const warpLines = [];
    const colors = [0xaaccff, 0x88bbff, 0xccddff, 0x60a5fa, 0xffffff];

    for (let i = 0; i < COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2 + Math.random() * 35;
        const z = -30 - Math.random() * 220;
        const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -0.5)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
            color: colors[floor(Math.random() * colors.length)],
            transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const line = new THREE.Line(geo, mat);
        line.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius + 8, z);
        scene.add(line);
        warpLines.push({ line, speed: 80 + Math.random() * 180 });
    }

    const DURATION = 2200;
    const startT = performance.now();
    let gameStarted = false;

    function warpFrame(now) {
        const elapsed = now - startT;
        const t = Math.min(elapsed / DURATION, 1);
        const accel = t * t * t;

        for (const s of warpLines) {
            s.line.position.z += s.speed * (0.3 + accel * 5) * 0.016;
            // Stretch tail with acceleration
            const pos = s.line.geometry.attributes.position.array;
            pos[5] = -(1 + accel * 25);
            s.line.geometry.attributes.position.needsUpdate = true;
            // Fade in then out
            s.line.material.opacity = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
            // Recycle stars that pass camera
            if (s.line.position.z > 25) {
                const a = Math.random() * Math.PI * 2;
                const r = 2 + Math.random() * 35;
                s.line.position.set(Math.cos(a) * r, Math.sin(a) * r + 8, -200 - Math.random() * 50);
            }
        }

        // FOV: ramp up before game start, ease back to 75 after
        if (!gameStarted) {
            cam.fov = 75 + accel * 40;
        } else {
            const returnT = (t - 0.6) / 0.4; // 0→1 over remaining 40%
            cam.fov = 75 + (1 - returnT * returnT) * (0.216 * 40); // ease out from ~83.6 back to 75
        }
        cam.updateProjectionMatrix();

        // Start game mid-warp
        if (t > 0.6 && !gameStarted) {
            gameStarted = true;
            game.st.isP = false;
            game.clock.getDelta();
        }

        if (t < 1) {
            requestAnimationFrame(warpFrame);
        } else {
            // Cleanup
            warpLines.forEach(s => { scene.remove(s.line); s.line.geometry.dispose(); s.line.material.dispose(); });
            cam.fov = 75;
            cam.updateProjectionMatrix();
        }
    }
    requestAnimationFrame(warpFrame);
}

function restartGame() {
    _pendingLevelUps = 0;
    const st = game.st;
    Object.assign(st, {
        spd: 0, maxSpd: CFG.maxSpd, steer: CFG.steer, size: CFG.size, def: CFG.def, hp: CFG.hp, maxHp: CFG.hp,
        dTimer: 0, pY: 0, pVY: 0, bVX: 0, invT: 0, pBank: 0, hStop: 0, cShkT: 0, cShkI: 0, cB_X: 0, cB_Y: 8,
        _crashSlow: false, _crashSpin: false, _crashZ: 0,
        lv: 1, exp: 0, nExp: CFG.lvExp, crv: 0, tCrv: 0, cTmr: 0,
        sCrvSt: 'N', sCrvCd: CFG.sCrvBase + R() * CFG.sCrvRnd, sCrvTmr: 0, sCrvDir: 1, pLx: 0,
        isP: false, isG: false, spwnT: 0, rocketTmr: 20 + R() * 10,
        dist: 0, _achTimer: 0,
        blasterCount: 0, blasterDmg: CFG.blasterDmg, blasterInterval: CFG.blasterInterval, blasterTimer: 0,
        stats: { destroyedEnemies: 0, damageTaken: 0, dashCount: 0, jumpCount: 0 },
        boss: _defaultBossState ? _defaultBossState() : { active: false },
        bossesDefeated: [false, false, false],
        coresEarned: 0
    });
    // Apply meta-progression permanent upgrades
    if (typeof applyMetaUpgrades === 'function') applyMetaUpgrades();
    el('warning-container').classList.remove('active');
    playerMesh.scale.setScalar(1.5); playerMesh.position.setScalar(0);
    playerMesh.rotation.set(0, 0, 0);
    cam.rotation.z = 0; cam.fov = 75; cam.position.set(0, 8, 15);
    el('speed-lines').style.opacity = '0';
    game.pts.forEach(p => p.scale.z = 1);
    game.ents.forEach(e => scene.remove(e.mesh)); game.ents.length = 0;
    el('gameover-modal').classList.remove('active');
    game.clock.getDelta();
    if (typeof resetStage === 'function') resetStage();
    applyCustomization();
}
