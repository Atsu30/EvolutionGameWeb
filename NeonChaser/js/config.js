// --- Game Constants ---
const CFG = {
    maxSpd: 120, acc: 40, steer: 35, size: 1.0, def: 0, hp: 100, guardDmg: 20, healRate: 0.15, healAmt: 20,
    dashRatio: 0.08, dashDur: 2.5, dashSpdMul: 1.6, jmpRatio: 0.05, jmpPow: 45, grav: 100,
    rocketRatio: 0.07,
    laneW: 16, maxCrv: 0.0035, crvInt: 3.5, cfForce: 0.15,
    sCrvBase: 60, sCrvRnd: 30, sCrvWarn: 2.5, sCrvDur: 3.0, sCrvFrc: 0.022, sCrvSpd: 0.01,
    spwnInt: 0.35, hitDecel: 15, wallDecel: 120, pGrav: 150, lvExp: 50, expMul: 1.5,
    blasterInterval: 0.3, blasterSpeed: 200, blasterDmg: 1
};

const ENEMY_TYPES = {
    drone: { hp: 1, atk: 0, w: 2.0, exp: 10, speed: 0.7 },
    shard: { hp: 5, atk: 15, w: 2.0, exp: 20, speed: 0.6 },
    sentinel: { hp: 15, atk: 40, w: 2.8, exp: 70, speed: 0.4 },
};

const ROCKET_DEF = { hp: 4, atk: 30, w: 1.5, exp: 40 };
const ZIGZAG_DEF = { hp: 4, atk: 20, w: 2.5, exp: 30, zigFreq: 2, zigAmp: 12 };

const UPGRADES = [
    { id: 'spd', i: '⚡', t: 'エンジン強化', d: '最高速度アップ。<br>※カーブで遠心力に負けやすくなる' },
    { id: 'grp', i: '🛞', t: 'タイヤグリップ', d: 'ハンドリングアップ。<br>遠心力に抗い急カーブに強くなる' },
    { id: 'siz', i: '🛡️', t: '車体拡張', d: '車体が巨大化。<br>当たり判定が広がり巻き込みやすくなる' },
    { id: 'def', i: '🛡️', t: '装甲強化', d: '被ダメージ5%軽減。<br>最大50%まで累積' },
    { id: 'heal', i: '❤️', t: 'HP回復', d: 'HPを50%回復する。' },
    { id: 'bls', i: '🔫', t: 'ブラスター装着', d: 'ブラスター装着。<br>前方に自動射撃開始', cond: st => st.blasterCount === 0 },
    { id: 'bpow', i: '⚡', t: 'ブラスター強化', d: 'ブラスターの攻撃力+1', cond: st => st.blasterCount > 0 },
    { id: 'bnum', i: '🔫', t: 'ブラスター増設', d: 'ブラスター+1門追加。<br>射撃範囲が横に広がる', cond: st => st.blasterCount > 0 && st.blasterCount < 3 },
];

// --- Distance & Economy ---
const DISTANCE_SCALE = 0.001;
const MILE_RATE = 10;
const GACHA_COST = 100;

const RARITY_WEIGHTS = [
    { rarity: 'C', weight: 50 },
    { rarity: 'R', weight: 30 },
    { rarity: 'E', weight: 15 },
    { rarity: 'L', weight: 5 },
];

const SCRAP_DUPE = { C: 5, R: 15, E: 50, L: 200 };
const SCRAP_PRICE = { C: 50, R: 150, E: 500, L: 1500 };

// --- Achievements ---
const ACHIEVEMENTS = [
    // Distance (50~500 miles, proportional to distance)
    { id: 'dist-1', type: 'dist', dist: 1, name: '最初の1キロ', icon: '🏁', desc: '1km走破', reward: 50 },
    { id: 'dist-3', type: 'dist', dist: 3, name: 'ウォームアップ', icon: '🔥', desc: '3km走破', reward: 80 },
    { id: 'dist-5', type: 'dist', dist: 5, name: 'ロードウォリアー', icon: '⚔️', desc: '5km走破', reward: 100 },
    { id: 'dist-10', type: 'dist', dist: 10, name: 'ハイウェイスター', icon: '⭐', desc: '10km走破', reward: 200 },
    { id: 'dist-25', type: 'dist', dist: 25, name: 'ネオンドリフター', icon: '💎', desc: '25km走破', reward: 300 },
    { id: 'dist-50', type: 'dist', dist: 50, name: 'サイバーファントム', icon: '👻', desc: '50km走破', reward: 400 },
    { id: 'dist-100', type: 'dist', dist: 100, name: 'グリッドの伝説', icon: '👑', desc: '100km走破', reward: 500 },
    { id: 'dist-200', type: 'dist', dist: 200, name: '永遠のランナー', icon: '∞', desc: '200km走破', reward: 800 },
    // Combat (30~200 miles)
    { id: 'kill-10', type: 'stat', stat: 'destroyedEnemies', val: 10, name: 'ファーストブラッド', icon: '🎯', desc: '1ランで敵10体撃破', reward: 30 },
    { id: 'kill-50', type: 'stat', stat: 'destroyedEnemies', val: 50, name: 'デストロイヤー', icon: '💀', desc: '1ランで敵50体撃破', reward: 100 },
    { id: 'kill-100', type: 'stat', stat: 'destroyedEnemies', val: 100, name: 'アナイアレイター', icon: '☠️', desc: '1ランで敵100体撃破', reward: 200 },
    // Dash (30~100 miles)
    { id: 'dash-5', type: 'stat', stat: 'dashCount', val: 5, name: 'スピード狂', icon: '💨', desc: '1ランでダッシュ5回', reward: 30 },
    { id: 'dash-20', type: 'stat', stat: 'dashCount', val: 20, name: 'ダッシュマスター', icon: '🌀', desc: '1ランでダッシュ20回', reward: 80 },
    // Jump (30~100 miles)
    { id: 'jump-3', type: 'stat', stat: 'jumpCount', val: 3, name: 'エアボーン', icon: '🦘', desc: '1ランでジャンプ3回', reward: 30 },
    { id: 'jump-10', type: 'stat', stat: 'jumpCount', val: 10, name: 'スカイライダー', icon: '🚀', desc: '1ランでジャンプ10回', reward: 80 },
    // Level (50~200 miles)
    { id: 'lv-5', type: 'stat', stat: 'lv', val: 5, name: '本気モード', icon: '🔰', desc: 'Lv5到達', reward: 50 },
    { id: 'lv-10', type: 'stat', stat: 'lv', val: 10, name: 'オーバークロック', icon: '⚡', desc: 'Lv10到達', reward: 150 },
    { id: 'lv-20', type: 'stat', stat: 'lv', val: 20, name: 'アンストッパブル', icon: '🔥', desc: 'Lv20到達', reward: 300 },
    // Challenge (100~500 miles)
    { id: 'nodmg-3', type: 'nodmg', dist: 3, name: 'アンタッチャブル', icon: '🛡️', desc: 'ノーダメージで3km', reward: 200 },
    { id: 'nodmg-10', type: 'nodmg', dist: 10, name: 'パーフェクトラン', icon: '💎', desc: 'ノーダメージで10km', reward: 500 },
];
