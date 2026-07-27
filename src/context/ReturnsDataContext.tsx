import React, { createContext, useContext, useState, useCallback } from 'react';
import { allReturns } from '../data/mockData';
import type { ReturnField, Thread, Message } from '../data/mockData';

interface Entry {
  fields: ReturnField[];
  threads: Thread[];
}

function initialData(): Record<string, Entry> {
  const map: Record<string, Entry> = {};
  for (const r of allReturns) map[r.id] = { fields: r.fields, threads: r.threads };
  return map;
}

interface ReturnsDataContextValue {
  getFields: (returnId: string) => ReturnField[];
  getThreads: (returnId: string) => Thread[];
  /** Directly replace a field — used for undo/revert. */
  setField: (returnId: string, field: ReturnField) => void;
  /** Patch a field and return its *previous* value (for undo). */
  patchField: (returnId: string, fieldId: string, patch: Partial<ReturnField>) => ReturnField | undefined;
  sendMessage: (returnId: string, threadId: string, msg: Message) => void;
  resolveThread: (returnId: string, threadId: string) => void;
  addThread: (returnId: string, thread: Thread) => void;
  /** Preparer reassignment overrides the mock default; falls back to the return's own preparer. */
  getPreparer: (returnId: string, fallback: string) => string;
  reassignPreparer: (returnId: string, preparer: string) => void;
}

const ReturnsDataContext = createContext<ReturnsDataContextValue | null>(null);

export function ReturnsDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Record<string, Entry>>(initialData);
  const [preparerOverrides, setPreparerOverrides] = useState<Record<string, string>>({});

  const getPreparer = useCallback((returnId: string, fallback: string) => preparerOverrides[returnId] ?? fallback, [preparerOverrides]);
  const reassignPreparer = useCallback((returnId: string, preparer: string) => {
    setPreparerOverrides(prev => ({ ...prev, [returnId]: preparer }));
  }, []);

  const getFields = useCallback((returnId: string) => data[returnId]?.fields ?? [], [data]);
  const getThreads = useCallback((returnId: string) => data[returnId]?.threads ?? [], [data]);

  const setField = useCallback((returnId: string, field: ReturnField) => {
    setData(prev => {
      const entry = prev[returnId];
      if (!entry) return prev;
      return { ...prev, [returnId]: { ...entry, fields: entry.fields.map(f => f.id === field.id ? field : f) } };
    });
  }, []);

  const patchField = useCallback((returnId: string, fieldId: string, patch: Partial<ReturnField>): ReturnField | undefined => {
    const entry = data[returnId];
    const prevField = entry?.fields.find(f => f.id === fieldId);
    if (!prevField) return undefined;
    const nextField = { ...prevField, ...patch };
    setData(prev => {
      const e = prev[returnId];
      if (!e) return prev;
      return { ...prev, [returnId]: { ...e, fields: e.fields.map(f => f.id === fieldId ? nextField : f) } };
    });
    return prevField;
  }, [data]);

  const sendMessage = useCallback((returnId: string, threadId: string, msg: Message) => {
    setData(prev => {
      const entry = prev[returnId];
      if (!entry) return prev;
      return {
        ...prev,
        [returnId]: { ...entry, threads: entry.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t) },
      };
    });
  }, []);

  const resolveThread = useCallback((returnId: string, threadId: string) => {
    setData(prev => {
      const entry = prev[returnId];
      if (!entry) return prev;
      return {
        ...prev,
        [returnId]: {
          ...entry,
          threads: entry.threads.map(t => t.id === threadId
            ? { ...t, isResolved: !t.isResolved, messages: t.messages.map(m => m.requestStatus ? { ...m, requestStatus: t.isResolved ? 'open' : 'resolved' } : m) }
            : t),
        },
      };
    });
  }, []);

  const addThread = useCallback((returnId: string, thread: Thread) => {
    setData(prev => {
      const entry = prev[returnId] ?? { fields: [], threads: [] };
      return { ...prev, [returnId]: { ...entry, threads: [thread, ...entry.threads] } };
    });
  }, []);

  return (
    <ReturnsDataContext.Provider value={{
      getFields, getThreads, setField, patchField, sendMessage, resolveThread, addThread,
      getPreparer, reassignPreparer,
    }}>
      {children}
    </ReturnsDataContext.Provider>
  );
}

export function useReturnsData() {
  const ctx = useContext(ReturnsDataContext);
  if (!ctx) throw new Error('useReturnsData must be used within ReturnsDataProvider');
  return ctx;
}
