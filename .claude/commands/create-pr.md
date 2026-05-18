以下の手順で develop ブランチへの PR を作成してください。入力内容: $ARGUMENTS

## 手順

### ステップ1: 現在のブランチと変更内容を確認する

```bash
git branch --show-current
git log develop..HEAD --oneline
git diff develop...HEAD --stat
```

ブランチ名（例: `feat/issue3`、`fix/issue2`）から CLF Issue 番号を読み取る。

### ステップ2: 現在のブランチをプッシュする

```bash
git push -u origin HEAD
```

### ステップ3: `develop` ブランチへの PR を作成する

コミット履歴と差分から変更内容を把握し、`gh pr create` で PR を作成してください。

- base: `develop`
- title: `[CLF-{Issue番号}] {タスクタイトル}`（入力内容またはコミット履歴から読み取る）
- body: 変更内容の概要・関連 Issue へのリンク・Notion URL（入力内容に含まれていれば使用）

```bash
gh pr create --base develop --title "..." --body "..."
```

### ステップ4: Notion Issue のステータスを「進行中」に更新する

入力内容に Notion ページ URL が含まれている場合のみ実施する。
`mcp__claude_ai_Notion__notion-update-page` でステータスを `"進行中"` に更新する。

## 完了報告

以下の情報をまとめて報告してください:

- PR URL
- 更新後の Notion Issue URL（更新した場合のみ）
