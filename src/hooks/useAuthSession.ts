// useAuthSession — restores and persists the logged-in user's single Role
// using the injected browser Storage.
//
// There is no in-app role switching: each account maps to exactly one fixed
// role, chosen at login. To act as a different persona, the user logs out
// (clearing the session) and logs back in as a different account. This hook
// owns that session state — which account (if any) is currently logged in —
// separately from the dashboard's other persisted preferences (theme, notes,
// overnight queue), so logging out never touches those.
//
// Behavior:
//   - On mount, reads and validates the stored role. A valid, known role
//     initializes a logged-in session; a missing or unknown value starts
//     logged out (`role: null`).
//   - An effect persists the role whenever it changes: `login(role)` writes
//     it, `logout()` removes it. Storage failures (private mode, quota) are
//     swallowed so they never break the UI.
//
// `Storage` is injected via `Pick<Storage, ...>` and defaults to
// `window.localStorage`, so tests can supply a mock without a real browser store.

import { useCallback, useEffect, useState } from "react";
import type { Role } from "@/types";
import { ROLE_IDS } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/layout";

/** The subset of the `Storage` API this hook needs (read on mount, write/remove on change). */
export type AuthSessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Public contract consumed by the composition root. */
export interface AuthSession {
  /** The logged-in user's fixed role, or `null` when logged out. */
  role: Role | null;
  /** Log in as the given account/role for this session. */
  login: (role: Role) => void;
  /** Log out, returning to the login screen. */
  logout: () => void;
}

/** True when `value` is one of the known Role identifiers. */
function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLE_IDS as string[]).includes(value);
}

/** Read + validate the persisted session role; `null` when logged out. */
function loadRole(storage: Pick<Storage, "getItem">): Role | null {
  try {
    const stored = storage.getItem(STORAGE_KEYS.role);
    return isValidRole(stored) ? stored : null;
  } catch {
    console.warn("Failed to load the persisted session; starting logged out.");
    return null;
  }
}

/**
 * React hook that restores a persisted login session on mount and
 * re-persists it whenever the user logs in or out.
 *
 * @param storage - anything exposing `getItem`/`setItem`/`removeItem`;
 *   defaults to `window.localStorage`. Injected for testability.
 */
export function useAuthSession(
  storage: AuthSessionStorage = window.localStorage,
): AuthSession {
  const [role, setRole] = useState<Role | null>(() => loadRole(storage));

  useEffect(() => {
    try {
      if (role === null) {
        storage.removeItem(STORAGE_KEYS.role);
      } else {
        storage.setItem(STORAGE_KEYS.role, role);
      }
    } catch {
      console.warn("Failed to persist the login session.");
    }
  }, [storage, role]);

  const login = useCallback((nextRole: Role) => setRole(nextRole), []);
  const logout = useCallback(() => setRole(null), []);

  return { role, login, logout };
}
