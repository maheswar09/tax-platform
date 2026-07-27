/**
 * Ch08 — Clickable vs. Editable
 * A design system reference showing all 7 field states in context.
 * Linked from the sidebar Settings item and demonstrates the affordance
 * system "across several different screens."
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, PenLine, User, Lock, AlertTriangle, RotateCcw,
  MousePointer2, Eye, ArrowRight, XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fieldStateConfig } from '../data/mockData';
import { FIELD_STATE_ICONS } from '../lib/fieldIcons';

interface DemoField {
  lineNumber: string;
  label: string;
  value: string;
  state: keyof typeof fieldStateConfig;
  confidence?: number;
  note?: string;
}

const DEMO_FIELDS: DemoField[] = [
  {
    lineNumber: '1a',
    label: 'Wages, salaries, tips',
    value: '$85,000',
    state: 'ai_generated',
    confidence: 94,
    note: 'Extracted from W-2 Box 1. Click to verify or override.',
  },
  {
    lineNumber: '2b',
    label: 'Taxable interest',
    value: '$1,240',
    state: 'ai_verified',
    confidence: 98,
    note: 'CPA confirmed this extraction is correct.',
  },
  {
    lineNumber: '3b',
    label: 'Ordinary dividends',
    value: '$3,420',
    state: 'corrected',
    confidence: 71,
    note: 'AI initially extracted $3,820. CPA overrode: IRA portion excluded.',
  },
  {
    lineNumber: '8a',
    label: 'Mortgage interest paid',
    value: '$12,480',
    state: 'needs_approval',
    note: 'Senior reviewer must sign off before this value is accepted.',
  },
  {
    lineNumber: '12a',
    label: 'Charitable contributions',
    value: '$2,800',
    state: 'client_provided',
    note: 'Client entered this value in their questionnaire.',
  },
  {
    lineNumber: '14',
    label: 'State and local taxes (SALT cap)',
    value: '$10,000',
    state: 'manual_entry',
    note: 'Manually entered by CPA — no source document.',
  },
  {
    lineNumber: '17',
    label: 'Total tax (calculated)',
    value: '$11,842',
    state: 'locked',
    note: 'Derived from lines 1–16. Cannot be edited directly.',
  },
  {
    lineNumber: '3b',
    label: 'Ordinary dividends (alt. scenario)',
    value: '$3,820',
    state: 'rejected',
    note: 'CPA rejected this AI extraction — a corrected value or client clarification is required before it can proceed.',
  },
];

function DemoFieldCard({ field }: { field: DemoField }) {
  const fsc = fieldStateConfig[field.state];
  const StateIcon = FIELD_STATE_ICONS[field.state];
  const rowBg =
    field.state === 'needs_approval' ? 'bg-amber-50 border-amber-200' :
    field.state === 'corrected'      ? 'bg-orange-50 border-orange-200' :
    field.state === 'locked'         ? 'bg-slate-50 border-slate-100'  :
    'bg-white border-slate-200';

  return (
    <div className={`border rounded-xl p-4 ${rowBg}`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400">L{field.lineNumber}</span>
            <span className="font-medium text-slate-800 text-sm">{field.label}</span>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${fsc.badgeBg} ${fsc.badge}`}>
            <StateIcon size={10} /> {fsc.label}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold tabular-nums text-slate-800">{field.value}</p>
          {field.confidence !== undefined && (
            <div className="flex items-center gap-1 justify-end mt-1">
              <div className="w-12 bg-slate-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${field.confidence >= 90 ? 'bg-emerald-500' : field.confidence >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${field.confidence}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${field.confidence >= 90 ? 'text-emerald-600' : field.confidence >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                {field.confidence}%
              </span>
            </div>
          )}
          {field.state === 'locked' && <Lock size={12} className="text-slate-400 ml-auto mt-1" />}
        </div>
      </div>
      {field.note && <p className="text-xs text-slate-500 leading-relaxed">{field.note}</p>}
    </div>
  );
}

export default function AffordancesPage() {
  const { setBreadcrumbs } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Interaction Reference', path: '/affordances' },
    ]);
  }, []);

  const interactionRules = [
    { icon: MousePointer2, label: 'Clickable',    color: 'text-indigo-600', description: 'Interactive elements use cursor-pointer. Rows, buttons, and links respond to hover with bg-slate-50 or teal accent.' },
    { icon: PenLine,       label: 'Editable',     color: 'text-blue-600', description: 'Fields with state manual_entry or ai_generated show a pencil cursor on hover. Click to enter override mode.' },
    { icon: Sparkles,      label: 'AI-generated', color: 'text-violet-600',description: 'Violet badge with a sparkle icon. Always shows confidence %. Click to see source document and reasoning.' },
    { icon: CheckCircle2,  label: 'Verified',     color: 'text-emerald-600',description: 'Emerald badge. AI extraction confirmed by a CPA. Still traceable but no further action needed.' },
    { icon: AlertTriangle, label: 'Needs approval',color:'text-amber-600', description: 'Amber background. A reviewer must sign off before this value can be included. Blocks return progression.' },
    { icon: Eye,           label: 'Read-only',     color: 'text-slate-500', description: 'Displayed without hover change. No edit affordance. Includes calculated and locked fields.' },
    { icon: Lock,          label: 'Locked',        color: 'text-slate-400', description: 'Lock icon appears when a field cannot be changed regardless of role. Tooltip explains why.' },
    { icon: RotateCcw,     label: 'Corrected',     color: 'text-orange-600',description: 'Orange badge with an undo icon. AI was wrong; CPA overrode with a logged reason. History preserved in the source panel.' },
    { icon: XCircle,       label: 'Rejected',      color: 'text-red-600',   description: 'Red badge with an X icon. CPA/reviewer rejected the AI value with a required reason. Blocks progression until corrected or clarified.' },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Interaction Affordances</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Ch08 — A consistent visual system for every state a field or element can be in.
          These patterns appear on the dashboard, returns list, and return detail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: all 7 field states in context */}
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Field State Examples</h2>
          <div className="space-y-3">
            {DEMO_FIELDS.map(f => <DemoFieldCard key={f.lineNumber} field={f} />)}
          </div>
          <button
            onClick={() => navigate('/returns/ret-2024-mitchell')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            See these in a real return <ArrowRight size={14} />
          </button>
        </div>

        {/* Right: interaction rules + legend */}
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Interaction Rules</h2>
          <div className="space-y-3">
            {interactionRules.map(rule => (
              <div key={rule.label} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <rule.icon size={15} className={rule.color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rule.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Where to find each state in the app */}
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-2">Where each state appears</h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">Dashboard</span>
                <span>Urgency badges, blocker indicators, stage pills</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">Returns list</span>
                <span>Stage pills, field-state summary row (on Mitchell), priority dots</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">Return detail</span>
                <span>Full field-state badges, confidence bars, source panel affordances, override modal</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">Messages</span>
                <span>Internal vs. client-visible visual distinction, open request badges</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
