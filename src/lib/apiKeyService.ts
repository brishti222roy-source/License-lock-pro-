export interface APIKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  permissions: string[];
  status: 'active' | 'revoked';
}

const STORAGE_KEY = 'licenselock_api_keys';

const generateAPIKey = (): string => {
  const prefix = 'llp_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

export const apiKeyService = {
  create: (userId: string, name: string, permissions: string[], expiresInDays?: number): Promise<APIKey> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        let expiresAt: string | undefined;
        if (expiresInDays) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + expiresInDays);
          expiresAt = expiry.toISOString();
        }

        const apiKey: APIKey = {
          id: crypto.randomUUID(),
          name,
          key: generateAPIKey(),
          userId,
          createdAt: new Date().toISOString(),
          expiresAt,
          permissions,
          status: 'active',
        };

        allKeys.push(apiKey);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allKeys));

        resolve(apiKey);
      }, 500);
    });
  },

  getAll: (userId: string): Promise<APIKey[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allKeys: APIKey[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        resolve(allKeys.filter(k => k.userId === userId));
      }, 500);
    });
  },

  revoke: (keyId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allKeys: APIKey[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const index = allKeys.findIndex(k => k.id === keyId);
        
        if (index !== -1) {
          allKeys[index].status = 'revoked';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allKeys));
        }
        
        resolve();
      }, 500);
    });
  },

  delete: (keyId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allKeys: APIKey[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = allKeys.filter(k => k.id !== keyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        resolve();
      }, 500);
    });
  },

  verify: (key: string): Promise<{ valid: boolean; apiKey?: APIKey; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allKeys: APIKey[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const apiKey = allKeys.find(k => k.key === key);

        if (!apiKey) {
          resolve({ valid: false, error: 'Invalid API key' });
          return;
        }

        if (apiKey.status === 'revoked') {
          resolve({ valid: false, error: 'API key has been revoked' });
          return;
        }

        if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
          resolve({ valid: false, error: 'API key has expired' });
          return;
        }

        // Update last used
        const index = allKeys.findIndex(k => k.id === apiKey.id);
        if (index !== -1) {
          allKeys[index].lastUsed = new Date().toISOString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allKeys));
        }

        resolve({ valid: true, apiKey });
      }, 500);
    });
  },
};