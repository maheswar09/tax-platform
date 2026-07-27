import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Filter, CheckCircle2, ArrowRight, CheckCheck, Undo2, ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import {
  permissionsFor, messageRoleFor, verifyField, approveField, rejectField, overrideField, buildClarificationThread,
} from '../lib/fieldActions';
import { scopedReturnsForRole, fieldStateConfig, urgencyConfig } from '../data/mockData';
import { FIELD_STATE_ICONS } from '../lib/fieldIcons';
import type { ReturnField, TaxDocument, TaxReturn } from '../data/mockData';
import { SourcePanel, OverrideModal, RejectModal } from '../components/FieldReview';

interface QueueItem {
  key: string;
  field: ReturnField;
  ret: TaxReturn;
}

const REVIEWABLE_STATES: ReturnField['state'][] = ['ai_generated', 'needs_approval', 'rejected'];

function priorityRank(item: QueueItem): number {
  if (item.field.state === 'rejected') return 0;
  if (item.field.state === 'needs_approval') return 1;
  const conf = item.field.aiMeta?.confidence ?? 1;
  return 2 + conf; // lower confidence ai_generated fields sort earlier within their band
}

export default function AIReviewQueue() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const ctx = useReturnsData();
  const navigate = useNavigate();
  const perms = permissionsFor(role);
  const msgRole = messageRoleFor(role);

  const [stateFilter, setStateFilter] = useState<'all' | ReturnField['state']>('all');
  const [confFilter, setConfFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [returnFilter, setReturnFilter] = useState('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [undoFn, setUndoFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard' }, { label: 'AI Review Queue', path: '/ai-review' }]);
  }, [role]);

  const allItems: QueueItem[] = useMemo(() => {
    const scoped = scopedReturnsForRole(role, currentUser.name);
    const items: QueueItem[] = [];
    for (const ret of scoped) {
      for (const f of ctx.getFields(ret.id)) {
        if (REVIEWABLE_STATES.includes(f.state)) {
          items.push({ key: `${ret.id}:${f.id}`, field: f, ret });
        }
      }
    }
    return items.sort((a, b) => {
      const pr = priorityRank(a) - priorityRank(b);
      if (pr !== 0) return pr;
      return urgencyConfig[a.ret.urgency].order - urgencyConfig[b.ret.urgency].order;
    });
  }, [role, currentUser.name, ctx]);

  const returnOptions = useMemo(() => [...new Set(allItems.map(i => i.ret.clientName))].sort(), [allItems]);

  const filtered = allItems.filter(i => {
    if (stateFilter !== 'all' && i.field.state !== stateFilter) return false;
    if (returnFilter !== 'all' && i.ret.clientName !== returnFilter) return false;
    if (confFilter !== 'all' && i.field.aiMeta) {
      const c = i.field.aiMeta.confidence * 100;
      if (confFilter === 'low' && c >= 75) return false;
      if (confFilter === 'medium' && (c < 75 || c >= 90)) return false;
      if (confFilter === 'high' && c < 90) return false;
    }
    return true;
  });

  const selected = filtered.find(i => i.key === selectedKey) ?? filtered[0] ?? null;

  const showToast = (message: string, undo?: () => void) => {
    setToast(message);
    setUndoFn(() => undo ?? null);
    setTimeout(() => { setToast(null); setUndoFn(null); }, 30000);
  };

  const goNext = (fromKey: string) => {
    const idx = filtered.findIndex(i => i.key === fromKey);
    const next = filtered[idx + 1] ?? filtered.find(i => i.key !== fromKey) ?? null;
    setSelectedKey(next?.key ?? null);
  };

  const handleVerify = (item: QueueItem) => {
    const prev = verifyField(ctx, item.ret.id, item.field);
    showToast(`Verified "${item.field.label}"`, prev && (() => ctx.setField(item.ret.id, prev)));
    goNext(item.key);
  };
  const handleApprove = (item: QueueItem) => {
    const prev = approveField(ctx, item.ret.id, item.field);
    showToast(`Approved "${item.field.label}"`, prev && (() => ctx.setField(item.ret.id, prev)));
    goNext(item.key);
  };
  const handleReject = (item: QueueItem, reason: string) => {
    const prev = rejectField(ctx, item.ret.id, item.field, reason);
    showToast(`Rejected "${item.field.label}"`, prev && (() => ctx.setField(item.ret.id, prev)));
    setShowRejectModal(false);
    goNext(item.key);
  };
  const handleOverride = (item: QueueItem, val: string, reason: string) => {
    const prev = overrideField(ctx, item.ret.id, item.field, val, reason, currentUser.name);
    showToast(`Override saved for "${item.field.label}"`, prev && (() => ctx.setField(item.ret.id, prev)));
    setShowOverrideModal(false);
    goNext(item.key);
  };
  const handleAsk = (item: QueueItem) => {
    const thread = buildClarificationThread(item.field, role !== 'client', currentUser.name, msgRole);
    ctx.addThread(item.ret.id, thread);
    navigate(`/returns/${item.ret.id}?tab=messages`);
  };

  const toggleBulk = (key: string) => {
    setSelectedForBulk(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const bulkItems = filtered.filter(i => selectedForBulk.has(i.key));
  const bulkVerifyCount = bulkItems.filter(i => i.field.state === 'ai_generated').length;
  const bulkApproveCount = bulkItems.filter(i => i.field.state === 'needs_approval').length;

  const runBulkVerify = () => {
    bulkItems.filter(i => i.field.state === 'ai_generated').forEach(i => verifyField(ctx, i.ret.id, i.field));
    showToast(`Verified ${bulkVerifyCount} field${bulkVerifyCount === 1 ? '' : 's'}`);
    setSelectedForBulk(new Set());
  };
  const runBulkApprove = () => {
    bulkItems.filter(i => i.field.state === 'needs_approval').forEach(i => approveField(ctx, i.ret.id, i.field));
    showToast(`Approved ${bulkApproveCount} field${bulkApproveCount === 1 ? '' : 's'}`);
    setSelectedForBulk(new Set());
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <Sparkles size={19} className="text-violet-500" /> AI Review Queue
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} fields need a decision, prioritized by risk.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-slate-400" />
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">All states</option>
              <option value="rejected">Rejected</option>
              <option value="needs_approval">Needs Approval</option>
              <option value="ai_generated">AI Extracted</option>
            </select>
            <select value={confFilter} onChange={e => setConfFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
              <option value="all">Any confidence</option>
              <option value="low">Low (&lt;75%)</option>
              <option value="medium">Medium (75–89%)</option>
              <option value="high">High (90%+)</option>
            </select>
            {returnOptions.length > 1 && (
              <select value={returnFilter} onChange={e => setReturnFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400">
                <option value="all">All returns</option>
                {returnOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {selectedForBulk.size > 0 && (perms.canVerify || perms.canSignOff) && (
          <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
            <span className="text-xs font-medium text-indigo-800">{selectedForBulk.size} selected</span>
            {bulkVerifyCount > 0 && perms.canVerify && (
              <button onClick={runBulkVerify} className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                Verify {bulkVerifyCount}
              </button>
            )}
            {bulkApproveCount > 0 && perms.canSignOff && (
              <button onClick={runBulkApprove} className="text-xs font-semibold px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
                Approve {bulkApproveCount}
              </button>
            )}
            <button onClick={() => setSelectedForBulk(new Set())} className="text-xs text-indigo-700 hover:underline ml-auto">Clear</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Queue list */}
        <div className="w-96 flex-shrink-0 border-r border-slate-200 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm text-slate-500">Queue is clear.</p>
            </div>
          ) : filtered.map(item => {
            const fsc = fieldStateConfig[item.field.state];
            const StateIcon = FIELD_STATE_ICONS[item.field.state];
            const conf = item.field.aiMeta ? Math.round(item.field.aiMeta.confidence * 100) : null;
            const isSelected = selected?.key === item.key;
            return (
              <div
                key={item.key}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-50 border-indigo-300 shadow-sm ring-2 ring-indigo-400' : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedKey(item.key)}
              >
                <div className="flex items-start gap-2">
                  {(item.field.state === 'ai_generated' && perms.canVerify) || (item.field.state === 'needs_approval' && perms.canSignOff) ? (
                    <input
                      type="checkbox"
                      checked={selectedForBulk.has(item.key)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleBulk(item.key)}
                      className="mt-1 flex-shrink-0"
                    />
                  ) : <div className="w-3.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${fsc.badgeBg} ${fsc.badge}`}>
                        <StateIcon size={10} /> {fsc.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.ret.clientName}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">L{item.field.lineNumber} · {item.field.label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-mono text-slate-500">
                        {typeof item.field.value === 'number' ? `$${item.field.value.toLocaleString()}` : item.field.value}
                      </p>
                      {conf !== null && (
                        <span className={`text-[10px] font-semibold ${conf >= 90 ? 'text-emerald-600' : conf >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {conf}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail + evidence */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select an item from the queue.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                <button
                  onClick={() => navigate(`/returns/${selected.ret.id}?tab=fields&field=${selected.field.id}`)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <ExternalLink size={11} /> Open in {selected.ret.clientName}'s return
                </button>
                <button
                  onClick={() => goNext(selected.key)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                >
                  Skip to next <ArrowRight size={11} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SourcePanel
                  field={selected.field}
                  role={role}
                  documents={selected.ret.documents as TaxDocument[]}
                  onClose={() => setSelectedKey(null)}
                  onGoToDoc={() => navigate(`/returns/${selected.ret.id}?tab=documents`)}
                  onVerify={() => handleVerify(selected)}
                  onApprove={() => handleApprove(selected)}
                  onReject={() => setShowRejectModal(true)}
                  onOverride={() => setShowOverrideModal(true)}
                  onAskClarification={() => handleAsk(selected)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showOverrideModal && selected && (
        <OverrideModal
          field={selected.field}
          onClose={() => setShowOverrideModal(false)}
          onSave={(val, reason) => handleOverride(selected, val, reason)}
        />
      )}
      {showRejectModal && selected && (
        <RejectModal
          field={selected.field}
          onClose={() => setShowRejectModal(false)}
          onSave={(reason) => handleReject(selected, reason)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <CheckCheck size={14} className="text-emerald-400" />
          {toast}
          {undoFn && (
            <button
              onClick={() => { undoFn(); setToast(null); setUndoFn(null); }}
              className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-semibold underline underline-offset-2"
            >
              <Undo2 size={12} /> Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
