"use client";

import { HELP_SECTIONS, type HelpSectionId } from "./HelpContent";

type Props = {
  activeId: HelpSectionId;
  onSelect?: () => void;
};

export function HelpToc({ activeId, onSelect }: Props) {
  return (
    <nav>
      <ul className="flex flex-col gap-0.5">
        {HELP_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={onSelect}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                activeId === section.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {section.icon}
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
