以下の手順でバグ修正タスクを開始してください。入力内容: $ARGUMENTS

## 手順

### ステップ1: Notion に Issue を作成する

`mcp__claude_ai_Notion__notion-create-pages` を使って、以下の設定で CLF Issues データベースにページを作成してください。

- parent: `{ "type": "data_source_id", "data_source_id": "b2ee31df-fe91-4862-9e55-ee7f5709a22e" }`
- properties:
  - タイトル: 入力内容から読み取ったタスクタイトル
  - ステータス: `"未着手"`
  - 優先度: 入力内容から読み取った優先度（指定なければ `"高"`）
  - 種別: 入力内容から読み取った種別（指定なければ `"バグ"`）

作成後、`mcp__claude_ai_Notion__notion-fetch` でそのページを取得し、`userDefined:ID` プロパティ（例: `CLF-3`）の数値部分を読み取ってください。これが CLF の Issue 番号です。

### ステップ2: GitHub に Issue を作成する

`gh` CLI を使って `shunsuke-kawata/clf` リポジトリに Issue を作成してください。

- title: `[CLF-{Issue番号}] {タスクタイトル}`
- label: `bug`（存在しない場合は省略）
- body: 入力内容の詳細説明（原因・影響・修正方針を含める）。末尾に `Notion: {作成した Notion ページの URL}` を追記する

### ステップ3: 現在のブランチを退避して fix ブランチを作成する

現在のブランチを確認し、fix ブランチを作成・切り替えてください。

```bash
git stash      # 作業中の変更があれば退避
git checkout main
git checkout -b fix/issue{Issue番号}
```

### ステップ4: 修正を実施する

入力内容に基づいて修正を実施してください。コミットはユーザーの確認後に行います。

## 完了報告

以下の情報をまとめて報告してください:

- Notion Issue URL
- GitHub Issue URL
- 作成したブランチ名
- 実施した修正内容の概要
