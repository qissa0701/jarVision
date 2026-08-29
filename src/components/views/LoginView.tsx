// LoginView — the login gate shown when no session is active.
//
// This is a frontend-only prototype: there is no backend, so there is no
// real authentication here. Each of the five persona "accounts" is presented
// as a selectable card; clicking one logs the user in as that role for the
// session (see useAuthSession). This replaces the old in-app Role Switcher —
// a logged-in user has exactly one fixed role and must log out to become a
// different persona.
//
// SECURITY NOTE: this screen is a UX affordance for switching demo personas,
// not an access-control boundary. It does not verify a password or any real
// credential, and nothing here should be treated as authentication in a
// production sense.

import { Zap } from "lucide-react";
import type { Role } from "@/types";
import { ROLE_DATA } from "@/data/roleData";
import { ROLES } from "@/constants/roles";

export interface LoginViewProps {
  /** Called with the chosen role id when the user picks an account. */
  onLogin: (role: Role) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center shadow-sm mb-3">
            <Zap className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Jarvis AI Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Sign in to continue as your account.
          </p>
        </div>

        <ul
          aria-label="Choose an account to sign in as"
          className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden"
        >
          {ROLES.map((r) => {
            const data = ROLE_DATA[r.id];
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onLogin(r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300 dark:focus:ring-indigo-400/40"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {data.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {data.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{r.label}</div>
                  </div>
                  <r.Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Prototype only — no password or real authentication is used.
        </p>
      </div>
    </div>
  );
}
