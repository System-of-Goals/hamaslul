import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { storage } from './storage';
import { emptyLog } from './schedule';
import { iso } from './dates';
import type { DayLog, Meta, UserData } from './types';

interface Store {
  ready: boolean;
  data: UserData | null;
  logs: Record<string, DayLog>;
  meta: Meta;
  setData: (fn: (d: UserData) => UserData) => void;
  replaceData: (d: UserData) => Promise<void>;
  logFor: (day: string) => DayLog;
  updateLog: (day: string, fn: (l: DayLog) => DayLog) => void;
  setMeta: (fn: (m: Meta) => Meta) => void;
  exportAll: () => string;
  importAll: (json: string) => Promise<'data' | 'backup'>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setDataState] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [meta, setMetaState] = useState<Meta>({ firstUse: iso(new Date()), reviewed: {} });

  useEffect(() => {
    (async () => {
      const [d, l, m] = await Promise.all([
        storage.get<UserData>('data'), storage.get<Record<string, DayLog>>('logs'), storage.get<Meta>('meta'),
      ]);
      setDataState(d ?? null);
      setLogs(l ?? {});
      if (m) setMetaState(m);
      else await storage.set('meta', { firstUse: iso(new Date()), reviewed: {} });
      setReady(true);
    })();
  }, []);

  const setData = useCallback((fn: (d: UserData) => UserData) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      storage.set('data', next);
      return next;
    });
  }, []);

  const replaceData = useCallback(async (d: UserData) => {
    await storage.set('data', d);
    setDataState(d);
  }, []);

  const updateLog = useCallback((day: string, fn: (l: DayLog) => DayLog) => {
    setLogs((prev) => {
      const next = { ...prev, [day]: fn(prev[day] ?? emptyLog()) };
      storage.set('logs', next);
      return next;
    });
  }, []);

  const setMeta = useCallback((fn: (m: Meta) => Meta) => {
    setMetaState((prev) => { const next = fn(prev); storage.set('meta', next); return next; });
  }, []);

  const logFor = useCallback((day: string) => logs[day] ?? emptyLog(), [logs]);

  const exportAll = () => JSON.stringify({ kind: 'hamaslul-backup', exportedAt: new Date().toISOString(), data, logs, meta }, null, 1);

  const importAll = async (json: string) => {
    const obj = JSON.parse(json);
    if (obj?.kind === 'hamaslul-backup') {
      await Promise.all([storage.set('data', obj.data), storage.set('logs', obj.logs ?? {}), storage.set('meta', obj.meta)]);
      setDataState(obj.data); setLogs(obj.logs ?? {}); if (obj.meta) setMetaState(obj.meta);
      return 'backup';
    }
    if (obj?.version === 1 && Array.isArray(obj.templates)) {
      await replaceData(obj as UserData);
      return 'data';
    }
    throw new Error('bad file');
  };

  return (
    <Ctx.Provider value={{ ready, data, logs, meta, setData, replaceData, logFor, updateLog, setMeta, exportAll, importAll }}>
      {children}
    </Ctx.Provider>
  );
}

/** Opens a file picker and returns the chosen file's text. */
export function pickFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return reject(new Error('no file'));
      f.text().then(resolve, reject);
    };
    input.click();
  });
}

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
