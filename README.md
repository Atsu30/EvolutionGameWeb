# EvolutionGameWeb

React + TypeScript + Vite で作成されたWebゲームです。

## GitHub Pagesでの公開方法

このプロジェクトはGitHub Actionsを使用して自動的にGitHub Pagesにデプロイされます。

### 初回セットアップ

1. **GitHubリポジトリの設定**
   - GitHubリポジトリの Settings > Pages に移動
   - Source を "GitHub Actions" に設定

2. **コードをプッシュ**
   - `main` ブランチにコードをプッシュすると、自動的にビルドとデプロイが実行されます
   - `.github/workflows/deploy.yml` がデプロイを実行します

3. **公開URL**
   - デプロイが完了すると、以下のURLでアクセスできます:
     - `https://[ユーザー名].github.io/[リポジトリ名]/`

### ローカルでのビルド

```bash
# 開発サーバーを起動
npm run dev

# 本番用ビルド（ローカル）
npm run build

# ビルド結果をプレビュー
npm run preview
```

### 注意事項

- GitHub Pages用のベースパスは自動的に設定されます（`/[リポジトリ名]/`）
- ローカル開発時は通常のパス（`/`）が使用されます

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
