// --- Title Background Animation ---
const _tbCvs = document.getElementById('title-bg-canvas');
const _tbCtx = _tbCvs.getContext('2d');
let _tbRunning = true;

function _tbResize() {
    _tbCvs.width = window.innerWidth;
    _tbCvs.height = window.innerHeight;
}
_tbResize();
window.addEventListener('resize', _tbResize);

// Floating geometric shapes
const _tbShapes = [];
const _tbShapeCount = 35;

for (let i = 0; i < _tbShapeCount; i++) {
    _tbShapes.push({
        x: Math.random() * _tbCvs.width,
        y: Math.random() * _tbCvs.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        size: 15 + Math.random() * 45,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        sides: [3, 4, 5, 6, 8][Math.floor(Math.random() * 5)],
        alpha: 0.08 + Math.random() * 0.15,
        hue: Math.random() < 0.6 ? 290 : 190, // magenta or cyan
    });
}

function _tbDrawShape(ctx, x, y, size, sides, rotation) {
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
        const a = rotation + (i / sides) * Math.PI * 2;
        const px = x + Math.cos(a) * size;
        const py = y + Math.sin(a) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function _tbAnimate() {
    if (!_tbRunning) return;
    requestAnimationFrame(_tbAnimate);

    const W = _tbCvs.width, H = _tbCvs.height;
    _tbCtx.fillStyle = '#050510';
    _tbCtx.fillRect(0, 0, W, H);

    // Subtle grid
    _tbCtx.strokeStyle = 'rgba(217, 70, 239, 0.03)';
    _tbCtx.lineWidth = 1;
    const gridSize = 60;
    for (let gx = 0; gx < W; gx += gridSize) {
        _tbCtx.beginPath(); _tbCtx.moveTo(gx, 0); _tbCtx.lineTo(gx, H); _tbCtx.stroke();
    }
    for (let gy = 0; gy < H; gy += gridSize) {
        _tbCtx.beginPath(); _tbCtx.moveTo(0, gy); _tbCtx.lineTo(W, gy); _tbCtx.stroke();
    }

    // Draw shapes
    for (const s of _tbShapes) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;

        // Wrap around
        if (s.x < -s.size) s.x = W + s.size;
        if (s.x > W + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = H + s.size;
        if (s.y > H + s.size) s.y = -s.size;

        _tbDrawShape(_tbCtx, s.x, s.y, s.size, s.sides, s.rotation);
        _tbCtx.strokeStyle = `hsla(${s.hue}, 80%, 65%, ${s.alpha})`;
        _tbCtx.lineWidth = 1.5;
        _tbCtx.stroke();

        // Glow layer
        _tbDrawShape(_tbCtx, s.x, s.y, s.size, s.sides, s.rotation);
        _tbCtx.strokeStyle = `hsla(${s.hue}, 80%, 65%, ${s.alpha * 0.3})`;
        _tbCtx.lineWidth = 4;
        _tbCtx.stroke();
    }

    // Cityscape silhouette
    _tbDrawCity(W, H);

    // Central glow
    const grad = _tbCtx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
    grad.addColorStop(0, 'rgba(217, 70, 239, 0.04)');
    grad.addColorStop(1, 'transparent');
    _tbCtx.fillStyle = grad;
    _tbCtx.fillRect(0, 0, W, H);
}

// --- Cityscape ---
const _tbBuildings = [];
function _tbGenBuildings() {
    _tbBuildings.length = 0;
    const W = _tbCvs.width, H = _tbCvs.height;
    const count = Math.floor(W / 25);
    let x = 0;
    for (let i = 0; i < count; i++) {
        const w = 18 + Math.random() * 30;
        const h = 40 + Math.random() * (H * 0.35);
        const windows = Math.random() > 0.3;
        _tbBuildings.push({ x, w, h, windows });
        x += w + Math.random() * 4;
    }
}
_tbGenBuildings();
window.addEventListener('resize', _tbGenBuildings);

function _tbDrawCity(W, H) {
    const baseY = H;
    const ctx = _tbCtx;

    // Far layer (darker, shorter)
    ctx.fillStyle = 'rgba(15, 10, 30, 0.9)';
    for (const b of _tbBuildings) {
        const h2 = b.h * 0.5;
        ctx.fillRect(b.x - 5, baseY - h2 - 20, b.w + 3, h2 + 20);
    }

    // Main layer
    for (const b of _tbBuildings) {
        // Building body
        ctx.fillStyle = 'rgba(10, 8, 20, 0.95)';
        ctx.fillRect(b.x, baseY - b.h, b.w, b.h);

        // Edge glow
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, baseY - b.h, b.w, b.h);

        // Top accent line
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, baseY - b.h);
        ctx.lineTo(b.x + b.w, baseY - b.h);
        ctx.stroke();

        // Windows
        if (b.windows && b.w > 20) {
            const cols = Math.floor(b.w / 8);
            const rows = Math.floor(b.h / 12);
            for (let r = 1; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() > 0.4) {
                        const wx = b.x + 4 + c * 8;
                        const wy = baseY - b.h + 4 + r * 12;
                        const lit = Math.random();
                        if (lit > 0.5) {
                            ctx.fillStyle = lit > 0.85 ? 'rgba(217, 70, 239, 0.25)' : 'rgba(34, 211, 238, 0.15)';
                        } else {
                            ctx.fillStyle = 'rgba(100, 116, 139, 0.08)';
                        }
                        ctx.fillRect(wx, wy, 4, 6);
                    }
                }
            }
        }
    }
}

function stopTitleBg() {
    _tbRunning = false;
    _tbCvs.style.display = 'none';
}

function showTitleBg() {
    _tbCvs.style.display = 'block';
    if (!_tbRunning) {
        _tbRunning = true;
        _tbAnimate();
    }
}

_tbAnimate();
