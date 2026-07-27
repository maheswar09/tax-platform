# AI-Powered Tax Platform - Product Architecture

## Information Hierarchy & Object Relationships

### Core Object Model

```
Tenant (Organization)
├── Users (CPA, Staff, Manager, Admin)
├── Clients (Businesses)
│   └── TaxReturns (Multiple years)
│       ├── ReturnMetadata (Year, status, stage, last_modified)
│       ├── Documents (1:Many)
│       │   ├── Type (1099, W-2, Invoice, Receipt, etc.)
│       │   ├── Status (Pending review, Classified, Flagged)
│       │   └── AIAnalysis (Category, confidence, extracted data)
│       ├── AIReviews (1:Many)
│       │   ├── Suggestion (What)
│       │   ├── Reasoning (Why)
│       │   ├── Confidence (0-100)
│       │   ├── Evidence (Supporting data)
│       │   ├── Status (Pending, Approved, Rejected)
│       │   └── AuditTrail (Who/When/What changed)
│       ├── Tasks (1:Many)
│       │   ├── Type (Get more info, Clarify, Review)
│       │   ├── AssignedTo (Staff member)
│       │   ├── Status (Open, In Progress, Complete)
│       │   └── DueDate (Optional)
│       ├── Messages (1:Many)
│       │   ├── Sender (Staff or Client)
│       │   ├── Type (Question, Info, Reminder)
│       │   ├── Context (Linked to document or suggestion)
│       │   └── Status (Sent, Read, Responded)
│       └── ReviewApproval (Final stage)
│           ├── ReviewedBy (CPA)
│           ├── ApprovedAt (Timestamp)
│           └── SubmitDate (Filing date)
```

### Relationship Flows

```
Return Lifecycle:
┌─────────────────────────────────────────────────────────────────┐
│ INITIATED                                                        │
│ Client documents uploaded, system initializes return             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
┌───────────────────┐              ┌──────────────────────┐
│ DOCUMENTS INGESTED│              │ AI ANALYSIS IN QUEUE │
│ Files organized   │              │ Processing          │
│ by category       │              │                      │
└──────────┬────────┘              └──────────┬───────────┘
           │                                 │
           └──────────────┬──────────────────┘
                          ▼
               ┌──────────────────────┐
               │ AI SUGGESTIONS READY │
               │ CPA notified         │
               │ Timeline starts      │
               └──────────┬───────────┘
                          ▼
               ┌──────────────────────┐
               │ REVIEW IN PROGRESS   │
               │ CPA evaluates        │
               │ Client feedback loop │
               └──────────┬───────────┘
                          ▼
               ┌──────────────────────┐
               │ APPROVED             │
               │ Final checks passed  │
               │ Ready for filing     │
               └──────────┬───────────┘
                          ▼
               ┌──────────────────────┐
               │ SUBMITTED            │
               │ Sent to IRS/State    │
               │ Complete             │
               └──────────────────────┘

Alternative path (Rejected):
REVIEW → REJECTED → [CLIENT LOOP] → REVIEW AGAIN
```

---

## Screen Map

### Global Navigation Structure

```
App
│
├── Authentication
│   ├── Login
│   ├── Signup (if applicable)
│   └── Onboarding
│
└── Main Application
    ├── DASHBOARD TAB
    │   ├── Overview (Quick stats, hot items)
    │   ├── Timeline (What's due, what's ready)
    │   ├── Team Performance (If manager)
    │   └── Quick Actions (Buttons/shortcuts)
    │
    ├── RETURNS TAB
    │   ├── Returns List
    │   │   ├── Filtering (Status, assigned, year, client)
    │   │   ├── Sorting (Priority, due date, CPA assigned)
    │   │   └── Bulk Actions (Reassign, flag, export)
    │   │
    │   └── Return Detail
    │       ├── Header (Return ID, client, status)
    │       ├── Tabs
    │       │   ├── Summary (Quick overview)
    │       │   ├── Documents (Organized list)
    │       │   ├── AI Review (Suggestions with evidence)
    │       │   ├── Tasks (Open items)
    │       │   └── Messages (Timeline)
    │       └── Side Panel (AI explanation, history)
    │
    ├── DOCUMENTS TAB
    │   ├── Browse by type (1099, W-2, Invoices, etc.)
    │   ├── Full-text search
    │   └── Document Viewer
    │
    ├── TASKS TAB
    │   ├── My Tasks (Assigned to me)
    │   ├── Team Tasks (If manager)
    │   ├── Filters (Status, due date, priority)
    │   └── Task Detail & Inline Editing
    │
    ├── MESSAGES TAB
    │   ├── Conversations (Grouped by return/client)
    │   ├── Compose (New message to client or team)
    │   ├── Templates (Quick responses)
    │   └── Message Detail
    │
    ├── AI REVIEW QUEUE TAB
    │   ├── Sorted by priority/confidence
    │   ├── Bulk approve/reject
    │   ├── Review each item with full context
    │   └── Override decision option
    │
    ├── SETTINGS TAB
    │   ├── User Preferences
    │   ├── Team Management (If manager)
    │   ├── Compliance Settings
    │   ├── Integrations
    │   ├── Notifications
    │   └── Data & Privacy
    │
    └── Support / Help
        ├── Onboarding Tour
        ├── Knowledge Base
        └── Contact Support
```

---

## Navigation Strategy

### Breadcrumb Pattern
```
Dashboard > Returns > Client: Acme Inc > Return: 2024 > AI Review
[Click to navigate back, or click specific level]
```

### Deep Linking
- Every screen has a unique, shareable URL
- State persists: filters, sort order, scroll position
- Keyboard shortcut: `⌘+K` (Cmd+K / Ctrl+K) opens command palette
- Command palette allows:
  - Search returns by ID or client name
  - Goto specific task
  - Search messages
  - Admin actions (if applicable)

### Context Preservation
- When drilling into return detail from list, list state saved
- When returning with back button, list state restored
- Multi-tab navigation preserves position within each tab
- Filters persist until explicitly cleared

---

## Component Hierarchy

### Layout Components
```
AppLayout
├── Sidebar Navigation (Collapsible on mobile)
├── Top Bar (User menu, search, notifications)
├── Main Content Area
│   ├── Breadcrumbs
│   ├── Page Header (Title, actions)
│   └── Page Content (Various layouts)
└── Modals/Drawers (Overlays for actions)
```

### Reusable Components

#### Data Display
- **Card:** Elevated container, shadow, rounded corners
- **Table:** Sticky headers, sortable columns, row actions
- **Timeline:** Vertical or horizontal workflow visualization
- **Badge:** Status indicator (tag-style)
- **Chip:** Removable filter indicator
- **Alert:** Warning, info, success, error messages

#### Input Components
- **Input:** Text field with label, validation, help text
- **Select:** Dropdown, searchable
- **Textarea:** Multi-line input
- **DatePicker:** Calendar date selection
- **Toggle/Switch:** On/off state
- **Checkbox:** Multi-select, standalone
- **Radio:** Single-choice option

#### Interaction Components
- **Button:** Primary, secondary, ghost, icon variants
- **Dropdown Menu:** Action menu, context menu
- **Modal:** Important decision, requires explicit action
- **Drawer/Side Panel:** Context without blocking
- **Toast/Notification:** Non-blocking info/error/success
- **Command Palette:** Global search and actions

#### AI-Specific Components
- **AI Card:** Suggestion with What/Why/Confidence/Evidence
- **Confidence Badge:** 0-100 score indicator
- **AI Review Decision:** Approve/Reject/Review buttons
- **Evidence Drawer:** Detailed reasoning and examples
- **Warning Banner:** High-risk item alert
- **Audit Trail:** Show who/when/what changed

### Component Composition Example

```
ReturnDetailScreen
├── PageHeader (Title, status badge, actions)
├── Breadcrumbs
├── TabNavigation (Summary | Documents | AI Review | Tasks | Messages)
│
├── [When Summary tab]
│   └── SummaryCard (Overview of all sections)
│       ├── QuickStats (# documents, # tasks, # AI suggestions)
│       ├── StatusTimeline (Visual progress)
│       └── NextActions (What to do next)
│
├── [When AI Review tab]
│   └── AIReviewList (Multiple AI cards)
│       └── AICard (per suggestion)
│           ├── SuggestionHeader (What, AI badge, confidence)
│           ├── ReasoningSection (Why it was flagged)
│           ├── EvidenceSection (Supporting data, examples)
│           └── ActionBar (Approve/Reject buttons)
│
└── SidePanel (Context, history, AI explanation)
    ├── ReviewHistory
    └── RelatedItems
```

---

## Interaction Flow

### Example: Approving AI Suggestion
```
1. User sees AI Review tab with suggestion cards
2. User hovers over card → See "Why" link
3. User clicks "Why" → Drawer opens with reasoning
4. User satisfied → Clicks "Approve" button
5. Optimistic UI: Button greyed, checkmark appears
6. Toast notification: "Suggestion approved"
7. 30-second undo window available
8. Server confirms, audit trail updated
9. AI suggestion moved to accepted pile
```

### Example: Bulk Reassigning Returns
```
1. User on Returns List tab
2. Filter: Status = "Ready for Review"
3. Shift+click or Cmd+click to select multiple
4. "Reassign" button appears in toolbar
5. Click → Modal with team members
6. Select assignee
7. Click "Reassign 5 returns"
8. Optimistic: Checkboxes greyed out
9. Toast: "5 returns reassigned"
10. List updates
11. Undo available for 30 seconds
```

---

## Breadcrumb Strategy

Every screen should show:
```
Home / Section / Subsection / Current Page
```

Examples:
- `Dashboard`
- `Returns / List`
- `Returns / 2024-1001 / Summary`
- `Returns / 2024-1001 / Documents`
- `Returns / 2024-1001 / AI Review / Deduction Mismatch`
- `Tasks`
- `Tasks / Get Client Backup / Details`

All elements clickable and maintaining state.

---

## Keyboard Shortcuts

```
Global:
  ⌘K (Cmd+K) or Ctrl+K    → Open Command Palette
  ?                        → Show help/shortcuts
  /                        → Focus search
  Esc                      → Close modal/drawer
  
Navigation:
  ⌘1                       → Go to Dashboard
  ⌘2                       → Go to Returns
  ⌘3                       → Go to Messages
  ⌘4                       → Go to Tasks
  ⌘5                       → Go to Settings
  
In Lists:
  ⌘A                       → Select all
  Shift+Click              → Select range
  Cmd/Ctrl+Click           → Select multiple
  
In Forms:
  ⌘⏎ (Cmd+Enter)          → Submit form
  Tab                      → Next field
  Shift+Tab                → Previous field
  
Actions:
  ⌘Z                       → Undo last action
  ⌘⇧Z                      → Redo
```

---

## Page Layout Patterns

### Full-Width Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ Title                              [Action] [Action]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Card 1: Stats]      [Card 2: Timeline]                │
│                       [Card 3: Hot Items]               │
│  [Card 4: Queue]      [Card 5: Metrics]                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### List + Detail Pattern
```
┌──────────────┬─────────────────────────────────────┐
│              │ Title                               │
│  Filter 1    ├─────────────────────────────────────┤
│  Filter 2    │  Content Area                       │
│              │  Content Area                       │
│  [List]      │  Content Area                       │
│  Item 1 ✓    │  (Side panel optional on right)     │
│  Item 2      │                                     │
│  Item 3      │  [Action] [Action]                  │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

### Cards with Side Panel
```
┌────────────────────────────────────┬──────────────────┐
│ Breadcrumb / Title / Actions       │   Side Panel     │
├────────────────────────────────────┼──────────────────┤
│  [Card 1]  [Card 2]  [Card 3]      │  Context Info    │
│  [Card 4]  [Card 5]  [Card 6]      │  History         │
│                                    │  Related Items   │
│  [More items...]                   │                  │
│                                    │  [Expand] Button │
└────────────────────────────────────┴──────────────────┘
```

---

## Summary

This architecture ensures:
- **Cohesive experience:** Same patterns everywhere
- **Deep linking:** Any screen can be bookmarked/shared
- **Efficient navigation:** Most screens <3 clicks
- **Context preservation:** State doesn't get lost
- **Keyboard power users:** Full functionality via shortcuts
- **Mobile responsive:** All patterns work at all sizes
- **Accessible:** Keyboard navigation, screen readers

The design is modular: each screen is self-contained but uses the same components and patterns globally.
