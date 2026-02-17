# GitHubリポジトリ作成と接続ガイド

## ✅ 完了した作業
- [x] Gitリポジトリの初期化
- [x] 初回コミットの作成

## 📋 次のステップ

### ステップ1: GitHubリポジトリを作成

1. **GitHubにログイン**
   - https://github.com にアクセスしてログイン

2. **新しいリポジトリを作成**
   - 右上の「+」ボタン（またはプロフィール画像の横）をクリック
   - 「New repository」を選択

3. **リポジトリの設定**
   - **Repository name**: `EvolutionGameWeb`（またはお好みの名前）
   - **Description**: （任意）「Evolution Game Web Application」
   - **Visibility**: ⚠️ **Public** を選択（GitHub Pagesは無料ではPublicのみ）
   - ⚠️ **重要**: 「Initialize this repository with」のチェックボックスは**すべて外す**
     - ☐ Add a README file
     - ☐ Add .gitignore
     - ☐ Choose a license
   - 「Create repository」ボタンをクリック

### ステップ2: リモートリポジトリに接続

GitHubでリポジトリを作成すると、次のような画面が表示されます。

**既存のリポジトリからpushする場合**の手順が表示されます。

以下のコマンドを実行してください（`[ユーザー名]`は実際のGitHubユーザー名に置き換えてください）：

```bash
git remote add origin https://github.com/[ユーザー名]/EvolutionGameWeb.git
git branch -M main
git push -u origin main
```

または、SSHを使用する場合：

```bash
git remote add origin git@github.com:[ユーザー名]/EvolutionGameWeb.git
git branch -M main
git push -u origin main
```

### ステップ3: GitHub Actionsを有効化

1. **リポジトリのSettingsに移動**
   - GitHubリポジトリのページで「Settings」タブをクリック

2. **Actions > General を選択**
   - 左側のメニューから「Actions」を展開
   - 「General」を選択

3. **Workflow permissions を設定**
   - 「Workflow permissions」セクションをスクロール
   - **「Read and write permissions」** を選択
   - 「Save」ボタンをクリック

### ステップ4: GitHub Pagesの設定

1. **Settings > Pages に移動**
   - 左側のメニューから「Pages」を選択

2. **Source を設定**
   - 「Source」セクションで
   - **「GitHub Actions」** を選択

3. **設定は自動保存されます**

### ステップ5: デプロイの確認

1. **Actions タブを確認**
   - リポジトリの「Actions」タブをクリック
   - 「Deploy to GitHub Pages」ワークフローが実行されていることを確認
   - 緑のチェックマークが表示されれば成功

2. **公開URLを確認**
   - Settings > Pages に戻る
   - 「Your site is live at:」の下にURLが表示されます
   - 例: `https://[ユーザー名].github.io/EvolutionGameWeb/`

## 🔧 トラブルシューティング

### Settings > Pagesが表示されない場合

- **リポジトリがプライベート**: Publicリポジトリに変更してください
- **コードがまだプッシュされていない**: ステップ2を完了してください
- **数分待つ**: リポジトリ作成直後は表示に時間がかかる場合があります

### GitHub Actionsが動作しない場合

- **Actions > General** で「Read and write permissions」が設定されているか確認
- **Actions** タブでエラーメッセージを確認

### プッシュ時にエラーが出る場合

- GitHubリポジトリが正しく作成されているか確認
- リモートURLが正しいか確認: `git remote -v`

