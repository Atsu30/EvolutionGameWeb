export const CFG = {
    maxSpd: 120, acc: 40, steer: 35, size: 1.0, kb: 1.0, hp: 100, guardDmg: 20, healRate: 0.15, healAmt: 20,
    dashRatio: 0.08, dashDur: 2.5, dashSpdMul: 1.6, jmpRatio: 0.05, jmpPow: 45, grav: 100,
    rocketRatio: 0.07,
    laneW: 16, maxCrv: 0.0035, crvInt: 3.5, cfForce: 0.15,
    sCrvBase: 60, sCrvRnd: 30, sCrvWarn: 2.5, sCrvDur: 3.0, sCrvFrc: 0.022, sCrvSpd: 0.01,
    spwnInt: 0.35, hitDecel: 15, wallDecel: 120, pGrav: 150, lvExp: 50, expMul: 1.5
};

export const ENEMY_DEFS = [
    { lv: 1, kb: 1.0, w: 1.0, dmg: 10, exp: 10 },
    { lv: 2, kb: 2.0, w: 1.3, dmg: 20, exp: 20 },
    { lv: 3, kb: 3.0, w: 1.7, dmg: 30, exp: 35 },
    { lv: 4, kb: 4.0, w: 2.2, dmg: 45, exp: 50 },
    { lv: 5, kb: 5.0, w: 3.0, dmg: 60, exp: 80 }
];

export const ROCKET_DEF = { lv: 3, kb: 3.0, w: 1.5, dmg: 30, exp: 40 };
export const ZIGZAG_DEF = { lv: 2, kb: 2.0, w: 1.3, dmg: 25, exp: 30, zigFreq: 4, zigAmp: 12 };

export const UPGRADES = [
    { id: 'spd', i: '⚡', t: 'Engine Overclock', d: '最高速度アップ。<br>※カーブで遠心力に負けやすくなる' },
    { id: 'grp', i: '🛞', t: 'Tire Grip', d: 'ハンドリングアップ。<br>遠心力に抗い急カーブに強くなる' },
    { id: 'siz', i: '🛡️', t: 'Chassis Expansion', d: '車体が巨大化。<br>当たり判定が広がり巻き込みやすくなる' },
    { id: 'atk', i: '💥', t: 'Kinetic Amplifier', d: '攻撃力アップ。<br>より大きく硬い敵(赤色)を粉砕可能になる' }
];

// --- Distance & Economy ---
export const DISTANCE_SCALE = 0.001;   // spd * dt * DISTANCE_SCALE = km
export const MILE_RATE = 10;           // miles per km
export const GACHA_COST = 100;         // miles per pull

export const RARITY_WEIGHTS = [
    { rarity: 'C', weight: 50 },
    { rarity: 'R', weight: 30 },
    { rarity: 'E', weight: 15 },
    { rarity: 'L', weight: 5 },
];

export const SCRAP_DUPE  = { C: 5, R: 15, E: 50, L: 200 };
export const SCRAP_PRICE = { C: 50, R: 150, E: 500, L: 1500 };

// --- Achievements ---
export const ACHIEVEMENTS = [
    // Distance
    { id: 'dist-1',   type: 'dist', dist: 1,   name: 'First Kilometer',   icon: '🏁', desc: '1km走破' },
    { id: 'dist-3',   type: 'dist', dist: 3,   name: 'Warming Up',        icon: '🔥', desc: '3km走破' },
    { id: 'dist-5',   type: 'dist', dist: 5,   name: 'Road Warrior',      icon: '⚔️', desc: '5km走破' },
    { id: 'dist-10',  type: 'dist', dist: 10,  name: 'Highway Star',      icon: '⭐', desc: '10km走破' },
    { id: 'dist-25',  type: 'dist', dist: 25,  name: 'Neon Drifter',      icon: '💎', desc: '25km走破' },
    { id: 'dist-50',  type: 'dist', dist: 50,  name: 'Cyber Phantom',     icon: '👻', desc: '50km走破' },
    { id: 'dist-100', type: 'dist', dist: 100, name: 'Legend of the Grid', icon: '👑', desc: '100km走破' },
    { id: 'dist-200', type: 'dist', dist: 200, name: 'Infinite Runner',   icon: '∞',  desc: '200km走破' },
    // Combat
    { id: 'kill-10',  type: 'stat', stat: 'destroyedEnemies', val: 10,  name: 'First Blood',    icon: '🎯', desc: '1ランで敵10体撃破' },
    { id: 'kill-50',  type: 'stat', stat: 'destroyedEnemies', val: 50,  name: 'Destroyer',      icon: '💀', desc: '1ランで敵50体撃破' },
    { id: 'kill-100', type: 'stat', stat: 'destroyedEnemies', val: 100, name: 'Annihilator',    icon: '☠️', desc: '1ランで敵100体撃破' },
    // Dash
    { id: 'dash-5',   type: 'stat', stat: 'dashCount',        val: 5,   name: 'Speed Junkie',   icon: '💨', desc: '1ランでダッシュ5回' },
    { id: 'dash-20',  type: 'stat', stat: 'dashCount',        val: 20,  name: 'Dash Master',    icon: '🌀', desc: '1ランでダッシュ20回' },
    // Jump
    { id: 'jump-3',   type: 'stat', stat: 'jumpCount',        val: 3,   name: 'Airborne',       icon: '🦘', desc: '1ランでジャンプ3回' },
    { id: 'jump-10',  type: 'stat', stat: 'jumpCount',        val: 10,  name: 'Sky Rider',      icon: '🚀', desc: '1ランでジャンプ10回' },
    // Level
    { id: 'lv-5',     type: 'stat', stat: 'lv',               val: 5,   name: 'Getting Serious', icon: '🔰', desc: 'Lv5到達' },
    { id: 'lv-10',    type: 'stat', stat: 'lv',               val: 10,  name: 'Overclocked',    icon: '⚡', desc: 'Lv10到達' },
    { id: 'lv-20',    type: 'stat', stat: 'lv',               val: 20,  name: 'Unstoppable',    icon: '🔥', desc: 'Lv20到達' },
    // Challenge
    { id: 'nodmg-3',  type: 'nodmg', dist: 3,  name: 'Untouchable',  icon: '🛡️', desc: 'ノーダメージで3km' },
    { id: 'nodmg-10', type: 'nodmg', dist: 10, name: 'Perfect Run',  icon: '💎', desc: 'ノーダメージで10km' },
];
