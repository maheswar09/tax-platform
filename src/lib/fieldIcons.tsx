import {
  Sparkles, CheckCircle2, PenLine, CircleDot, Lock, AlertTriangle, RotateCcw, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FieldState } from '../data/mockData';

// Consistent monochrome iconography for every field state — no emoji glyphs,
// which render inconsistently across platforms and clash with the icon set.
export const FIELD_STATE_ICONS: Record<FieldState, LucideIcon> = {
  ai_generated: Sparkles,
  ai_verified: CheckCircle2,
  manual_entry: PenLine,
  client_provided: CircleDot,
  locked: Lock,
  needs_approval: AlertTriangle,
  corrected: RotateCcw,
  rejected: XCircle,
};
