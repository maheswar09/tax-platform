import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Filter, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import { scopedReturnsForRole } from '../data/mockData';
import type { TaxReturn, Thread } from '../data/mockData';

interface ThreadRow {
  ret: TaxReturn;
  thread: Thread;
}

export default function MessagesPage() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const ctx = useReturnsData();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard' }, { label: 'Messages', path: '/messages' }]);
  }, [role]);

  const myOwnerKey = role === 'client' || role === 'business_owner' ? 'client' : 'cpa';

  const rows: ThreadRow[] = useMemo(() => {
    const scoped = scopedReturnsForRole(role, currentUser.name);
    const list: ThreadRow[] = [];
    for (const ret of scoped) {
      for (const thread of ctx.getThreads(ret.id)) {
        list.push({ ret, thread });
      }
    }
    return list.sort((a, b) => {
      const aLast = a.thread.messages[a.thread.messages.length - 1]?.timestamp ?? a.thread.createdAt;
      const bLast = b.thread.messages[b.thread.messages.length - 1]?.timestamp ?? b.thread.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    });
  }, [role, currentUser.name, ctx]);

  const filtered = rows.filter(({ thread }) => {
    if (statusFilter === 'open' && thread.isResolved) return false;
    if (statusFilter === 'resolved' && !thread.isResolved) return false;
    if (ownerFilter === 'mine' && thread.ownerAction !== myOwnerKey) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">Conversations across {role === 'client' ? 'your return' : 'all your returns'}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-slate-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
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
          <MessageSquare size={24} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No conversations here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ ret, thread }) => {
            const lastMsg = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={`${ret.id}-${thread.id}`}
                onClick={() => navigate(`/returns/${ret.id}?tab=messages`)}
                className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 p-3.5 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare size={13} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-slate-800">{ret.clientName}</p>
                    {thread.isResolved ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                        <CheckCircle2 size={9} /> Resolved
                      </span>
                    ) : thread.ownerAction !== 'none' && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        thread.ownerAction === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {thread.ownerAction === 'client' ? 'Client owns' : 'CPA owns'}
                      </span>
                    )}
                    {thread.priority === 'high' && !thread.isResolved && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-700 truncate">{thread.title}</p>
                  {lastMsg && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {lastMsg.author}: {lastMsg.content}
                    </p>
                  )}
                </div>
                <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
