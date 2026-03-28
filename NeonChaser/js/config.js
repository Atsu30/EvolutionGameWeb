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
    jellyfish: { hp: 15, atk: 40, w: 2.8, exp: 70, speed: 0.4 },
    fish: { hp: 3, atk: 25, w: 2.0, exp: 35, speed: 1.2 },
};

const ROCKET_DEF = { hp: 4, atk: 30, w: 1.5, exp: 40 };
const ZIGZAG_DEF = { hp: 4, atk: 20, w: 2.5, exp: 30, zigFreq: 2, zigAmp: 12 };

const UPGRADES = [
    { id: 'spd', i: '⚡', t: 'エンジン強化', d: '最高速度アップ。<br>※カーブで遠心力に負けやすくなる' },
    { id: 'grp', i: '🛞', t: 'タイヤグリップ', d: 'ハンドリングアップ。<br>遠心力に抗い急カーブに強くなる' },
    { id: 'siz', i: '🛡️', t: '車体拡張', d: '車体が巨大化。<br>当たり判定が広がり巻き込みやすくなる' },
    { id: 'def', i: '🛡️', t: '装甲強化', d: '被ダメージ5%軽減。<br>最大50%まで累積' },
    { id: 'maxhp', i: '💖', t: '最大HP強化', d: '最大HPが+10増加する。' },
    { id: 'heal', i: '❤️', t: 'HP回復', d: 'HPを50%回復する。' },
    { id: 'jmp', i: '🦘', t: 'ジャンプ強化', d: 'ジャンプ力アップ。<br>より高く飛べるようになる' },
    { id: 'bls', i: '🔫', t: 'ブラスター装着', d: 'ブラスター装着。<br>前方に自動射撃開始', cond: st => st.blasterCount === 0 },
    { id: 'bpow', i: '⚡', t: '連射強化', d: 'ブラスターの発射速度アップ', cond: st => st.blasterCount > 0 },
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

// --- Boss Definitions ---
const BOSS_DEFS = [
    {
        name: 'ネオンヒドラ', hp: 120, coreReward: 1,
        colors: { body: 0xbe123c, emit: 0x9f1239, neon: 0xff0055 },
        bulletSpd: 70, bulletDmg: 15, contactDmg: 25,
        phases: [
            { pattern: 'straight', interval: 1.5 },
            { pattern: 'spread3', interval: 2.0 },
            { pattern: 'burst', interval: 2.0 },
        ],
    },
    {
        name: 'アビサルリヴァイアサン', hp: 250, coreReward: 2,
        colors: { body: 0x0e7490, emit: 0x155e75, neon: 0x06b6d4 },
        bulletSpd: 85, bulletDmg: 20, contactDmg: 35,
        phases: [
            { pattern: 'wave5', interval: 2.5 },
            { pattern: 'homing', interval: 2.0 },
            { pattern: 'rain', interval: 1.5 },
        ],
    },
    {
        name: 'インフェルノセンチネル', hp: 400, coreReward: 3,
        colors: { body: 0x991b1b, emit: 0x7f1d1d, neon: 0xef4444 },
        bulletSpd: 100, bulletDmg: 25, contactDmg: 45,
        phases: [
            { pattern: 'ring', interval: 2.0 },
            { pattern: 'sweep', interval: 3.0 },
            { pattern: 'chaos', interval: 1.0 },
        ],
    },
];

const BOSS_DASH_DMG = 20;
const BOSS_PHASE_THRESHOLDS = [0.66, 0.33]; // phase changes at these HP ratios

// --- Achievements ---
const ACHIEVEMENTS = [
    // ===== Distance =====
    { id: 'dist-1', type: 'dist', dist: 1, name: '最初の1キロ', icon: 'flag', desc: '1km走破', reward: 50 },
    { id: 'dist-3', type: 'dist', dist: 3, name: 'ウォームアップ', icon: 'flame', desc: '3km走破', reward: 80 },
    { id: 'dist-5', type: 'dist', dist: 5, name: 'ロードウォリアー', icon: 'swords', desc: '5km走破', reward: 100 },
    { id: 'dist-10', type: 'dist', dist: 10, name: 'ハイウェイスター', icon: 'star', desc: '10km走破', reward: 200 },
    { id: 'dist-25', type: 'dist', dist: 25, name: 'ネオンドリフター', icon: 'gem', desc: '25km走破', reward: 300 },
    { id: 'dist-50', type: 'dist', dist: 50, name: 'サイバーファントム', icon: 'ghost', desc: '50km走破', reward: 400 },
    { id: 'dist-100', type: 'dist', dist: 100, name: 'グリッドの伝説', icon: 'crown', desc: '100km走破', reward: 500 },
    { id: 'dist-200', type: 'dist', dist: 200, name: '永遠のランナー', icon: 'infinity', desc: '200km走破', reward: 800 },

    // ===== Single-run Combat =====
    { id: 'kill-10', type: 'stat', stat: 'destroyedEnemies', val: 10, name: 'ファーストブラッド', icon: 'crosshair', desc: '1ランで敵10体撃破', reward: 30 },
    { id: 'kill-50', type: 'stat', stat: 'destroyedEnemies', val: 50, name: 'デストロイヤー', icon: 'skull', desc: '1ランで敵50体撃破', reward: 100 },
    { id: 'kill-100', type: 'stat', stat: 'destroyedEnemies', val: 100, name: 'アナイアレイター', icon: 'bomb', desc: '1ランで敵100体撃破', reward: 200 },

    // ===== Dash / Jump =====
    { id: 'dash-5', type: 'stat', stat: 'dashCount', val: 5, name: 'スピード狂', icon: 'wind', desc: '1ランでダッシュ5回', reward: 30 },
    { id: 'dash-20', type: 'stat', stat: 'dashCount', val: 20, name: 'ダッシュマスター', icon: 'tornado', desc: '1ランでダッシュ20回', reward: 80 },
    { id: 'jump-3', type: 'stat', stat: 'jumpCount', val: 3, name: 'エアボーン', icon: 'arrow-up-from-line', desc: '1ランでジャンプ3回', reward: 30 },
    { id: 'jump-10', type: 'stat', stat: 'jumpCount', val: 10, name: 'スカイライダー', icon: 'rocket', desc: '1ランでジャンプ10回', reward: 80 },

    // ===== Level =====
    { id: 'lv-5', type: 'stat', stat: 'lv', val: 5, name: '本気モード', icon: 'shield', desc: 'Lv5到達', reward: 50 },
    { id: 'lv-10', type: 'stat', stat: 'lv', val: 10, name: 'オーバークロック', icon: 'zap', desc: 'Lv10到達', reward: 150 },
    { id: 'lv-20', type: 'stat', stat: 'lv', val: 20, name: 'アンストッパブル', icon: 'flame-kindling', desc: 'Lv20到達', reward: 300 },

    // ===== Challenge =====
    { id: 'nodmg-3', type: 'nodmg', dist: 3, name: 'アンタッチャブル', icon: 'shield-check', desc: 'ノーダメージで3km', reward: 200 },
    { id: 'nodmg-10', type: 'nodmg', dist: 10, name: 'パーフェクトラン', icon: 'diamond', desc: 'ノーダメージで10km', reward: 500 },

    // ===== Enemy Types (first kill) =====
    { id: 'ek-drone', type: 'enemyType', enemyName: 'drone', name: 'ドローンハンター', icon: 'bot', desc: '初めてドローンを撃破', reward: 20 },
    { id: 'ek-shard', type: 'enemyType', enemyName: 'shard', name: 'シャードブレイカー', icon: 'hexagon', desc: '初めてシャードを撃破', reward: 30 },
    { id: 'ek-sentinel', type: 'enemyType', enemyName: 'sentinel', name: 'センチネルスレイヤー', icon: 'castle', desc: '初めてセンチネルを撃破', reward: 50 },
    { id: 'ek-jellyfish', type: 'enemyType', enemyName: 'jellyfish', name: 'ジェリークラッシャー', icon: 'waves', desc: '初めてジェリーフィッシュを撃破', reward: 50 },
    { id: 'ek-fish', type: 'enemyType', enemyName: 'fish', name: 'フィッシュキャッチャー', icon: 'fish', desc: '初めてフィッシュを撃破', reward: 40 },
    { id: 'ek-rocket', type: 'enemyType', enemyName: 'rocket', name: 'ロケットバスター', icon: 'rocket', desc: '初めてロケットを撃破', reward: 60 },
    { id: 'ek-zigzag', type: 'enemyType', enemyName: 'zigzag', name: 'ジグザグハンター', icon: 'zap', desc: '初めてジグザグを撃破', reward: 60 },

    // ===== Cumulative Kills =====
    { id: 'ck-100', type: 'cumul', stat: 'totalKills', val: 100, name: 'ベテランパイロット', icon: 'medal', desc: '累計100体撃破', reward: 100 },
    { id: 'ck-500', type: 'cumul', stat: 'totalKills', val: 500, name: 'エースライダー', icon: 'award', desc: '累計500体撃破', reward: 200 },
    { id: 'ck-1000', type: 'cumul', stat: 'totalKills', val: 1000, name: 'キルマシン', icon: 'skull', desc: '累計1,000体撃破', reward: 400 },
    { id: 'ck-5000', type: 'cumul', stat: 'totalKills', val: 5000, name: 'エクスターミネーター', icon: 'siren', desc: '累計5,000体撃破', reward: 800 },
    { id: 'ck-10000', type: 'cumul', stat: 'totalKills', val: 10000, name: 'ジェノサイドマスター', icon: 'radiation', desc: '累計10,000体撃破', reward: 1500 },

    // ===== Play Count =====
    { id: 'run-1', type: 'cumul', stat: 'totalRuns', val: 1, name: 'ファーストライド', icon: 'play', desc: '初めてプレイ', reward: 30 },
    { id: 'run-10', type: 'cumul', stat: 'totalRuns', val: 10, name: 'リピーター', icon: 'repeat', desc: '10回プレイ', reward: 80 },
    { id: 'run-50', type: 'cumul', stat: 'totalRuns', val: 50, name: 'ハードコアライダー', icon: 'dumbbell', desc: '50回プレイ', reward: 200 },
    { id: 'run-100', type: 'cumul', stat: 'totalRuns', val: 100, name: '永久ループ', icon: 'infinity', desc: '100回プレイ', reward: 500 },

    // ===== Gacha =====
    { id: 'gacha-1', type: 'cumul', stat: 'gachaPulls', val: 1, name: '初ガチャ', icon: 'ticket', desc: '初めてガチャを引く', reward: 30 },
    { id: 'gacha-10', type: 'cumul', stat: 'gachaPulls', val: 10, name: 'ガチャ中毒', icon: 'dice-3', desc: 'ガチャ10回', reward: 80 },
    { id: 'gacha-50', type: 'cumul', stat: 'gachaPulls', val: 50, name: 'ガチャマスター', icon: 'dice-6', desc: 'ガチャ50回', reward: 200 },
    { id: 'gacha-legend', type: 'flag', stat: 'gotLegendary', name: 'レジェンダリー', icon: 'sparkles', desc: 'レジェンドアイテムを引く', reward: 300 },

    // ===== Shop =====
    { id: 'shop-1', type: 'cumul', stat: 'shopPurchases', val: 1, name: 'お買い物デビュー', icon: 'shopping-cart', desc: '初めてショップで購入', reward: 30 },
    { id: 'shop-5', type: 'cumul', stat: 'shopPurchases', val: 5, name: 'リピート顧客', icon: 'shopping-bag', desc: 'ショップで5回購入', reward: 80 },

    // ===== Customize =====
    { id: 'custom-first', type: 'flag', stat: 'customChanged', name: 'スタイルチェンジ', icon: 'palette', desc: '初めてカスタマイズ変更', reward: 30 },

    // ===== Collection =====
    { id: 'collect-5', type: 'collection', val: 5, name: 'コレクター', icon: 'package', desc: 'アイテム5種集める', reward: 80 },
    { id: 'collect-10', type: 'collection', val: 10, name: 'トレジャーハンター', icon: 'coins', desc: 'アイテム10種集める', reward: 150 },
    { id: 'collect-20', type: 'collection', val: 20, name: 'ミュージアムキュレーター', icon: 'library', desc: 'アイテム20種集める', reward: 300 },
    { id: 'collect-all', type: 'collectAll', name: 'コンプリート', icon: 'trophy', desc: '全アイテム収集', reward: 2000 },
];
