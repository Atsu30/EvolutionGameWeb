// --- Menu System ---
let _menuStack = [];

function _updateMenuMiles() {
    const m = el('menu-miles');
    if (m) m.innerText = getWallet().miles.toLocaleString();
    const c = el('menu-cores');
    if (c && typeof getCores === 'function') c.innerText = getCores().toLocaleString();
}

function showMetaUpgrades() {
    _renderMetaGrid();
    _showModal('meta-modal');
}

function _renderMetaGrid() {
    const cores = getCores();
    el('meta-cores').innerText = cores.toLocaleString();
    const levels = getMetaLevels();
    const grid = el('meta-grid');
    grid.innerHTML = META_UPGRADES.map(u => {
        const lv = levels[u.id] || 0;
        const isMaxed = lv >= u.maxLv;
        const cost = isMaxed ? '-' : u.costs[lv];
        const canBuy = !isMaxed && cores >= cost;
        return `<div class="meta-card ${isMaxed ? 'maxed' : ''}" ${canBuy ? `onclick="metaBuy('${u.id}')"` : ''}>
            <div class="meta-card-icon"><i data-lucide="${u.icon}"></i></div>
            <div class="meta-card-name">${u.name}</div>
            <div class="meta-card-lv">Lv ${lv} / ${u.maxLv}</div>
            ${isMaxed ? '<div class="meta-card-cost" style="color:#64748b;">MAX</div>' : `<div class="meta-card-cost">${cost} Core</div>`}
        </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function metaBuy(id) {
    if (purchaseMetaUpgrade(id)) _renderMetaGrid();
}

// --- Bestiary (敵図鑑) ---
let _bestiaryRenderers = [];

function showBestiary() {
    // Clean up previous renderers
    _cleanupBestiaryRenderers();

    const cumul = getCumulStats();
    const discovered = cumul.enemyTypesKilled || {};
    const counts = cumul.enemyKillCounts || {};
    const grid = el('bestiary-grid');

    grid.innerHTML = BESTIARY.map((entry, idx) => {
        const found = !!discovered[entry.id];
        const kills = counts[entry.id] || 0;
        const hpUnlock = kills >= entry.hpDebuff;
        const atkUnlock = kills >= entry.atkDebuff;

        if (!found) {
            return `<div class="bestiary-card locked">
                <div class="bestiary-canvas" style="display:flex;align-items:center;justify-content:center;color:#475569;font-size:36px;">?</div>
                <div class="bestiary-card-body">
                    <div class="bestiary-name">？？？</div>
                    <div class="bestiary-desc">未発見</div>
                </div>
            </div>`;
        }

        let badges = '';
        if (hpUnlock) badges += `<span class="bestiary-badge hp-debuff">HP半減</span>`;
        else badges += `<span class="bestiary-badge pending">HP: ${kills}/${entry.hpDebuff}</span>`;
        if (atkUnlock) badges += `<span class="bestiary-badge atk-debuff">ATK半減</span>`;
        else badges += `<span class="bestiary-badge pending">ATK: ${kills}/${entry.atkDebuff}</span>`;

        return `<div class="bestiary-card">
            <canvas class="bestiary-canvas" id="bp-canvas-${idx}" width="140" height="100"></canvas>
            <div class="bestiary-card-body">
                <div class="bestiary-name">${entry.name}</div>
                <div class="bestiary-kills">× ${kills}</div>
                <div class="bestiary-badges">${badges}</div>
            </div>
        </div>`;
    }).join('');

    _showModal('bestiary-modal');

    // Init a mini Three.js renderer for each discovered enemy
    requestAnimationFrame(() => {
        BESTIARY.forEach((entry, idx) => {
            if (!discovered[entry.id]) return;
            const canvas = el('bp-canvas-' + idx);
            if (!canvas) return;
            _initBestiaryCard(canvas, entry.id);
        });
    });
}

function _initBestiaryCard(canvas, enemyId) {
    const rdr = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    rdr.setClearColor(0x080812, 1);
    rdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rdr.setSize(canvas.clientWidth, canvas.clientHeight);

    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    cam.position.set(0, 0, 9);
    cam.lookAt(0, 0, 0);

    sc.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5, 8, 5); sc.add(dl);

    const bMat = new THREE.MeshPhongMaterial({ color: 0xbe123c, emissive: 0x9f1239, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
    const nMat = new THREE.LineBasicMaterial({ color: 0xff0055 });

    let mesh;
    if (enemyId.startsWith('boss')) {
        const bossFactories = [_createBoss1Mesh, _createBoss2Mesh, _createBoss3Mesh];
        const bIdx = parseInt(enemyId.replace('boss', '')) || 0;
        const factory = bossFactories[bIdx];
        mesh = (factory ? factory(bMat, nMat) : new THREE.Mesh(new THREE.BoxGeometry(1,1,1), bMat));
        mesh.scale.setScalar(bIdx === 0 ? 0.5 : 0.35);
    } else {
        const factories = { drone: createDroneMesh, shard: createShardMesh, sentinel: createSentinelMesh, jellyfish: createJellyfishMesh, fish: createFishMesh, rocket: createRocket, zigzag: createZigzagMesh };
        const factory = factories[enemyId];
        if (!factory) return;
        mesh = factory(bMat, nMat);
        const scaleMap = { jellyfish: 1.0, sentinel: 1.2, zigzag: 1.3 };
        mesh.scale.setScalar(scaleMap[enemyId] || 1.5);
    }
    // Auto-center: compute bounding box and offset so center is at origin
    sc.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    mesh.position.sub(center);

    let running = true;
    function anim() {
        if (!running) return;
        requestAnimationFrame(anim);
        mesh.rotation.y += 0.015;
        if (mesh.userData && mesh.userData.animate) mesh.userData.animate(0.016);
        rdr.render(sc, cam);
    }
    anim();

    _bestiaryRenderers.push({ rdr, running: true, stop: () => { running = false; rdr.dispose(); } });
}

function _cleanupBestiaryRenderers() {
    _bestiaryRenderers.forEach(r => r.stop());
    _bestiaryRenderers = [];
}

function _showModal(id) { _menuStack.push(id); el(id).classList.add('active'); }
function _hideModal(id) { el(id).classList.remove('active'); _menuStack = _menuStack.filter(m => m !== id); }

function showMenu() { game.st.isP = true; }
function hideMenu() {
    if (_menuStack.includes('custom-modal') && typeof hidePreview === 'function') hidePreview();
    if (_menuStack.includes('bestiary-modal')) _cleanupBestiaryRenderers();
    if (_gachaPulling) _gachaPulling = false;
    _menuStack.forEach(id => el(id).classList.remove('active')); _menuStack = [];
    // Return to menu page, not directly to game
    el('menu-page').classList.add('active');
}
function goBack() {
    const top = _menuStack[_menuStack.length - 1];
    if (top === 'custom-modal' && typeof hidePreview === 'function') hidePreview();
    if (top === 'bestiary-modal') _cleanupBestiaryRenderers();
    if (_menuStack.length > 1) { _hideModal(top); }
    else {
        _menuStack.forEach(id => el(id).classList.remove('active')); _menuStack = [];
        el('menu-page').classList.add('active');
    }
}

function showRanking() {
    const scores = getScores(), list = el('ranking-list');
    if (scores.length === 0) { list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">記録なし</div>'; }
    else {
        list.innerHTML = scores.map((s, i) => {
            const rc = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#64748b';
            const d = new Date(s.date);
            return `<div class="rank-row"><span class="rank-num" style="color:${rc}">#${i+1}</span><span class="rank-dist">${s.dist.toFixed(2)} km</span><span class="rank-lv">Lv ${s.lv}</span><span class="rank-date">${d.getMonth()+1}/${d.getDate()}</span></div>`;
        }).join('');
    }
    _showModal('ranking-modal');
}

function showAchievements() {
    const progress = getAchievementProgress();
    const unlocked = ACHIEVEMENTS.filter(a => progress[a.id]).length;
    el('achieve-progress').innerText = `${unlocked} / ${ACHIEVEMENTS.length}`;
    const am = el('achieve-miles');
    if (am) am.innerText = getWallet().miles.toLocaleString();
    el('achieve-list').innerHTML = ACHIEVEMENTS.map(a => {
        const entry = progress[a.id];
        const done = !!entry;
        const claimed = entry && entry.claimed;
        let rightCol;
        if (!done) {
            rightCol = `<span class="achieve-check"><i data-lucide="lock"></i></span>`;
        } else if (claimed) {
            rightCol = `<span class="achieve-claimed"><i data-lucide="check-circle"></i></span>`;
        } else {
            rightCol = `<button class="claim-btn" onclick="achieveClaim('${a.id}')">受取 +${a.reward} マイル</button>`;
        }
        return `<div class="achieve-row ${done ? (claimed ? 'unlocked claimed' : 'unlocked claimable') : 'locked'}"><span class="achieve-icon"><i data-lucide="${a.icon}"></i></span><div class="achieve-info"><div class="achieve-name">${a.name}</div><div class="achieve-desc">${a.desc}</div></div>${rightCol}</div>`;
    }).join('');
    _showModal('achieve-modal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function achieveClaim(id) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    // Find the clicked button
    const btn = event.currentTarget;
    const row = btn.closest('.achieve-row');
    if (!btn || !row) { if (claimReward(id)) showAchievements(); return; }

    // Get button position for effects
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // 1. Mile popup float
    const popup = document.createElement('div');
    popup.className = 'claim-popup';
    popup.innerText = `+${achievement.reward}`;
    popup.style.left = cx + 'px';
    popup.style.top = cy + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);

    // 2. Gold particle burst
    const colors = ['#fbbf24', '#f59e0b', '#fcd34d', '#facc15', '#d97706'];
    for (let i = 0; i < 7; i++) {
        const p = document.createElement('div');
        p.className = 'claim-particle';
        const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 30 + Math.random() * 40;
        p.style.setProperty('--cpx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--cpy', Math.sin(angle) * dist + 'px');
        p.style.background = colors[i % colors.length];
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }

    // 3. Replace button with check mark
    btn.style.transition = 'opacity 0.3s, transform 0.3s';
    btn.style.opacity = '0';
    btn.style.transform = 'scale(0.5)';

    setTimeout(() => {
        if (claimReward(id)) {
            // Replace the button area with a checkmark
            const check = document.createElement('span');
            check.className = 'achieve-claimed claim-check-enter';
            check.innerText = '✅';
            btn.replaceWith(check);
            // Update miles display
            const am = el('achieve-miles');
            if (am) am.innerText = getWallet().miles.toLocaleString();
        }
    }, 300);
}

let _popupQueue = [], _popupActive = false;
function showAchievementPopup(a) { _popupQueue.push(a); if (!_popupActive) _processPopup(); }
function _processPopup() {
    if (!_popupQueue.length) { _popupActive = false; return; }
    _popupActive = true; const a = _popupQueue.shift();
    const p = el('achieve-popup');
    p.innerHTML = `<div class="achieve-popup-border"></div><div class="achieve-popup-bg"></div>`
        + `<div class="achieve-popup-content">`
        + `<span class="achieve-popup-icon"><i data-lucide="${a.icon}"></i></span>`
        + `<div class="achieve-popup-text"><div class="achieve-popup-label">Achievement</div><strong>${a.name}</strong><small>${a.desc}</small></div>`
        + `</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons({ nameAttr: 'data-lucide', attrs: {} });
    p.classList.add('show');
    setTimeout(() => { p.classList.remove('show'); setTimeout(_processPopup, 400); }, 3000);
}
