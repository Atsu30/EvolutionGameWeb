# ビルドエラーの修正手順

## 問題
ビルドが失敗し、以下のエラーが発生：
```
Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions
```

## 原因
GitHub PagesがまだSettingsで有効になっていない、または正しく設定されていない可能性があります。

## 解決手順

### ステップ1: GitHub Pagesを有効化（重要！）

**これが最も重要です。** まず以下を実施してください：

1. **GitHubリポジトリにアクセス**
   - https://github.com/Atsu30/EvolutionGameWeb にアクセス

2. **Settings > Pages に移動**
   - リポジトリページで「Settings」タブをクリック
   - 左側のメニューから「Pages」を選択

3. **Source を GitHub Actions に設定**
   - 「Source」セクションでドロップダウンを開く
   - **「GitHub Actions」** を選択
   - これが設定されていないと、ワークフローが失敗します

### ステップ2: GitHub Actionsの権限設定

1. **Settings > Actions > General に移動**
   - 左側のメニューから「Actions」を展開
   - 「General」を選択

2. **Workflow permissions を設定**
   - 「Workflow permissions」セクションまでスクロール
   - **「Read and write permissions」** を選択
   - 「Save」ボタンをクリック

### ステップ3: 修正したワークフローをプッシュ

修正したワークフローファイルをプッシュします。これで再度ビルドが実行されます。

### ステップ4: ワークフローの再実行

1. **Actions タブを確認**
   - リポジトリの「Actions」タブをクリック
   - 最新のワークフロー実行を確認

2. **手動で再実行する場合**
   - 失敗したワークフローをクリック
   - 「Re-run all jobs」または「Re-run failed jobs」をクリック

## 注意事項

⚠️ **重要**: Settings > Pages で「GitHub Actions」を選択していない場合、ワークフローは必ず失敗します。まずこれを設定してください。

## 修正内容

ワークフローファイル（`.github/workflows/deploy.yml`）を修正しました：
- `actions/configure-pages@v4` のステップを削除（エラーの原因になっていた可能性）
- deployジョブにpermissionsを明示的に追加

