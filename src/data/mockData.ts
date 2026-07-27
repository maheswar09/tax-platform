// ─── Types ────────────────────────────────────────────────────────────────────

export type Role =
  | 'cpa'
  | 'client'
  | 'reviewer'
  | 'admin'
  | 'business_owner'
  | 'seasonal_staff';

export type ReturnStage =
  | 'gathering_documents'
  | 'under_review'
  | 'corrections_needed'
  | 'client_review'
  | 'approved'
  | 'filed';

export type FieldState =
  | 'ai_generated'
  | 'ai_verified'
  | 'manual_entry'
  | 'client_provided'
  | 'locked'
  | 'needs_approval'
  | 'corrected'
  | 'rejected';

export interface Client {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  company?: string;
  joinedAt: string;
}

export interface SourceRef {
  docId: string;
  docName: string;
  page: number;
  section: string;
  rawValue: string;
  transformation?: string;
}

export interface AIMetadata {
  confidence: number;
  reasoning: string;
  alternativeValues?: Array<{ value: number | string; confidence: number; source: string }>;
  extractedAt: string;
}

export interface CorrectionEntry {
  oldValue: number | string;
  newValue: number | string;
  correctedBy: string;
  reason: string;
  date: string;
}

export interface ReturnField {
  id: string;
  lineNumber: string;
  label: string;
  value: number | string;
  state: FieldState;
  source?: SourceRef;
  aiMeta?: AIMetadata;
  lockReason?: string;
  approvalNote?: string;
  correctionHistory?: CorrectionEntry[];
  rejectionReason?: string;
}

export interface TaxDocument {
  id: string;
  name: string;
  type: 'W-2' | '1099-INT' | '1099-DIV' | '1098' | 'Schedule-K1' | '1099-B' | 'Other';
  uploadedBy: 'client' | 'cpa';
  uploadedAt: string;
  pages: number;
  status: 'pending_review' | 'reviewed' | 'flagged';
  flagNote?: string;
}

export interface Message {
  id: string;
  threadId: string;
  author: string;
  role: 'cpa' | 'client' | 'reviewer';
  content: string;
  timestamp: string;
  isInternal: boolean;
  attachmentDocId?: string;
  requestStatus?: 'open' | 'resolved';
}

export interface Thread {
  id: string;
  title: string;
  linkedDocId?: string;
  linkedFieldId?: string;
  linkedIssue?: string;
  messages: Message[];
  isResolved: boolean;
  ownerAction: 'client' | 'cpa' | 'none';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
}

export interface ReturnSection {
  id: string;
  label: string;
  fieldIds: string[];
  isComplete: boolean;
  hasIssues: boolean;
}

export interface TaxReturn {
  id: string;
  year: number;
  type: '1040' | '1065' | '1120S' | '1041';
  clientId: string;
  clientName: string;
  preparer: string;
  reviewer?: string;
  stage: ReturnStage;
  deadline: string;
  urgency: 'critical' | 'high' | 'normal' | 'low';
  fields: ReturnField[];
  documents: TaxDocument[];
  threads: Thread[];
  sections: ReturnSection[];
  blockers: string[];
  lastActivity: string;
  refund?: number;
  amountDue?: number;
}

// ─── Sample documents ─────────────────────────────────────────────────────────

export const sampleDocuments: TaxDocument[] = [
  {
    id: 'doc-w2-1',
    name: 'W-2 — Acme Corp 2024',
    type: 'W-2',
    uploadedBy: 'client',
    uploadedAt: '2025-01-15',
    pages: 2,
    status: 'reviewed',
  },
  {
    id: 'doc-1099-int',
    name: '1099-INT — Chase Bank',
    type: '1099-INT',
    uploadedBy: 'client',
    uploadedAt: '2025-01-18',
    pages: 1,
    status: 'reviewed',
  },
  {
    id: 'doc-1098',
    name: '1098 Mortgage Interest — Wells Fargo',
    type: '1098',
    uploadedBy: 'client',
    uploadedAt: '2025-01-20',
    pages: 1,
    status: 'flagged',
    flagNote: 'Box 6 shows $480 point-of-sale credit — may affect deductibility. Needs senior review.',
  },
  {
    id: 'doc-1099-div',
    name: '1099-DIV — Fidelity Investments',
    type: '1099-DIV',
    uploadedBy: 'client',
    uploadedAt: '2025-01-22',
    pages: 1,
    status: 'reviewed',
  },
  {
    id: 'doc-k1',
    name: 'Schedule K-1 — Mitchell Family LLC',
    type: 'Schedule-K1',
    uploadedBy: 'client',
    uploadedAt: '2025-02-03',
    pages: 3,
    status: 'pending_review',
  },
];

// ─── Sample fields (full traceability data for Mitchell return) ───────────────

export const sampleFields: ReturnField[] = [
  {
    id: 'f1',
    lineNumber: '1a',
    label: 'Wages, salaries, tips (W-2 Box 1)',
    value: 85000,
    state: 'ai_verified',
    source: {
      docId: 'doc-w2-1',
      docName: 'W-2 — Acme Corp 2024',
      page: 1,
      section: 'Box 1 — Wages, tips, other compensation',
      rawValue: '$85,000.00',
      transformation: 'Strip currency symbol and commas → parse as integer',
    },
    aiMeta: {
      confidence: 0.98,
      reasoning:
        'Box 1 clearly printed in standard W-2 format. No ambiguity. Cross-referenced employer EIN 12-3456789 matches prior-year W-2 on file.',
      extractedAt: '2025-02-10T09:15:00Z',
    },
  },
  {
    id: 'f2',
    lineNumber: '2b',
    label: 'Taxable interest',
    value: 1240,
    state: 'ai_generated',
    source: {
      docId: 'doc-1099-int',
      docName: '1099-INT — Chase Bank',
      page: 1,
      section: 'Box 1 — Interest Income',
      rawValue: '$1,240.12',
      transformation: 'Strip currency → round to nearest dollar (IRS convention)',
    },
    aiMeta: {
      confidence: 0.94,
      reasoning:
        'Box 1 value is clearly legible. Rounded per IRS guidance (cents dropped). Payer TIN matches prior year. Box 2 (early withdrawal penalty) is $0.',
      alternativeValues: [{ value: 1240.12, confidence: 0.94, source: 'Unrounded raw value' }],
      extractedAt: '2025-02-10T09:16:00Z',
    },
  },
  {
    id: 'f3',
    lineNumber: '3b',
    label: 'Ordinary dividends',
    value: 3420,
    state: 'corrected',
    source: {
      docId: 'doc-1099-div',
      docName: '1099-DIV — Fidelity Investments',
      page: 1,
      section: 'Box 1a — Total ordinary dividends',
      rawValue: '$3,820.45',
      transformation: 'Strip currency → round → subtract IRA portion',
    },
    aiMeta: {
      confidence: 0.71,
      reasoning:
        'Box 1a extracted. Lower confidence: document has two account sections. AI summed both — but one section is an IRA account that should be excluded from Schedule B.',
      alternativeValues: [
        { value: 3820, confidence: 0.71, source: 'Original AI extraction (both accounts summed)' },
      ],
      extractedAt: '2025-02-10T09:17:00Z',
    },
    correctionHistory: [
      {
        oldValue: 3820,
        newValue: 3420,
        correctedBy: 'Alex Chen',
        reason:
          'Excluded IRA dividends ($400). Retirement account distributions are not reportable as ordinary dividends on Schedule B.',
        date: '2025-02-11T14:30:00Z',
      },
    ],
  },
  {
    id: 'f4',
    lineNumber: '8a',
    label: 'Mortgage interest paid',
    value: 12480,
    state: 'needs_approval',
    source: {
      docId: 'doc-1098',
      docName: '1098 Mortgage Interest — Wells Fargo',
      page: 1,
      section: 'Box 1 — Mortgage interest received from payer(s)/borrower(s)',
      rawValue: '$12,480.00',
      transformation: 'Direct extraction, no numeric transformation',
    },
    aiMeta: {
      confidence: 0.89,
      reasoning:
        'Box 1 clearly legible. However, Box 6 shows a $480 point-of-sale credit. Under Rev. Rul. 87-22, this may affect deductibility. Flagged for senior review before inclusion.',
      extractedAt: '2025-02-10T09:18:00Z',
    },
    approvalNote:
      'Reviewer: Box 6 POS credit ($480) — confirm with client if this was a seller-paid buydown. If lender credit at closing, reduces basis only, not deduction amount.',
  },
  {
    id: 'f5',
    lineNumber: '12a',
    label: 'Charitable contributions (cash)',
    value: 2800,
    state: 'client_provided',
  },
  {
    id: 'f6',
    lineNumber: '17',
    label: 'Total tax (calculated)',
    value: 11842,
    state: 'locked',
    lockReason: 'Calculated field — derived from lines 1–16. Edit source lines to update this value.',
  },
  {
    id: 'f7',
    lineNumber: 'K1-1',
    label: 'Ordinary business income — Schedule K-1',
    value: 18500,
    state: 'ai_generated',
    source: {
      docId: 'doc-k1',
      docName: 'Schedule K-1 — Mitchell Family LLC',
      page: 1,
      section: 'Part III, Line 1 — Ordinary business income (loss)',
      rawValue: '$18,500',
      transformation: 'Line 1 × ownership % (40%) = $18,500 of $46,250 total',
    },
    aiMeta: {
      confidence: 0.76,
      reasoning:
        'K-1 not yet fully reviewed. Extracted from Part III Line 1. AI applied 40% ownership based on Schedule K-1 Page 2 partner info — but ownership % is unconfirmed with client.',
      alternativeValues: [
        { value: 46250, confidence: 0.4, source: 'If 100% ownership assumed (full K-1 amount)' },
        { value: 23125, confidence: 0.3, source: 'If 50% ownership assumed' },
      ],
      extractedAt: '2025-02-10T09:20:00Z',
    },
  },
];

// ─── Sample threads ───────────────────────────────────────────────────────────

export const sampleThreads: Thread[] = [
  {
    id: 'thread-1',
    title: 'Schedule K-1 ownership percentage',
    linkedDocId: 'doc-k1',
    linkedFieldId: 'f7',
    linkedIssue: 'Verify ownership stake in Mitchell Family LLC',
    ownerAction: 'client',
    priority: 'high',
    isResolved: false,
    createdAt: '2025-02-11T10:00:00Z',
    messages: [
      {
        id: 'm1',
        threadId: 'thread-1',
        author: 'Alex Chen',
        role: 'cpa',
        content:
          "Hi Sarah, I'm reviewing your Schedule K-1 from Mitchell Family LLC. The document shows what appears to be a 40% ownership interest, but I want to confirm this before finalizing the business income figure. Could you let me know your exact ownership percentage?",
        timestamp: '2025-02-11T10:05:00Z',
        isInternal: false,
        attachmentDocId: 'doc-k1',
        requestStatus: 'open',
      },
      {
        id: 'm2',
        threadId: 'thread-1',
        author: 'Alex Chen',
        role: 'cpa',
        content:
          'Internal note: K-1 Box 1 shows $46,250 total. AI applied 40% → $18,500. But ownership % is unconfirmed. Also need to check whether this LLC has any separately stated items on lines 2–20 that require different treatment.',
        timestamp: '2025-02-11T10:07:00Z',
        isInternal: true,
      },
      {
        id: 'm3',
        threadId: 'thread-1',
        author: 'Sarah Mitchell',
        role: 'client',
        content:
          "Hi Alex, yes — I own 40% of the LLC. My brother owns the remaining 60%. Let me know if you need anything else!",
        timestamp: '2025-02-12T14:22:00Z',
        isInternal: false,
      },
    ],
  },
  {
    id: 'thread-2',
    title: 'Missing: Coinbase 1099-DA',
    linkedDocId: undefined,
    linkedFieldId: undefined,
    linkedIssue: 'Potential unreported crypto income',
    ownerAction: 'client',
    priority: 'high',
    isResolved: false,
    createdAt: '2025-02-13T09:00:00Z',
    messages: [
      {
        id: 'm4',
        threadId: 'thread-2',
        author: 'Alex Chen',
        role: 'cpa',
        content:
          "Sarah, your questionnaire indicates you had cryptocurrency transactions in 2024. We need a 1099-DA (or complete transaction history) from your exchange. We can't finalize your return without this. Could you upload it when you get a chance?",
        timestamp: '2025-02-13T09:15:00Z',
        isInternal: false,
        requestStatus: 'open',
      },
    ],
  },
  {
    id: 'thread-3',
    title: 'Mortgage interest — point-of-sale credit',
    linkedDocId: 'doc-1098',
    linkedFieldId: 'f4',
    linkedIssue: 'Box 6 POS credit may affect deductibility',
    ownerAction: 'cpa',
    priority: 'normal',
    isResolved: false,
    createdAt: '2025-02-14T11:00:00Z',
    messages: [
      {
        id: 'm5',
        threadId: 'thread-3',
        author: 'Jordan Lee',
        role: 'reviewer',
        content:
          "Alex — the 1098 Box 6 shows a $480 POS credit. Under Rev. Rul. 87-22 this may need to reduce the deductible amount. Can you confirm whether this was a seller-paid buydown or a lender credit? Treatment differs.",
        timestamp: '2025-02-14T11:30:00Z',
        isInternal: true,
      },
      {
        id: 'm6',
        threadId: 'thread-3',
        author: 'Alex Chen',
        role: 'cpa',
        content:
          "Good catch. Looking at the closing disclosure Sarah sent — this appears to be a lender credit applied at closing, not a seller buydown. If so, it reduces basis only, doesn't offset the deduction. I'll confirm with her.",
        timestamp: '2025-02-14T13:00:00Z',
        isInternal: true,
      },
    ],
  },
];

// ─── Sample return (full data — Mitchell) ────────────────────────────────────

export const sampleReturn: TaxReturn = {
  id: 'ret-2024-mitchell',
  year: 2024,
  type: '1040',
  clientId: 'c1',
  clientName: 'Sarah Mitchell',
  preparer: 'Alex Chen',
  reviewer: 'Jordan Lee',
  stage: 'corrections_needed',
  deadline: '2025-04-15',
  urgency: 'high',
  fields: sampleFields,
  documents: sampleDocuments,
  threads: sampleThreads,
  sections: [
    { id: 's1', label: 'Income', fieldIds: ['f1', 'f2', 'f3'], isComplete: false, hasIssues: true },
    { id: 's2', label: 'Business Income', fieldIds: ['f7'], isComplete: false, hasIssues: true },
    { id: 's3', label: 'Deductions', fieldIds: ['f4', 'f5'], isComplete: false, hasIssues: true },
    { id: 's4', label: 'Tax & Credits', fieldIds: ['f6'], isComplete: false, hasIssues: false },
  ],
  blockers: ['Missing Coinbase 1099-DA', 'K-1 ownership % pending client confirmation'],
  lastActivity: '2025-02-14T13:00:00Z',
};

// Alex Chen's personal return (dual-role demo — Ch05)
export const alexPersonalReturn: TaxReturn = {
  id: 'ret-2024-alex-chen',
  year: 2024,
  type: '1040',
  clientId: 'alex-chen-personal',
  clientName: 'Alex Chen (Personal)',
  preparer: 'Morgan Wu',
  reviewer: 'Jordan Lee',
  stage: 'under_review',
  deadline: '2025-04-15',
  urgency: 'normal',
  fields: [
    {
      id: 'ac-f1',
      lineNumber: '1a',
      label: 'Wages, salaries, tips',
      value: 142000,
      state: 'ai_verified',
      source: {
        docId: 'ac-doc-w2',
        docName: 'W-2 — Hartfield & Associates CPA',
        page: 1,
        section: 'Box 1 — Wages, tips, other compensation',
        rawValue: '$142,000.00',
        transformation: 'Strip currency symbol and commas → parse as integer',
      },
      aiMeta: {
        confidence: 0.99,
        reasoning: 'Clean W-2 from a single employer. Box 1 unambiguous.',
        extractedAt: '2025-02-10T10:00:00Z',
      },
    },
    {
      id: 'ac-f2',
      lineNumber: '3b',
      label: 'Ordinary dividends',
      value: 4800,
      state: 'ai_generated',
      source: {
        docId: 'ac-doc-1099div',
        docName: '1099-DIV — Vanguard',
        page: 1,
        section: 'Box 1a — Total ordinary dividends',
        rawValue: '$4,800.22',
        transformation: 'Round to nearest dollar',
      },
      aiMeta: {
        confidence: 0.96,
        reasoning: 'Single account, single section, clear box labeling.',
        extractedAt: '2025-02-10T10:01:00Z',
      },
    },
    {
      id: 'ac-f3',
      lineNumber: '17',
      label: 'Total tax (calculated)',
      value: 32410,
      state: 'locked',
      lockReason: 'Calculated field — derived from lines 1–16.',
    },
  ],
  documents: [
    { id: 'ac-doc-w2', name: 'W-2 — Hartfield & Associates CPA', type: 'W-2', uploadedBy: 'cpa', uploadedAt: '2025-01-20', pages: 2, status: 'reviewed' },
    { id: 'ac-doc-1099div', name: '1099-DIV — Vanguard', type: '1099-DIV', uploadedBy: 'client', uploadedAt: '2025-01-25', pages: 1, status: 'reviewed' },
  ],
  threads: [],
  sections: [
    { id: 'ac-s1', label: 'Income', fieldIds: ['ac-f1', 'ac-f2'], isComplete: true, hasIssues: false },
    { id: 'ac-s2', label: 'Tax & Credits', fieldIds: ['ac-f3'], isComplete: false, hasIssues: false },
  ],
  blockers: [],
  lastActivity: '2025-02-13T09:00:00Z',
  amountDue: 2840,
};

// ─── Bulk return generator (~180 returns) ────────────────────────────────────

const FIRST_NAMES = [
  'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda',
  'William','Barbara','David','Susan','Richard','Jessica','Joseph','Sarah',
  'Thomas','Karen','Charles','Lisa','Christopher','Nancy','Daniel','Betty',
  'Matthew','Margaret','Anthony','Sandra','Mark','Ashley','Donald','Dorothy',
  'Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle',
  'Kenneth','Carol','Kevin','Amanda','Brian','Melissa','George','Deborah',
  'Timothy','Stephanie','Ronald','Rebecca','Edward','Sharon','Jason','Laura',
  'Jeffrey','Cynthia','Ryan','Kathleen','Gary','Amy','Nicholas','Angela',
  'Eric','Shirley','Jonathan','Anna','Stephen','Brenda','Larry','Pamela',
  'Frank','Emma','Scott','Helen','Raymond','Christine','Gregory','Samantha',
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson',
  'Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson',
  'White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen',
  'Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera',
  'Campbell','Carter','Roberts','Evans','Turner','Collins','Stewart','Morris',
  'Reed','Cook','Bailey','Bell','Cooper','Richardson','Cox','Howard',
];

const BUSINESS_NAMES = [
  'Apex Solutions','Blue Ridge Partners','Cornerstone Group','Delta Ventures',
  'Evergreen Holdings','Frontier Associates','Global Dynamics','Harbor Capital',
  'Ironwood Enterprises','Jade Consulting','Keystone Industries','Liberty Group',
  'Maple Leaf Partners','Northgate Corp','Oakwood Holdings','Pacific Ventures',
  'Quantum Solutions','River Rock LLC','Summit Partners','Titan Industries',
  'Unified Systems','Valley Enterprises','Westside Holdings','Zenith Group',
  'Arbor Capital','Beacon Strategies','Cascade Solutions','Driftwood Partners',
  'Elevation Group','Fairway Enterprises','Granite Holdings','Highland Corp',
];

const PREPARERS = ['Alex Chen', 'Morgan Wu', 'Taylor Kim'];
const REVIEWERS = ['Jordan Lee', 'Sam Patel'];

const BULK_STAGES: ReturnStage[] = [
  'gathering_documents','under_review','corrections_needed',
  'client_review','approved','filed',
];
const BULK_TYPES: TaxReturn['type'][] = ['1040','1065','1120S','1041'];
const BULK_URGENCIES: TaxReturn['urgency'][] = ['critical','high','normal','low'];

const BLOCKERS_POOL = [
  'Missing W-2 from secondary employer',
  'No response from client — 5 days overdue',
  'Brokerage statements not uploaded',
  'Partnership K-1 pending from entity',
  'Prior year return needed for basis calculation',
  'Home office square footage unconfirmed',
  'Rental property depreciation schedule missing',
  'Foreign income disclosure outstanding',
  'Estimated tax payment records needed',
  'Business auto mileage log not provided',
  'Crypto transaction history needed',
  'Amended return from partner pending',
  'State tax ID verification required',
  'Health insurance premium allocation unclear',
  'Vehicle depreciation method not selected',
  'Retirement contribution limits need verification',
];

function prand(seed: number): number {
  let s = (seed * 1664525 + 1013904223) & 0xffffffff;
  s = (s ^ (s >>> 16)) & 0xffffffff;
  s = (s * 2246822519) & 0xffffffff;
  s = (s ^ (s >>> 13)) & 0xffffffff;
  return ((s >>> 0) / 0x100000000);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(prand(seed) * arr.length)];
}

function generateBulkReturns(count: number, startSeed: number = 1000): TaxReturn[] {
  const results: TaxReturn[] = [];
  for (let i = 0; i < count; i++) {
    const s = startSeed + i * 97;
    const isBusinessEntity = prand(s * 7 + 1) > 0.55;
    const type: TaxReturn['type'] = isBusinessEntity
      ? pick(['1065', '1120S', '1041'] as TaxReturn['type'][], s * 3 + 2)
      : '1040';

    const clientName = type === '1040'
      ? `${pick(FIRST_NAMES, s * 11 + 3)} ${pick(LAST_NAMES, s * 13 + 5)}`
      : pick(BUSINESS_NAMES, s * 17 + 7);

    const stage = pick(BULK_STAGES, s * 19 + 9);
    const urgency = pick(BULK_URGENCIES, s * 23 + 11);
    const preparer = pick(PREPARERS, s * 29 + 13);
    const reviewer = prand(s * 31 + 15) > 0.45 ? pick(REVIEWERS, s * 37 + 17) : undefined;
    const deadline = (type === '1065' || type === '1120S') ? '2025-03-15' : '2025-04-15';

    const wantBlockers = stage === 'gathering_documents' || stage === 'corrections_needed';
    const blockerCount = wantBlockers
      ? (urgency === 'critical' ? 2 : prand(s * 41 + 19) > 0.5 ? 1 : 0)
      : 0;
    const blockers: string[] = [];
    for (let b = 0; b < blockerCount; b++) {
      const bl = pick(BLOCKERS_POOL, s * (43 + b * 7) + 21);
      if (!blockers.includes(bl)) blockers.push(bl);
    }

    const daysAgo = Math.floor(prand(s * 47 + 23) * 45);
    const lastActivity = new Date(Date.now() - daysAgo * 86400000).toISOString();

    let refund: number | undefined;
    let amountDue: number | undefined;
    if (stage === 'approved' || stage === 'filed') {
      if (prand(s * 53 + 25) > 0.35) {
        refund = Math.floor(prand(s * 59 + 27) * 9000) + 400;
      } else {
        amountDue = Math.floor(prand(s * 61 + 29) * 6000) + 150;
      }
    }

    results.push({
      id: `ret-bulk-${s}`,
      year: 2024,
      type,
      clientId: `client-${s}`,
      clientName,
      preparer,
      reviewer,
      stage,
      deadline,
      urgency,
      fields: [],
      documents: [],
      threads: [],
      sections: [],
      blockers,
      lastActivity,
      refund,
      amountDue,
    });
  }
  return results;
}

// ─── Named hand-crafted returns ───────────────────────────────────────────────

const mk = (
  id: string, clientName: string, type: TaxReturn['type'],
  stage: ReturnStage, urgency: TaxReturn['urgency'],
  preparer: string, deadline: string, blockers: string[],
  lastActivity: string, refund?: number, amountDue?: number, reviewer?: string,
): TaxReturn => ({
  id, year: 2024, type, clientId: id, clientName, preparer, reviewer,
  stage, deadline, urgency, fields: [], documents: [], threads: [],
  sections: [], blockers, lastActivity, refund, amountDue,
});

const coreReturns: TaxReturn[] = [
  { ...sampleReturn },
  alexPersonalReturn,
  mk('ret-thompson','Marcus Thompson','1040','gathering_documents','critical','Alex Chen','2025-04-15',['Questionnaire not started','No documents uploaded'],'2025-01-10T09:00:00Z'),
  mk('ret-patel','Priya Patel','1065','client_review','critical','Morgan Wu','2025-03-15',[],'2025-02-15T16:00:00Z',undefined,undefined,'Jordan Lee'),
  mk('ret-kim','David Kim','1120S','under_review','high','Morgan Wu','2025-03-15',['Waiting for audited financials'],'2025-02-13T11:00:00Z'),
  mk('ret-walsh','Jennifer Walsh','1040','approved','low','Alex Chen','2025-04-15',[],'2025-02-12T15:00:00Z',3240),
  mk('ret-rodriguez','Carlos Rodriguez','1040','under_review','normal','Alex Chen','2025-04-15',[],'2025-02-14T10:00:00Z'),
  mk('ret-anderson','Lisa Anderson','1040','filed','low','Morgan Wu','2025-04-15',[],'2025-02-08T12:00:00Z',1850),
  mk('ret-chen-trust','Chen Family Trust','1041','corrections_needed','high','Alex Chen','2025-04-15',['Trust document amendment needed'],'2025-02-13T14:00:00Z',undefined,undefined,'Jordan Lee'),
  mk('ret-johnson','Robert Johnson','1040','gathering_documents','normal','Morgan Wu','2025-04-15',['Waiting for brokerage statements'],'2025-01-28T09:00:00Z'),
  mk('ret-nguyen','Anh Nguyen','1040','client_review','high','Alex Chen','2025-04-15',[],'2025-02-15T08:00:00Z',5120),
  mk('ret-garcia','Garcia & Sons LLC','1065','under_review','critical','Morgan Wu','2025-03-15',['Missing partner basis schedules'],'2025-02-14T17:00:00Z',undefined,undefined,'Jordan Lee'),
  mk('ret-raj','Raj Patel','1040','approved','low','Alex Chen','2025-04-15',[],'2025-02-11T13:00:00Z',undefined,2340),
  mk('ret-williams','Diana Williams','1040','corrections_needed','normal','Morgan Wu','2025-04-15',['Home office documentation needed'],'2025-02-13T09:00:00Z'),
  mk('ret-jackson','Thomas Jackson','1040','filed','low','Alex Chen','2025-04-15',[],'2025-02-07T15:00:00Z',840),
  mk('ret-hassan','Hassan Tech Solutions','1120S','gathering_documents','critical','Morgan Wu','2025-03-15',['No client response — 3 days overdue','Balance sheet not uploaded'],'2025-02-10T12:00:00Z',undefined,undefined,'Jordan Lee'),
  mk('ret-martinez','Elena Martinez','1040','under_review','normal','Alex Chen','2025-04-15',[],'2025-02-15T10:00:00Z'),
  mk('ret-robinson','Kevin Robinson','1040','client_review','normal','Morgan Wu','2025-04-15',[],'2025-02-14T16:00:00Z',undefined,1280),
  mk('ret-lee-family','Lee Family Partnership','1065','under_review','high','Alex Chen','2025-03-15',[],'2025-02-15T11:00:00Z'),
  mk('ret-brown','Patricia Brown','1040','corrections_needed','high','Morgan Wu','2025-04-15',['Rental property depreciation schedule missing'],'2025-02-12T14:00:00Z'),
  mk('ret-clark','Nathan Clark','1040','approved','low','Alex Chen','2025-04-15',[],'2025-02-10T13:00:00Z',4200),
];

export const bulkReturns: TaxReturn[] = generateBulkReturns(180);

export const allReturns: TaxReturn[] = [...coreReturns, ...bulkReturns];

// ─── Stage / urgency / field config ──────────────────────────────────────────

export const STAGES: ReturnStage[] = [
  'gathering_documents','under_review','corrections_needed',
  'client_review','approved','filed',
];

export const stageConfig: Record<ReturnStage, {
  cpaLabel: string; clientLabel: string;
  color: string; bg: string; description: string;
}> = {
  gathering_documents: {
    cpaLabel: 'Gathering Documents', clientLabel: 'Submitting Info',
    color: 'text-slate-600', bg: 'bg-slate-100',
    description: 'Waiting for client to upload required documents and complete questionnaire.',
  },
  under_review: {
    cpaLabel: 'Under Review', clientLabel: 'Being Prepared',
    color: 'text-blue-700', bg: 'bg-blue-100',
    description: 'CPA is actively reviewing documents and preparing the return.',
  },
  corrections_needed: {
    cpaLabel: 'Corrections Needed', clientLabel: 'Being Prepared',
    color: 'text-amber-700', bg: 'bg-amber-100',
    description: 'Open issues must be resolved before the return can proceed.',
  },
  client_review: {
    cpaLabel: 'Client Review', clientLabel: 'Your Review',
    color: 'text-violet-700', bg: 'bg-violet-100',
    description: 'Return is ready for client to review and approve.',
  },
  approved: {
    cpaLabel: 'Approved', clientLabel: 'Complete',
    color: 'text-emerald-700', bg: 'bg-emerald-100',
    description: 'Client has approved. Ready to file.',
  },
  filed: {
    cpaLabel: 'Filed', clientLabel: 'Complete',
    color: 'text-emerald-700', bg: 'bg-emerald-100',
    description: 'Return has been filed with the IRS.',
  },
};

export const urgencyConfig = {
  critical: { label: 'Critical', color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500',    order: 0 },
  high:     { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-400', order: 1 },
  normal:   { label: 'Normal',   color: 'text-slate-600',  bg: 'bg-slate-100',  dot: 'bg-slate-400',  order: 2 },
  low:      { label: 'Low',      color: 'text-slate-500',  bg: 'bg-slate-100',  dot: 'bg-slate-300',  order: 3 },
};

export const fieldStateConfig: Record<FieldState, {
  label: string; badge: string; badgeBg: string; description: string;
}> = {
  ai_generated:  { label: 'AI Extracted',   badge: 'text-violet-700', badgeBg: 'bg-violet-50 border border-violet-200',  description: 'Extracted by AI — verify before accepting' },
  ai_verified:   { label: 'AI · Verified',  badge: 'text-emerald-700',badgeBg: 'bg-emerald-50 border border-emerald-200',description: 'AI extraction verified by CPA' },
  manual_entry:  { label: 'Manual Entry',   badge: 'text-blue-700',   badgeBg: 'bg-blue-50 border border-blue-200',      description: 'Entered manually by CPA' },
  client_provided:{ label:'Client Provided', badge: 'text-indigo-700',   badgeBg: 'bg-indigo-50 border border-indigo-200',      description: 'Answered by client in questionnaire' },
  locked:        { label: 'Locked',          badge: 'text-slate-500',  badgeBg: 'bg-slate-50 border border-slate-200',    description: 'Read-only — cannot be changed' },
  needs_approval:{ label: 'Needs Approval',  badge: 'text-amber-700',  badgeBg: 'bg-amber-50 border border-amber-200',    description: 'Requires senior reviewer sign-off' },
  corrected:     { label: 'AI Corrected',    badge: 'text-orange-700', badgeBg: 'bg-orange-50 border border-orange-200',  description: 'AI extraction was overridden' },
  rejected:      { label: 'Rejected',        badge: 'text-red-700',    badgeBg: 'bg-red-50 border border-red-200',        description: 'AI extraction rejected — needs a corrected value or client clarification' },
};

// ─── Mock clients ────────────────────────────────────────────────────────────

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@example.com',
    role: 'client',
    phone: '(555) 123-4567',
    company: 'Mitchell Family Holdings',
    joinedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'c2',
    name: 'Marcus Thompson',
    email: 'marcus.thompson@example.com',
    role: 'client',
    phone: '(555) 234-5678',
    joinedAt: '2024-02-20T10:30:00Z',
  },
  {
    id: 'c3',
    name: 'Priya Patel',
    email: 'priya@patelbusiness.com',
    role: 'client',
    company: 'Patel & Associates',
    phone: '(555) 345-6789',
    joinedAt: '2024-01-05T09:15:00Z',
  },
  {
    id: 'c4',
    name: 'David Kim',
    email: 'dkim@techventures.com',
    role: 'client',
    company: 'Tech Ventures LLC',
    joinedAt: '2024-02-01T14:00:00Z',
  },
  {
    id: 'c5',
    name: 'Jennifer Walsh',
    email: 'jen.walsh@consulting.com',
    role: 'client',
    company: 'Walsh Consulting Group',
    phone: '(555) 456-7890',
    joinedAt: '2024-01-28T11:20:00Z',
  },
];

// ─── Main export alias ───────────────────────────────────────────────────────

export const mockReturns = allReturns;

// ─── Role-based data scoping (shared by Dashboard, ReturnsList, command palette) ──

export function scopedReturnsForRole(role: Role, userName: string): TaxReturn[] {
  if (role === 'client') return allReturns.filter(r => r.clientName === userName);
  if (role === 'seasonal_staff') return allReturns.filter(r => r.preparer === 'Taylor Kim');
  return allReturns;
}
