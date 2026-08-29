// Pure notification derivation for the top-bar bell dropdown.
//
// The bell is driven entirely by the active role's data rather than a separate
// data source, so notifications stay in sync with what the dashboard shows. The
// derivation is pure and non-mutating: it reads a RoleData and returns a fresh,
// ordered Notification list. Keeping it here (rather than inside TopBar) makes
// the mapping unit-testable without a DOM and keeps the component thin.
//
// Signal selection (highest-signal first), all navigating to the dashboard
// (the only remaining nav destination besides Settings):
//   1. Critical / high priorities.
//   2. An unread-email summary row.
//   3. Jarvis suggestions.

import type { Notification, RoleData } from "@/types";

/**
 * Build the ordered notification list for a role.
 *
 * Only critical/high priorities are surfaced (medium priorities are considered
 * ambient and omitted). A single summary row is added for unread emails when
 * the role has any. Every suggestion becomes a notification. The result is a
 * new array; the input is never mutated.
 */
export function buildNotifications(data: RoleData): Notification[] {
  const notifications: Notification[] = [];

  for (const priority of data.priorities) {
    if (priority.urgency === "critical" || priority.urgency === "high") {
      notifications.push({
        id: `priority-${priority.id}`,
        title: priority.title,
        detail: priority.context,
        kind: priority.urgency,
        target: "dashboard",
      });
    }
  }

  if (data.emails.length > 0) {
    notifications.push({
      id: "emails-summary",
      title: `${data.emails.length} ${
        data.emails.length === 1 ? "email needs" : "emails need"
      } attention`,
      detail: `Latest from ${data.emails[0].sender}`,
      kind: "info",
      target: "dashboard",
    });
  }

  for (const suggestion of data.suggestions) {
    notifications.push({
      id: `suggestion-${suggestion.id}`,
      title: suggestion.text,
      detail: suggestion.action,
      kind: suggestion.kind,
      target: "dashboard",
    });
  }

  return notifications;
}
