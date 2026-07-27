import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ChevronDown, ArrowRight, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Role } from '../data/mockData';
import { sampleFields } from '../data/mockData';
import { DocExcerpt } from '../components/FieldReview';

// The K-1 field — genuinely ambiguous (76% confidence, two plausible readings)
// rather than a clean 98% extraction. A trust story is more convincing when
// the AI admits it isn't sure than when it shows off an easy case.
const demoField = sampleFields.find(f => f.id === 'f7')!;

function LiveFieldDemo() {
  const [open, setOpen] = useState(false);
  const conf = Math.round((demoField.aiMeta?.confidence ?? 0) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700">
            <Sparkles size={10} /> AI Extracted
          </span>
          <span className="text-xs font-mono text-slate-400">Line K1-1</span>
        </div>
        <p className="text-sm text-slate-600 mt-2">Ordinary business income — Schedule K-1</p>
        <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
          ${Number(demoField.value).toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${conf}%` }} />
          </div>
          <span className="text-xs font-semibold text-amber-600">{conf}%</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          Why only {conf}%?
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          {demoField.source && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Straight from the document — {demoField.source.docName}
              </p>
              <DocExcerpt docType="Schedule-K1" src={demoField.source} />
            </div>
          )}
          <p className="text-xs text-slate-600 leading-relaxed">{demoField.aiMeta?.reasoning}</p>
          {demoField.aiMeta?.alternativeValues && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">If it read it differently</p>
              {demoField.aiMeta.alternativeValues.map((alt, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                  <span className="text-slate-500 flex-1">{alt.source}</span>
                  <span className="font-mono font-semibold text-slate-700">${Number(alt.value).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400 italic">
            This is why a preparer can verify a clean extraction, but only a senior reviewer can sign off one like this.
          </p>
        </div>
      )}
    </div>
  );
}

interface WorkflowNode {
  role: Role;
  label: string;
  does: string;
}

const PRIMARY_FLOW: WorkflowNode[] = [
  { role: 'client',   label: 'Client',   does: 'uploads documents, answers questionnaires' },
  { role: 'cpa',       label: 'CPA',      does: 'reviews AI extractions, prepares the return' },
  { role: 'reviewer',  label: 'Reviewer', does: 'signs off anything flagged high-risk' },
  { role: 'admin',     label: 'Admin',    does: 'sees status across the whole firm' },
];

const SIDE_ROLES: WorkflowNode[] = [
  { role: 'business_owner', label: 'Business Owner', does: 'client-side, but for an entity return' },
  { role: 'seasonal_staff', label: 'Seasonal Staff', does: 'CPA-side, but with fewer permissions' },
];

export default function WelcomePage() {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const enterAs = (role: Role) => {
    setRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #818cf8 0%, #4338ca 100%)' }}>
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">TaxFlow</span>
          </div>
          <button
            onClick={() => enterAs('cpa')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Skip to the app →
          </button>
        </div>
      </header>

      {/* Hero: asymmetric — claim on the left, the actual claim under test on the right */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            The AI doesn't get the final word.
          </h1>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            TaxFlow is a prototype built around one idea: an AI extraction is a claim, not a fact.
            Every claim shows its evidence, its confidence, and who's actually allowed to accept it —
            and every decision can be undone.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <button
              onClick={() => enterAs('cpa')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
            >
              Start reviewing <ArrowRight size={14} />
            </button>
            <a href="#roles" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              See it from six angles
            </a>
          </div>
        </div>
        <div>
          <LiveFieldDemo />
          <p className="text-xs text-slate-400 mt-2 text-center">↑ this is real interaction, not a screenshot</p>
        </div>
      </section>

      {/* Workflow map — the product's actual mental model, not a feature list */}
      <section id="roles" className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-slate-900">One return, four hands</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg">
            Click a stage to enter the app at that point in the pipeline, seeing exactly what that
            person sees — and only what they're allowed to do.
          </p>

          <div className="mt-10 flex flex-col lg:flex-row items-stretch gap-0">
            {PRIMARY_FLOW.map((node, i) => (
              <div key={node.role} className="flex-1 flex items-center">
                <button
                  onClick={() => enterAs(node.role)}
                  className="flex-1 text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="font-semibold text-slate-900 mt-3">{node.label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{node.does}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Enter here <ArrowUpRight size={11} />
                  </span>
                </button>
                {i < PRIMARY_FLOW.length - 1 && (
                  <div className="hidden lg:block w-8 flex-shrink-0 border-t-2 border-dashed border-slate-300 mx-1" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {SIDE_ROLES.map(node => (
              <button
                key={node.role}
                onClick={() => enterAs(node.role)}
                className="flex-1 text-left bg-white/60 rounded-xl border border-dashed border-slate-300 px-4 py-3 hover:border-indigo-300 hover:bg-white transition-all"
              >
                <p className="text-sm font-semibold text-slate-700">{node.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{node.does}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How a review actually happens, as a sequence — not abstract feature bullets */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-900 text-center">What happens when you click a field</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'See the evidence', body: 'The exact document, page, and highlighted raw text behind the number.' },
            { step: '02', title: 'Judge the confidence', body: 'A score, the reasoning, and any alternative reading the AI considered.' },
            { step: '03', title: 'Decide, within your role', body: 'Verify, override with a reason, reject, or ask the other side a question.' },
            { step: '04', title: 'Leave a trail', body: 'Every decision is logged with who and why — and can be undone for 30 seconds.' },
          ].map(s => (
            <div key={s.step}>
              <p className="text-2xl font-bold text-indigo-200">{s.step}</p>
              <p className="font-semibold text-slate-900 text-sm mt-1">{s.title}</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            Prototype built to demonstrate frontend UX, information architecture, and trustworthy-AI
            interaction patterns for tax software. Every name, figure, document, and AI output above is fabricated.
          </p>
        </div>
      </footer>
    </div>
  );
}
