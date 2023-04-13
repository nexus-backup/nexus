import { InjectedCkb } from '@nexus-wallet-backup/types';

declare global {
  interface Window {
    ckb: InjectedCkb;
  }
}
