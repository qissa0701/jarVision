// useGlobalSearchShortcut — global Cmd/Ctrl+K keyboard shortcut to open the
// Global_Search overlay, mirroring the standard command-palette convention
// (VS Code, Linear, Slack, Spotlight-style launchers all bind this).
//
// The listener is attached to `document` (not a specific element) so the
// shortcut works regardless of which element currently has focus — including
// when focus is on the top-bar search field itself — and is removed on
// unmount, matching the cleanup discipline already established by
// useFocusTrap.ts's document-level keydown listener.

import { useEffect } from "react";

export interface UseGlobalSearchShortcutParams {
  /** Called when Cmd+K (Mac) or Ctrl+K (Windows/Linux) is pressed. */
  onTrigger: () => void;
}

/**
 * Registers a document-level keydown listener for Cmd/Ctrl+K that invokes
 * `onTrigger`. The browser's default behavior for the combination (if any) is
 * prevented so it doesn't compete with the app's own shortcut.
 */
export function useGlobalSearchShortcut({
  onTrigger,
}: UseGlobalSearchShortcutParams): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      if (isModifierPressed && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onTrigger();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onTrigger]);
}
