import { Storage } from '@nexus-wallet-backup/types';
import { errors } from '@nexus-wallet-backup/utils';

export interface InMemoryStorage<S> extends Storage<S> {
  getAll(): S | undefined;

  setAll(s: S): void;
}

export function createInMemoryStorage<S>(): InMemoryStorage<S> {
  const store = new Map();

  return {
    getItem(key) {
      const value = store.get(key) as string | undefined;
      if (!value) return value as undefined;
      // deep clone to avoid the value being modified by the caller
      return JSON.parse(JSON.stringify(value));
    },
    hasItem(key) {
      return store.has(key);
    },
    removeItem(key) {
      return store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
    getAll() {
      /* istanbul ignore next */
      return Object.fromEntries(store.entries()) as S;
    },
    setAll(s) {
      if (!s) errors.throwError(`The storage cannot be set to ${s}`);

      Object.entries(s).forEach(([key, value]) => {
        store.set(key, value);
      });
    },
  };
}
