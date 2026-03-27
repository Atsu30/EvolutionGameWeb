// --- UI: HUD, Modals, Game Over, Restart ---
function updateUI() {
    const st = game.st;
    el('ui-lv').innerText = `Lv ${st.lv}`;
    // Speed meter
    const spdVal = floor(st.spd);
    el('ui-spd').innerText = spdVal;
    const spdRatio = min(1, st.spd / st.maxSpd);
    // Arc: 270deg sweep, dasharray=245 (3/4 of circumference ~326)
    el('meter-arc').style.strokeDashoffset = 245 - spdRatio * 245;
    // Needle: rotate from -135deg (0%) to +135deg (100%)
    el('meter-needle').style.transform = `rotate(${-135 + spdRatio * 270}deg)`;
    el('ui-hp').innerText = ceil(st.hp);
    el('ui-dist').innerText = (st.dist || 0).toFixed(2) + ' km';
    el('exp-fill').style.width = `${min(100, st.exp / st.nExp * 100)}%`;
    const hpRatio = max(0, min(100, st.hp / st.maxHp * 100));
    el('hp-fill').style.width = `${hpRatio}%`;
    el('ui-hp').style.color = hpRatio < 30 ? '#f87171' : '#86efac';
    el('hp-fill').style.background = hpRatio < 30 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #22c55e, #86efac)';
    const isD = st.dTimer > 0;
    el('ui-spd').style.color = isD ? '#22d3ee' : '#60a5fa';
    el('meter-arc').style.stroke = isD ? '#22d3ee' : '#3b82f6';
}

function showUpgradeUI() {
    const container = el('upgrades'); container.innerHTML = '';
    const modal = el('levelup-modal');

    // Block clicks during celebration
    modal.classList.add('no-interact');

    // Spawn burst particles
    const burst = el('levelup-burst');
    burst.innerHTML = '';
    const colors = ['#60a5fa','#818cf8','#f472b6','#34d399','#fbbf24','#22d3ee'];
    for (let i = 0; i < 24; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        const angle = (i / 24) * Math.PI * 2;
        const dist = 120 + Math.random() * 160;
        p.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--by', Math.sin(angle) * dist + 'px');
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.3) + 's';
        p.style.width = p.style.height = (4 + Math.random() * 6) + 'px';
        burst.appendChild(p);
    }

    // Build cards (hidden initially) — filter by conditions
    const st = game.st;
    const available = UPGRADES.filter(u => !u.cond || u.cond(st));
    const chosen = [...available].sort(() => 0.5 - R()).slice(0, 3);
    chosen.forEach(u => {
        const card = document.createElement('div'); card.className = 'card';
        card.onclick = () => selectUpgrade(u.id);
        card.innerHTML = `<div class="card-icon">${u.i}</div><div><div class="card-title">${u.t}</div><div class="card-desc">${u.d}</div></div>`;
        container.appendChild(card);
    });

    // Stagger-reveal cards after 1.2s, then enable clicks
    const cards = container.querySelectorAll('.card');
    const staggerDelay = 200; // ms between each card
    const startDelay = 1200;  // ms before first card appears

    cards.forEach((card, i) => {
        setTimeout(() => {
            card.classList.add('card-reveal');
        }, startDelay + i * staggerDelay);
    });

    // Enable clicks after all cards are revealed
    const totalRevealTime = startDelay + cards.length * staggerDelay + 400;
    setTimeout(() => {
        modal.classList.remove('no-interact');
    }, totalRevealTime);
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
    if (id === 'bpow') st.blasterDmg += 1;
    if (id === 'bnum') st.blasterCount = min(3, st.blasterCount + 1);
    const modal = el('levelup-modal');
    modal.classList.remove('active');
    modal.classList.remove('no-interact');
    // Reset card reveal classes so animations replay next time
    modal.querySelectorAll('.card.card-reveal').forEach(c => c.classList.remove('card-reveal'));
    st.cB_X = 0; st.cB_Y = 8; cam.position.set(0, 8, 15);
    game.clock.getDelta(); st.isP = false;
}

function triggerGameOver() {
    const st = game.st;
    if (st.isG) return;
    st.isG = true;
    const dist = st.dist || 0;
    const milesEarned = calcMilesEarned(dist);
    addMiles(milesEarned);
    addScore(dist, st.lv);
    el('res-lv').innerText = st.lv;
    // Animate numbers with count-up effect (delayed to sync with modal appearance)
    el('res-dist').innerText = '0.00 km';
    el('res-miles').innerText = '+0';
    setTimeout(() => {
        animateNumber(el('res-dist'), 0, dist, 1200, ' km');
        animateNumber(el('res-miles'), 0, milesEarned, 1000, '');
        // Prefix '+' for miles after animation starts
        const _origMiles = el('res-miles');
        const _milesUpdate = setInterval(() => {
            if (!_origMiles.innerText.startsWith('+')) _origMiles.innerText = '+' + _origMiles.innerText;
        }, 16);
        setTimeout(() => clearInterval(_milesUpdate), 1100);
    }, 400);
    el('gameover-modal').classList.add('active');
}

function goToMenu() {
    el('title-page').classList.remove('active');
    el('menu-page').classList.add('active');
}

function goToMenuPage() {
    game.st.isP = true;
    // Close any open sub-modals
    if (typeof hidePreview === 'function') hidePreview();
    _menuStack.forEach(id => el(id).classList.remove('active'));
    _menuStack = [];
    el('gameover-modal').classList.remove('active');
    el('menu-page').classList.add('active');
}

function startGame() {
    el('menu-page').classList.remove('active');
    if (game.st.isG) restartGame();
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
            triggerWarpEffect();
        }
    }, 700);
}

function triggerWarpEffect() {
    const overlay = el('warp-overlay');
    overlay.innerHTML = '';
    const cvs = document.createElement('canvas');
    const W = window.innerWidth, H = window.innerHeight;
    cvs.width = W; cvs.height = H;
    overlay.appendChild(cvs);
    overlay.classList.add('active');
    const ctx = cvs.getContext('2d');
    const cx = W / 2, cy = H / 2;

    // Stars
    const STAR_COUNT = 300;
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            angle: Math.random() * Math.PI * 2,
            dist: Math.random() * 2,
            speed: 0.5 + Math.random() * 1.5,
            size: 0.5 + Math.random() * 1.5,
            hue: 200 + Math.random() * 40,
        });
    }

    const DURATION = 2000;
    const startT = performance.now();
    let gameStarted = false;

    function drawFrame(now) {
        const elapsed = now - startT;
        const t = Math.min(elapsed / DURATION, 1);

        // Acceleration curve: slow start, then rapid
        const accel = t * t * t;
        const streakLen = accel * 80;

        ctx.fillStyle = `rgba(0,0,5,${0.3 + accel * 0.4})`;
        ctx.fillRect(0, 0, W, H);

        for (const s of stars) {
            s.dist += s.speed * (0.5 + accel * 8) * 0.016;

            const x = cx + Math.cos(s.angle) * s.dist * (W * 0.4);
            const y = cy + Math.sin(s.angle) * s.dist * (H * 0.4);

            if (x < -50 || x > W + 50 || y < -50 || y > H + 50) {
                s.dist = Math.random() * 0.3;
                s.angle = Math.random() * Math.PI * 2;
                continue;
            }

            // Trail
            const tx = cx + Math.cos(s.angle) * Math.max(0, s.dist - streakLen * 0.01 * s.speed) * (W * 0.4);
            const ty = cy + Math.sin(s.angle) * Math.max(0, s.dist - streakLen * 0.01 * s.speed) * (H * 0.4);

            const alpha = Math.min(1, s.dist * 2) * (0.4 + accel * 0.6);
            const grad = ctx.createLinearGradient(tx, ty, x, y);
            grad.addColorStop(0, `hsla(${s.hue},80%,80%,0)`);
            grad.addColorStop(1, `hsla(${s.hue},80%,90%,${alpha})`);

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(x, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.size * (1 + accel * 2);
            ctx.stroke();
        }

        // White flash at the end
        if (t > 0.8) {
            const flash = (t - 0.8) / 0.2;
            ctx.fillStyle = `rgba(200,220,255,${flash * 0.8})`;
            ctx.fillRect(0, 0, W, H);
        }

        // Start game mid-warp
        if (t > 0.5 && !gameStarted) {
            gameStarted = true;
            game.st.isP = false;
            game.clock.getDelta();
        }

        if (t < 1) {
            requestAnimationFrame(drawFrame);
        } else {
            overlay.classList.remove('active');
            overlay.innerHTML = '';
        }
    }
    requestAnimationFrame(drawFrame);
}

function restartGame() {
    const st = game.st;
    Object.assign(st, {
        spd: 0, maxSpd: CFG.maxSpd, steer: CFG.steer, size: CFG.size, def: CFG.def, hp: CFG.hp, maxHp: CFG.hp,
        dTimer: 0, pY: 0, pVY: 0, bVX: 0, invT: 0, pBank: 0, hStop: 0, cShkT: 0, cShkI: 0, cB_X: 0, cB_Y: 8,
        lv: 1, exp: 0, nExp: CFG.lvExp, crv: 0, tCrv: 0, cTmr: 0,
        sCrvSt: 'N', sCrvCd: CFG.sCrvBase + R() * CFG.sCrvRnd, sCrvTmr: 0, sCrvDir: 1, pLx: 0,
        isP: false, isG: false, spwnT: 0, rocketTmr: 20 + R() * 10,
        dist: 0, _achTimer: 0,
        blasterCount: 0, blasterDmg: CFG.blasterDmg, blasterTimer: 0,
        stats: { destroyedEnemies: 0, damageTaken: 0, dashCount: 0, jumpCount: 0 }
    });
    el('warning-container').classList.remove('active');
    playerMesh.scale.setScalar(1.5); playerMesh.position.setScalar(0);
    cam.rotation.z = 0; cam.fov = 75; cam.position.set(0, 8, 15);
    el('speed-lines').style.opacity = '0';
    game.pts.forEach(p => p.scale.z = 1);
    game.ents.forEach(e => scene.remove(e.mesh)); game.ents.length = 0;
    el('gameover-modal').classList.remove('active');
    game.clock.getDelta();
    if (typeof resetStage === 'function') resetStage();
    applyCustomization();
}
