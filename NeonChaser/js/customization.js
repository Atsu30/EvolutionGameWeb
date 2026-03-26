import { load, save } from './storage.js';
import { PI } from './state.js';
import { MkMat, playerMesh, geoTire, geoBody, initTrailPool } from './renderer.js';

const INV_KEY = 'inventory-v1';
const EQP_KEY = 'equip-v1';

// --- Color Presets: { body, emissive, neon, neonEmissive } ---
const COLORS = {
    'color-default':  { name: 'Cyber Blue',     body: 0x38bdf8, emit: 0x0284c7, neon: 0x00ffff, nEmit: 0x00ffff, rarity: '-' },
    'color-emerald':  { name: 'Neon Emerald',   body: 0x059669, emit: 0x064e3b, neon: 0x34d399, nEmit: 0x34d399, rarity: 'C' },
    'color-amber':    { name: 'Solar Flare',    body: 0xd97706, emit: 0x92400e, neon: 0xfbbf24, nEmit: 0xfbbf24, rarity: 'C' },
    'color-slate':    { name: 'Ghost Steel',    body: 0x475569, emit: 0x1e293b, neon: 0x94a3b8, nEmit: 0x94a3b8, rarity: 'C' },
    'color-rose':     { name: 'Crimson Blaze',  body: 0xe11d48, emit: 0x9f1239, neon: 0xff0055, nEmit: 0xff0055, rarity: 'R' },
    'color-violet':   { name: 'Phantom Violet', body: 0x7c3aed, emit: 0x5b21b6, neon: 0xa78bfa, nEmit: 0xa78bfa, rarity: 'R' },
    'color-lime':     { name: 'Acid Runner',    body: 0x65a30d, emit: 0x3f6212, neon: 0x84cc16, nEmit: 0x84cc16, rarity: 'R' },
    'color-orange':   { name: 'Magma Core',     body: 0xea580c, emit: 0x9a3412, neon: 0xfb923c, nEmit: 0xfb923c, rarity: 'R' },
    'color-fuchsia':  { name: 'Neon Sakura',    body: 0xc026d3, emit: 0x86198f, neon: 0xf0abfc, nEmit: 0xf0abfc, rarity: 'E' },
    'color-gold':     { name: 'Gilded Rider',   body: 0xb45309, emit: 0x78350f, neon: 0xfcd34d, nEmit: 0xfcd34d, rarity: 'E' },
    'color-ice':      { name: 'Cryo Phantom',   body: 0x0ea5e9, emit: 0x075985, neon: 0xbae6fd, nEmit: 0xbae6fd, rarity: 'E' },
    'color-rainbow':  { name: 'Prismatic',      body: 0xffffff, emit: 0xff0000, neon: 0xffffff, nEmit: 0xff0000, rarity: 'L', animated: true },
    'color-void':     { name: 'Void Walker',    body: 0x0f0f23, emit: 0x3b0764, neon: 0x8b5cf6, nEmit: 0x8b5cf6, rarity: 'L' },
};

// --- Tire Presets ---
const TIRES = {
    'tire-default': { name: 'Standard',   rarity: '-', geo: () => geoTire },
    'tire-wide':    { name: 'Wide Grip',  rarity: 'C', geo: () => applyGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 12), g => g.rotateZ(PI / 2)) },
    'tire-hex':     { name: 'Hex Core',   rarity: 'R', geo: () => applyGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 6), g => g.rotateZ(PI / 2)) },
    'tire-thin':    { name: 'Razor Thin', rarity: 'R', geo: () => applyGeo(new THREE.TorusGeometry(0.45, 0.08, 8, 12), g => g.rotateZ(PI / 2)) },
    'tire-spiked':  { name: 'Spike Ring', rarity: 'E', geo: () => applyGeo(new THREE.TorusGeometry(0.45, 0.12, 6, 12), g => g.rotateZ(PI / 2)) },
};

// --- Body Presets ---
const BODIES = {
    'body-default': { name: 'Standard Cone', rarity: '-', geo: () => geoBody },
    'body-sleek':   { name: 'Sleek Arrow',   rarity: 'C', geo: () => applyGeo(new THREE.ConeGeometry(0.3, 4.5, 3), g => g.rotateX(-PI / 2).rotateZ(PI / 2)) },
    'body-heavy':   { name: 'Heavy Frame',   rarity: 'R', geo: () => applyGeo(new THREE.BoxGeometry(0.8, 0.6, 3.5), g => g) },
    'body-diamond': { name: 'Diamond Edge',  rarity: 'E', geo: () => { const g = new THREE.OctahedronGeometry(1.2, 0); g.scale(0.5, 0.8, 1.2); return g; } },
    'body-twin':    { name: 'Twin Blade',    rarity: 'L', geo: () => applyGeo(new THREE.ConeGeometry(0.25, 3.5, 3), g => g.rotateX(-PI / 2).rotateZ(PI / 2)) },
};

function applyGeo(g, fn) { fn(g); return g; }

// --- Trail Presets ---
const TRAILS = {
    'trail-default':  { name: 'None',           rarity: '-', color: null },
    'trail-cyan':     { name: 'Cyber Stream',   rarity: 'C', color: 0x00ffff },
    'trail-fire':     { name: 'Fire Trail',     rarity: 'C', color: 0xff6600 },
    'trail-electric': { name: 'Lightning',      rarity: 'R', color: 0x60a5fa },
    'trail-sakura':   { name: 'Cherry Blossom', rarity: 'R', color: 0xf0abfc },
    'trail-gold':     { name: 'Golden Path',    rarity: 'E', color: 0xfcd34d },
    'trail-void':     { name: 'Dark Matter',    rarity: 'L', color: 0x8b5cf6 },
};

// --- Gacha Pool (excludes defaults) ---
export const GACHA_POOL = [
    ...Object.entries(COLORS).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'color', rarity: v.rarity })),
    ...Object.entries(TIRES).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'tire', rarity: v.rarity })),
    ...Object.entries(BODIES).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'body', rarity: v.rarity })),
    ...Object.entries(TRAILS).filter(([, v]) => v.rarity !== '-').map(([id, v]) => ({ id, name: v.name, category: 'trail', rarity: v.rarity })),
];

export function getColorDef(id) { return COLORS[id] || COLORS['color-default']; }
export function getTireDef(id)  { return TIRES[id] || TIRES['tire-default']; }
export function getBodyDef(id)  { return BODIES[id] || BODIES['body-default']; }
export function getTrailDef(id) { return TRAILS[id] || TRAILS['trail-default']; }

export function getAllColors() { return COLORS; }
export function getAllTires()  { return TIRES; }
export function getAllBodies() { return BODIES; }
export function getAllTrails() { return TRAILS; }

// --- Inventory ---
export function getInventory() {
    return load(INV_KEY, { colors: [], tires: [], bodies: [], trails: [] });
}

export function addItem(id) {
    const inv = getInventory();
    const pool = GACHA_POOL.find(p => p.id === id);
    if (!pool) return;
    const catMap = { color: 'colors', tire: 'tires', body: 'bodies', trail: 'trails' };
    const key = catMap[pool.category];
    if (key && !inv[key].includes(id)) {
        inv[key].push(id);
        save(INV_KEY, inv);
    }
}

export function ownsItem(id) {
    const inv = getInventory();
    return [...inv.colors, ...inv.tires, ...inv.bodies, ...(inv.trails || [])].includes(id);
}

// --- Equipment ---
export function getEquipped() {
    return load(EQP_KEY, { colorId: 'color-default', tireId: 'tire-default', bodyId: 'body-default', trailId: 'trail-default' });
}

export function setEquipped(category, id) {
    const eq = getEquipped();
    if (category === 'color') eq.colorId = id;
    else if (category === 'tire') eq.tireId = id;
    else if (category === 'body') eq.bodyId = id;
    else if (category === 'trail') eq.trailId = id;
    save(EQP_KEY, eq);
}

// --- Apply to Player Mesh ---
let rainbowHue = 0;
let isRainbow = false;

export function applyCustomization() {
    const eq = getEquipped();

    // Color
    const col = getColorDef(eq.colorId);
    isRainbow = !!col.animated;
    const bodyMat = MkMat(col.body, col.emit, 0.6);
    const neonMat = MkMat(col.neon, col.nEmit, 2.0);
    playerMesh.userData.changeMat(bodyMat, neonMat);
    playerMesh.userData._bodyMat = bodyMat;
    playerMesh.userData._neonMat = neonMat;

    // Tires
    const tireDef = getTireDef(eq.tireId);
    const newTireGeo = tireDef.geo();
    playerMesh.userData.tires.forEach(tireGroup => {
        const tireMesh = tireGroup.children[0];  // Mesh(geoTire, matTire)
        if (tireMesh.geometry !== newTireGeo) tireMesh.geometry = newTireGeo;
        // Update rim and edge geometry too
        const rimMesh = tireGroup.children[1];
        const edgeLine = tireGroup.children[2];
        rimMesh.geometry = newTireGeo;
        edgeLine.geometry = new THREE.EdgesGeometry(newTireGeo);
    });

    // Body
    const bodyDef = getBodyDef(eq.bodyId);
    const newBodyGeo = bodyDef.geo();
    const bodyLine = playerMesh.children[2]; // LineSegments (body edges)
    if (bodyLine) {
        bodyLine.geometry = new THREE.EdgesGeometry(newBodyGeo);
    }

    // Trail
    const trailDef = getTrailDef(eq.trailId);
    initTrailPool(trailDef.color);
}

export function updateRainbowEffect(dt) {
    if (!isRainbow) return;
    rainbowHue = (rainbowHue + dt * 0.3) % 1;
    const bodyMat = playerMesh.userData._bodyMat;
    const neonMat = playerMesh.userData._neonMat;
    if (bodyMat) {
        bodyMat.color.setHSL(rainbowHue, 0.8, 0.5);
        bodyMat.emissive.setHSL(rainbowHue, 1, 0.3);
    }
    if (neonMat) {
        neonMat.color.setHSL((rainbowHue + 0.1) % 1, 1, 0.7);
        neonMat.emissive.setHSL((rainbowHue + 0.1) % 1, 1, 0.5);
    }
}
