import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MessageSquare, Users, Settings,
  ChevronDown, ChevronRight, LogOut, Sparkles, User, Building2,
  ClipboardList, ShieldCheck, Bell, Search, X, CornerDownLeft,
  CheckSquare, BarChart3, HelpCircle,
} from 'lucide-react';
import { useApp, ROLE_OPTIONS } from '../context/AppContext';
import { scopedReturnsForRole, stageConfig, urgencyConfig } from '../data/mockData';
import { useEscapeToClose } from '../lib/useEscapeToClose';
import type { Role } from '../data/mockData';

const NAV: Record<Role, Array<{ icon: React.ElementType; label: string; path: string }>> = {
  cpa: [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
    { icon: FileText,        label: 'Returns',      path: '/returns'   },
    { icon: CheckSquare,     label: 'Tasks',        path: '/tasks'     },
    { icon: Sparkles,        label: 'AI Review',    path: '/ai-review' },
    { icon: MessageSquare,   label: 'Messages',     path: '/messages'  },
    { icon: BarChart3,       label: 'Reports',      path: '/reports'   },
    { icon: Users,           label: 'Clients',      path: '/clients'   },
    { icon: Settings,        label: 'Settings',     path: '/settings'  },
  ],
  client: [
    { icon: LayoutDashboard, label: 'My Return',    path: '/dashboard' },
    { icon: FileText,        label: 'Documents',    path: '/returns'   },
    { icon: CheckSquare,     label: 'Tasks',        path: '/tasks'     },
    { icon: MessageSquare,   label: 'Messages',     path: '/messages'  },
    { icon: Settings,        label: 'Settings',     path: '/settings'  },
  ],
  reviewer: [
    { icon: ClipboardList,   label: 'Review Queue', path: '/dashboard' },
    { icon: FileText,        label: 'All Returns',  path: '/returns'   },
    { icon: CheckSquare,     label: 'Tasks',        path: '/tasks'     },
    { icon: Sparkles,        label: 'AI Review',    path: '/ai-review' },
    { icon: MessageSquare,   label: 'Messages',     path: '/messages'  },
    { icon: BarChart3,       label: 'Reports',      path: '/reports'   },
    { icon: Users,           label: 'Team',         path: '/clients'   },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Firm Overview',  path: '/dashboard' },
    { icon: FileText,        label: 'All Returns',    path: '/returns'   },
    { icon: CheckSquare,     label: 'Tasks',          path: '/tasks'     },
    { icon: Sparkles,        label: 'AI Review',      path: '/ai-review' },
    { icon: Users,           label: 'Users & Roles',  path: '/clients'   },
    { icon: BarChart3,       label: 'Reports',        path: '/reports'   },
    { icon: Settings,        label: 'Firm Settings',  path: '/settings'  },
  ],
  business_owner: [
    { icon: Building2,       label: 'My Entities',    path: '/dashboard' },
    { icon: FileText,        label: 'Returns',        path: '/returns'   },
    { icon: CheckSquare,     label: 'Tasks',          path: '/tasks'     },
    { icon: MessageSquare,   label: 'Messages',       path: '/messages'  },
    { icon: Settings,        label: 'Settings',       path: '/settings'  },
  ],
  seasonal_staff: [
    { icon: ClipboardList,   label: 'My Workload',    path: '/dashboard' },
    { icon: FileText,        label: 'My Returns',     path: '/returns'   },
    { icon: CheckSquare,     label: 'Tasks',          path: '/tasks'     },
    { icon: Sparkles,        label: 'AI Review',      path: '/ai-review' },
    { icon: MessageSquare,   label: 'Messages',       path: '/messages'  },
  ],
};

const ROLE_COLORS: Record<Role, {
  bg: string; badgeBg: string; badgeText: string; label: string; dot: string; ring: string;
}> = {
  cpa:            { bg: 'bg-indigo-500',   badgeBg: 'bg-indigo-500/15',   badgeText: 'text-indigo-300',   dot: 'bg-indigo-400',   ring: 'ring-indigo-400',   label: 'CPA'            },
  client:         { bg: 'bg-blue-500',   badgeBg: 'bg-blue-500/15',   badgeText: 'text-blue-300',   dot: 'bg-blue-400',   ring: 'ring-blue-400',   label: 'Client'         },
  reviewer:       { bg: 'bg-violet-500', badgeBg: 'bg-violet-500/15', badgeText: 'text-violet-300', dot: 'bg-violet-400', ring: 'ring-violet-400', label: 'Reviewer'       },
  admin:          { bg: 'bg-orange-500', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-300', dot: 'bg-orange-400', ring: 'ring-orange-400', label: 'Admin'          },
  business_owner: { bg: 'bg-pink-500',   badgeBg: 'bg-pink-500/15',   badgeText: 'text-pink-300',   dot: 'bg-pink-400',   ring: 'ring-pink-400',   label: 'Business Owner' },
  seasonal_staff: { bg: 'bg-cyan-600',   badgeBg: 'bg-cyan-500/15',   badgeText: 'text-cyan-300',   dot: 'bg-cyan-400',   ring: 'ring-cyan-400',   label: 'Seasonal Staff' },
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

// ─── Command Palette (⌘K / Ctrl+K) — global return search ────────────────────

function CommandPalette({ role, userName, onClose }: { role: Role; userName: string; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  useEscapeToClose(onClose);

  const results = useMemo(() => {
    const scoped = scopedReturnsForRole(role, userName);
    const q = query.trim().toLowerCase();
    const list = q
      ? scoped.filter(r =>
          r.clientName.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q))
      : scoped;
    return list.slice(0, 8);
  }, [query, role, userName]);

  const go = (id: string) => { navigate(`/returns/${id}`); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-[15vh] z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results[0]) go(results[0].id);
            }}
            placeholder="Search returns by client, type, or ID…"
            className="flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 flex-shrink-0"><X size={15} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No returns match "{query}".</p>
          ) : results.map(r => {
            const sc = stageConfig[r.stage];
            const uc = urgencyConfig[r.urgency];
            return (
              <button
                key={r.id}
                onClick={() => go(r.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.clientName}</p>
                  <p className="text-xs text-slate-400">{r.type} · {r.year}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${uc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${uc.dot}`} />{uc.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    {role === 'client' ? sc.clientLabel : sc.cpaLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> Open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

const SHORTCUT_NAV: Record<string, string> = {
  '1': '/dashboard', '2': '/returns', '3': '/messages', '4': '/tasks', '5': '/settings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { role, setRole, currentUser, breadcrumbs } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const typingInField = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (typingInField) return;

      if (e.key === '/') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && SHORTCUT_NAV[e.key]) {
        e.preventDefault();
        navigate(SHORTCUT_NAV[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navItems = NAV[role];
  const rc = ROLE_COLORS[role];
  const hasPersonalReturn = !!currentUser.personalReturnId && role !== 'client';

  const handleRoleSwitch = (newRole: Role) => {
    setRole(newRole);
    setShowPicker(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col select-none"
        style={{
          background: 'linear-gradient(160deg, #06101e 0%, #0b1628 45%, #0f1f38 100%)',
          boxShadow: '2px 0 24px 0 rgba(0,0,0,0.25)',
        }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #818cf8 0%, #4338ca 100%)', boxShadow: '0 4px 12px rgba(79,70,229,0.5)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[15px] tracking-tight">TaxFlow</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                style={{ background: 'rgba(129,140,248,0.12)', color: '#a5b4fc', border: '1px solid rgba(129,140,248,0.2)' }}>
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Role pill */}
        <div className="px-5 pb-4">
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${rc.badgeBg} ${rc.badgeText}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
            {rc.label}
          </div>
        </div>

        <div className="mx-5 mb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path
              || (path !== '/dashboard' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-100 ${
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={active ? { background: 'rgba(255,255,255,0.08)' } : {}}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                {active && (
                  <span className="absolute left-0 inset-y-2.5 w-[3px] rounded-full"
                    style={{ background: '#818cf8' }} />
                )}
                <Icon size={15} style={{ color: active ? '#a5b4fc' : undefined }} />
                {label}
              </Link>
            );
          })}

          {hasPersonalReturn && (
            <>
              <div className="mx-3 my-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Personal</p>
              <Link
                to={`/returns/${currentUser.personalReturnId}`}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-100 ${
                  location.pathname.includes(currentUser.personalReturnId!)
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={location.pathname.includes(currentUser.personalReturnId!)
                  ? { background: 'rgba(255,255,255,0.08)' } : {}}
              >
                {location.pathname.includes(currentUser.personalReturnId!) && (
                  <span className="absolute left-0 inset-y-2.5 w-[3px] rounded-full" style={{ background: '#818cf8' }} />
                )}
                <User size={15} style={{ color: location.pathname.includes(currentUser.personalReturnId!) ? '#a5b4fc' : undefined }} />
                My Personal Return
              </Link>
            </>
          )}
        </nav>

        {/* User / Role Switcher */}
        <div className="p-3 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all group"
            style={{ background: showPicker ? 'rgba(255,255,255,0.07)' : '' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!showPicker) (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div className={`w-8 h-8 rounded-full ${rc.bg} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}
              style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.15)' }}>
              {initials(currentUser.name)}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight" title={currentUser.name}>{currentUser.name}</p>
              <p className="text-[11px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }} title={currentUser.subtitle}>{currentUser.subtitle}</p>
            </div>
            <ChevronDown size={13} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>

          {showPicker && (
            <div className="absolute bottom-full left-2 mb-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
              style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.35)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} className="text-slate-400" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Switch Role</p>
                </div>
              </div>
              {ROLE_OPTIONS.map(opt => {
                const orc = ROLE_COLORS[opt.role];
                const isActive = role === opt.role;
                return (
                  <button
                    key={opt.role}
                    onClick={() => handleRoleSwitch(opt.role)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${orc.bg} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                      {initials(opt.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">{opt.name}</p>
                        {opt.personalReturnId && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#f0fdf9', color: '#0d9488', border: '1px solid #99f6e4' }}>
                            +personal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{opt.subtitle}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  <LogOut size={11} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-7 bg-white/90 backdrop-blur-sm"
          style={{ borderBottom: '1px solid #e8eaed', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          {/* Left: breadcrumbs */}
          <div className="flex items-center gap-1.5 min-w-0">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={bc.path + i}>
                {i > 0 && <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link to={bc.path}
                    className="text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium whitespace-nowrap">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-slate-800 truncate">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setPaletteOpen(true)}
              title="Search returns (⌘K)"
              className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Search size={15} />
              <span className="hidden lg:inline text-[10px] font-semibold border border-slate-200 rounded px-1 py-0.5 text-slate-400">⌘K</span>
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard shortcuts (?)"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <HelpCircle size={15} />
            </button>
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell size={15} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <div className="flex items-center gap-2.5 pl-1">
              <div className={`w-7 h-7 rounded-full ${rc.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                {initials(currentUser.name)}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden lg:block">{currentUser.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {paletteOpen && (
        <CommandPalette role={role} userName={currentUser.name} onClose={() => setPaletteOpen(false)} />
      )}

      {shortcutsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4" onClick={() => setShortcutsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Keyboard Shortcuts</p>
              <button onClick={() => setShortcutsOpen(false)} className="text-slate-300 hover:text-slate-500"><X size={15} /></button>
            </div>
            <div className="p-4 space-y-2 text-sm">
              {[
                ['⌘K / Ctrl+K', 'Open command palette'],
                ['/', 'Open command palette'],
                ['⌘1', 'Go to Dashboard'],
                ['⌘2', 'Go to Returns'],
                ['⌘3', 'Go to Messages'],
                ['⌘4', 'Go to Tasks'],
                ['⌘5', 'Go to Settings'],
                ['Esc', 'Close dialog'],
                ['?', 'Show this help'],
              ].map(([keys, desc]) => (
                <div key={keys} className="flex items-center justify-between">
                  <span className="text-slate-600">{desc}</span>
                  <kbd className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">{keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
