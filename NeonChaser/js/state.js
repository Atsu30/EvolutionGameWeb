export const el = id => document.getElementById(id);
export const { min, max, random, floor, ceil, PI, abs, sign, pow, atan, atan2 } = Math;
export const R = () => random();
export const R_Sign = () => (R() - 0.5) * 2;

export const game = {
    st: {},
    keys: { l: false, r: false },
    ents: [],
    pts: [],
    road: [],
    shockIdx: 0,
    clock: new THREE.Clock()
};
