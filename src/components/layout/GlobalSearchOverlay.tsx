// GlobalSearchOverlay — full-screen command-palette search (Global_Search).
//
// Replaces the old "focus the top-bar field → filter the dashboard inline"
// experience with an OS-Spotlight/Teams-search-style overlay: a modal
// dialog with its own search input, showing categorized, keyboard-navigable
// results across Tasks, Emails, Meetings, Documents, and People as the user
// types.
//
// Built entirely on the existing Command*/CommandDialog primitives in
// src/app/components/ui/command.tsx, which already wrap `cmdk`'s
// `Command.Dialog` (itself built on the app's `dialog.tsx` Radix primitive) —
// so dialog semantics (`role="dialog"`, focus trapping, Escape-to-close) and
// arrow-key/Enter navigation all come for free. This component only supplies
// the query state, the categorized grouping (via src/lib/globalSearch.ts),
// and the per-category activation behavior.
//
// `shouldFilter={false}` is set on the underlying Command because filtering
// is already done ourselves (word-level matching in searchGlobal) rather than
// cmdk's default substring/fuzzy scorer — CommandItems are rendered only for
// entries that already matched.

import { useMemo, useState, type ComponentType } from "react";
import { Calendar, CheckSquare, FileText, Mail, User } from "lucide-react";
import type { Document, Meeting, Person, RoleData, Task } from "@/types";
import {
  buildSearchIndex,
  searchGlobal,
  type SearchCategory,
  type SearchIndexEntry,
} from "@/lib/globalSearch";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";

export interface GlobalSearchOverlayProps {
  /** Whether the overlay is currently shown. */
  open: boolean;
  /** Called to open/close the overlay (Escape, backdrop click, or a result activation). */
  onOpenChange: (open: boolean) => void;
  /** The active role's real, unfiltered data — never the dashboard's search-filtered projection. */
  data: RoleData;
  /** Mock documents for the "Documents" category (no real data source exists yet). */
  documents: Document[];
  /** Mock people for the "People" category (no real data source exists yet). */
  people: Person[];
  /** Task result activated: close the overlay and open the Task_Panel for it. */
  onSelectTask: (task: Task) => void;
  /** Meeting result activated: close the overlay and show the meeting toast. */
  onSelectMeeting: (meeting: Meeting) => void;
  /** Email/Document/Person result activated: close the overlay and show a toast naming it. */
  onSelectOther: (entry: SearchIndexEntry) => void;
}

const CATEGORY_LABEL: Record<SearchCategory, string> = {
  task: "Tasks",
  email: "Emails",
  meeting: "Meetings",
  document: "Documents",
  person: "People",
};

const CATEGORY_ICON: Record<SearchCategory, ComponentType<{ className?: string }>> = {
  task: CheckSquare,
  email: Mail,
  meeting: Calendar,
  document: FileText,
  person: User,
};

/** Ordered so Tasks/Emails/Meetings (real data) lead, Documents/People (mock) trail. */
const CATEGORY_ORDER: SearchCategory[] = [
  "task",
  "email",
  "meeting",
  "document",
  "person",
];

export function GlobalSearchOverlay({
  open,
  onOpenChange,
  data,
  documents,
  people,
  onSelectTask,
  onSelectMeeting,
  onSelectOther,
}: GlobalSearchOverlayProps) {
  // The overlay owns its own query state, independent of the dashboard's
  // inline search field/query — see SearchInput.tsx for why.
  const [query, setQuery] = useState("");

  const index = useMemo(
    () => buildSearchIndex(data, documents, people),
    [data, documents, people],
  );
  const results = useMemo(() => searchGlobal(index, query), [index, query]);

  const handleActivate = (entry: SearchIndexEntry) => {
    onOpenChange(false);
    setQuery("");
    switch (entry.category) {
      case "task":
        onSelectTask(entry.item as Task);
        break;
      case "meeting":
        onSelectMeeting(entry.item as Meeting);
        break;
      default:
        onSelectOther(entry);
        break;
    }
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
      title="Global search"
      description="Search tasks, emails, meetings, documents, and people"
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search tasks, emails, meetings, documents, people…"
        aria-label="Global search"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {CATEGORY_ORDER.map((category) => {
          const entries = results[category];
          if (entries.length === 0) return null;
          const Icon = CATEGORY_ICON[category];
          return (
            <CommandGroup key={category} heading={CATEGORY_LABEL[category]}>
              {entries.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={entry.id}
                  onSelect={() => handleActivate(entry)}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{entry.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.secondary}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
