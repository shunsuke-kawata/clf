"use client";

import { useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Navigation,
  List,
  LogIn,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type HelpSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
};

export const HELP_SECTIONS = [
  { id: "overview", title: "CLFとは", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "map", title: "地図の基本操作", icon: <MapPin className="h-4 w-4" /> },
  { id: "detail", title: "ロッカー情報を見る", icon: <List className="h-4 w-4" /> },
  { id: "search", title: "場所・ロッカーを探す", icon: <Search className="h-4 w-4" /> },
  { id: "admin", title: "登録・編集・削除（管理者）", icon: <Plus className="h-4 w-4" /> },
  { id: "faq", title: "うまくいかない時は", icon: <HelpCircle className="h-4 w-4" /> },
] as const satisfies HelpSection[];

export type HelpSectionId = (typeof HELP_SECTIONS)[number]["id"];

type StepProps = { steps: string[]; note?: string };

function Steps({ steps, note }: StepProps) {
  return (
    <ol className="mt-3 flex flex-col gap-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
      {note && (
        <li className="text-muted-foreground bg-muted mt-1 flex gap-2 rounded-lg px-3 py-2 text-sm">
          <span className="flex-shrink-0">💡</span>
          <span>{note}</span>
        </li>
      )}
    </ol>
  );
}

type WarnProps = { children: React.ReactNode };

function Warn({ children }: WarnProps) {
  return (
    <div className="text-destructive bg-destructive/10 border-destructive/20 mt-3 flex gap-2 rounded-lg border px-3 py-2 text-sm">
      <span className="flex-shrink-0">⚠️</span>
      <span>{children}</span>
    </div>
  );
}

function SectionContent({ id }: { id: HelpSectionId }) {
  switch (id) {
    case "overview":
      return (
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <p>
            CLF（Coin Locker Finder）は、
            <strong>「また使いたいコインロッカー」を地図に記録して管理する</strong>
            プライベートメモツールです。
          </p>
          <p>
            旅先や遠征先で見つけた便利なロッカーを登録しておけば、次回訪問時にすぐ見つけられます。
          </p>
          <ul className="flex flex-col gap-1.5 pl-1">
            <li className="flex gap-2">
              <span>👁️</span>
              <span>
                <strong>閲覧</strong>: 誰でも地図とロッカー情報を見られます
              </span>
            </li>
            <li className="flex gap-2">
              <span>✏️</span>
              <span>
                <strong>登録・編集</strong>: パスワードでログインした管理者のみ操作できます
              </span>
            </li>
          </ul>
        </div>
      );

    case "map":
      return (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium">地図を動かす</p>
            <Steps
              steps={[
                "指1本で画面をなぞると地図が上下左右に動きます",
                "2本指でつまむ・広げる操作で拡大・縮小できます",
              ]}
              note="地図の読み込みに少し時間がかかることがあります"
            />
          </div>
          <div>
            <p className="text-sm font-medium">ロッカーの場所を確認する</p>
            <Steps
              steps={[
                "地図上にコインロッカーのアイコンが表示されています",
                "アイコンをタップすると詳細情報が確認できます",
              ]}
            />
          </div>
        </div>
      );

    case "detail":
      return (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium">詳細を見る</p>
            <Steps
              steps={[
                "地図上のロッカーアイコンをタップします",
                "画面下から詳細パネルが表示されます",
                "写真・料金・メモを確認できます",
                "パネル外をタップすると閉じます",
              ]}
            />
          </div>
        </div>
      );

    case "search":
      return (
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" />
              会場名・駅名で検索する
            </div>
            <Steps
              steps={[
                "画面上部の検索バーに施設名や駅名を入力します",
                "候補が表示されたらタップします",
                "地図がその場所に移動し、検索バーに施設名が表示されます",
                "検索をクリアするには検索バー右端の「×」をタップします",
              ]}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Navigation className="h-4 w-4" />
              現在地に移動する
            </div>
            <Steps
              steps={[
                "画面右下の青いボタン（コンパスマーク）をタップします",
                "初回は「位置情報の使用を許可しますか？」と表示されるので「許可」を選びます",
                "地図が現在地に移動し、青い丸が表示されます",
              ]}
              note="位置情報を許可しないと現在地は表示されません"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <List className="h-4 w-4" />
              近くのロッカーをリストで見る
            </div>
            <Steps
              steps={[
                "画面右下のロッカーアイコンのボタンをタップします",
                "施設検索後は検索地点から、それ以外は現在地から近い順にリストが表示されます（3km圏内のみ）",
                "「ナビ」ボタンをタップするとGoogleマップで経路案内が起動します",
                "ロッカー名をタップすると地図上で場所が表示されます",
              ]}
              note="施設検索後は「〇〇 付近のロッカー」と表示されます。現在地基準に戻すには青いボタン（コンパスマーク）をタップしてください"
            />
          </div>
        </div>
      );

    case "admin":
      return (
        <div className="flex flex-col gap-6">
          <div className="bg-muted flex gap-2 rounded-lg px-3 py-2 text-sm">
            <span className="flex-shrink-0">🔒</span>
            <span>このセクションの操作はパスワードでのログインが必要です</span>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <LogIn className="h-4 w-4" />
              ログインする
            </div>
            <Steps
              steps={[
                "画面右下のログインボタン（カギのアイコン）をタップします",
                "パスワードを入力して「ログイン」をタップします",
                "ボタンが「＋」アイコンに変わればログイン完了です",
              ]}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              ロッカーを新しく登録する
            </div>
            <Steps
              steps={[
                "ログイン後、画面右下の「＋」ボタンをタップします",
                "登録フォームが開きます",
                "名前・料金・メモを入力します",
                "地図をタップして登録する場所を指定します",
                "写真を追加する場合はカメラアイコンをタップします",
                "「保存」をタップして完了です",
              ]}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Pencil className="h-4 w-4" />
              ロッカー情報を編集する
            </div>
            <Steps
              steps={[
                "編集したいロッカーのアイコンをタップして詳細を開きます",
                "右上の鉛筆アイコンをタップします",
                "内容を変更して「保存」をタップします",
              ]}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Trash2 className="h-4 w-4" />
              ロッカーを削除する
            </div>
            <Steps
              steps={[
                "削除したいロッカーの詳細を開き、鉛筆アイコンをタップします",
                "編集画面下部の「削除」ボタンをタップします",
                "確認ダイアログが表示されるので「削除」を選びます",
              ]}
            />
            <Warn>削除したロッカーは元に戻せません。</Warn>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <LogOut className="h-4 w-4" />
              ログアウトする
            </div>
            <Steps
              steps={["画面右にあるドアのアイコンをタップします", "ログアウト状態に戻ります"]}
            />
          </div>
        </div>
      );

    case "faq":
      return (
        <div className="flex flex-col gap-4">
          {[
            {
              q: "地図にアイコンが表示されない",
              a: "通信状況を確認してください。改善しない場合は画面を閉じて開き直してください。",
            },
            {
              q: "現在地が表示されない・ボタンを押しても動かない",
              a: "スマートフォンの設定 → プライバシー（またはアプリの設定）→ 位置情報サービスで、このアプリを「許可」に変更してください。",
            },
            {
              q: "パスワードがわからない",
              a: "管理者にお問い合わせください。パスワードはアプリ内からリセットできません。",
            },
            {
              q: "登録したはずのロッカーが見当たらない",
              a: "地図を広い範囲に縮小して探してみてください。登録時に指定した場所付近を確認してみてください。",
            },
          ].map(({ q, a }) => (
            <div key={q} className="flex flex-col gap-1 text-sm">
              <p className="font-medium">Q. {q}</p>
              <p className="text-muted-foreground pl-4">A. {a}</p>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

type Props = {
  onSectionChange?: (id: HelpSectionId) => void;
};

export function HelpContent({ onSectionChange }: Props) {
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const onSectionChangeRef = useRef(onSectionChange);
  useEffect(() => {
    onSectionChangeRef.current = onSectionChange;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onSectionChangeRef.current?.(entry.target.id as HelpSectionId);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    for (const el of sectionRefs.current.values()) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* セクション本体 */}
      {HELP_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          ref={(el) => {
            if (el) sectionRefs.current.set(section.id, el);
          }}
          className="scroll-mt-20"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-primary">{section.icon}</span>
            <h2 className="text-base font-semibold">{section.title}</h2>
            {section.id === "admin" && (
              <Badge variant="secondary" className="text-xs">
                管理者のみ
              </Badge>
            )}
          </div>
          <SectionContent id={section.id} />
        </section>
      ))}
    </div>
  );
}
