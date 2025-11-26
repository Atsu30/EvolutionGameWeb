# GitHub Pages セットアップ手順

## ステップ1: Gitリポジトリの初期化とコミット

まず、ローカルのGitリポジトリを初期化し、コードをコミットします。

```bash
# Gitリポジトリを初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit"
```

## ステップ2: GitHubリポジトリの作成

1. GitHubにログイン
2. 右上の「+」ボタンから「New repository」を選択
3. リポジトリ名を入力（例: `EvolutionGameWeb`）
4. **Public** を選択（GitHub Pagesは無料アカウントでもPublicリポジトリで利用可能）
5. 「Initialize this repository with:」のチェックは外す（既にコードがあるため）
6. 「Create repository」をクリック

## ステップ3: リモートリポジトリに接続してプッシュ

GitHubでリポジトリを作成した後、表示されるURLを使用して接続します。

```bash
# リモートリポジトリを追加（URLは実際のものに置き換えてください）
git remote add origin https://github.com/[ユーザー名]/EvolutionGameWeb.git

# メインブランチをmainに設定（必要に応じて）
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

## ステップ4: GitHub Actionsを有効化

1. GitHubリポジトリのページに移動
2. **Settings** タブをクリック
3. 左側のメニューから **Actions > General** を選択
4. 「Workflow permissions」セクションで **"Read and write permissions"** を選択
5. 「Save」をクリック

## ステップ5: GitHub Pagesの設定

コードをプッシュすると、GitHub Actionsワークフローが実行されます。
その後、以下の手順でGitHub Pagesを設定します：

1. GitHubリポジトリのページで **Settings** タブをクリック
2. 左側のメニューから **Pages** を選択
3. **Source** セクションで：
   - 「Deploy from a branch」の代わりに
   - **「GitHub Actions」** を選択（または既に選択されていることを確認）
4. 設定は保存する必要はありません（自動保存されます）

## ステップ6: デプロイの確認

1. リポジトリの **Actions** タブをクリック
2. 「Deploy to GitHub Pages」ワークフローが実行中または完了していることを確認
3. 完了後、**Settings > Pages** に戻ると、公開URLが表示されます
   - 例: `https://[ユーザー名].github.io/EvolutionGameWeb/`

## トラブルシューティング

### Settings > Pagesが表示されない場合

- **リポジトリがプライベートの場合**: GitHub PagesはPublicリポジトリで無料で利用可能です。Privateリポジトリでは有料プランが必要です。
- **コードがまだプッシュされていない場合**: まずコードをプッシュしてください。
- **リポジトリが新しく作成されたばかりの場合**: 数分待ってから再度確認してください。

### GitHub Actionsが表示されない場合

- **リポジトリでGitHub Actionsが無効になっている場合**: Settings > Actions > General で有効化してください。

