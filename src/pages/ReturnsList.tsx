import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, ChevronRight, AlertTriangle, ArrowUpDown,
  ChevronLeft, Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import { allReturns, stageConfig, urgencyConfig, scopedReturnsForRole, fieldStateConfig } from '../data/mockData';
import { FIELD_STATE_ICONS } from '../lib/fieldIcons';
import type { TaxReturn, ReturnStage, FieldState } from '../data/mockData';

type SortKey = 'urgency' | 'deadline' | 'client' | 'stage';

const PAGE_SIZE = 25;

function sortReturns(returns: TaxReturn[], key: SortKey, dir: 'asc' | 'desc') {
  const stageOrder: Record<ReturnStage, number> = {
    gathering_documents: 0, under_review: 1, corrections_needed: 2,
    client_review: 3, approved: 4, filed: 5,
  };
  return [...returns].sort((a, b) => {
    let cmp = 0;
    if (key === 'urgency')  cmp = urgencyConfig[a.urgency].order - urgencyConfig[b.urgency].order;
    if (key === 'deadline') cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (key === 'client')   cmp = a.clientName.localeCompare(b.clientName);
    if (key === 'stage')    cmp = stageOrder[a.stage] - stageOrder[b.stage];
    return dir === 'asc' ? cmp : -cmp;
  });
}

// Mini affordance summary per return row (Ch08 — shown across screens).
// Reads live field state from the shared context so it never goes stale
// against decisions made in the AI Review Queue or the return itself.
const SUMMARY_STATES: FieldState[] = ['ai_generated', 'needs_approval', 'rejected', 'corrected'];

function FieldStateSummary({ returnId }: { returnId: string }) {
  const ctx = useReturnsData();
  const fields = ctx.getFields(returnId);
  if (fields.length === 0) return null;

  const counts = SUMMARY_STATES
    .map(state => ({ state, ...fieldStateConfig[state], count: fields.filter(f => f.state === state).length }))
    .filter(c => c.count > 0);
  if (counts.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {counts.map(c => {
        const Icon = FIELD_STATE_ICONS[c.state];
        return (
          <span key={c.state} className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${c.badgeBg} ${c.badge}`}>
            <Icon size={9} />{c.count} {c.label}
          </span>
        );
      })}
    </div>
  );
}

export default function ReturnsList() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const navigate = useNavigate();
  const ctx = useReturnsData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reassignTo, setReassignTo] = useState('');
  const canBulkReassign = ['cpa', 'admin', 'reviewer'].includes(role);

  // Filters/sort/page are seeded from the URL so browser back/forward and
  // refresh restore exactly where the user left off (context preservation).
  const [search, setSearch]           = useState(searchParams.get('q') ?? '');
  const [filterStage, setFilterStage] = useState(searchParams.get('stage') ?? 'all');
  const [filterType, setFilterType]   = useState(searchParams.get('type') ?? 'all');
  const [filterPreparer, setFilterPreparer] = useState(searchParams.get('preparer') ?? 'all');
  const [sortKey, setSortKey]         = useState<SortKey>((searchParams.get('sort') as SortKey) || 'urgency');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>((searchParams.get('dir') as 'asc' | 'desc') || 'asc');
  const [page, setPage]               = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: role === 'client' ? 'My Documents' : 'Returns', path: '/returns' },
    ]);
  }, [role]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterStage, filterType, filterPreparer, sortKey, sortDir]);

  // Keep filters/sort/page in the URL.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    if (filterStage !== 'all') next.set('stage', filterStage);
    if (filterType !== 'all') next.set('type', filterType);
    if (filterPreparer !== 'all') next.set('preparer', filterPreparer);
    if (sortKey !== 'urgency') next.set('sort', sortKey);
    if (sortDir !== 'asc') next.set('dir', sortDir);
    if (page !== 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [search, filterStage, filterType, filterPreparer, sortKey, sortDir, page]);

  const preparers = [...new Set(allReturns.map(r => ctx.getPreparer(r.id, r.preparer)))].sort();

  const baseList = scopedReturnsForRole(role, currentUser.name);

  const filtered = sortReturns(
    baseList.filter(r => {
      const q = search.toLowerCase();
      const preparer = ctx.getPreparer(r.id, r.preparer);
      if (q && !r.clientName.toLowerCase().includes(q) && !r.type.toLowerCase().includes(q)) return false;
      if (filterStage    !== 'all' && r.stage    !== filterStage)    return false;
      if (filterType     !== 'all' && r.type     !== filterType)     return false;
      if (filterPreparer !== 'all' && preparer   !== filterPreparer) return false;
      return true;
    }),
    sortKey, sortDir,
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors">
      {label}
      <ArrowUpDown size={10} className={sortKey === k ? 'text-indigo-500' : 'text-slate-300'} />
    </button>
  );

  // Stage distribution mini-bar (affordance demo — Ch08)
  const stageCounts = Object.keys(stageConfig).map(s => ({
    stage: s as ReturnStage,
    count: filtered.filter(r => r.stage === s).length,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {role === 'client' ? 'My Documents' : role === 'seasonal_staff' ? 'My Returns' : 'Returns'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} returns</p>
        </div>

        {/* Stage distribution (mini-affordance across list screen — Ch08) */}
        {role !== 'client' && (
          <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            {stageCounts.map(({ stage, count }) => {
              const sc = stageConfig[stage];
              return count > 0 ? (
                <button key={stage} onClick={() => setFilterStage(filterStage === stage ? 'all' : stage)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                    filterStage === stage ? `${sc.bg} ${sc.color} font-semibold` : 'text-slate-500 hover:bg-slate-100'
                  }`}>
                  {count} {sc.cpaLabel}
                </button>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative min-w-48 flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search clients or types…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200" />
        </div>
        {role !== 'client' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-slate-400" />
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">All Stages</option>
              {Object.entries(stageConfig).map(([k, v]) => <option key={k} value={k}>{v.cpaLabel}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">All Types</option>
              {['1040','1065','1120S','1041'].map(t => <option key={t}>{t}</option>)}
            </select>
            {role !== 'seasonal_staff' && (
              <select value={filterPreparer} onChange={e => setFilterPreparer(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
                <option value="all">All Preparers</option>
                {preparers.map(p => <option key={p}>{p}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Bulk reassign toolbar */}
      {canBulkReassign && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
          <Users size={13} className="text-indigo-600" />
          <span className="text-xs font-medium text-indigo-800">{selectedIds.size} selected</span>
          <select value={reassignTo} onChange={e => setReassignTo(e.target.value)}
            className="text-xs border border-indigo-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
            <option value="">Reassign to…</option>
            {preparers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            disabled={!reassignTo}
            onClick={() => {
              selectedIds.forEach(id => ctx.reassignPreparer(id, reassignTo));
              setSelectedIds(new Set());
              setReassignTo('');
            }}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reassign {selectedIds.size}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-indigo-700 hover:underline ml-auto">Clear</button>
        </div>
      )}

      {/* Active filter chips */}
      {(search || filterStage !== 'all' || filterType !== 'all' || filterPreparer !== 'all') && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-slate-500">Filtered:</span>
          {search && (
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              "{search}" <button onClick={() => setSearch('')} className="hover:text-indigo-900 font-bold">×</button>
            </span>
          )}
          {filterStage !== 'all' && (
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              {stageConfig[filterStage as ReturnStage].cpaLabel}
              <button onClick={() => setFilterStage('all')} className="hover:text-indigo-900 font-bold">×</button>
            </span>
          )}
          {filterType !== 'all' && (
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              {filterType} <button onClick={() => setFilterType('all')} className="hover:text-indigo-900 font-bold">×</button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {canBulkReassign && (
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={pageData.length > 0 && pageData.every(r => selectedIds.has(r.id))}
                    onChange={e => {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        pageData.forEach(r => e.target.checked ? next.add(r.id) : next.delete(r.id));
                        return next;
                      });
                    }}
                  />
                </th>
              )}
              <th className="text-left px-4 py-3"><SortBtn k="client" label="Client" /></th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3"><SortBtn k="stage" label="Stage" /></th>
              {role !== 'client' && <th className="text-left px-4 py-3"><SortBtn k="urgency" label="Priority" /></th>}
              {role !== 'client' && role !== 'seasonal_staff' && (
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Preparer</th>
              )}
              <th className="text-left px-4 py-3"><SortBtn k="deadline" label="Deadline" /></th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pageData.map(r => {
              const sc = stageConfig[r.stage];
              const uc = urgencyConfig[r.urgency];
              const days = Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 86400000);
              const preparer = ctx.getPreparer(r.id, r.preparer);
              return (
                <tr key={r.id} onClick={() => navigate(`/returns/${r.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer group transition-colors">
                  {canBulkReassign && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => setSelectedIds(prev => {
                          const next = new Set(prev);
                          next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                          return next;
                        })}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{r.clientName}</p>
                    {r.blockers[0] && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={9} />{r.blockers[0]}
                      </p>
                    )}
                    <FieldStateSummary returnId={r.id} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-medium">{r.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      {role === 'client' ? sc.clientLabel : sc.cpaLabel}
                    </span>
                  </td>
                  {role !== 'client' && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${uc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${uc.dot}`} />{uc.label}
                      </span>
                    </td>
                  )}
                  {role !== 'client' && role !== 'seasonal_staff' && (
                    <td className="px-4 py-3 text-slate-400 text-xs">{preparer}</td>
                  )}
                  <td className="px-4 py-3 text-xs">
                    <span className={days < 30 ? 'text-red-600 font-semibold' : 'text-slate-400'}>
                      {new Date(r.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      {days < 30 && <span className="text-red-500"> ({days}d)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={13} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {pageData.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No returns match your filters.</p>
            <button onClick={() => { setSearch(''); setFilterStage('all'); setFilterType('all'); setFilterPreparer('all'); }}
              className="text-indigo-600 text-xs mt-1 hover:underline">Clear filters</button>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {filtered.length} returns · page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    page === pageNum ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
