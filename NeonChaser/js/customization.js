// --- Customization: Items, Inventory, Equipment ---
const _COLORS = {
    'color-default':  { name: 'サイバーブルー',     body: 0x38bdf8, emit: 0x0284c7, neon: 0x00ffff, nEmit: 0x00ffff, rarity: '-' },
    'color-emerald':  { name: 'ネオンエメラルド',   body: 0x059669, emit: 0x064e3b, neon: 0x34d399, nEmit: 0x34d399, rarity: 'C' },
    'color-amber':    { name: 'ソーラーフレア',     body: 0xd97706, emit: 0x92400e, neon: 0xfbbf24, nEmit: 0xfbbf24, rarity: 'C' },
    'color-slate':    { name: 'ゴーストスチール',   body: 0x475569, emit: 0x1e293b, neon: 0x94a3b8, nEmit: 0x94a3b8, rarity: 'C' },
    'color-rose':     { name: 'クリムゾンブレイズ', body: 0xe11d48, emit: 0x9f1239, neon: 0xff0055, nEmit: 0xff0055, rarity: 'R' },
    'color-violet':   { name: 'ファントムバイオレット', body: 0x7c3aed, emit: 0x5b21b6, neon: 0xa78bfa, nEmit: 0xa78bfa, rarity: 'R' },
    'color-lime':     { name: 'アシッドランナー',   body: 0x65a30d, emit: 0x3f6212, neon: 0x84cc16, nEmit: 0x84cc16, rarity: 'R' },
    'color-orange':   { name: 'マグマコア',         body: 0xea580c, emit: 0x9a3412, neon: 0xfb923c, nEmit: 0xfb923c, rarity: 'R' },
    'color-fuchsia':  { name: 'ネオンサクラ',       body: 0xc026d3, emit: 0x86198f, neon: 0xf0abfc, nEmit: 0xf0abfc, rarity: 'E' },
    'color-gold':     { name: 'ギルデッドライダー', body: 0xb45309, emit: 0x78350f, neon: 0xfcd34d, nEmit: 0xfcd34d, rarity: 'E' },
    'color-ice':      { name: 'クライオファントム', body: 0x0ea5e9, emit: 0x075985, neon: 0xbae6fd, nEmit: 0xbae6fd, rarity: 'E' },
    'color-rainbow':  { name: 'プリズマティック',   body: 0xffffff, emit: 0xff0000, neon: 0xffffff, nEmit: 0xff0000, rarity: 'L', animated: true },
    'color-void':     { name: 'ヴォイドウォーカー', body: 0x0f0f23, emit: 0x3b0764, neon: 0x8b5cf6, nEmit: 0x8b5cf6, rarity: 'L' },
};

const _TIRES = {
    'tire-default': { name: 'スタンダード',     rarity: '-', geo: () => geoTire },
    'tire-wide':    { name: 'ワイドグリップ',   rarity: 'C', geo: () => _applyGeo(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 12), g => g.rotateZ(PI / 2)) },
    'tire-sphere':  { name: 'スフィアホイール', rarity: 'C', geo: () => new THREE.SphereGeometry(0.5, 10, 10) },
    'tire-hex':     { name: 'ヘックスコア',     rarity: 'R', geo: () => _applyGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 6), g => g.rotateZ(PI / 2)) },
    'tire-ring':    { name: 'プラズマリング',   rarity: 'R', geo: () => _applyGeo(new THREE.TorusGeometry(0.5, 0.06, 6, 16), g => g.rotateZ(PI / 2)) },
    'tire-blade':   { name: 'ブレードホイール', rarity: 'E', geo: () => _applyGeo(new THREE.OctahedronGeometry(0.5, 0), g => { g.scale(0.5, 1, 1); g.rotateZ(PI / 2); return g; }) },
    'tire-dodeca':  { name: 'ドデカホイール',   rarity: 'E', geo: () => new THREE.DodecahedronGeometry(0.45, 0) },
    'tire-hover':   { name: 'ホバーユニット',   rarity: 'L', geo: () => new THREE.BoxGeometry(0.3, 0.3, 0.3) },
};

const _BODIES = {
    'body-default': { name: 'スタンダードコーン', rarity: '-', geo: () => geoBody },
    'body-sleek':   { name: 'スリークアロー',     rarity: 'C', geo: () => _applyGeo(new THREE.ConeGeometry(0.3, 4.5, 3), g => g.rotateX(-PI / 2).rotateZ(PI / 2)) },
    'body-heavy':   { name: 'ヘビーフレーム',     rarity: 'C', geo: () => new THREE.BoxGeometry(0.8, 0.6, 3.5) },
    'body-needle':  { name: 'ニードル',           rarity: 'R', geo: () => _applyGeo(new THREE.ConeGeometry(0.15, 5.0, 4), g => g.rotateX(-PI / 2)) },
    'body-orb':     { name: 'オーブライダー',     rarity: 'R', geo: () => new THREE.SphereGeometry(1.0, 12, 12) },
    'body-diamond': { name: 'ダイヤモンドエッジ', rarity: 'E', geo: () => { const g = new THREE.OctahedronGeometry(1.2, 0); g.scale(0.5, 0.8, 1.2); return g; } },
    'body-torus':   { name: 'リングライダー',     rarity: 'E', geo: () => _applyGeo(new THREE.TorusGeometry(0.8, 0.3, 8, 16), g => g.rotateX(PI / 2)) },
    'body-stealth': { name: 'ステルス',           rarity: 'L', geo: () => { const g = new THREE.ConeGeometry(1.5, 4.0, 4); g.rotateX(-PI / 2); g.scale(1, 0.2, 1); return g; } },
    'body-crystal': { name: 'クリスタルコア',     rarity: 'L', geo: () => new THREE.DodecahedronGeometry(1.0, 0) },
};

const _TRAILS = {
    'trail-default':  { name: 'なし',               rarity: '-', color: null },
    // C: basic trails
    'trail-cyan':     { name: 'サイバーストリーム', rarity: 'C', color: 0x00ffff, size: 1,   life: 0.5, count: 1, spread: 0.3 },
    'trail-fire':     { name: 'フレイムトレイル',   rarity: 'C', color: 0xff6600, size: 1.8, life: 0.3, count: 1, spread: 0.5, geoType: 'cube' },
    // R: distinctive behaviors
    'trail-spark':    { name: 'スパーク',           rarity: 'R', color: 0xffffff, size: 0.4, life: 0.2, count: 4, spread: 2.0 },
    'trail-sakura':   { name: 'チェリーブロッサム', rarity: 'R', color: 0xf0abfc, size: 2.5, life: 1.0, count: 1, spread: 1.5, geoType: 'plane' },
    'trail-electric': { name: 'ライトニング',       rarity: 'R', color: 0x60a5fa, size: 0.6, life: 0.8, count: 2, spread: 0.8 },
    // E: impressive effects
    'trail-gold':     { name: 'ゴールデンパス',     rarity: 'E', color: 0xfcd34d, size: 1.2, life: 0.6, count: 3, spread: 0.4 },
    'trail-plasma':   { name: 'プラズマジェット',   rarity: 'E', color: 0x22d3ee, size: 2.0, life: 0.15, count: 5, spread: 0.6, geoType: 'ring' },
    // L: spectacular
    'trail-void':     { name: 'ダークマター',       rarity: 'L', color: 0x8b5cf6, size: 2.2, life: 1.2, count: 3, spread: 1.5 },
    'trail-rainbow':  { name: 'レインボートレイル', rarity: 'L', color: 0xffffff, size: 1.5, life: 0.8, count: 3, spread: 0.5, animated: true },
};

const GACHA_POOL = [
    ...Object.entries(_COLORS).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'color', rarity: v.rarity })),
    ...Object.entries(_TIRES).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'tire', rarity: v.rarity })),
    ...Object.entries(_BODIES).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'body', rarity: v.rarity })),
    ...Object.entries(_TRAILS).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'trail', rarity: v.rarity })),
];

function getColorDef(id) { return _COLORS[id] || _COLORS['color-default']; }
function getTireDef(id)  { return _TIRES[id] || _TIRES['tire-default']; }
function getBodyDef(id)  { return _BODIES[id] || _BODIES['body-default']; }
function getTrailDef(id) { return _TRAILS[id] || _TRAILS['trail-default']; }
function getAllColors() { return _COLORS; }
function getAllTires()  { return _TIRES; }
function getAllBodies() { return _BODIES; }
function getAllTrails() { return _TRAILS; }

const _INV_KEY = 'inventory-v1';
const _EQP_KEY = 'equip-v1';

function getInventory() { return storageLoad(_INV_KEY, { colors: [], tires: [], bodies: [], trails: [] }); }

function addItem(id) {
    const inv = getInventory();
    const pool = GACHA_POOL.find(p => p.id === id);
    if (!pool) return;
    const catMap = { color: 'colors', tire: 'tires', body: 'bodies', trail: 'trails' };
    const key = catMap[pool.category];
    if (key && !inv[key].includes(id)) { inv[key].push(id); storageSave(_INV_KEY, inv); }
}

function ownsItem(id) {
    const inv = getInventory();
    return [...inv.colors, ...inv.tires, ...inv.bodies, ...(inv.trails || [])].includes(id);
}

function getEquipped() { return storageLoad(_EQP_KEY, { colorId: 'color-default', tireId: 'tire-default', bodyId: 'body-default', trailId: 'trail-default' }); }

function setEquipped(category, id) {
    const eq = getEquipped();
    if (category === 'color') eq.colorId = id;
    else if (category === 'tire') eq.tireId = id;
    else if (category === 'body') eq.bodyId = id;
    else if (category === 'trail') eq.trailId = id;
    storageSave(_EQP_KEY, eq);
}

let _rainbowHue = 0;
let _isRainbow = false;

function _mkLineMat(color) {
    return new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 1 });
}

function applyCustomization() {
    const eq = getEquipped();
    const col = getColorDef(eq.colorId);
    _isRainbow = !!col.animated;
    // Player bike uses LineSegments → needs LineBasicMaterial for glow via Bloom
    const neonMat = _mkLineMat(col.neon);
    playerMesh.userData.changeMat(neonMat, neonMat);
    playerMesh.userData._bodyMat = neonMat;
    playerMesh.userData._neonMat = neonMat;

    const tireDef = getTireDef(eq.tireId);
    const newTireGeo = tireDef.geo();
    playerMesh.userData.tires.forEach(tireGroup => {
        tireGroup.children[0].geometry = new THREE.EdgesGeometry(newTireGeo);
    });

    const bodyDef = getBodyDef(eq.bodyId);
    const bodyLine = playerMesh.children[2];
    if (bodyLine) bodyLine.geometry = new THREE.EdgesGeometry(bodyDef.geo());

    const trailDef = getTrailDef(eq.trailId);
    initTrailPool(trailDef);
}

function updateRainbowEffect(dt) {
    if (!_isRainbow) return;
    _rainbowHue = (_rainbowHue + dt * 0.3) % 1;
    const nm = playerMesh.userData._neonMat;
    if (nm) nm.color.setHSL(_rainbowHue, 1, 0.7);
}
