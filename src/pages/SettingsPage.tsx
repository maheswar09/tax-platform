import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Bell, ArrowRight, Check, X } from 'lucide-react';
import { useApp, ROLE_OPTIONS } from '../context/AppContext';
import { permissionsFor } from '../lib/fieldActions';
import type { Role } from '../data/mockData';

const ACTIONS: Array<{ key: keyof ReturnType<typeof permissionsFor>; label: string; description: string }> = [
  { key: 'canVerify',   label: 'Verify & Accept',       description: 'Accept a clean AI extraction (ai_generated → verified)' },
  { key: 'canSignOff',  label: 'Approve (sign-off)',     description: 'Sign off a field flagged needs_approval — senior review only' },
  { key: 'canOverride', label: 'Override Value',         description: 'Replace an AI value with a corrected one' },
  { key: 'canReject',   label: 'Reject',                 description: 'Flag an AI extraction as wrong, pending correction' },
  { key: 'canAsk',      label: 'Ask a Question',         description: 'Request clarification from the other party' },
];

const ROLE_LABELS: Record<Role, string> = {
  cpa: 'CPA', client: 'Client', reviewer: 'Reviewer',
  admin: 'Admin', business_owner: 'Business Owner', seasonal_staff: 'Seasonal Staff',
};

export default function SettingsPage() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const navigate = useNavigate();

  const [emailOnResponse, setEmailOnResponse] = useState(true);
  const [emailOnBlocker, setEmailOnBlocker] = useState(true);
  const [showInternalByDefault, setShowInternalByDefault] = useState(role !== 'client');
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings', path: '/settings' }]);
  }, [role]);

  const myPerms = permissionsFor(role);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Signed in as {currentUser.name} · {ROLE_LABELS[role]}</p>
      </div>

      {/* My permissions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
          <ShieldCheck size={14} className="text-indigo-600" /> What you can do as {ROLE_LABELS[role]}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACTIONS.map(a => (
            <div key={a.key} className={`flex items-start gap-2 p-2.5 rounded-xl border ${
              myPerms[a.key] ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
            }`}>
              {myPerms[a.key]
                ? <Check size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                : <X size={13} className="text-slate-300 flex-shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${myPerms[a.key] ? 'text-emerald-800' : 'text-slate-400'}`}>{a.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Roles & Permissions</h2>
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr>
              <th className="text-left pb-2 font-semibold text-slate-500">Action</th>
              {ROLE_OPTIONS.map(o => (
                <th key={o.role} className={`text-center pb-2 font-semibold ${o.role === role ? 'text-indigo-700' : 'text-slate-500'}`}>
                  {ROLE_LABELS[o.role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map(a => (
              <tr key={a.key} className="border-t border-slate-100">
                <td className="py-2 text-slate-700 font-medium">{a.label}</td>
                {ROLE_OPTIONS.map(o => {
                  const allowed = permissionsFor(o.role)[a.key];
                  return (
                    <td key={o.role} className={`py-2 text-center ${o.role === role ? 'bg-indigo-50' : ''}`}>
                      {allowed
                        ? <Check size={13} className="text-emerald-600 mx-auto" />
                        : <X size={13} className="text-slate-300 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-400 mt-3">
          This matrix reflects the same permission logic enforced in the return review screens — a CPA can verify a clean extraction but cannot sign off a needs-approval field; only Reviewer and Admin can.
        </p>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
          <Bell size={14} className="text-slate-500" /> Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Email me when someone responds to a thread I own', checked: emailOnResponse, set: setEmailOnResponse },
            { label: 'Email me when a return I prepare gets a new blocker', checked: emailOnBlocker, set: setEmailOnBlocker },
            { label: 'Show internal notes by default', checked: showInternalByDefault, set: setShowInternalByDefault },
            { label: 'Compact list density', checked: compactMode, set: setCompactMode },
          ].map((pref, i) => (
            <label key={i} className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm text-slate-700">{pref.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={pref.checked}
                onClick={() => pref.set(!pref.checked)}
                className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 relative border ${
                  pref.checked ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-300 border-slate-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    pref.checked ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Interaction reference */}
      <button
        onClick={() => navigate('/affordances')}
        className="w-full flex items-center justify-between gap-3 rounded-2xl p-4 text-left bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">Interaction Reference</p>
          <p className="text-xs text-slate-500 mt-0.5">See every field state and its visual affordance in one place.</p>
        </div>
        <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
      </button>
    </div>
  );
}
