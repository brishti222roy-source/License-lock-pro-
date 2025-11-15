export interface TwoFactorSetup {
  secret: string;
  // QR image was previously a placeholder; now we expose the otpauth URL
  otpauthUrl: string;
  // Keep qrCode for backward compatibility (will contain the otpauthUrl string)
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
}

const STORAGE_KEY = 'licenselock_2fa';

// Generate a random secret (in real app, use a proper library like speakeasy)
const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

// Generate backup codes
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Build the otpauth URL used by authenticator apps
const buildOtpauthUrl = (secret: string, email: string): string => {
  return `otpauth://totp/LicenseLock:${email}?secret=${secret}&issuer=LicenseLock`;
};

// Simple TOTP verification (in real app, use proper TOTP library)
const verifyTOTP = (secret: string, token: string): boolean => {
  // Mock verification - in real app, calculate TOTP based on time
  // For demo, accept any 6-digit code
  return /^\d{6}$/.test(token);
};

export const twoFactorAuth = {
  setup: (email: string): Promise<TwoFactorSetup> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        const otpauthUrl = buildOtpauthUrl(secret, email);

        const twoFactorData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        twoFactorData[email] = {
          secret,
          backupCodes,
          enabled: false,
          verified: false,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(twoFactorData));

        // Return otpauthUrl for proper QR rendering
        resolve({ secret, otpauthUrl, qrCode: otpauthUrl, backupCodes });
      }, 500);
    });
  },

  verify: (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const twoFactorData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const userData = twoFactorData[email];

        if (!userData) {
          resolve({ success: false, error: '2FA not set up' });
          return;
        }

        // Check if it's a backup code
        const backupCodeIndex = userData.backupCodes.indexOf(token);
        if (backupCodeIndex !== -1) {
          // Remove used backup code
          userData.backupCodes.splice(backupCodeIndex, 1);
          userData.enabled = true;
          userData.verified = true;
          twoFactorData[email] = userData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(twoFactorData));
          resolve({ success: true });
          return;
        }

        // Verify TOTP
        if (verifyTOTP(userData.secret, token)) {
          userData.enabled = true;
          userData.verified = true;
          twoFactorData[email] = userData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(twoFactorData));
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Invalid code' });
        }
      }, 500);
    });
  },

  disable: (email: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const twoFactorData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        delete twoFactorData[email];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(twoFactorData));
        resolve();
      }, 500);
    });
  },

  getStatus: (email: string): Promise<TwoFactorStatus> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const twoFactorData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const userData = twoFactorData[email];

        if (!userData) {
          resolve({ enabled: false, verified: false });
        } else {
          resolve({ enabled: userData.enabled, verified: userData.verified });
        }
      }, 500);
    });
  },

  getBackupCodes: (email: string): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const twoFactorData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const userData = twoFactorData[email];
        resolve(userData?.backupCodes || []);
      }, 500);
    });
  },
};