// Sidebar navigation items — the minimal icon rail (Dashboard + Settings).
//
// The sidebar was collapsed from a 6-item nav (Dashboard/Tasks/Calendar/Email/
// Agents/Settings) down to just Dashboard and Settings, since the Tasks,
// Calendar, Email, and Agents standalone views were removed (their content now
// lives only as the two fixed dashboard widgets, Calendar + Tasks).

import type { ComponentType } from "react";
import { LayoutDashboard, Settings } from "lucide-react";
import type { NavItem } from "@/types";

export interface NavItemConfig {
  id: NavItem;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "settings", label: "Settings", Icon: Settings },
];
