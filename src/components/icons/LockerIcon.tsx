import type { SVGProps } from "react";

export function LockerIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* ロッカー外枠 */}
      <rect x="2" y="2" width="28" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="white" />
      {/* 上部コントロールパネル */}
      <rect x="5" y="5" width="22" height="6" rx="2" fill="currentColor" opacity="0.2" />
      {/* キーホール（円部分） */}
      <circle cx="16" cy="19" r="4" fill="currentColor" />
      {/* キーホール（差し込み口） */}
      <path d="M14 21.5 L14.5 27 L17.5 27 L18 21.5Z" fill="currentColor" />
    </svg>
  );
}
