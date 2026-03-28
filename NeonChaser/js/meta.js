// --- Core Resource & Meta-Progression ---
const _CORES_KEY = 'cores-v1';
const _META_KEY = 'meta-v1';

function getCores() { return storageLoad(_CORES_KEY, 0); }
function addCores(amount) { const c = getCores() + Math.floor(amount); storageSave(_CORES_KEY, c); return c; }
function spendCores(amount) {
    const c = getCores();
    if (c < amount) return false;
    storageSave(_CORES_KEY, c - amount);
    return true;
}

const META_UPGRADES = [
    { id: 'meta-hp',    name: 'HP強化',         desc: '初期HP +10',       icon: 'heart',       maxLv: 5, costs: [1,2,3,4,5],  stat: 'hp',           perLv: 10 },
    { id: 'meta-maxhp', name: '最大HP強化',     desc: '最大HP +10',       icon: 'heart-pulse', maxLv: 5, costs: [1,2,3,4,5],  stat: 'maxHp',        perLv: 10 },
    { id: 'meta-spd',   name: 'エンジン強化',   desc: '初期最高速度 +5',  icon: 'gauge',       maxLv: 5, costs: [1,2,3,4,5],  stat: 'maxSpd',       perLv: 5 },
    { id: 'meta-steer', name: 'グリップ強化',   desc: 'ステアリング +3',  icon: 'disc',        maxLv: 5, costs: [1,1,2,2,3],  stat: 'steer',        perLv: 3 },
    { id: 'meta-def',   name: '装甲強化',       desc: '被ダメ -3%',       icon: 'shield',      maxLv: 5, costs: [2,2,3,3,4],  stat: 'def',          perLv: 0.03 },
    { id: 'meta-bls',   name: 'ブラスター起動', desc: '開始時ブラスター', icon: 'crosshair',   maxLv: 1, costs: [5],           stat: 'blasterCount', set: 1 },
    { id: 'meta-size',  name: '車体拡張',       desc: '初期サイズ +0.1',  icon: 'maximize',    maxLv: 3, costs: [2,3,4],       stat: 'size',         perLv: 0.1 },
];

function getMetaLevels() { return storageLoad(_META_KEY, {}); }
function _saveMetaLevels(obj) { storageSave(_META_KEY, obj); }

function purchaseMetaUpgrade(id) {
    const def = META_UPGRADES.find(u => u.id === id);
    if (!def) return false;
    const levels = getMetaLevels();
    const curLv = levels[id] || 0;
    if (curLv >= def.maxLv) return false;
    const cost = def.costs[curLv];
    if (!spendCores(cost)) return false;
    levels[id] = curLv + 1;
    _saveMetaLevels(levels);
    return true;
}

function applyMetaUpgrades() {
    const st = game.st;
    const levels = getMetaLevels();
    for (const u of META_UPGRADES) {
        const lv = levels[u.id] || 0;
        if (lv <= 0) continue;
        if (u.set !== undefined) {
            st[u.stat] = u.set;
        } else {
            st[u.stat] = (st[u.stat] || 0) + u.perLv * lv;
        }
    }
    // Sync hp with maxHp if boosted
    if (levels['meta-hp']) st.hp = st.maxHp;
}
