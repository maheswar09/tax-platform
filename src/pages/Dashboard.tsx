import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, AlertTriangle, MessageSquare, Clock, ArrowRight, Sparkles, CheckCircle2, Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import {
  sampleReturn, stageConfig, urgencyConfig, scopedReturnsForRole,
} from '../data/mockData';
import type { TaxReturn } from '../data/mockData';

function StatTile({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number;
  tone: 'slate' | 'amber' | 'red' | 'teal';
}) {
  const toneMap = {
    slate: { chip: 'bg-slate-600', text: 'text-slate-500' },
    amber: { chip: 'bg-amber-500', text: 'text-amber-600' },
    red:   { chip: 'bg-red-500',   text: 'text-red-600' },
    teal:  { chip: 'bg-indigo-600',  text: 'text-indigo-600' },
  };
  const t = toneMap[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${t.chip} flex items-center justify-center shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-3xl font-extrabold tabular-nums text-slate-900">{value}</p>
      </div>
      <p className={`mt-3 text-xs font-semibold uppercase tracking-wide ${t.text}`}>{label}</p>
    </div>
  );
}

function ReturnRow({ ret, role, reason }: { ret: TaxReturn; role: string; reason?: { text: string; owner: 'client' | 'cpa' | 'none' } }) {
  const navigate = useNavigate();
  const ctx = useReturnsData();
  const sc = stageConfig[ret.stage];
  const uc = urgencyConfig[ret.urgency];
  const openThreadCount = ctx.getThreads(ret.id).filter(t => !t.isResolved).length;
  const targetTab = reason?.owner ? 'messages' : 'fields';

  return (
    <button
      onClick={() => navigate(`/returns/${ret.id}${reason ? `?tab=${targetTab}` : ''}`)}
      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 p-3 text-left transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate">{ret.clientName}</p>
          <span className="text-xs text-slate-400">{ret.type}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
            {role === 'client' ? sc.clientLabel : sc.cpaLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {reason ? (
            <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
              {reason.owner === 'client'
                ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex-shrink-0">Client owns</span>
                : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 flex-shrink-0">CPA owns</span>}
              <span className="truncate">{reason.text}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Updated {new Date(ret.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {openThreadCount > 0 && !reason && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <MessageSquare size={10} /> {openThreadCount} open
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {role !== 'client' && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${uc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${uc.dot}`} />{uc.label}
          </span>
        )}
        <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const navigate = useNavigate();
  const ctx = useReturnsData();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard' }]);
  }, [role]);

  const scoped: TaxReturn[] = scopedReturnsForRole(role, currentUser.name);

  // Preparer filter is only meaningful where multiple preparers are visible.
  const canFilterByPreparer = ['cpa', 'reviewer', 'admin'].includes(role);
  const [preparerFilter, setPreparerFilter] = useState('all');
  const preparers = [...new Set(scoped.map(r => ctx.getPreparer(r.id, r.preparer)))].sort();
  const filtered = canFilterByPreparer && preparerFilter !== 'all'
    ? scoped.filter(r => ctx.getPreparer(r.id, r.preparer) === preparerFilter)
    : scoped;

  const inProgress = filtered.filter(r => ['gathering_documents', 'under_review', 'corrections_needed', 'client_review'].includes(r.stage)).length;
  const needsAttention = filtered.filter(r => r.blockers.length > 0 || ctx.getThreads(r.id).some(t => !t.isResolved));
  const overdue = filtered.filter(r => r.urgency === 'critical' && !['approved', 'filed'].includes(r.stage)).length;
  const openThreads = filtered.reduce((acc, r) => acc + ctx.getThreads(r.id).filter(t => !t.isResolved).length, 0);

  // Client role: surface exactly what's blocking *them*, by name, from thread ownership.
  const myActionItems = role === 'client'
    ? scoped.flatMap(r => ctx.getThreads(r.id).filter(t => !t.isResolved && t.ownerAction === 'client').map(t => ({ ret: r, thread: t })))
    : [];

  const attentionRows = needsAttention
    .sort((a, b) => urgencyConfig[a.urgency].order - urgencyConfig[b.urgency].order)
    .slice(0, 6);

  const recentRows = [...filtered]
    .filter(r => !['approved', 'filed'].includes(r.stage))
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 6);

  const titleByRole: Record<string, string> = {
    cpa: 'Dashboard', client: 'My Return', reviewer: 'Review Queue',
    admin: 'Firm Overview', business_owner: 'My Entities', seasonal_staff: 'My Workload',
  };
  const subtitleByRole: Record<string, string> = {
    cpa: `Welcome back, ${currentUser.name.split(' ')[0]}. Here's what needs attention.`,
    client: 'Track your return and respond to anything we need from you.',
    reviewer: 'Returns and fields awaiting your sign-off.',
    admin: 'Firm-wide activity across all preparers.',
    business_owner: 'Status of your entity and personal returns.',
    seasonal_staff: 'Your assigned returns only.',
  };

  // Feature the showcase return (richest field-level data) when it's in scope.
  const showcase = scoped.find(r => r.id === sampleReturn.id);
  const showcaseNeedsApproval = showcase && ctx.getFields(showcase.id).some(f => f.state === 'needs_approval' || f.state === 'ai_generated');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titleByRole[role] ?? 'Dashboard'}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitleByRole[role]}</p>
      </div>

      {/* Showcase CTA — the one return with full AI traceability data */}
      {showcase && role !== 'client' && showcaseNeedsApproval && (
        <button
          onClick={() => navigate(`/returns/${showcase.id}?tab=fields`)}
          className="w-full flex items-center justify-between gap-4 rounded-2xl p-4 text-left bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 hover:border-violet-300 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-violet-200 flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {showcase.clientName} has AI-extracted fields awaiting your review
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Low-confidence K-1 income, a needs-approval mortgage deduction, and an ambiguous 1099-DIV — with full source traceability.
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-violet-500 flex-shrink-0" />
        </button>
      )}

      {/* Client: direct action items */}
      {role === 'client' && myActionItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500" /> We need something from you
          </h2>
          <div className="space-y-2">
            {myActionItems.map(({ ret, thread }) => (
              <button
                key={thread.id}
                onClick={() => navigate(`/returns/${ret.id}?tab=messages`)}
                className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 p-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{thread.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{thread.linkedIssue}</p>
                </div>
                <ArrowRight size={13} className="text-amber-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={FileText} label={role === 'client' ? 'My Returns' : 'Total Returns'} value={filtered.length} tone="slate" />
        <StatTile icon={Clock} label="In Progress" value={inProgress} tone="teal" />
        <StatTile icon={AlertTriangle} label="Needs Attention" value={needsAttention.length} tone="amber" />
        <StatTile icon={MessageSquare} label="Open Threads" value={openThreads} tone={overdue > 0 ? 'red' : 'slate'} />
      </div>

      {/* Do These First */}
      {role !== 'client' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Do These First
            </h2>
            {canFilterByPreparer && preparers.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Filter size={11} className="text-slate-400" />
                <select
                  value={preparerFilter}
                  onChange={e => setPreparerFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="all">All Preparers</option>
                  {preparers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>
          {attentionRows.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={22} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-sm text-slate-500">Everything's on track.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attentionRows.map(r => {
                const openThread = ctx.getThreads(r.id).find(t => !t.isResolved);
                const reason = r.blockers[0]
                  ? { text: r.blockers[0], owner: 'none' as const }
                  : openThread
                  ? { text: openThread.title, owner: openThread.ownerAction }
                  : undefined;
                return <ReturnRow key={r.id} ret={r} role={role} reason={reason} />;
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent returns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">{role === 'client' ? 'My Return' : 'Recent Returns'}</h2>
          <button onClick={() => navigate('/returns')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </button>
        </div>
        {recentRows.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No active returns.</p>
        ) : (
          <div className="space-y-2">
            {recentRows.map(r => <ReturnRow key={r.id} ret={r} role={role} />)}
          </div>
        )}
      </div>
    </div>
  );
}
