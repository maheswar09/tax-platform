import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, MessageSquare, Sparkles, ArrowRight, Filter, CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import { scopedReturnsForRole, urgencyConfig, fieldStateConfig } from '../data/mockData';

type TaskType = 'blocker' | 'clarification' | 'ai_review';
type Owner = 'client' | 'cpa' | 'unassigned';

interface TaskItem {
  id: string;
  type: TaskType;
  title: string;
  subtitle: string;
  returnId: string;
  clientName: string;
  owner: Owner;
  urgency: 'critical' | 'high' | 'normal' | 'low';
  deadline: string;
  link: string;
}

const TYPE_META: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  blocker:       { label: 'Blocker',       icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  clarification: { label: 'Clarification', icon: MessageSquare, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ai_review:     { label: 'AI Review',     icon: Sparkles,      color: 'text-violet-600 bg-violet-50 border-violet-200' },
};

export default function TasksPage() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const ctx = useReturnsData();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard' }, { label: 'Tasks', path: '/tasks' }]);
  }, [role]);

  const myOwnerKey: Owner = role === 'client' || role === 'business_owner' ? 'client' : 'cpa';

  const tasks: TaskItem[] = useMemo(() => {
    const scoped = scopedReturnsForRole(role, currentUser.name);
    const items: TaskItem[] = [];

    for (const ret of scoped) {
      // Blockers
      ret.blockers.forEach((b, i) => {
        const looksClientOwned = /missing|not uploaded|pending from|no documents|no response|needed|unconfirmed/i.test(b);
        items.push({
          id: `blocker-${ret.id}-${i}`,
          type: 'blocker',
          title: b,
          subtitle: ret.clientName,
          returnId: ret.id,
          clientName: ret.clientName,
          owner: looksClientOwned ? 'client' : 'unassigned',
          urgency: ret.urgency,
          deadline: ret.deadline,
          link: `/returns/${ret.id}`,
        });
      });

      // Open threads needing a decision
      for (const t of ctx.getThreads(ret.id)) {
        if (t.isResolved || t.ownerAction === 'none') continue;
        items.push({
          id: `thread-${ret.id}-${t.id}`,
          type: 'clarification',
          title: t.title,
          subtitle: t.linkedIssue ?? ret.clientName,
          returnId: ret.id,
          clientName: ret.clientName,
          owner: t.ownerAction,
          urgency: t.priority === 'high' ? 'high' : ret.urgency,
          deadline: ret.deadline,
          link: `/returns/${ret.id}?tab=messages`,
        });
      }

      // AI fields needing a decision
      for (const f of ctx.getFields(ret.id)) {
        if (f.state !== 'needs_approval' && f.state !== 'rejected') continue;
        items.push({
          id: `field-${ret.id}-${f.id}`,
          type: 'ai_review',
          title: `${fieldStateConfig[f.state].label}: ${f.label}`,
          subtitle: `Line ${f.lineNumber} · ${ret.clientName}`,
          returnId: ret.id,
          clientName: ret.clientName,
          owner: 'cpa',
          urgency: ret.urgency,
          deadline: ret.deadline,
          link: `/returns/${ret.id}?tab=fields&field=${f.id}`,
        });
      }
    }

    return items.sort((a, b) => urgencyConfig[a.urgency].order - urgencyConfig[b.urgency].order);
  }, [role, currentUser.name, ctx]);

  const filtered = tasks.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (ownerFilter === 'mine' && t.owner !== myOwnerKey) return false;
    return true;
  });

  const counts = {
    all: tasks.length,
    blocker: tasks.filter(t => t.type === 'blocker').length,
    clarification: tasks.filter(t => t.type === 'clarification').length,
    ai_review: tasks.filter(t => t.type === 'ai_review').length,
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {role === 'client' ? 'Things we need from you, and what we\'re working on.' : 'Every open item across your returns, in one place.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-slate-400" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
            <option value="all">All types ({counts.all})</option>
            <option value="blocker">Blockers ({counts.blocker})</option>
            <option value="clarification">Clarifications ({counts.clarification})</option>
            <option value="ai_review">AI Review ({counts.ai_review})</option>
          </select>
          <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
            <option value="all">Everyone</option>
            <option value="mine">Assigned to me</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 size={26} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-sm text-slate-500">Nothing open right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const meta = TYPE_META[t.type];
            const Icon = meta.icon;
            const uc = urgencyConfig[t.urgency];
            return (
              <button
                key={t.id}
                onClick={() => navigate(t.link)}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 p-3.5 text-left transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                    {t.owner !== 'unassigned' && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        t.owner === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {t.owner === 'client' ? 'Client owns' : 'CPA owns'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate mt-1">{t.title}</p>
                  <p className="text-xs text-slate-400 truncate">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${uc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${uc.dot}`} />{uc.label}
                  </span>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
