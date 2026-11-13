// All data lives only on this device (IndexedDB). Nothing is sent to any server.
import { get, set, del } from 'idb-keyval';

export const storage = {
  get: <T>(key: string) => get<T>(key),
  set: <T>(key: string, value: T) => set(key, value),
  del: (key: string) => del(key),
};
