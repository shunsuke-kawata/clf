.PHONY: dev https stop db-start db-stop db-status help

TUNNEL_PID_FILE := .cloudflared.pid
LOG_DIR         := .logs

## デフォルト: ヘルプ表示
help:
	@echo "使用可能なコマンド:"
	@echo "  make dev      ローカル開発サーバー起動 (localhost:3000)"
	@echo "  make https    HTTPS開発サーバー起動 (Cloudflare tunnel + iPhone対応)"
	@echo "  make stop     全サービス停止"
	@echo "  make db-start Supabaseのみ起動"
	@echo "  make db-stop  Supabaseのみ停止"
	@echo "  make db-status Supabaseの状態確認"

## ローカル開発（Supabase + Next.js）
dev: db-start next-kill
	pnpm dev

## HTTPS開発（Supabase + Cloudflare tunnel + Next.js）
## iPhone等から現在地取得・画像表示をテストする場合に使用
https: db-start next-kill
	@mkdir -p $(LOG_DIR)
	@if [ -f $(TUNNEL_PID_FILE) ]; then \
		kill $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; \
		rm -f $(TUNNEL_PID_FILE); \
	fi
	@cloudflared tunnel --url http://localhost:3000 \
		> $(LOG_DIR)/cloudflared.log 2>&1 & echo $$! > $(TUNNEL_PID_FILE)
	@echo "Cloudflare tunnel 起動中... URLは以下で確認:"
	@echo "  tail -f $(LOG_DIR)/cloudflared.log"
	@sleep 3
	@grep -o 'https://[^ ]*\.trycloudflare\.com' $(LOG_DIR)/cloudflared.log 2>/dev/null || echo "  (URL取得中、上記ログを確認)"
	pnpm dev

## 既存のNext.js devサーバーを停止（ポート3000を解放）
next-kill:
	@lsof -ti :3000 | xargs kill -9 2>/dev/null && echo "既存のNext.jsを停止しました" || true

## 全サービス停止
stop: db-stop
	@if [ -f $(TUNNEL_PID_FILE) ]; then \
		kill $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null && echo "Cloudflare tunnel 停止"; \
		rm -f $(TUNNEL_PID_FILE); \
	fi
	@echo "完了 (Next.jsはCtrl+Cで停止してください)"

## Supabase起動（起動済みならスキップ）
db-start:
	@if supabase status 2>&1 | grep -q "is running"; then \
		echo "Supabase はすでに起動しています"; \
	else \
		echo "Supabase を起動しています..."; \
		supabase start; \
	fi

## Supabase停止
db-stop:
	supabase stop

## Supabase状態確認
db-status:
	supabase status
