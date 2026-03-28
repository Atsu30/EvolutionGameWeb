// --- Menu System ---
let _menuStack = [];

function _updateMenuMiles() {
    const m = el('menu-miles');
    if (m) m.innerText = getWallet().miles.toLocaleString();
}

function _showModal(id) { _menuStack.push(id); el(id).classList.add('active'); }
function _hideModal(id) { el(id).classList.remove('active'); _menuStack = _menuStack.filter(m => m !== id); }

function showMenu() { game.st.isP = true; }
function hideMenu() {
    if (_menuStack.includes('custom-modal') && typeof hidePreview === 'function') hidePreview();
    if (_gachaPulling) _gachaPulling = false;
    _menuStack.forEach(id => el(id).classList.remove('active')); _menuStack = [];
    // Return to menu page, not directly to game
    el('menu-page').classList.add('active');
}
function goBack() {
    const top = _menuStack[_menuStack.length - 1];
    if (top === 'custom-modal' && typeof hidePreview === 'function') hidePreview();
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
