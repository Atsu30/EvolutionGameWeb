// --- Shared State & Helpers ---
const el = id => document.getElementById(id);
const { min, max, random, floor, ceil, PI, abs, sign, pow, atan, atan2 } = Math;
const R = () => random();
const R_Sign = () => (R() - 0.5) * 2;

const game = {
    st: {},
    keys: { l: false, r: false },
    ents: [],
    pts: [],
    road: [],
    shockIdx: 0,
    clock: new THREE.Clock()
};
