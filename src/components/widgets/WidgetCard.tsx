// Plain card shell for a dashboard widget.
//
// The dashboard is now fixed to exactly two widgets (Calendar + Tasks) with no
// drag-and-drop, reordering, or removal, so this shell was simplified down to
// just the title/icon header plus a content slot — no move/remove affordances,
// no drag handle, no options menu.

import type { ReactNode } from "react";

export interface WidgetCardProps {
  /** Human-readable widget label rendered in the header. */
  title: string;
  /** Leading icon node rendered before the title. */
  icon: ReactNode;
  /** Widget body content. */
  children: ReactNode;
}

export function WidgetCard({ title, icon, children }: WidgetCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden h-full">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
