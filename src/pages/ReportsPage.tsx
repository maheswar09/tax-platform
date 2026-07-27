import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, RotateCcw, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReturnsData } from '../context/ReturnsDataContext';
import { scopedReturnsForRole, stageConfig, urgencyConfig, STAGES } from '../data/mockData';
import type { ReturnStage } from '../data/mockData';

type Urgency = 'critical' | 'high' | 'normal' | 'low';

const STAGE_DOT: Record<ReturnStage, string> = {
  gathering_documents: 'bg-slate-400',
  under_review: 'bg-blue-500',
  corrections_needed: 'bg-amber-500',
  client_review: 'bg-violet-500',
  approved: 'bg-emerald-500',
  filed: 'bg-emerald-600',
};

function BarRow({ label, count, total, colorClass, dotClass }: {
  label: string; count: number; total: number; colorClass: string; dotClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} /> {label}
        </span>
        <span className="text-slate-400 tabular-nums">{count} · {pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { role, currentUser, setBreadcrumbs } = useApp();
  const ctx = useReturnsData();
  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports', path: '/reports' }]);
  }, [role]);

  const scoped = scopedReturnsForRole(role, currentUser.name);

  const stageCounts = useMemo(() => STAGES.map(s => ({
    stage: s, count: scoped.filter(r => r.stage === s).length,
  })), [scoped]);

  const urgencyOrder: Urgency[] = ['critical', 'high', 'normal', 'low'];
  const urgencyCounts = useMemo(() => urgencyOrder.map(u => ({
    urgency: u, count: scoped.filter(r => r.urgency === u).length,
  })), [scoped]);

  const { confBuckets, avgConfidence, correctionRate, rejectionRate, totalReviewed } = useMemo(() => {
    let low = 0, medium = 0, high = 0, confSum = 0, confCount = 0;
    let corrected = 0, rejected = 0, decided = 0;
    for (const ret of scoped) {
      for (const f of ctx.getFields(ret.id)) {
        if (f.aiMeta) {
          const c = f.aiMeta.confidence * 100;
          confSum += c; confCount += 1;
          if (c < 75) low++; else if (c < 90) medium++; else high++;
        }
        if (['ai_verified', 'corrected', 'rejected'].includes(f.state)) {
          decided++;
          if (f.state === 'corrected') corrected++;
          if (f.state === 'rejected') rejected++;
        }
      }
    }
    return {
      confBuckets: { low, medium, high },
      avgConfidence: confCount > 0 ? Math.round(confSum / confCount) : null,
      correctionRate: decided > 0 ? Math.round((corrected / decided) * 100) : null,
      rejectionRate: decided > 0 ? Math.round((rejected / decided) * 100) : null,
      totalReviewed: decided,
    };
  }, [scoped, ctx]);

  const stageTotal = scoped.length;
  const confTotal = confBuckets.low + confBuckets.medium + confBuckets.high;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {role === 'client' ? 'A summary of your return.' : `Metrics across ${stageTotal} return${stageTotal === 1 ? '' : 's'} you can see.`}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><BarChart3 size={12} /> Avg. AI Confidence</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-800">{avgConfidence !== null ? `${avgConfidence}%` : '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><RotateCcw size={12} /> Correction Rate</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-800">{correctionRate !== null ? `${correctionRate}%` : '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><XCircle size={12} /> Rejection Rate</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-800">{rejectionRate !== null ? `${rejectionRate}%` : '—'}</p>
        </div>
      </div>
      {totalReviewed === 0 && (
        <p className="text-xs text-slate-400 -mt-3">
          These rates are computed from fields that have gone through review. Only returns with full field-level data (like{' '}
          <button onClick={() => navigate('/returns/ret-2024-mitchell?tab=fields')} className="text-indigo-600 hover:underline">
            Sarah Mitchell's return
          </button>) contribute here — most demo returns don't have field data populated.
        </p>
      )}

      {/* Stage distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Returns by Stage</h2>
        <div className="space-y-3">
          {stageCounts.map(({ stage, count }) => {
            const sc = stageConfig[stage as ReturnStage];
            const dot = STAGE_DOT[stage as ReturnStage];
            return (
              <BarRow key={stage} label={role === 'client' ? sc.clientLabel : sc.cpaLabel} count={count} total={stageTotal}
                colorClass={dot} dotClass={dot} />
            );
          })}
        </div>
      </div>

      {/* Urgency distribution */}
      {role !== 'client' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Returns by Priority</h2>
          <div className="space-y-3">
            {urgencyCounts.map(({ urgency, count }) => {
              const uc = urgencyConfig[urgency];
              return (
                <BarRow key={urgency} label={uc.label} count={count} total={stageTotal}
                  colorClass={uc.dot} dotClass={uc.dot} />
              );
            })}
          </div>
        </div>
      )}

      {/* Confidence distribution */}
      {confTotal > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-violet-500" /> AI Confidence Distribution
          </h2>
          <div className="space-y-3">
            <BarRow label="High (90%+)" count={confBuckets.high} total={confTotal} colorClass="bg-emerald-500" dotClass="bg-emerald-500" />
            <BarRow label="Medium (75–89%)" count={confBuckets.medium} total={confTotal} colorClass="bg-amber-500" dotClass="bg-amber-500" />
            <BarRow label="Low (&lt;75%)" count={confBuckets.low} total={confTotal} colorClass="bg-red-500" dotClass="bg-red-500" />
          </div>
        </div>
      )}
    </div>
  );
}
