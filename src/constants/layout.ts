// Persisted-preference storage keys.
//
// The dashboard's widget list is no longer user-configurable (it is fixed to
// exactly two widgets: Calendar + Tasks), so there is nothing to persist for
// widgets anymore. Only the active role and color theme are persisted. The
// versioned `.v1` suffix allows future schema changes without colliding with
// stale data.
export const STORAGE_KEYS = {
  role: "jarvis.dashboard.role.v1",
  theme: "jarvis.dashboard.theme.v1",
  // VISION Studio persisted state (saved ideas, cascade items, gate decisions,
  // dismissed trend nudges). Kept separate from Jarvis preferences so clearing
  // one never disturbs the other.
  vision: "jarvis.vision.state.v1",
} as const;
