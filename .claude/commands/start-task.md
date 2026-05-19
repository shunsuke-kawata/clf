以下の手順でタスクを開始してください。入力内容: $ARGUMENTS

## 手順

### ステップ1: Notion に Issue を作成する

`mcp__claude_ai_Notion__notion-create-pages` を使って、以下の設定で CLF Issues データベースにページを作成してください。

- parent: `{ "type": "data_source_id", "data_source_id": "b2ee31df-fe91-4862-9e55-ee7f5709a22e" }`
- properties:
  - タイトル: 入力内容から読み取ったタスクタイトル
  - ステータス: `"進行中"`
  - 優先度: 入力内容から読み取った優先度（指定なければ `"中"`）
  - 種別: 入力内容から読み取った種別（指定なければ省略）

作成後、`mcp__claude_ai_Notion__notion-fetch` でそのページを取得し、`userDefined:ID` プロパティ（例: `CLF-3`）の数値部分を読み取ってください。これが CLF の Issue 番号です。

### ステップ2: GitHub に Issue を作成する

`gh` CLI を使って `shunsuke-kawata/clf` リポジトリに Issue を作成してください。

```bash
gh issue create --repo shunsuke-kawata/clf \
  --title "[CLF-{Issue番号}] {タスクタイトル}" \
  --body "..."
```

- body: 入力内容の詳細説明。末尾に `Notion: {作成した Notion ページの URL}` を追記する

### ステップ3: Git ブランチを作成・切り替える

**重要: ブランチ作成は必ずステップ1・2の Issue 作成後に行うこと。**

必ず develop に切り替えてから最新を取得し、ブランチを作成する。

```bash
git checkout develop
git pull origin develop
git checkout -b feat/issue{番号}
```

- 形式: `feat/issue{Issue番号}`
- 例: Issue 番号が 3 なら `feat/issue3`

## 完了報告

以下の情報をまとめて報告してください:

- Notion Issue URL
- GitHub Issue URL
- 作成したブランチ名
