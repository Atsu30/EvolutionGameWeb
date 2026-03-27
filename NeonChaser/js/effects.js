// --- Visual Effects ---
function flashScreen(col) {
    const f = el('damage-flash');
    f.style.transition = 'none';
    f.style.background = col;
    setTimeout(() => {
        f.style.transition = 'background 0.5s ease-out';
        f.style.background = 'transparent';
    }, 50);
}

function shakeCamera(time, intensity) {
    game.st.cShkT = time;
    game.st.cShkI = intensity;
}

// --- XP Popup (DOM) ---
function showXpPopup(worldPos, expAmount, enemyLv) {
    const p = worldPos.clone().project(cam);
    if (p.z > 1.0) return;
    const sx = (p.x + 1) / 2 * window.innerWidth;
    const sy = (-p.y + 1) / 2 * window.innerHeight;
    const popup = document.createElement('div');
    popup.className = enemyLv >= 4 ? 'xp-popup xp-big' : 'xp-popup';
    popup.textContent = '+' + expAmount + ' EXP';
    popup.style.left = sx + 'px';
    popup.style.top = sy + 'px';
    const ctr = el('xp-popup-container');
    ctr.appendChild(popup);
    setTimeout(() => popup.remove(), 950);
}

// --- Destroy Particles (Three.js) ---
const _destroyParticles = [];
const _dpGeo = new THREE.SphereGeometry(0.15, 4, 4);

function spawnDestroyEffect(worldPos, enemyLv, neonColor) {
    const color = neonColor || 0x94a3b8;
    let count, speed, size;
    if (enemyLv <= 1) {
        count = 0; // Lv1: no particles, just grey fade (handled by knock state)
        return;
    } else if (enemyLv <= 3) {
        count = 3 + floor(R() * 3); speed = 8; size = 0.8;
    } else {
        count = 8 + floor(R() * 5); speed = 15; size = 1.2;
        shakeCamera(0.25, 2.0);
        // Bloom flare: brief white flash at position
        flashScreen('rgba(255,255,255,.25)');
    }
    for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
        const mesh = new THREE.Mesh(_dpGeo, mat);
        mesh.position.copy(worldPos);
        mesh.scale.setScalar(size * (0.5 + R() * 0.5));
        const vel = new THREE.Vector3(R_Sign() * speed, R() * speed * 0.8 + 2, R_Sign() * speed);
        scene.add(mesh);
        _destroyParticles.push({ mesh, vel, life: 0.6 + R() * 0.3 });
    }
}

// --- Number Count-Up Animation ---
function animateNumber(element, from, to, duration, suffix) {
    const start = performance.now();
    const diff = to - from;
    const update = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const val = from + diff * eased;
        element.innerText = (Number.isInteger(to) ? Math.floor(val) : val.toFixed(2)) + (suffix || '');
        if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

// --- Bullet Hit Flash ---
const _matHitWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
function bulletHitFlash(entity) {
    if (!entity.mesh || !entity.mesh.userData.changeMat) return;
    // Save current material state key to restore correct colors
    const wasBreakable = entity.mS;
    entity.mesh.userData.changeMat(_matHitWhite, _matHitWhite);
    setTimeout(() => {
        if (entity.state !== 'A') return;
        if (wasBreakable === 'B') entity.mesh.userData.changeMat(matEnemyBreak, matEnemyNeonB);
        else if (entity.type === 'zigzag') entity.mesh.userData.changeMat(matZigzagBody, matZigzagNeon);
        else entity.mesh.userData.changeMat(matEnemyUnbreak, matEnemyNeonU);
    }, 80);
}

function updateDestroyParticles(dt) {
    for (let i = _destroyParticles.length - 1; i >= 0; i--) {
        const p = _destroyParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            _destroyParticles.splice(i, 1);
            continue;
        }
        p.mesh.position.addScaledVector(p.vel, dt);
        p.vel.y -= 20 * dt;
        p.mesh.material.opacity = max(0, p.life / 0.9);
        p.mesh.scale.multiplyScalar(0.97);
    }
}
