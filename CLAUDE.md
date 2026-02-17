# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo containing multiple independent web tool projects, deployed together to GitHub Pages via a single workflow. No root-level package.json — each project is self-contained.

Live site: https://atsu30.github.io/EvolutionGameWeb/

## Build & Dev Commands

Each project has its own `package.json`. Run commands from within the project directory.

### evolution-game/
```bash
cd evolution-game
npm install
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### stickersplitter-tool/
```bash
cd stickersplitter-tool
npm install
npm run dev          # Vite dev server (port 3000)
npm run build        # vite build (no tsc step)
npm run preview      # Preview production build
```

Stickersplitter requires `GEMINI_API_KEY` in `.env.local` for AI features (background removal works without it).

## Architecture

### Deployment (`.github/workflows/deploy.yml`)
- Builds both projects independently, combines their `dist/` outputs into `_site/`, and generates a root index page linking to each
- Each project's `VITE_BASE_PATH` is set to `/<repo-name>/<project-name>/` for GitHub Pages subpath routing
- Triggered on push to `main`

### evolution-game/
React 19 + Vite 7 + TypeScript + Tailwind CSS 4 (via PostCSS plugin).

Core logic lives in a single large component `src/EvolutionGame.tsx` (~1200 lines) containing:
- Evolution tree data (47+ nodes with organisms from bacteria to human)
- Three game modes: random target, target selection, collection/encyclopedia
- 20-second timer per generation, decision-tree branching choices
- Progress persistence via LocalStorage (key versioned as v3)
- Icon loading from `public/icons/{type}.png` with fallback chain (image → lucide-react → emoji)
- SVG bezier curve connection lines and animated particle backgrounds

`src/App.tsx` is a thin wrapper that renders `EvolutionGame`.

### stickersplitter-tool/
React 19 + Vite 6 + TypeScript. Uses Tailwind via CDN (`<script src="https://cdn.tailwindcss.com">`), not a build plugin.

Entry point is `index.tsx`. The `index.html` uses an importmap with esm.sh for direct browser loading alongside vite bundling.

#### UI構成: タブベースUI
`App.tsx` はタブシェル（`useState<'splitter' | 'howto'>`）で、ヘッダー内の `TabBar` で切り替え。

**「分割ツール」タブ** — 画像分割＆背景透過ワークフロー:
- `components/SplitterTab.tsx` — 旧App.tsxのUI・state・handlerをすべて移動。自前でstateを持つ
- `components/StickerCard.tsx` — 個別スタンプ表示カード（選択/透過処理コントロール）

**「作り方」タブ** — LINEスタンプ制作ガイド＋プロンプト管理:
- `components/HowToMakeTab.tsx` — 親コンポーネント（WorkflowGuide → PromptTemplates → LineSpecCard）
- `components/WorkflowGuide.tsx` — Gemini AIを使った6ステップのビジュアルガイド（静的）
- `components/PromptTemplates.tsx` — テンプレート一覧＋追加/編集/削除。初回訪問時にデフォルトテンプレートを自動初期化
- `components/PromptEditor.tsx` — 変数入力フォーム＋リアルタイムプレビュー＋クリップボードコピー
- `components/LineSpecCard.tsx` — LINE Creators Market仕様チェックリスト（静的）
- `components/TabBar.tsx` — タブ切り替えバー

#### データ・ユーティリティ
- `types.ts` — `Sticker`, `StickerInput`, `GridType`, `PromptTemplate`, `PromptVariable`
- `data/defaultTemplates.ts` — 組み込みテンプレート3種（猫キャラ基本/カスタムキャラ/シンプル絵文字風）
- `utils/image.ts` — `splitImage()`, `removeBackground()`, `fileToBase64()`
- `utils/storage.ts` — localStorage CRUD for PromptTemplate（key: `sticker-prompt-templates-v1`）
- `utils/clipboard.ts` — `copyToClipboard()` with fallback
- `services/gemini.ts` — Google Generative AI統合（model: `gemini-3-pro-image-preview`）

#### プロンプトテンプレートのデータモデル
```typescript
interface PromptTemplate {
  id: string;
  name: string;           // テンプレート名
  description: string;
  body: string;           // {{variableName}} 形式のプレースホルダー付きプロンプト本文
  variables: PromptVariable[];  // { key, label, defaultValue }
  createdAt: number;
  updatedAt: number;
}
```
テンプレートはlocalStorageに永続化。初回訪問フラグ: `sticker-templates-initialized-v1`。

#### デザインパターン
- Tailwind CDN使用（ビルドプラグインではない）
- テーマカラー: カスタム `line` パレット（#06C755ベース、Tailwind CDN configで定義）
- カード: `rounded-[2.5rem] shadow-xl border border-slate-100 p-8`
- 番号バッジ: `bg-{color}-600 text-white w-6 h-6 rounded-lg text-[10px]`
- ボタン: `font-black rounded-2xl uppercase italic tracking-tighter`

Path alias: `@/*` maps to project root (configured in both tsconfig.json and vite.config.ts).
