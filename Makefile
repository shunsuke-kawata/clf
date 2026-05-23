.PHONY: dev stop db-start db-stop db-status tunnel-start help

TUNNEL_PID_FILE := .cloudflared.pid
LOG_DIR         := .logs

## デフォルト: ヘルプ表示
help:
	@echo "使用可能なコマンド:"
	@echo "  make dev       開発サーバー起動 (localhost + HTTPS URL 表示)"
	@echo "  make stop      全サービス停止 (Supabase + Cloudflare tunnel)"
	@echo "  make db-start  Supabaseのみ起動"
	@echo "  make db-stop   Supabaseのみ停止"
	@echo "  make db-status Supabaseの状態確認"

## 開発サーバー起動（Supabase + Cloudflare tunnel + Next.js）
dev: db-start tunnel-start next-kill
	pnpm dev

## Cloudflare tunnelをバックグラウンドで起動しHTTPS URLを表示
tunnel-start:
	@mkdir -p $(LOG_DIR)
	@if [ -f $(TUNNEL_PID_FILE) ]; then \
		kill $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; \
		rm -f $(TUNNEL_PID_FILE); \
	fi
	@cloudflared tunnel --url http://localhost:3000 \
		> $(LOG_DIR)/cloudflared.log 2>&1 & echo $$! > $(TUNNEL_PID_FILE)
	@printf "Cloudflare tunnel 起動中"
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		sleep 1; printf "."; \
		grep -q 'https.*trycloudflare' $(LOG_DIR)/cloudflared.log 2>/dev/null && break; \
	done
	@echo ""
	@echo "  HTTPS: $$(grep -o 'https://[^ ]*\.trycloudflare\.com' $(LOG_DIR)/cloudflared.log 2>/dev/null || echo '(取得失敗 — tail -f $(LOG_DIR)/cloudflared.log で確認)')"

## 既存のNext.js devサーバーを停止（ポート3000を解放）
next-kill:
	@lsof -ti :3000 | xargs kill -9 2>/dev/null && echo "既存のNext.jsを停止しました" || true

## 全サービス停止
stop: db-stop
	@if [ -f $(TUNNEL_PID_FILE) ]; then \
		kill $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null && echo "Cloudflare tunnel 停止"; \
		rm -f $(TUNNEL_PID_FILE); \
	fi
	@lsof -ti :3000 | xargs kill -9 2>/dev/null && echo "Next.js 停止" || true
	@echo "完了"

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
