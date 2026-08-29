// Login account configuration and defaults.
//
// Each account maps to exactly one fixed Role — there is no in-app role
// switching. A user logs in as one of these five accounts and stays that
// role for the session; switching personas means logging out and logging
// back in as a different account (see LoginView / useAuthSession).

import type { ComponentType } from "react";
import { Code2, Briefcase, ShieldCheck, Heart, Lightbulb } from "lucide-react";
import type { Role } from "@/types";

export interface RoleConfig {
  id: Role;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

/**
 * All five login accounts, in display order. The personas are re-mapped to
 * VISION's org-level roles (see constants/visionRoleMap.ts) so cascaded action
 * items land in the right account's task list. The `id` values are kept stable
 * as internal keys; only the presented labels/titles changed.
 */
export const ROLES: RoleConfig[] = [
  { id: "engineer", label: "Solution Architect", Icon: Code2 },
  { id: "portfolio", label: "Portfolio Manager", Icon: Briefcase },
  { id: "infrastructure", label: "Security / 1LoD", Icon: ShieldCheck },
  { id: "people", label: "People & Culture / L&D", Icon: Heart },
  { id: "leadership", label: "Innovation Lead", Icon: Lightbulb },
];

/** All known role identifiers, in display order. */
export const ROLE_IDS: Role[] = ROLES.map((role) => role.id);

/** Default role used when no persisted session exists. */
export const DEFAULT_ROLE: Role = "engineer";
