import type { ReturnField, Thread, Message, Role, CorrectionEntry } from '../data/mockData';

// ─── Permissions ──────────────────────────────────────────────────────────────
// A concrete demonstration of role-based permissions: not every role can take
// every action on an AI-extracted field.
export function permissionsFor(role: Role) {
  return {
    canVerify:   ['cpa', 'reviewer', 'admin', 'seasonal_staff'].includes(role),  // ai_generated -> ai_verified (seasonal staff can confirm obvious cases, but nothing more)
    canSignOff:  ['reviewer', 'admin'].includes(role),          // needs_approval -> ai_verified (senior sign-off only)
    canOverride: ['cpa', 'reviewer', 'admin'].includes(role),   // provide a corrected value
    canReject:   ['cpa', 'reviewer', 'admin'].includes(role),   // flag an AI value as wrong
    canAsk:      true,                                          // anyone can request clarification
  };
}

export function messageRoleFor(role: Role): 'cpa' | 'client' | 'reviewer' {
  if (role === 'client' || role === 'business_owner') return 'client';
  if (role === 'reviewer') return 'reviewer';
  return 'cpa'; // admin, seasonal_staff, cpa
}

export interface FieldActionsCtx {
  patchField: (returnId: string, fieldId: string, patch: Partial<ReturnField>) => ReturnField | undefined;
  addThread: (returnId: string, thread: Thread) => void;
}

export function verifyField(ctx: FieldActionsCtx, returnId: string, field: ReturnField) {
  return ctx.patchField(returnId, field.id, { state: 'ai_verified' });
}

export function approveField(ctx: FieldActionsCtx, returnId: string, field: ReturnField) {
  return ctx.patchField(returnId, field.id, { state: 'ai_verified', approvalNote: undefined });
}

export function rejectField(ctx: FieldActionsCtx, returnId: string, field: ReturnField, reason: string) {
  return ctx.patchField(returnId, field.id, { state: 'rejected', rejectionReason: reason });
}

export function overrideField(
  ctx: FieldActionsCtx, returnId: string, field: ReturnField,
  val: string, reason: string, correctedBy: string,
) {
  const oldValue = field.value;
  const newValue: number | string = typeof oldValue === 'number'
    ? Number(val.replace(/[^0-9.-]/g, '')) || 0
    : val;
  const entry: CorrectionEntry = { oldValue, newValue, correctedBy, reason, date: new Date().toISOString() };
  return ctx.patchField(returnId, field.id, {
    value: newValue,
    state: 'corrected',
    rejectionReason: undefined,
    correctionHistory: [...(field.correctionHistory ?? []), entry],
  });
}

export function buildClarificationThread(
  field: ReturnField, askingClient: boolean, authorName: string, msgRole: Message['role'],
): Thread {
  const threadId = `thread-field-${field.id}-${Date.now()}`;
  return {
    id: threadId,
    title: `Question: ${field.label}`,
    linkedFieldId: field.id,
    linkedDocId: field.source?.docId,
    linkedIssue: `Clarification needed on Line ${field.lineNumber}`,
    ownerAction: askingClient ? 'client' : 'cpa',
    priority: 'normal',
    isResolved: false,
    createdAt: new Date().toISOString(),
    messages: [{
      id: `m-${Date.now()}`,
      threadId,
      author: authorName,
      role: msgRole,
      content: `Can you confirm the value for "${field.label}" (Line ${field.lineNumber})? Currently showing ${typeof field.value === 'number' ? `$${field.value.toLocaleString()}` : field.value}.`,
      timestamp: new Date().toISOString(),
      isInternal: false,
      requestStatus: 'open',
    }],
  };
}
