// Shared role mapping between VISION Studio's org-level roles and the Jarvis
// login accounts (VISION Studio FRD § 3, "shared role re-mapping").
//
// The five Jarvis personas were re-mapped to org-level roles (see
// constants/roles.ts and data/roleData.ts) so that action items cascaded from a
// VISION simulation land in the right persona's Jarvis task list. VISION names
// more org roles than there are Jarvis accounts, so related roles are
// consolidated into one account (e.g. Data Privacy folds into Security / 1LoD).
//
// The login/auth model is unchanged — a user still logs in as one fixed
// account; there is no in-app role switcher. A cascaded item simply appears in
// its owning account's task list the next time that account is logged in.

import type { Role } from "@/types";

/** Every VISION cascade target role → the Jarvis account that owns it. */
export const VISION_ROLE_TO_JARVIS: Record<string, Role> = {
  "Innovation Lead / Explorer": "leadership",
  "Innovation Lead": "leadership",
  "Finance / IT Finance": "leadership",
  "Portfolio Manager": "portfolio",
  "Project Manager (PM)": "portfolio",
  "Solution Architect": "engineer",
  "Enterprise / Governance Architect": "engineer",
  "Security / 1LoD": "infrastructure",
  "Data Privacy Manager": "infrastructure",
  "People & Culture / L&D": "people",
};

/**
 * Resolve which Jarvis account owns a VISION cascade target role. Falls back to
 * the Innovation Lead (the primary VISION persona) for any unmapped label.
 */
export function jarvisRoleForCascadeTarget(targetRole: string): Role {
  return VISION_ROLE_TO_JARVIS[targetRole] ?? "leadership";
}

/** The org-level display label each Jarvis account now presents as. */
export const JARVIS_ROLE_LABEL: Record<Role, string> = {
  leadership: "Innovation Lead",
  portfolio: "Portfolio Manager",
  engineer: "Solution Architect",
  infrastructure: "Security / 1LoD",
  people: "People & Culture / L&D",
};
