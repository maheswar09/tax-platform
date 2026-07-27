import { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Lock, Sparkles, ChevronDown,
  FileText, X, ExternalLink, RotateCcw, CheckCheck, PenLine, UserCheck,
  ArrowRight, XCircle, HelpCircle,
} from 'lucide-react';
import { fieldStateConfig } from '../data/mockData';
import { permissionsFor } from '../lib/fieldActions';
import { FIELD_STATE_ICONS } from '../lib/fieldIcons';
import { useEscapeToClose } from '../lib/useEscapeToClose';
import type { ReturnField, TaxDocument, Role } from '../data/mockData';

// ─── Document excerpt (doc-type-accurate mock evidence) ───────────────────────

export function DocExcerpt({ docType, src }: { docType: TaxDocument['type']; src: NonNullable<ReturnField['source']> }) {
  const highlight = (
    <span className="bg-yellow-200 px-1 rounded font-semibold">{src.rawValue}</span>
  );

  const body = (() => {
    switch (docType) {
      case 'W-2':
        return (
          <>
            <p>W-2 Wage and Tax Statement 2024</p>
            <p>Employer: ACME CORPORATION · EIN: 12-3456789</p>
            <p className="mt-2">{src.section}: {highlight}</p>
            <p>Box 2 — Federal income tax withheld: $14,200.00</p>
            <p>Box 3 — Social security wages: $85,000.00</p>
            <p>Box 4 — Social security tax withheld: $5,270.00</p>
          </>
        );
      case '1099-INT':
        return (
          <>
            <p>1099-INT Interest Income 2024</p>
            <p>Payer: CHASE BANK · TIN: 91-1234567</p>
            <p className="mt-2">{src.section}: {highlight}</p>
            <p>Box 2 — Early withdrawal penalty: $0.00</p>
            <p>Box 4 — Federal tax withheld: $0.00</p>
          </>
        );
      case '1099-DIV':
        return (
          <>
            <p>1099-DIV Dividends and Distributions 2024</p>
            <p>Payer: FIDELITY INVESTMENTS · TIN: 04-1234567</p>
            <p className="mt-2 text-slate-400 font-sans text-[10px] uppercase tracking-wider">Account 1 — Individual Brokerage</p>
            <p>{src.section}: {highlight}</p>
            <p className="mt-2 text-slate-400 font-sans text-[10px] uppercase tracking-wider">Account 2 — Traditional IRA (excluded — not reportable on Sch. B)</p>
            <p>Box 1a — Total ordinary dividends: $400.00</p>
          </>
        );
      case '1098':
        return (
          <>
            <p>1098 Mortgage Interest Statement 2024</p>
            <p>Lender: WELLS FARGO HOME MORTGAGE</p>
            <p className="mt-2">{src.section}: {highlight}</p>
            <p>Box 6 — Points / POS credit: $480.00</p>
          </>
        );
      case 'Schedule-K1':
        return (
          <>
            <p>Schedule K-1 (Form 1065) 2024</p>
            <p>Partnership: MITCHELL FAMILY LLC · EIN: 88-1234567</p>
            <p>Item J — Partner's share of profit: 40.0000%</p>
            <p className="mt-2">{src.section}: {highlight}</p>
          </>
        );
      default:
        return <p>{src.section}  {highlight}</p>;
    }
  })();

  return (
    <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-600 leading-relaxed">
      <p className="text-slate-400 mb-2 font-sans font-medium text-[10px] uppercase tracking-wider">
        Document excerpt · Page {src.page}
      </p>
      <div className="space-y-0.5">{body}</div>
    </div>
  );
}

// ─── Source Panel ───────────────────────────────────────────────────────────

export function SourcePanel({
  field, role, documents, onClose, onGoToDoc,
  onVerify, onApprove, onReject, onOverride, onAskClarification,
}: {
  field: ReturnField;
  role: Role;
  documents: TaxDocument[];
  onClose: () => void;
  onGoToDoc: (docId: string) => void;
  onVerify: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOverride: () => void;
  onAskClarification: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fsc = fieldStateConfig[field.state];
  const StateIcon = FIELD_STATE_ICONS[field.state];
  const src = field.source;
  const ai  = field.aiMeta;
  const conf = ai ? Math.round(ai.confidence * 100) : null;
  const confColor = conf === null ? '' : conf >= 90 ? 'text-emerald-600' : conf >= 75 ? 'text-amber-600' : 'text-red-600';
  const confBar   = conf === null ? '' : conf >= 90 ? 'bg-emerald-500' : conf >= 75 ? 'bg-amber-500' : 'bg-red-500';
  const perms = permissionsFor(role);
  const docType = src ? documents.find(d => d.id === src.docId)?.type : undefined;

  if (!src) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <span className="font-semibold text-slate-700 text-sm">Source</span>
          <button onClick={onClose}><X size={15} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${fsc.badgeBg} ${fsc.badge} mb-3`}>
              <StateIcon size={12} /> {fsc.label}
            </span>
            <p className="text-sm text-slate-500">
              {field.state === 'locked'          ? field.lockReason :
               field.state === 'client_provided' ? 'Value entered by client in their questionnaire.' :
               field.state === 'manual_entry'    ? 'Manually entered by CPA — no source document.' :
               'No source document linked.'}
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onAskClarification}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            <HelpCircle size={12} /> Ask a Question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
        <div>
          <span className="font-semibold text-slate-700">Source Traceability</span>
          <p className="text-xs text-slate-400 mt-0.5">L{field.lineNumber} · {field.label}</p>
        </div>
        <button onClick={onClose}><X size={15} className="text-slate-400 hover:text-slate-600" /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* State badge */}
        <div className="p-4 border-b border-slate-100">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${fsc.badgeBg} ${fsc.badge}`}>
            <StateIcon size={12} /> {fsc.label}
          </span>
          <p className="text-xs text-slate-500 mt-1.5">{fsc.description}</p>
        </div>

        {/* Value */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Field Value</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">
            {typeof field.value === 'number' ? `$${field.value.toLocaleString()}` : field.value}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Line {field.lineNumber}</p>
        </div>

        {/* Source document */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Source Document</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={13} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate text-xs">{src.docName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Page {src.page} · {src.section}</p>
              </div>
              <button
                onClick={() => onGoToDoc(src.docId)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 flex-shrink-0 font-medium"
                title="Go to document"
              >
                <ExternalLink size={12} /> View
              </button>
            </div>
          </div>

          {docType && <DocExcerpt docType={docType} src={src} />}

          {/* Value chain */}
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Raw extracted value</p>
              <p className="text-sm font-mono font-semibold text-slate-700">{src.rawValue}</p>
            </div>
            <ArrowRight size={13} className="text-slate-300 mx-2" />
            <div className="text-right">
              <p className="text-xs text-slate-400">Used in return</p>
              <p className="text-sm font-mono font-semibold text-indigo-700">
                {typeof field.value === 'number' ? `$${field.value.toLocaleString()}` : field.value}
              </p>
            </div>
          </div>
          {src.transformation && (
            <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Transformation: </span>{src.transformation}
            </div>
          )}
        </div>

        {/* AI confidence */}
        {ai && (
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-violet-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Confidence</p>
              </div>
              <span className={`text-sm font-bold ${confColor}`}>{conf}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
              <div className={`h-1.5 rounded-full ${confBar}`} style={{ width: `${conf}%` }} />
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Why this confidence?
              <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
              <p className="mt-2 text-xs text-slate-600 bg-violet-50 border border-violet-100 rounded-lg p-2.5 leading-relaxed">
                {ai.reasoning}
              </p>
            )}
            {ai.alternativeValues && ai.alternativeValues.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Alternative interpretations</p>
                {ai.alternativeValues.map((alt, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 truncate flex-1 mr-2">{alt.source}</span>
                    <span className="font-mono text-slate-700">{typeof alt.value === 'number' ? `$${Number(alt.value).toLocaleString()}` : alt.value}</span>
                    <span className="text-slate-400 ml-2">{Math.round(alt.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Correction history */}
        {!!field.correctionHistory?.length && (
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Correction History</p>
            {field.correctionHistory.map((c, i) => (
              <div key={i} className="bg-orange-50 border border-orange-100 rounded-lg p-2.5 text-xs mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw size={10} className="text-orange-500" />
                  <span className="font-medium text-orange-700">
                    {typeof c.oldValue === 'number' ? `$${Number(c.oldValue).toLocaleString()}` : c.oldValue} → {typeof c.newValue === 'number' ? `$${Number(c.newValue).toLocaleString()}` : c.newValue}
                  </span>
                </div>
                <p className="text-orange-700">{c.reason}</p>
                <p className="text-orange-400 mt-1">{c.correctedBy} · {new Date(c.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Rejection reason */}
        {field.state === 'rejected' && field.rejectionReason && (
          <div className="p-4 border-b border-slate-100">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
              <p className="font-semibold text-red-800 flex items-center gap-1 mb-1">
                <XCircle size={11} /> Rejected
              </p>
              <p className="text-red-700">{field.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Approval note */}
        {field.state === 'needs_approval' && field.approvalNote && (
          <div className="p-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
              <p className="font-semibold text-amber-800 flex items-center gap-1 mb-1">
                <AlertTriangle size={11} /> Awaiting Approval
              </p>
              <p className="text-amber-700">{field.approvalNote}</p>
              {!perms.canSignOff && (
                <p className="text-amber-600 mt-1.5 italic">Only a senior reviewer or admin can sign off on this field.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 flex-shrink-0 space-y-2">
        {field.state === 'ai_generated' && perms.canVerify && (
          <button onClick={onVerify} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
            <CheckCheck size={12} /> Verify & Accept
          </button>
        )}
        {field.state === 'needs_approval' && perms.canSignOff && (
          <button onClick={onApprove} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors">
            <UserCheck size={12} /> Approve This Field
          </button>
        )}
        {(field.state === 'ai_generated' || field.state === 'needs_approval') && perms.canReject && (
          <button onClick={onReject} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
            <XCircle size={12} /> Reject
          </button>
        )}
        {perms.canOverride && field.state !== 'locked' && (
          <button onClick={onOverride} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
            <PenLine size={12} /> {field.state === 'rejected' ? 'Provide Corrected Value' : 'Override Value'}
          </button>
        )}
        <button onClick={onAskClarification} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
          <HelpCircle size={12} /> Ask a Question
        </button>
      </div>
    </div>
  );
}

// ─── Field Row ─────────────────────────────────────────────────────────────

export function FieldRow({ field, isSelected, onClick, subtitle }: {
  field: ReturnField; isSelected: boolean; onClick: () => void; subtitle?: string;
}) {
  const fsc = fieldStateConfig[field.state];
  const StateIcon = FIELD_STATE_ICONS[field.state];
  const conf = field.aiMeta ? Math.round(field.aiMeta.confidence * 100) : null;
  const rowBg =
    isSelected              ? 'bg-indigo-50 border-indigo-300 shadow-sm' :
    field.state === 'needs_approval' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
    field.state === 'rejected'       ? 'bg-red-50 border-red-200 hover:bg-red-100' :
    field.state === 'corrected'      ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
    field.state === 'locked'         ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' :
    'bg-white border-slate-100 hover:bg-slate-50';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded-xl p-3 transition-all ${rowBg} ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {subtitle && <p className="text-xs font-semibold text-slate-500 mb-0.5 truncate">{subtitle}</p>}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-slate-400">L{field.lineNumber}</span>
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md ${fsc.badgeBg} ${fsc.badge}`}>
              <StateIcon size={10} /> {fsc.label}
            </span>
            {field.source && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <FileText size={9} /> {field.source.docName}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-slate-800">
            {typeof field.value === 'number' ? `$${field.value.toLocaleString()}` : field.value}
          </p>
          {conf !== null && (
            <div className="flex items-center gap-1 justify-end mt-1">
              <div className="w-10 bg-slate-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${conf >= 90 ? 'bg-emerald-500' : conf >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${conf}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${conf >= 90 ? 'text-emerald-600' : conf >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                {conf}%
              </span>
            </div>
          )}
          {field.state === 'locked' && <Lock size={11} className="text-slate-400 ml-auto mt-1" />}
        </div>
      </div>
    </button>
  );
}

// ─── Override Modal ────────────────────────────────────────────────────────────

export function OverrideModal({ field, onClose, onSave }: {
  field: ReturnField;
  onClose: () => void;
  onSave: (val: string, reason: string) => void;
}) {
  const [value, setValue] = useState(String(field.value));
  const [reason, setReason] = useState('');
  useEscapeToClose(onClose);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">{field.state === 'rejected' ? 'Provide Corrected Value' : 'Override AI Value'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Line {field.lineNumber} · {field.label}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Current Value</label>
            <div className="flex items-center gap-2 p-2.5 bg-violet-50 border border-violet-200 rounded-lg">
              <Sparkles size={11} className="text-violet-500 flex-shrink-0" />
              <span className="text-sm font-mono font-semibold text-violet-800">
                {typeof field.value === 'number' ? `$${field.value.toLocaleString()}` : field.value}
              </span>
              {field.aiMeta && (
                <span className="text-xs text-violet-500 ml-auto">{Math.round(field.aiMeta.confidence * 100)}% conf.</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Corrected Value</label>
            <input type="text" value={value} onChange={e => setValue(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Reason for Override <span className="text-red-500">*</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Explain why the AI extraction was incorrect…"
              autoFocus
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200" />
            <p className="text-xs text-slate-400 mt-1">Required for audit trail.</p>
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button
            onClick={() => reason.trim() && value.trim() && onSave(value, reason)}
            disabled={!reason.trim() || !value.trim()}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <RotateCcw size={12} /> Save Override
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ───────────────────────────────────────────────────────────

export function RejectModal({ field, onClose, onSave }: {
  field: ReturnField;
  onClose: () => void;
  onSave: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  useEscapeToClose(onClose);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Reject AI Value</h3>
          <p className="text-xs text-slate-500 mt-0.5">Line {field.lineNumber} · {field.label}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Explain why this AI extraction can't be used as-is…"
              autoFocus
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200" />
            <p className="text-xs text-slate-400 mt-1">The field will be flagged until a corrected value or clarification resolves it.</p>
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button
            onClick={() => reason.trim() && onSave(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <XCircle size={12} /> Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}
