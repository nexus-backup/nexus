import { ConfigService, KeystoreService, PlatformService } from '@nexus-wallet-backup/types';
import { NetworkConfig } from '@nexus-wallet-backup/types/lib/services';
import { EventHub } from './event';
import {
  FULL_OWNERSHIP_EXTERNAL_PARENT_PATH,
  FULL_OWNERSHIP_INTERNAL_PARENT_PATH,
  RULE_BASED_PARENT_PATH,
} from './ownership';

const DEFAULT_NETWORKS: NetworkConfig[] = [
  { id: 'mainnet', networkName: 'ckb', displayName: 'Mainnet', rpcUrl: 'https://mainnet.ckb.dev' },
  { id: 'testnet', networkName: 'ckb_testnet', displayName: 'Testnet', rpcUrl: 'https://testnet.ckb.dev' },
];

export interface InternalService {
  initWallet: (payload: { password: string; nickname: string; mnemonic: string | string[] }) => Promise<void>;
  startInitIfNotInitialized: () => Promise<void>;
  isInitialized: () => Promise<boolean>;
}

export function createInternalService(payload: {
  keystoreService: KeystoreService;
  configService: ConfigService;
  platformService: PlatformService;
  eventHub: EventHub;
}): InternalService {
  const { keystoreService, configService, platformService, eventHub } = payload;

  const impl: InternalService = {
    initWallet: async (payload) => {
      const mnemonic = Array.isArray(payload.mnemonic) ? payload.mnemonic.join(' ') : payload.mnemonic;
      await configService.setConfig({
        config: {
          nickname: payload.nickname,
          whitelist: [],
          selectedNetwork: 'testnet',
          networks: DEFAULT_NETWORKS,
        },
      });
      await keystoreService.initKeystore({
        password: payload.password,
        mnemonic,
        paths: [FULL_OWNERSHIP_EXTERNAL_PARENT_PATH, FULL_OWNERSHIP_INTERNAL_PARENT_PATH, RULE_BASED_PARENT_PATH],
      });

      eventHub.emit('walletInitialized');
    },

    isInitialized: () => Promise.resolve(keystoreService.hasInitialized()),
    startInitIfNotInitialized: /* istanbul ignore next */ async () => {
      const initialized = await impl.isInitialized();
      if (initialized) return;
      await platformService.navigateToInitWallet();
    },
  };

  return impl;
}
