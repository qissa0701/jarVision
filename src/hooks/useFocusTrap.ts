import * as React from "react";

/**
 * CSS selector matching the elements that can receive keyboard focus.
 * Elements with `disabled` or `tabindex="-1"` are intentionally excluded so
 * the trap only cycles through genuinely focusable controls.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface UseFocusTrapParams {
  /** While `true`, focus is confined to the container and Escape is handled. */
  active: boolean;
  /** Ref to the element whose focusable descendants form the trap. */
  containerRef: React.RefObject<HTMLElement>;
  /** Called when the user presses Escape while the trap is active. */
  onEscape: () => void;
}

/**
 * Confines keyboard focus within a container while `active` is true.
 *
 * On activation the hook records the currently focused element, moves focus to
 * the first focusable element inside the container, and traps Tab/Shift+Tab so
 * focus wraps around within the container. Pressing Escape invokes `onEscape`.
 * On deactivation (or unmount) focus is restored to the previously focused
 * element, guarding against an element that is missing or no longer in the DOM.
 *
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5
 */
export function useFocusTrap({
  active,
  containerRef,
  onEscape,
}: UseFocusTrapParams): void {
  // Keep the latest onEscape without forcing the trap effect to re-run.
  const onEscapeRef = React.useRef(onEscape);
  React.useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  React.useEffect(() => {
    if (!active) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Record the element focused before the trap activated so we can restore it.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusableElements = (): HTMLElement[] =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

    // Move focus into the container: first focusable element, else the
    // container itself so keystrokes are captured.
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else if (typeof container.focus === "function") {
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const items = getFocusableElements();
      if (items.length === 0) {
        // Nothing to move to; keep focus inside the container.
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        // Shift+Tab on the first element (or focus outside) wraps to the last.
        if (activeElement === first || !container.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last || !container.contains(activeElement)) {
        // Tab on the last element (or focus outside) wraps to the first.
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);

      // Restore focus, guarding against an element that no longer exists or was
      // detached from the document while the trap was active.
      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === "function" &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef]);
}
