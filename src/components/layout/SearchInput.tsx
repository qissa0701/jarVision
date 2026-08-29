import { Search } from "lucide-react";

export interface SearchInputProps {
  /** Called when the field is activated (clicked or focused), opening the Global_Search overlay. */
  onOpenGlobalSearch: () => void;
}

/**
 * Top-bar search trigger for the dashboard (Global_Search).
 *
 * This used to be a plain controlled text input that filtered the dashboard
 * inline as you typed. It is now a button styled to look like that same
 * search field, but instead of owning query text itself it opens the
 * full-screen Global_Search command-palette overlay — which owns its own
 * query state — on click *or* keyboard focus (Tab-ing to it and pressing
 * Enter/Space works the same way a button normally would, and focusing it
 * directly also opens the overlay so the field never sits there accepting
 * keystrokes that go nowhere).
 *
 * Rendered as a real `<button>` rather than a read-only `<input>` so it's
 * unambiguously keyboard/screen-reader operable as a trigger, with a
 * descriptive accessible name mirroring the overlay's own input label.
 */
export function SearchInput({ onOpenGlobalSearch }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <button
        type="button"
        aria-label="Search tasks, emails, docs"
        onClick={onOpenGlobalSearch}
        onFocus={onOpenGlobalSearch}
        className="w-80 pl-9 pr-4 py-2 text-sm text-left bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400/40 focus:border-indigo-300 dark:focus:border-indigo-400/50 text-muted-foreground transition"
      >
        Search tasks, emails, docs…
      </button>
    </div>
  );
}
