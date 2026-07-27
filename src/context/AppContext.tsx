import React, { createContext, useContext, useState } from 'react';
import type { Role } from '../data/mockData';

export interface RoleOption {
  role: Role;
  name: string;
  subtitle: string;
  // If non-null, this persona also has a personal return in the system
  personalReturnId?: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { role: 'cpa',            name: 'Alex Chen',      subtitle: 'CPA / Tax Preparer',        personalReturnId: 'ret-2024-alex-chen' },
  { role: 'client',         name: 'Sarah Mitchell', subtitle: 'Individual Client'           },
  { role: 'reviewer',       name: 'Jordan Lee',     subtitle: 'Senior Reviewer'             },
  { role: 'admin',          name: 'Morgan Wu',      subtitle: 'Firm Administrator'          },
  { role: 'business_owner', name: 'David Kim',      subtitle: 'Business Owner (1120S)'     },
  { role: 'seasonal_staff', name: 'Taylor Kim',     subtitle: 'Seasonal Staff (Limited)'   },
];

interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  currentUser: RoleOption;
  breadcrumbs: Array<{ label: string; path: string }>;
  setBreadcrumbs: (bc: Array<{ label: string; path: string }>) => void;
}

const AppContext = createContext<AppContextValue>({
  role: 'cpa',
  setRole: () => {},
  currentUser: ROLE_OPTIONS[0],
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('cpa');
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; path: string }>>([]);

  const currentUser = ROLE_OPTIONS.find(o => o.role === role) ?? ROLE_OPTIONS[0];

  return (
    <AppContext.Provider value={{ role, setRole, currentUser, breadcrumbs, setBreadcrumbs }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
