"use client";

import { useEffect } from "react";

/**
 * iOS Safari/Chrome でフォーム入力欄フォーカス時にビューポートが自動ズームされる問題を防ぐ。
 *
 * iOS は font-size < 16px の入力欄にフォーカスすると viewport を自動拡大する。
 * globals.css の font-size: max(16px, 1em) と組み合わせて二重に対策する。
 *
 * アプローチ: フォーカス中のみ viewport meta の maximum-scale を 1 に固定し、
 * ブラー後に元の値を復元する。ピンチズームはフォーカス外では引き続き有効。
 */
export function usePreventIOSZoom() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]'
    );
    if (!meta) return;

    const original = meta.content;

    function lock(e: FocusEvent) {
      if (
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
      )
        return;
      meta!.content =
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    }

    function unlock(e: FocusEvent) {
      if (
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
      )
        return;
      meta!.content = original;
    }

    document.addEventListener("focusin", lock, true);
    document.addEventListener("focusout", unlock, true);

    return () => {
      document.removeEventListener("focusin", lock, true);
      document.removeEventListener("focusout", unlock, true);
      meta.content = original;
    };
  }, []);
}
