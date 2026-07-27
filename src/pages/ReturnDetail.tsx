import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, ChevronRight, FileText, MessageSquare, Send,
  Eye, EyeOff, Clock, CheckCheck, ArrowLeft, Link2, Undo2, X, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import { messageRoleFor, verifyField, approveField, rejectField, overrideField, buildClarificationThread } from '../lib/fieldActions';
import { FIELD_STATE_ICONS } from '../lib/fieldIcons';
import { useEscapeToClose } from '../lib/useEscapeToClose';
import {
  allReturns, sampleReturn, alexPersonalReturn, stageConfig, STAGES, fieldStateConfig, urgencyConfig,
} from '../data/mockData';
import type { ReturnField, Thread, TaxDocument, Message, Role } from '../data/mockData';
import { SourcePanel, FieldRow, OverrideModal, RejectModal, DocExcerpt } from '../components/FieldReview';

// ─── Status Pipeline ──────────────────────────────────────────────────────────

function StatusPipeline({ stage, role }: { stage: string; role: string }) {
  const isClient = role === 'client';
  const stages = isClient
    ? ['gathering_documents', 'under_review', 'client_review', 'filed']
    : STAGES;
  const currentIdx = stages.indexOf(stage);

  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {stages.map((s, i) => {
        const sc = stageConfig[s as keyof typeof stageConfig];
        const done = i < currentIdx;
        const active = i === currentIdx;
        const label = isClient ? sc.clientLabel : sc.cpaLabel;
        return (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                         'bg-slate-200 text-slate-400'
              }`}>
                {done ? <CheckCircle2 size={12} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                active ? 'text-indigo-700' : done ? 'text-slate-500' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`w-6 h-0.5 mx-1.5 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Collaboration Panel ──────────────────────────────────────────────────────

function CollabPanel({
  threads, role, activeThreadId, onSelectThread,
  onGoToField, onGoToDoc, onSendMessage, onResolveThread,
}: {
  threads: Thread[];
  role: Role;
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onGoToField: (fieldId: string) => void;
  onGoToDoc:   (docId: string)   => void;
  onSendMessage: (threadId: string, content: string, isInternal: boolean) => void;
  onResolveThread: (threadId: string) => void;
}) {
  const [showInternal, setShowInternal] = useState(role !== 'client');
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const selected = threads.find(t => t.id === activeThreadId) ?? threads[0] ?? null;
  const visible = selected?.messages.filter(m => showInternal || !m.isInternal) ?? [];
  const msgRole = messageRoleFor(role);

  if (threads.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <MessageSquare size={28} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No conversations yet.</p>
          <p className="text-xs text-slate-400 mt-1">Messages linked to documents and fields will appear here.</p>
        </div>
      </div>
    );
  }

  const send = () => {
    if (!selected || !newMessage.trim()) return;
    onSendMessage(selected.id, newMessage.trim(), role === 'client' ? false : isInternal);
    setNewMessage('');
  };

  return (
    <div className="h-full flex flex-col text-sm">
      {/* Thread selector */}
      <div className="border-b border-slate-200 flex-shrink-0">
        <div className="p-3 flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">Conversations</span>
          {role !== 'client' && (
            <button
              onClick={() => setShowInternal(!showInternal)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${showInternal ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {showInternal ? <Eye size={10} /> : <EyeOff size={10} />}
              {showInternal ? 'Showing internal' : 'Internal hidden'}
            </button>
          )}
        </div>
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto">
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              className={`flex-shrink-0 text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                selected?.id === t.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {t.priority === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                {t.isResolved ? (
                  <span className="text-[9px] font-medium px-1 rounded bg-emerald-100 text-emerald-700">Resolved</span>
                ) : t.ownerAction !== 'none' && (
                  <span className={`text-[9px] font-medium px-1 rounded ${
                    t.ownerAction === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {t.ownerAction === 'client' ? 'Client owns' : 'CPA owns'}
                  </span>
                )}
              </div>
              <p className="font-medium max-w-[120px] truncate">{t.title}</p>
              <p className="text-slate-400 mt-0.5">{t.messages.length} msg</p>
            </button>
          ))}
        </div>
      </div>

      {/* Thread context + cross-object links */}
      {selected && (selected.linkedIssue || selected.linkedDocId || selected.linkedFieldId) && (
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex-shrink-0 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Link2 size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-2">
              {selected.linkedIssue && (
                <span className="text-xs text-slate-600 font-medium">{selected.linkedIssue}</span>
              )}
              {selected.linkedFieldId && (
                <button
                  onClick={() => onGoToField(selected.linkedFieldId!)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5"
                >
                  <ArrowLeft size={10} /> View linked field
                </button>
              )}
              {selected.linkedDocId && (
                <button
                  onClick={() => onGoToDoc(selected.linkedDocId!)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5"
                >
                  <FileText size={10} /> View linked document
                </button>
              )}
            </div>
          </div>
          {role !== 'client' && (
            <button
              onClick={() => onResolveThread(selected.id)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 transition-colors ${
                selected.isResolved ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {selected.isResolved ? 'Reopen' : 'Mark Resolved'}
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {visible.map(msg => {
          const isMe = msg.role === msgRole;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {!isMe && (
                    <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-600">
                      {msg.author.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">{msg.author}</span>
                  {msg.isInternal && (
                    <span className="text-[9px] bg-slate-200 text-slate-500 px-1 rounded font-medium">Internal</span>
                  )}
                  {msg.requestStatus === 'open' && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-medium flex items-center gap-0.5">
                      <Clock size={7} /> Open
                    </span>
                  )}
                  {msg.requestStatus === 'resolved' && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 rounded font-medium flex items-center gap-0.5">
                      <CheckCheck size={7} /> Resolved
                    </span>
                  )}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.isInternal ? 'bg-slate-800 text-slate-200 rounded-tl-none' :
                  isMe           ? 'bg-indigo-600 text-white rounded-br-none' :
                                   'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 px-1">
                  {new Date(msg.timestamp).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <div className="border-t border-slate-200 p-3 flex-shrink-0">
        {role !== 'client' && (
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setIsInternal(false)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${!isInternal ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              Client-visible
            </button>
            <button onClick={() => setIsInternal(true)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${isInternal ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              Internal only
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={isInternal ? 'Internal note (not visible to client)…' : 'Message client…'}
            rows={2}
            className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
          />
          <button onClick={send} disabled={!newMessage.trim()}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors self-end">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document List ────────────────────────────────────────────────────────────

function DocumentList({ documents, fields, highlightId, blockers, onOpenDoc }: {
  documents: TaxDocument[]; fields: ReturnField[]; highlightId?: string; blockers: string[];
  onOpenDoc: (doc: TaxDocument) => void;
}) {
  const typeColors: Record<string, string> = {
    'W-2': 'bg-blue-100 text-blue-700', '1099-INT': 'bg-indigo-100 text-indigo-700',
    '1099-DIV': 'bg-violet-100 text-violet-700', '1098': 'bg-orange-100 text-orange-700',
    'Schedule-K1': 'bg-pink-100 text-pink-700', '1099-B': 'bg-amber-100 text-amber-700',
    'Other': 'bg-slate-100 text-slate-600',
  };

  const missingDocBlockers = blockers.filter(b => /missing|not uploaded|pending from|no documents/i.test(b));

  if (documents.length === 0 && missingDocBlockers.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText size={28} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-400">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {missingDocBlockers.map((b, i) => (
        <div key={`missing-${i}`} className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-red-200 bg-red-50">
          <div className="w-8 h-8 bg-white border border-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={13} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">Missing document</p>
            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{b}</p>
          </div>
          <button className="text-xs text-red-600 hover:text-red-700 font-medium flex-shrink-0 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors">
            Request from client
          </button>
        </div>
      ))}
      {documents.map(doc => (
        <button
          key={doc.id}
          id={`doc-${doc.id}`}
          onClick={() => onOpenDoc(doc)}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left group ${
            highlightId === doc.id
              ? 'bg-indigo-50 border-indigo-300 shadow-sm'
              : doc.status === 'flagged'
              ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={13} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${typeColors[doc.type] || typeColors['Other']}`}>
                {doc.type}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">{doc.pages}p · {doc.uploadedAt}</span>
              {doc.status === 'reviewed' && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={9} /> Reviewed</span>
              )}
              {doc.status === 'pending_review' && (
                <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><Clock size={9} /> Pending</span>
              )}
              {doc.status === 'flagged' && (
                <span className="text-[10px] text-red-600 flex items-center gap-0.5"><AlertTriangle size={9} /> Flagged</span>
              )}
              {fields.some(f => f.source?.docId === doc.id) && (
                <span className="text-[10px] text-indigo-600 flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ArrowUpRight size={9} />
                </span>
              )}
            </div>
            {doc.flagNote && (
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">{doc.flagNote}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Document Viewer Modal ─────────────────────────────────────────────────────

function DocumentViewerModal({ doc, fields, onClose, onGoToField }: {
  doc: TaxDocument; fields: ReturnField[]; onClose: () => void; onGoToField: (fieldId: string) => void;
}) {
  useEscapeToClose(onClose);
  const relatedFields = fields.filter(f => f.source?.docId === doc.id);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3 sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-slate-800">{doc.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {doc.type} · {doc.pages} page{doc.pages === 1 ? '' : 's'} · uploaded {doc.uploadedAt} by {doc.uploadedBy}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0"><X size={16} /></button>
        </div>

        {doc.flagNote && (
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {doc.flagNote}
          </div>
        )}

        <div className="p-5 space-y-4">
          {relatedFields.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No return field references this document yet — it hasn't been used in an extraction.
            </p>
          ) : relatedFields.map(f => (
            <div key={f.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-500">
                  Used for Line {f.lineNumber} · {f.label}
                </p>
                <button
                  onClick={() => onGoToField(f.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5 flex-shrink-0"
                >
                  View field <ArrowUpRight size={11} />
                </button>
              </div>
              {f.source && <DocExcerpt docType={doc.type} src={f.source} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReturnDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, currentUser, setBreadcrumbs } = useApp();
  const navigate = useNavigate();
  const ctx = useReturnsData();

  const baseReturn =
    id === sampleReturn.id       ? sampleReturn :
    id === alexPersonalReturn.id ? alexPersonalReturn :
    allReturns.find(r => r.id === id);

  const initialTab = (searchParams.get('tab') as 'fields' | 'documents' | 'messages') || 'fields';
  const initialDoc = searchParams.get('doc') ?? undefined;
  const initialField = searchParams.get('field') ?? undefined;

  const [tab, setTabState] = useState<'fields' | 'documents' | 'messages'>(initialTab);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(initialField);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('s1');
  const [highlightDocId, setHighlightDocId] = useState<string | undefined>(initialDoc);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<TaxDocument | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoFn, setUndoFn] = useState<(() => void) | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (baseReturn) {
      setBreadcrumbs([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Returns', path: '/returns' },
        { label: baseReturn.clientName, path: `/returns/${baseReturn.id}` },
      ]);
      setActiveThreadId(prev => prev ?? ctx.getThreads(baseReturn.id)[0]?.id ?? null);
    }
  }, [baseReturn?.id, role]);

  const setTab = (t: 'fields' | 'documents' | 'messages') => {
    setTabState(t);
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (tab === 'documents' && highlightDocId) {
      setTimeout(() => {
        document.getElementById(`doc-${highlightDocId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [tab, highlightDocId]);

  const showToast = (message: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    setUndoFn(() => undo ?? null);
    toastTimer.current = setTimeout(() => { setToast(null); setUndoFn(null); }, 30000);
  };

  if (!baseReturn) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Return not found.</p>
        <button onClick={() => navigate('/returns')} className="text-indigo-600 mt-2 text-sm hover:underline">← Back</button>
      </div>
    );
  }

  const sc = stageConfig[baseReturn.stage];
  const uc = urgencyConfig[baseReturn.urgency];
  const fields = ctx.getFields(baseReturn.id);
  const threads = ctx.getThreads(baseReturn.id);
  const hasFields = fields.length > 0;
  const selectedField = fields.find(f => f.id === selectedFieldId) ?? null;
  const msgRole = messageRoleFor(role);

  const setSelectedField = (fieldId: string | undefined) => {
    setSelectedFieldId(fieldId);
    const next = new URLSearchParams(searchParams);
    if (fieldId) next.set('field', fieldId); else next.delete('field');
    setSearchParams(next, { replace: true });
  };

  const handleVerify = (field: ReturnField) => {
    const prev = verifyField(ctx, baseReturn.id, field);
    showToast(`Verified "${field.label}"`, prev && (() => ctx.setField(baseReturn.id, prev)));
  };
  const handleApprove = (field: ReturnField) => {
    const prev = approveField(ctx, baseReturn.id, field);
    showToast(`Approved "${field.label}"`, prev && (() => ctx.setField(baseReturn.id, prev)));
  };
  const handleReject = (field: ReturnField, reason: string) => {
    const prev = rejectField(ctx, baseReturn.id, field, reason);
    showToast(`Rejected "${field.label}"`, prev && (() => ctx.setField(baseReturn.id, prev)));
    setShowRejectModal(false);
  };
  const handleOverrideSave = (field: ReturnField, val: string, reason: string) => {
    const prev = overrideField(ctx, baseReturn.id, field, val, reason, currentUser.name);
    showToast(`Override saved for "${field.label}"`, prev && (() => ctx.setField(baseReturn.id, prev)));
    setShowOverrideModal(false);
  };

  function handleSendMessage(threadId: string, content: string, isInternal: boolean) {
    const msg: Message = {
      id: `m-${Date.now()}`,
      threadId,
      author: currentUser.name,
      role: msgRole,
      content,
      timestamp: new Date().toISOString(),
      isInternal,
    };
    ctx.sendMessage(baseReturn.id, threadId, msg);
  }

  function handleResolveThread(threadId: string) {
    ctx.resolveThread(baseReturn.id, threadId);
  }

  function handleAskClarification(field: ReturnField) {
    const existing = threads.find(t => t.linkedFieldId === field.id && !t.isResolved);
    if (existing) {
      setActiveThreadId(existing.id);
      setTab('messages');
      return;
    }
    const newThread = buildClarificationThread(field, role !== 'client', currentUser.name, msgRole);
    ctx.addThread(baseReturn.id, newThread);
    setActiveThreadId(newThread.id);
    setTab('messages');
    showToast('Clarification request sent');
  }

  const goToDoc = (docId: string) => {
    setHighlightDocId(docId);
    setTab('documents');
  };
  const goToField = (fieldId: string) => {
    const f = fields.find(fi => fi.id === fieldId);
    if (f) {
      setSelectedField(f.id);
      setTab('fields');
      const sec = baseReturn.sections.find(s => s.fieldIds.includes(fieldId));
      if (sec) setExpandedSection(sec.id);
    }
  };

  const totalMessages = threads.reduce((a, t) => a + t.messages.length, 0);

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{baseReturn.clientName}</h1>
              <span className="text-sm text-slate-400">{baseReturn.type} · {baseReturn.year}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                {role === 'client' ? sc.clientLabel : sc.cpaLabel}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${uc.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${uc.dot}`} />{uc.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span>Preparer: {baseReturn.preparer}</span>
              {baseReturn.reviewer && <span>Reviewer: {baseReturn.reviewer}</span>}
              <span>Due: {new Date(baseReturn.deadline).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <StatusPipeline stage={baseReturn.stage} role={role} />
        </div>

        {baseReturn.blockers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {baseReturn.blockers.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-full">
                <AlertTriangle size={9} /> {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 flex-shrink-0">
        <div className="flex">
          {([
            { id: 'fields',    label: `Return Fields (${fields.length})`,      icon: FileText      },
            { id: 'documents', label: `Documents (${baseReturn.documents.length})`,        icon: FileText      },
            { id: 'messages',  label: `Messages (${totalMessages})`,                     icon: MessageSquare },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">
        <div className={`flex-1 ${tab === 'messages' ? 'overflow-hidden' : 'overflow-y-auto p-5'}`}>

          {tab === 'fields' && (
            <>
              {!hasFields ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={28} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No fields prepared yet.</p>
                  <p className="text-xs mt-1">Documents must be uploaded and reviewed first.</p>
                </div>
              ) : (
                <>
                  {role !== 'client' && (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Field State Reference</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(fieldStateConfig).map(([k, v]) => {
                          const Icon = FIELD_STATE_ICONS[k as keyof typeof FIELD_STATE_ICONS];
                          return (
                            <span key={k} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${v.badgeBg} ${v.badge}`}>
                              <Icon size={10} /> {v.label}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Click any field to trace its source document and AI reasoning.</p>
                    </div>
                  )}

                  {baseReturn.sections.map(section => {
                    const sFields = fields.filter(f => section.fieldIds.includes(f.id));
                    const open = expandedSection === section.id;
                    return (
                      <div key={section.id} className="mb-4">
                        <button
                          onClick={() => setExpandedSection(open ? null : section.id)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''} text-slate-500`} />
                            <span className="font-semibold text-slate-700 text-sm">{section.label}</span>
                            {section.hasIssues && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </div>
                          <span className="text-xs text-slate-400">{sFields.length} fields</span>
                        </button>
                        {open && (
                          <div className="space-y-2">
                            {sFields.map(f => (
                              <FieldRow
                                key={f.id}
                                field={f}
                                isSelected={selectedFieldId === f.id}
                                onClick={() => setSelectedField(selectedFieldId === f.id ? undefined : f.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {tab === 'documents' && (
            <DocumentList
              documents={baseReturn.documents}
              fields={fields}
              highlightId={highlightDocId}
              blockers={baseReturn.blockers}
              onOpenDoc={setViewingDoc}
            />
          )}

          {tab === 'messages' && (
            <div className="h-full">
              <CollabPanel
                threads={threads}
                role={role}
                activeThreadId={activeThreadId}
                onSelectThread={setActiveThreadId}
                onGoToField={goToField}
                onGoToDoc={goToDoc}
                onSendMessage={handleSendMessage}
                onResolveThread={handleResolveThread}
              />
            </div>
          )}
        </div>

        {selectedField && tab === 'fields' && (
          <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
            <SourcePanel
              field={selectedField}
              role={role}
              documents={baseReturn.documents}
              onClose={() => setSelectedField(undefined)}
              onGoToDoc={goToDoc}
              onVerify={() => handleVerify(selectedField)}
              onApprove={() => handleApprove(selectedField)}
              onReject={() => setShowRejectModal(true)}
              onOverride={() => setShowOverrideModal(true)}
              onAskClarification={() => handleAskClarification(selectedField)}
            />
          </div>
        )}
      </div>

      {showOverrideModal && selectedField && (
        <OverrideModal
          field={selectedField}
          onClose={() => setShowOverrideModal(false)}
          onSave={(val, reason) => handleOverrideSave(selectedField, val, reason)}
        />
      )}

      {showRejectModal && selectedField && (
        <RejectModal
          field={selectedField}
          onClose={() => setShowRejectModal(false)}
          onSave={(reason) => handleReject(selectedField, reason)}
        />
      )}

      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          fields={fields}
          onClose={() => setViewingDoc(null)}
          onGoToField={(fieldId) => { setViewingDoc(null); goToField(fieldId); }}
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
