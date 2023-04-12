import { GrantService, Storage } from '@nexus-wallet-backup/types';
import { errors } from '@nexus-wallet-backup/utils';

export function createGrantService(payload: { storage: Storage<{ grant: string[] }> }): GrantService {
  const { storage } = payload;

  return {
    async getIsGranted(payload) {
      const grantedUrls = await storage.getItem('grant');
      if (!grantedUrls) return false;
      return grantedUrls.includes(payload.host);
    },
    async grant(payload) {
      const grantedUrls = await storage.getItem('grant');
      if (!grantedUrls) {
        errors.throwError('Storage is not initialized');
      }
      grantedUrls.push(payload.host);
      await storage.setItem('grant', grantedUrls);
    },
    async revoke(payload) {
      const grantedUrls = await storage.getItem('grant');

      if (!grantedUrls) return;

      const revoked = grantedUrls.filter((host) => host === payload.host);
      await storage.setItem('grant', revoked);
    },
  };
}
