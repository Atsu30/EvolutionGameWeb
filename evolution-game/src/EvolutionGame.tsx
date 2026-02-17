import React, { useState, useEffect, useRef } from 'react';
import {
  Dna,
  RotateCcw,
  ArrowLeft,
  Skull,
  HelpCircle,
  Fish,
  Dog,
  User,
  Bird,
  Bug,
  Ghost,
  Cat,
  Snowflake,
  Shell,
  Star,
  Zap,
  Clock,
  BookOpen,
  Shuffle,
  MousePointerClick,
  Hourglass
} from 'lucide-react';

// --- 型定義 ---

type OrganismType =
  | 'start'
  | 'bacteria'
  | 'jellyfish'
  | 'insect'
  | 'fish'
  | 'amphibian'
  | 'reptile'
  | 'bird'
  | 'mammal'
  | 'whale'
  | 'human'
  | 'dog'
  | 'cat'
  | 'bat'
  | 'horse'
  | 'eagle'
  | 'penguin'
  | 'octopus'
  | 'snail'
  | 'starfish'
  | 'platypus'
  | 'axolotl'
  | 'panda';

interface EvolutionNode {
  id: string;
  name: string;
  type: OrganismType;
  era: string;
  description: string;
  detail?: string;
  question: string;
  choices: {
    label: string;
    nextId: string;
  }[];
  isTargetCandidate?: boolean;
}

interface GameData {
  discoveredIds: string[];
  clearedTargets: string[]; // クリア済みのターゲットID
}

// --- 画像のURL設定 ---
// CUSTOM_IMAGESに設定がない場合は、自動的にpublic/icons/{type}.pngを使用します
const CUSTOM_IMAGES: Partial<Record<OrganismType, string>> = {
  // カスタム画像を使用したい場合はここに設定
  // 'human': 'https://example.com/custom-human.png',
};

// --- 進化データ ---
const EVOLUTION_TREE: Record<string, EvolutionNode> = {
  'root': {
    id: 'root',
    name: '原始生命',
    type: 'start',
    era: '約40億年前',
    description: '海の中に生まれた最初の生命。',
    question: '生存戦略の第一歩は？',
    choices: [
      { label: '細胞同士で協力', nextId: 'multicellular' },
      { label: '単独で分裂', nextId: 'bacteria' },
    ]
  },
  'bacteria': { id: 'bacteria', name: 'バクテリア', type: 'bacteria', era: '約35億年前', description: '単純だが最強の生存者。しかし複雑な進化はここで止まる。', question: '', choices: [] },

  'multicellular': {
    id: 'multicellular',
    name: '多細胞生物',
    type: 'jellyfish',
    era: '約10億年前',
    description: '役割分担を始めた細胞の集合体。',
    question: '体を支える「軸」を持つか？',
    choices: [
      { label: '背骨を持たない（無脊椎）', nextId: 'invertebrate_path' },
      { label: '背骨を持つ（脊椎）', nextId: 'vertebrate' },
    ]
  },

  // --- 無脊椎動物ルート ---
  'invertebrate_path': {
    id: 'invertebrate_path',
    name: '無脊椎動物の祖',
    type: 'jellyfish',
    era: '約6億年前',
    description: '背骨を持たない多様な生命群。',
    question: '体の構造と特徴は？',
    choices: [
      { label: '硬い殻と関節', nextId: 'arthropod' },
      { label: '柔らかい体と筋肉質の足', nextId: 'mollusc_root' },
      { label: '五放射の星形', nextId: 'echinoderm' },
      { label: '漂う傘のような体', nextId: 'jellyfish_end' },
    ]
  },
  'arthropod': {
    id: 'arthropod',
    name: '節足動物',
    type: 'insect',
    era: '約5億年前',
    description: '硬い殻を持つグループ。',
    question: '生息域は？',
    choices: [
      { label: '陸で羽ばたく', nextId: 'insect_end' },
      { label: '海で這う', nextId: 'crab_end' },
    ]
  },
  'insect_end': { id: 'insect_end', name: '昆虫', type: 'insect', era: '約4億年前', description: '史上初めて空を飛んだ動物たち。', question: '', choices: [] },
  'crab_end': { id: 'crab_end', name: '甲殻類', type: 'insect', era: '約5億年前', description: 'カニやエビの仲間。', question: '', choices: [] },
  'jellyfish_end': { id: 'jellyfish_end', name: 'クラゲ', type: 'jellyfish', era: '約5億年前', description: '脳も心臓もないが、優雅に泳ぐ。', question: '', choices: [] },

  'echinoderm': {
    id: 'echinoderm',
    name: '棘皮動物',
    type: 'starfish',
    era: '約5億年前',
    description: '独特な水管系を持つ海の星。',
    question: 'その姿は？',
    choices: [
      { label: '星形で再生', nextId: 'starfish' },
      { label: 'トゲだらけの球体', nextId: 'urchin_end' },
    ]
  },
  'starfish': {
    id: 'starfish',
    name: 'ヒトデ',
    type: 'starfish',
    era: '現代',
    description: '切れても再生する星形の捕食者。',
    detail: '脳も心臓も持ちませんが、驚異的な再生能力を誇ります。体を星型に広げることで全方位の環境を感じ取り、管足を使って器用に移動・捕食を行う、進化の不思議を体現した生物です。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'urchin_end': { id: 'urchin_end', name: 'ウニ', type: 'starfish', era: '現代', description: '美味しいがターゲットではない。', question: '', choices: [] },

  'mollusc_root': {
    id: 'mollusc_root',
    name: '軟体動物',
    type: 'snail',
    era: '約5億年前',
    description: '貝やタコの仲間。',
    question: '進化の方向性は？',
    choices: [
      { label: '殻を捨て脳を発達', nextId: 'cephalopod' },
      { label: '螺旋状の殻にこもる', nextId: 'snail' },
    ]
  },
  'snail': {
    id: 'snail',
    name: 'カタツムリ',
    type: 'snail',
    era: '約3億年前',
    description: '陸に上がった貝の仲間。ゆっくり進む。',
    detail: '海から陸へ上がった貝の仲間です。エラではなく「肺」を持ち、殻の中に内臓を収めています。乾燥を防ぐために粘液を出し、湿った環境に適応することで、陸上での生活圏を広げました。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },

  'cephalopod': {
    id: 'cephalopod',
    name: '頭足類',
    type: 'octopus',
    era: '約4億8000万年前',
    description: '海で最も賢い無脊椎動物への道。',
    question: 'あなたの能力は？',
    choices: [
      { label: '8本の足と知能', nextId: 'octopus' },
      { label: '10本の足と巨大化', nextId: 'squid_end' },
    ]
  },
  'octopus': {
    id: 'octopus',
    name: 'タコ',
    type: 'octopus',
    era: '現代',
    description: '心臓を3つ持ち、道具を使う海の賢者。',
    detail: '9つの脳と3つの心臓を持つ、無脊椎動物の知性の頂点です。皮膚の色や質感を瞬時に変える擬態能力を持ち、瓶の蓋を開けるなど高度な問題解決能力も備えています。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'squid_end': { id: 'squid_end', name: 'イカ', type: 'octopus', era: '現代', description: 'ジェット推進で泳ぐハンター。', question: '', choices: [] },

  // --- 脊椎動物ルート ---
  'vertebrate': {
    id: 'vertebrate',
    name: '魚類',
    type: 'fish',
    era: '約5億年前',
    description: '背骨を獲得し、遊泳能力を高めた。',
    question: '次なる世界へ？',
    choices: [
      { label: 'ヒレを足に変え陸へ', nextId: 'amphibian' },
      { label: '海を極める', nextId: 'ancient_fish' },
    ]
  },
  'ancient_fish': { id: 'ancient_fish', name: 'シーラカンス', type: 'fish', era: '約4億年前', description: '深海で生き続ける生きた化石。', question: '', choices: [] },

  'amphibian': {
    id: 'amphibian',
    name: '両生類',
    type: 'amphibian',
    era: '約3億7000万年前',
    description: '脊椎動物として初めて陸に上がった。',
    question: '大人へのなり方は？',
    choices: [
      { label: '変態して陸へ', nextId: 'amniotes' },
      { label: '子供の姿のまま', nextId: 'neoteny' },
    ]
  },
  'neoteny': {
    id: 'neoteny',
    name: '幼形成熟個体',
    type: 'axolotl',
    era: '現代',
    description: 'エラ呼吸のまま大人になる選択。',
    question: '',
    choices: [
      { label: '再生能力を持つ', nextId: 'axolotl' }
    ]
  },
  'axolotl': {
    id: 'axolotl',
    name: 'ウーパールーパー',
    type: 'axolotl',
    era: '現代',
    description: '驚異的な再生能力を持つ、永遠の子供。',
    detail: '大人になってもエラ呼吸など子供の特徴を残したまま成熟する「ネオテニー（幼形成熟）」の代表格です。手足だけでなく、心臓や脳の一部さえも再生できる驚異的な再生能力を持っています。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },

  'amniotes': {
    id: 'amniotes',
    name: '有羊膜類',
    type: 'reptile',
    era: '約3億2000万年前',
    description: '殻のある卵を獲得し、水辺を離れられるようになった。',
    question: '体温調節と皮膚は？',
    choices: [
      { label: '鱗と変温（爬虫類）', nextId: 'reptile_path' },
      { label: '毛・恒温（哺乳類へ）', nextId: 'warm_blood' },
    ]
  },
  'reptile_path': { id: 'reptile_path', name: '爬虫類', type: 'reptile', era: '約3億年前', description: '乾燥に強い皮膚を持ち、地上を支配した。', question: '', choices: [{ label: '巨大化', nextId: 'dino_end' }] },
  'dino_end': { id: 'dino_end', name: '恐竜', type: 'reptile', era: '約2億3000万年前', description: 'かつて地球を支配した覇者。', question: '', choices: [] },

  'warm_blood': {
    id: 'warm_blood',
    name: '単弓類',
    type: 'mammal',
    era: '約3億年前',
    description: '哺乳類の祖先。自ら熱を生み出す能力を獲得し始めた。',
    question: '繁殖スタイルは？',
    choices: [
      { label: '硬い卵・翼（鳥類）', nextId: 'bird_ancestor' },
      { label: '胎生・母乳（哺乳類）', nextId: 'mammal_base' },
    ]
  },

  // --- 鳥類 ---
  'bird_ancestor': {
    id: 'bird_ancestor',
    name: '鳥類',
    type: 'bird',
    era: '約1億5000万年前',
    description: '恐竜の一部が翼を持ち、空へと進出した。',
    question: '適応する環境は？',
    choices: [
      { label: '天空', nextId: 'eagle' },
      { label: '極寒の海', nextId: 'penguin' },
    ]
  },
  'eagle': {
    id: 'eagle',
    name: 'ワシ',
    type: 'eagle',
    era: '現代',
    description: '天空の王者。',
    detail: '数キロ先の獲物を見つける驚異的な視力を持つ、食物連鎖の頂点です。上昇気流を捉えて滑空し、鋭い爪で確実に獲物を捕らえる、空への適応を極めたハンターです。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'penguin': {
    id: 'penguin',
    name: 'ペンギン',
    type: 'penguin',
    era: '約6000万年前',
    description: '空を捨て海を選んだ鳥。',
    detail: '空を飛ぶことをやめ、海中を飛ぶように泳ぐ道を選んだ鳥です。分厚い脂肪と密な羽毛、そして骨密度を高めることで、極寒の海での潜水に適応しました。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },

  // --- 哺乳類 (特殊分岐含む) ---
  'mammal_base': {
    id: 'mammal_base',
    name: '初期哺乳類',
    type: 'mammal',
    era: '約2億年前',
    description: '恐竜の影で夜行性の小さな生き物として生きていた。',
    question: '出産の形式は？',
    choices: [
      { label: 'まだ卵を産む', nextId: 'monotreme' },
      { label: 'お腹で育てる', nextId: 'mammal_real' },
    ]
  },
  'monotreme': {
    id: 'monotreme',
    name: '単孔類',
    type: 'platypus',
    era: '約1億年前',
    description: '哺乳類でありながら卵を産む、原始的な特徴を残すグループ。',
    question: '特徴的な器官は？',
    choices: [
      { label: 'クチバシと毒爪', nextId: 'platypus' }
    ]
  },
  'platypus': {
    id: 'platypus',
    name: 'カモノハシ',
    type: 'platypus',
    era: '現代',
    description: '卵を産み、母乳で育て、電気を感じるクチバシを持つ不思議な生物。',
    detail: '哺乳類なのに卵を産み、クチバシで生体電流を感じて獲物を探す、進化のミッシングリンクのような生物です。オスは後ろ足に毒針を持っており、非常にユニークな特徴を多数備えています。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },

  'mammal_real': {
    id: 'mammal_real',
    name: '真獣類',
    type: 'mammal',
    era: '約1億年前',
    description: '胎盤を持ち、子供を大きく育ててから産む。恐竜絶滅後に爆発的に多様化した。',
    question: 'どの能力に特化する？',
    choices: [
      { label: '海へ戻る', nextId: 'whale' },
      { label: '高度な知能', nextId: 'human' },
      { label: '肉食（狩り）', nextId: 'carnivore_path' },
      { label: '翼手（空）', nextId: 'bat' },
      { label: '蹄（草原）', nextId: 'horse' },
    ]
  },

  'carnivore_path': {
    id: 'carnivore_path',
    name: '食肉目',
    type: 'dog',
    era: '約6000万年前',
    description: '狩りのスペシャリスト。',
    question: '食性とスタイルは？',
    choices: [
      { label: '群れで狩る', nextId: 'dog' },
      { label: '単独で忍び寄る', nextId: 'cat' },
      { label: '肉食で竹を食べる', nextId: 'panda' },
    ]
  },

  'whale': {
    id: 'whale',
    name: 'クジラ',
    type: 'whale',
    era: '約5000万年前',
    description: '海に戻った哺乳類。',
    detail: 'かつて陸を歩いていた祖先が、再び海へと戻り適応した姿です。音波（エコーロケーション）を使って交信し、プランクトンから巨大イカまで捕食する、地球史上最大の動物たちです。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'human': {
    id: 'human',
    name: '人間',
    type: 'human',
    era: '約20万年前',
    description: '文明を持つ霊長類。',
    detail: '直立二足歩行により手を自由に使い、巨大化した脳で複雑な道具と言語を操ります。高い社会性と協力関係を築くことで、地球上のあらゆる環境に適応し、文明を築き上げました。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'dog': {
    id: 'dog',
    name: 'イヌ',
    type: 'dog',
    era: '約1万5000年前',
    description: '人類の最良の友。',
    detail: 'オオカミから分かれ、人間と共生する道を選んだ動物です。優れた嗅覚と聴覚に加え、人間の表情を読み取る高い社会性を獲得しました。品種改良により多様な姿を持つのも特徴です。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'cat': {
    id: 'cat',
    name: 'ネコ',
    type: 'cat',
    era: '約1万年前',
    description: '自由気ままなハンター。',
    detail: 'しなやかな筋肉、優れた平衡感覚、暗闇を見通す目を持つ、究極の小型ハンターです。人間と暮らしながらも野生の本能を色濃く残しており、その柔軟性と敏捷性は驚異的です。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'bat': {
    id: 'bat',
    name: 'コウモリ',
    type: 'bat',
    era: '約5000万年前',
    description: '超音波を使う空飛ぶ哺乳類。',
    detail: '哺乳類で唯一、自力飛行能力を獲得しました。指の間に張った皮膜で飛び、超音波を反響させて周囲を把握する「エコーロケーション」により、完全な暗闇でも自在に飛び回ることができます。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'horse': {
    id: 'horse',
    name: 'ウマ',
    type: 'horse',
    era: '約5000万年前',
    description: '草原を駆けるアスリート。',
    detail: '草原を高速で駆け抜けるため、指を中指一本（蹄）にまで減らし、脚を極限まで軽量化した「走りの芸術品」です。立ったまま眠ることができるなど、草食動物としての逃走能力に特化しています。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
  'panda': {
    id: 'panda',
    name: 'パンダ',
    type: 'panda',
    era: '現代',
    description: '熊の仲間だが、平和に竹を食べる白黒の珍獣。',
    detail: '肉食動物の体構造（短い腸など）を持ちながら、竹を主食にするという特異な進化を遂げました。手首の骨が変化した「第6の指」を使い、器用に竹を掴んで食べます。',
    question: '',
    choices: [],
    isTargetCandidate: true
  },
};

// --- ヘルパー関数 ---

const getTargetCandidates = () => Object.values(EVOLUTION_TREE).filter(n => n.isTargetCandidate);

const getRandomTarget = () => {
  const candidates = getTargetCandidates();
  return candidates[Math.floor(Math.random() * candidates.length)];
};

// --- アイコンマッピング ---

const IconMapper = ({ type, size = 24, className = "" }: { type: OrganismType, size?: number, className?: string }) => {
  const [imageError, setImageError] = useState(false);

  // カスタム画像がある場合はカスタム画像を表示
  if (type in CUSTOM_IMAGES && CUSTOM_IMAGES[type]) {
    return (
      <img
        src={CUSTOM_IMAGES[type]}
        alt={type}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // 画像のロードエラーが発生した場合はフォールバックアイコンを表示
  if (imageError) {
    switch (type) {
      case 'start': return <Dna size={size} className={className} />;
      case 'bacteria': return <Ghost size={size} className={className} />;
      case 'jellyfish': return <div style={{ fontSize: size }} className={className}>🪼</div>;
      case 'insect': return <Bug size={size} className={className} />;
      case 'fish': return <Fish size={size} className={className} />;
      case 'amphibian': return <div style={{ fontSize: size }} className={className}>🐸</div>;
      case 'reptile': return <div style={{ fontSize: size }} className={className}>🦎</div>;
      case 'bird': return <Bird size={size} className={className} />;
      case 'mammal': return <div style={{ fontSize: size }} className={className}>🐀</div>;
      case 'whale': return <div style={{ fontSize: size }} className={className}>🐋</div>;
      case 'human': return <User size={size} className={className} />;
      case 'dog': return <Dog size={size} className={className} />;
      case 'cat': return <Cat size={size} className={className} />;
      case 'bat': return <div style={{ fontSize: size }} className={className}>🦇</div>;
      case 'horse': return <div style={{ fontSize: size }} className={className}>🐎</div>;
      case 'eagle': return <div style={{ fontSize: size }} className={className}>🦅</div>;
      case 'penguin': return <Snowflake size={size} className={className} />;
      case 'octopus': return <div style={{ fontSize: size }} className={className}>🐙</div>;
      case 'snail': return <Shell size={size} className={className} />;
      case 'starfish': return <Star size={size} className={className} />;
      case 'platypus': return <Zap size={size} className={className} />;
      case 'axolotl': return <div style={{ fontSize: size }} className={className}>🦎</div>;
      case 'panda': return <div style={{ fontSize: size }} className={className}>🐼</div>;
      default: return <HelpCircle size={size} className={className} />;
    }
  }

  // public/icons/から画像を読み込む（Viteのベースパスに対応）
  const baseUrl = import.meta.env.BASE_URL || '/';
  const iconPath = `${baseUrl}icons/${type}.png`;
  
  return (
    <img
      src={iconPath}
      alt={type}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImageError(true)}
    />
  );
};

// --- 曲線描画用コンポーネント ---
const ConnectionLines = React.memo(({ count, startX = 50 }: { count: number, startX?: number }) => {
  if (count === 0) return null;
  const paths = [];
  const startY = 0;
  const endY = 100;

  for (let i = 0; i < count; i++) {
    const endX = (i + 0.5) * (100 / count);
    const cp1y = 50;
    const cp2y = 50;

    paths.push(
      <path
        key={i}
        d={`M ${startX} ${startY} C ${startX} ${startY + cp1y}, ${endX} ${endY - cp2y}, ${endX} ${endY}`}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="opacity-50"
      />
    );
  }

  return (
    <svg className="absolute top-0 left-0 w-full h-16 -z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
          <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {paths}
    </svg>
  );
});

// --- メモ化された背景コンポーネント ---
const Background = React.memo(() => {
  const particles = React.useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 4 + 1}px`,
    duration: `${Math.random() * 5 + 3}s`,
    delay: `${Math.random() * 2}s`
  })), []);

  const bubbles = React.useMemo(() => [...Array(15)].map((_, i) => ({
    id: i,
    bottom: `-${Math.random() * 20 + 5}px`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 20 + 5}px`,
    duration: `${Math.random() * 10 + 15}s`,
    delay: `${Math.random() * 10}s`
  })), []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-black">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-gradient-to-b from-cyan-500/10 to-transparent rotate-12 blur-3xl transform-gpu" />
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[150%] h-full bg-gradient-to-b from-blue-400/5 to-transparent -rotate-12 blur-3xl transform-gpu" />

      <div className="absolute w-full h-full">
        {particles.map((p) => (
          <div
            key={`p-${p.id}`}
            className="absolute bg-cyan-400 rounded-full opacity-20 animate-pulse"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay
            }}
          />
        ))}
      </div>

      <div className="absolute w-full h-full">
        {bubbles.map((b) => (
          <div
            key={`b-${b.id}`}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-rise-up"
            style={{
              bottom: b.bottom,
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: b.duration,
              animationDelay: b.delay
            }}
          />
        ))}
      </div>
    </div>
  );
});


// --- メインコンポーネント ---

export default function EvolutionGame() {
  const [target, setTarget] = useState<EvolutionNode | null>(null);
  const [history, setHistory] = useState<EvolutionNode[]>([]);
  const [currentNode, setCurrentNode] = useState<EvolutionNode>(EVOLUTION_TREE['root']);
  const [status, setStatus] = useState<'mode_select' | 'target_select' | 'collection' | 'prologue' | 'playing' | 'won' | 'lost' | 'time_over'>('mode_select');
  const scrollRef = useRef<HTMLDivElement>(null);

  const TIME_LIMIT = 20;
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameData, setGameData] = useState<GameData>({ discoveredIds: [], clearedTargets: [] });

  // 初期化：ローカルストレージからロード
  useEffect(() => {
    const saved = localStorage.getItem('evolution_game_data_v3');
    if (saved) {
      setGameData(JSON.parse(saved));
    } else {
      setGameData({ discoveredIds: ['root'], clearedTargets: [] });
    }
  }, []);

  // データ保存 (LocalStorage)
  const saveGameData = (newData: GameData) => {
    setGameData(newData);
    localStorage.setItem('evolution_game_data_v3', JSON.stringify(newData));
  };

  // 新しいノード発見時の処理
  const handleDiscover = (nodeId: string) => {
    if (!gameData.discoveredIds.includes(nodeId)) {
      const newDiscovered = [...gameData.discoveredIds, nodeId];
      saveGameData({ ...gameData, discoveredIds: newDiscovered });
    }
  };

  // タイマー処理
  useEffect(() => {
    let interval: number;
    if (status === 'playing') {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            clearInterval(interval);
            setStatus('time_over');
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status]);

  // ノードが変わるたびにタイマーリセット
  useEffect(() => {
    if (status === 'playing') {
      setTimeLeft(TIME_LIMIT);
    }
  }, [currentNode, status]);


  // 共通開始処理
  const initGame = (t: EvolutionNode) => {
    setTarget(t);
    setHistory([EVOLUTION_TREE['root']]);
    setCurrentNode(EVOLUTION_TREE['root']);
    setTimeLeft(TIME_LIMIT);
    handleDiscover('root');
    setStatus('prologue'); // プロローグへ
  };

  const startRandomGame = () => initGame(getRandomTarget());
  const startGameWithTarget = (selectedTarget: EvolutionNode) => initGame(selectedTarget);
  const goToTargetSelect = () => setStatus('target_select');
  const goToCollection = () => setStatus('collection');
  const startPlaying = () => setStatus('playing'); // プロローグ完了

  const handleChoice = (nextId: string) => {
    const nextNode = EVOLUTION_TREE[nextId];
    setHistory(prev => [...prev, nextNode]);
    setCurrentNode(nextNode);
    handleDiscover(nextId);

    if (nextNode.id === target?.id) {
      // 勝利：クリア済みフラグ追加
      if (!gameData.clearedTargets.includes(target.id)) {
        saveGameData({
          ...gameData,
          discoveredIds: Array.from(new Set([...gameData.discoveredIds, nextId])),
          clearedTargets: [...gameData.clearedTargets, target.id]
        });
      }
      setStatus('won');
    } else if (nextNode.choices.length === 0) {
      setStatus('lost');
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrentNode(newHistory[newHistory.length - 1]);
    setStatus('playing');
    setTimeLeft(TIME_LIMIT); // Undoしたら時間もリセット
  };

  const resetGame = () => {
    setStatus('mode_select');
    setTarget(null);
    setHistory([]);
    setTimeLeft(TIME_LIMIT);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [history, currentNode]);

  // タイマーゲージの色判定
  const getTimerColor = (time: number) => {
    if (time > 5) return 'bg-green-500';
    if (time > 2) return 'bg-yellow-500';
    return 'bg-red-500 animate-pulse';
  };

  return (
    <div className="relative h-screen text-white font-sans flex flex-col overflow-hidden">
      <Background />

      {/* --- プロローグ画面 --- */}
      {status === 'prologue' && target && (
        <div
          className="z-20 w-full h-full flex flex-col items-center justify-center p-6 animate-fade-in cursor-pointer"
          onClick={startPlaying}
        >
          <div className="relative flex flex-col items-center justify-center h-full max-w-md mx-auto">

            {/* 思考の吹き出しエリア */}
            <div className="relative flex flex-col items-center mb-8">

              {/* 思考の泡（小） */}
              <div
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 rounded-full opacity-0 animate-pop-in"
                style={{ animationDelay: '0.5s', animationFillMode: 'forwards', transform: 'translateX(-20px)' }}
              />
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/90 rounded-full opacity-0 animate-pop-in"
                style={{ animationDelay: '0.8s', animationFillMode: 'forwards', transform: 'translateX(10px)' }}
              />

              {/* メインの吹き出し */}
              <div
                className="relative bg-white/95 text-slate-900 p-8 rounded-[40%] shadow-[0_0_50px_rgba(34,211,238,0.6)] flex flex-col items-center justify-center min-w-[280px] min-h-[200px] opacity-0 animate-pop-in"
                style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}
              >
                {/* アイコン */}
                <div className="mb-4 p-4 bg-slate-50 rounded-full border-4 border-cyan-100 shadow-inner animate-blob-shape">
                  <IconMapper type={target.type} size={64} className="text-slate-800" />
                </div>

                {/* セリフ */}
                <p className="text-xl font-bold text-slate-800 text-center leading-relaxed font-sans">
                  <span className="text-2xl text-cyan-600 block mb-1">{target.name}</span>
                  になりたいなぁ...
                </p>
              </div>
            </div>

            {/* 原始生命（自分）- 細胞のような形 */}
            <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-900 to-slate-900 border-4 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.5)] flex items-center justify-center animate-blob-shape">
              <IconMapper type="start" size={48} className="text-cyan-200" />
            </div>

            {/* ガイド */}
            <p className="absolute bottom-10 text-sm text-slate-400 animate-pulse flex items-center gap-2">
              <MousePointerClick size={16} /> 画面をタップして進化を始める
            </p>
          </div>
        </div>
      )}

      {/* --- 図鑑画面 --- */}
      {status === 'collection' && (() => {
        const allNodes = Object.values(EVOLUTION_TREE);
        const discoveredCount = allNodes.filter(n => gameData.discoveredIds.includes(n.id)).length;
        const completionRate = Math.round((discoveredCount / allNodes.length) * 100);

        return (
          <div className="z-10 w-full h-full flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-6xl bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl animate-fade-in my-8 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setStatus('mode_select')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} /> TOP
                </button>
                <div className="flex flex-col items-end">
                  <h2 className="text-2xl font-bold text-cyan-200 flex items-center gap-2"><BookOpen size={24} /> 系統樹図鑑</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400">収集率: <span className="text-white font-mono text-lg">{completionRate}%</span></div>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {allNodes.map(node => {
                    const isDiscovered = gameData.discoveredIds.includes(node.id);
                    return (
                      <div key={node.id} className={`relative flex flex-col items-center p-3 rounded-lg border ${isDiscovered ? 'bg-slate-800/60 border-slate-600' : 'bg-slate-900/80 border-slate-800'}`}>
                        <div className={`mb-2 p-2 rounded-full animate-blob-shape ${isDiscovered ? 'bg-slate-700/50' : 'bg-black/50'}`}>
                          {isDiscovered ? (
                            <IconMapper type={node.type} size={24} className="text-cyan-200" />
                          ) : (
                            <HelpCircle size={24} className="text-slate-700" />
                          )}
                        </div>
                        <span className={`text-xs text-center font-bold ${isDiscovered ? 'text-white' : 'text-slate-600'}`}>
                          {isDiscovered ? node.name : '???'}
                        </span>
                        {isDiscovered && node.isTargetCandidate && gameData.clearedTargets.includes(node.id) && (
                          <div className="absolute top-2 right-2 text-yellow-400"><Star size={10} fill="currentColor" /></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- モード選択画面 --- */}
      {status === 'mode_select' && (
        <div className="z-10 w-full h-full flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-4xl w-full bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl animate-fade-in my-8">
            <div className="mb-4 flex justify-center">
              <Dna size={64} className="text-cyan-300 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-400">
              Evolution Game
            </h1>
            <p className="text-blue-200 mb-10 text-lg tracking-widest">何に進化しようかな</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <button onClick={startRandomGame} className="group p-6 bg-slate-800/50 hover:bg-cyan-900/40 border border-slate-600 hover:border-cyan-400 rounded-xl transition-all hover:-translate-y-1 flex flex-col items-center gap-3">
                <Shuffle size={32} className="text-slate-300 group-hover:text-cyan-200" />
                <div>
                  <h3 className="text-lg font-bold">ランダムモード</h3>
                </div>
              </button>

              <button onClick={goToTargetSelect} className="group p-6 bg-slate-800/50 hover:bg-cyan-900/40 border border-slate-600 hover:border-cyan-400 rounded-xl transition-all hover:-translate-y-1 flex flex-col items-center gap-3">
                <MousePointerClick size={32} className="text-slate-300 group-hover:text-cyan-200" />
                <div>
                  <h3 className="text-lg font-bold">生物選択モード</h3>
                </div>
              </button>

              <button onClick={goToCollection} className="group p-6 bg-slate-800/50 hover:bg-yellow-900/20 border border-slate-600 hover:border-yellow-400 rounded-xl transition-all hover:-translate-y-1 flex flex-col items-center gap-3">
                <BookOpen size={32} className="text-slate-300 group-hover:text-yellow-200" />
                <div>
                  <h3 className="text-lg font-bold">系統樹図鑑</h3>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 生物選択画面 --- */}
      {status === 'target_select' && (() => {
        const candidates = getTargetCandidates();
        return (
          <div className="z-10 w-full h-full flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-6xl w-full bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-start mb-4">
                <button onClick={() => setStatus('mode_select')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} /> 戻る
                </button>
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-wider text-white">Target Selection</h2>
              <p className="text-blue-200 mb-6 text-sm">目指す進化の頂点を選択してください</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {candidates.map((candidate) => {
                  const isCleared = gameData.clearedTargets.includes(candidate.id);
                  return (
                    <button
                      key={candidate.id}
                      onClick={() => startGameWithTarget(candidate)}
                      className="group relative flex flex-col items-center p-4 bg-slate-800/50 hover:bg-cyan-900/40 border border-slate-600 hover:border-cyan-400 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:-translate-y-1"
                    >
                      {isCleared && <div className="absolute top-2 right-2 text-yellow-400"><Star size={12} fill="currentColor" /></div>}
                      <div className="mb-3 p-3 rounded-full bg-slate-700/50 group-hover:bg-cyan-500/20 transition-colors animate-blob-shape">
                        <IconMapper type={candidate.type} size={28} className="text-slate-300 group-hover:text-cyan-200" />
                      </div>
                      <span className="font-bold text-xs text-slate-200 group-hover:text-white text-center">{candidate.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- ゲームプレイ画面 --- */}
      {(status === 'playing' || status === 'won' || status === 'lost' || status === 'time_over') && (
        <>
          <header className="z-50 flex-none bg-black/20 backdrop-blur-md border-b border-white/5 p-4">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-blue-300 uppercase tracking-widest">Goal</span>
                  <div className="flex items-center gap-2 text-lg font-bold text-cyan-100">
                    {target && <IconMapper type={target.type} size={20} className="text-yellow-400" />}
                    {target?.name}
                  </div>
                </div>
              </div>

              {/* タイマー表示 */}
              <div className="flex items-center gap-4 flex-1 justify-end max-w-xs">
                {status === 'playing' && (
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                      <span>Life Limit</span>
                      <span className={`${timeLeft <= 3 ? 'text-red-400 font-bold' : ''}`}>{Math.ceil(timeLeft)}s</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-100 ease-linear ${getTimerColor(timeLeft)}`}
                        style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {(status === 'won' || status === 'lost' || status === 'time_over') && (
                  <button onClick={resetGame} className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-slate-300 transition-colors">TOP</button>
                )}
              </div>
            </div>
          </header>

          <main className="z-10 flex-grow flex flex-col items-center p-4 pb-32 overflow-y-auto scrollbar-hide">
            <div className="max-w-3xl w-full space-y-0 flex flex-col items-center">

              {history.map((node, index) => {
                if (index === 0) {
                  return (
                    <div key={node.id} className="relative flex flex-col items-center animate-fade-in-up z-10 w-full mb-0">
                      <div className={`relative z-10 w-16 h-16 rounded-full bg-slate-800/80 border border-slate-500 flex items-center justify-center shadow-lg animate-blob-shape`}>
                        <IconMapper type={node.type} size={28} className="text-slate-200" />
                      </div>
                      <div className="mt-2 text-sm text-slate-300 font-medium">{node.name}</div>
                      <div className="text-[10px] text-cyan-500/80 font-mono tracking-wider">{node.era}</div>
                      <div className="w-0.5 h-8 bg-gradient-to-b from-slate-500 to-cyan-500/20 mt-1" />
                    </div>
                  );
                }

                const prevNode = history[index - 1];

                // 線の開始位置を計算
                let startX = 50;
                if (index > 1) {
                  const prevPrevNode = history[index - 2];
                  const pIndex = prevPrevNode.choices.findIndex(c => EVOLUTION_TREE[c.nextId].id === prevNode.id);
                  const pCount = prevPrevNode.choices.length;
                  if (pIndex >= 0 && pCount > 0) {
                    startX = (pIndex + 0.5) * (100 / pCount);
                  }
                }

                return (
                  <div key={node.id} className="relative w-full flex flex-col items-center animate-fade-in-up">
                    <div className="relative w-full h-16">
                      <ConnectionLines count={prevNode.choices.length} startX={startX} />
                    </div>
                    <div className="flex justify-center items-start w-full relative -mt-4">
                      {prevNode.choices.map((choice) => {
                        const choiceNode = EVOLUTION_TREE[choice.nextId];
                        const isSelected = choiceNode.id === node.id;
                        const isDiscovered = gameData.discoveredIds.includes(choiceNode.id);
                        const showDetails = isSelected || isDiscovered;

                        return (
                          <div key={choice.nextId} className={`flex-1 flex flex-col items-center relative z-10`}>
                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 animate-blob-shape
                              ${isSelected ? 'bg-slate-800/90 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-110 z-20' : 'bg-slate-900/40 border-slate-700/50 grayscale opacity-40 scale-90'}`}>
                              {showDetails ? (
                                <IconMapper type={choiceNode.type} size={20} className={isSelected ? "text-cyan-200" : "text-slate-500"} />
                              ) : (
                                <HelpCircle size={20} className="text-slate-600" />
                              )}
                            </div>
                            <div className={`mt-2 text-xs font-medium text-center truncate w-full px-1 ${isSelected ? 'text-cyan-200' : 'text-slate-600 opacity-50'}`}>
                              {showDetails ? choiceNode.name : '???'}
                            </div>
                            {isSelected && <div className="text-[10px] text-cyan-500/80 font-mono tracking-wider">{choiceNode.era}</div>}
                            {isSelected && <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500 to-cyan-500/20 mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div ref={scrollRef} className="relative flex flex-col items-center animate-bounce-slight mt-0">
                <div className="h-4" />
                <div className="relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                  <div className={`relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-900 to-slate-900 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center justify-center animate-blob-shape`}>
                    <IconMapper type={currentNode.type} size={40} className="text-cyan-200" />
                  </div>
                  {status === 'playing' && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                      <div className="px-3 py-1 bg-black/80 backdrop-blur border border-cyan-500/50 rounded-full text-xs font-mono text-cyan-300 shadow-lg flex items-center gap-1">
                        <Clock size={10} /> {currentNode.era}
                      </div>
                    </div>
                  )}
                </div>

                {status === 'playing' && (
                  <div className="mt-8 text-center px-4">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">{currentNode.name}</h2>
                    <p className="text-cyan-200/80 text-sm mt-1 max-w-md mx-auto">{currentNode.description}</p>
                  </div>
                )}

                {status === 'won' && (
                  <div className="relative my-4 p-6 bg-slate-900/90 border border-yellow-400/50 rounded-2xl text-center backdrop-blur-lg animate-pop-in mx-4 max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                    {/* 紙吹雪エフェクト(CSS) - 修正: bottomを指定して下から出るように */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(15)].map((_, i) => (
                        <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-rise-up" style={{ left: `${Math.random() * 100}%`, bottom: '-20px', animationDelay: `${Math.random()}s`, opacity: 0.7 }} />
                      ))}
                    </div>

                    {/* 吹き出し */}
                    <div className="relative z-10">
                      <div className="inline-block bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-lg animate-bounce mb-6 border-2 border-yellow-400">
                        やったー！ついに{target?.name}になれたよ！
                      </div>
                    </div>

                    <div className="mb-6 relative z-10 flex justify-center">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
                      <div className="p-4 bg-slate-800/50 rounded-full border-4 border-yellow-400/50 animate-blob-shape">
                        <IconMapper type={target?.type as OrganismType} size={80} className="text-yellow-400 relative z-10" />
                      </div>
                    </div>

                    {/* 修正: テキスト変更 */}
                    <h3 className="relative z-10 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 mb-4 drop-shadow-sm">進化成功</h3>

                    {currentNode.detail && (
                      <div className="relative z-10 bg-black/40 p-4 rounded-xl text-left border border-white/10 mb-6">
                        <div className="flex items-center gap-2 mb-2 text-cyan-300 text-sm font-bold"><BookOpen size={16} /> <span>豆知識</span></div>
                        <p className="text-sm text-slate-200 leading-relaxed">{currentNode.detail}</p>
                      </div>
                    )}
                    <div className="relative z-10 flex gap-3">
                      <button onClick={resetGame} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all hover:-translate-y-0.5">TOPへ戻る</button>
                      <button onClick={goToCollection} className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-900/20">図鑑を見る</button>
                    </div>
                  </div>
                )}

                {status === 'lost' && (
                  <div className="mt-8 p-6 bg-red-900/40 border border-red-500/30 rounded-xl text-center backdrop-blur-sm animate-pop-in mx-4">
                    <Skull size={48} className="mx-auto text-red-400 mb-2" />
                    <h3 className="text-2xl font-bold text-red-200">進化の袋小路</h3>
                    <p className="text-red-100 mt-2">この形態は{target?.name}ではありません。</p>
                    <div className="flex gap-4 justify-center mt-4">
                      <button onClick={handleUndo} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors flex items-center gap-2"><RotateCcw size={16} /> 1世代戻る</button>
                      <button onClick={resetGame} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors">最初から</button>
                    </div>
                  </div>
                )}

                {status === 'time_over' && (
                  <div className="mt-8 p-6 bg-slate-800/80 border border-red-500/50 rounded-xl text-center backdrop-blur-sm animate-pop-in mx-4">
                    <Hourglass size={48} className="mx-auto text-red-400 mb-2 animate-pulse" />
                    <h3 className="text-2xl font-bold text-red-200">TIME OVER</h3>
                    <p className="text-red-100 mt-2">環境の変化に適応できず、<br />種は絶滅しました。</p>
                    <div className="flex gap-4 justify-center mt-4">
                      <button onClick={handleUndo} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors flex items-center gap-2"><RotateCcw size={16} /> 直前からやり直す</button>
                      <button onClick={resetGame} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors">最初から</button>
                    </div>
                  </div>
                )}

                {status === 'playing' && currentNode.choices.length > 0 && (
                  <div className="mt-8 w-full max-w-md animate-slide-up px-4">
                    <p className="text-center text-cyan-300 mb-4 font-bold tracking-wide animate-pulse">{currentNode.question || "進化の選択"}</p>
                    <div className="grid gap-3">
                      {currentNode.choices.map((choice, i) => (
                        <button key={i} onClick={() => handleChoice(choice.nextId)} className="group relative w-full p-4 bg-slate-800/60 hover:bg-cyan-900/60 border border-slate-600 hover:border-cyan-400 rounded-xl text-left transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-100 font-medium group-hover:text-white transition-colors">{choice.label}</span>
                            <ArrowLeft className="rotate-180 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 text-cyan-400" size={20} />
                          </div>
                        </button>
                      ))}
                    </div>
                    {history.length > 1 && (
                      <button onClick={handleUndo} className="mt-6 mx-auto flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                        <RotateCcw size={14} /> 直前の進化を取り消す
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes bounceSlight { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes riseUp { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 0.5; } 100% { transform: translateY(-120vh) scale(1.5); opacity: 0; } }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-bounce-slight { animation: bounceSlight 3s infinite ease-in-out; }
        .animate-rise-up { animation: riseUp linear infinite; }
        .animate-blob-shape { animation: blob 6s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .clip-path-triangle { clip-path: polygon(0 0, 100% 0, 0 100%); }
      `}</style>
    </div>
  );
}