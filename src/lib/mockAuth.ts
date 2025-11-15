export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}

const STORAGE_KEYS = {
  USER: 'licenselock_user',
  TOKEN: 'licenselock_token',
  USERS_DB: 'licenselock_users_db',
  RESET_TOKENS: 'licenselock_reset_tokens',
  SESSION_TIMEOUT: 'licenselock_session_timeout',
};

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export const mockAuth = {
  register: (email: string, password:string, name: string, licenseKey: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');

        if (usersDb[email]) {
          resolve({ success: false, error: 'Email already registered' });
          return;
        }

        // Validate license key (mock validation)
        if (!licenseKey || licenseKey.length !== 23) { // Assuming format XXXXX-XXXXX-XXXXX-XXXXX
          resolve({ success: false, error: 'Invalid license key' });
          return;
        }

        const user: User = {
          id: crypto.randomUUID(),
          email,
          name,
          createdAt: new Date().toISOString(),
        };

        usersDb[email] = { ...user, password, licenseKey };
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDb));

        resolve({ success: true });
      }, 500);
    });
  },

  login: (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
        const userData = usersDb[email];

        if (!userData || userData.password !== password) {
          resolve({ success: false, error: 'Invalid credentials' });
          return;
        }

        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          createdAt: userData.createdAt,
        };

        const token: AuthToken = {
          token: crypto.randomUUID(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(token));

        resolve({ success: true, user });
      }, 500);
    });
  },

  logout: (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        resolve();
      }, 500);
    });
  },

  getCurrentUser: (): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        const tokenStr = localStorage.getItem(STORAGE_KEYS.TOKEN);

        if (!userStr || !tokenStr) {
          resolve(null);
          return;
        }

        const token: AuthToken = JSON.parse(tokenStr);
        if (Date.now() > token.expiresAt) {
          mockAuth.logout();
          resolve(null);
          return;
        }

        resolve(JSON.parse(userStr));
      }, 500);
    });
  },

  isAuthenticated: (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockAuth.getCurrentUser().then(user => {
          resolve(user !== null);
        });
      }, 500);
    });
  },

  requestPasswordReset: (email: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
        
        if (!usersDb[email]) {
          // Don't reveal if email exists for security
          resolve({ success: true });
          return;
        }

        const resetToken = crypto.randomUUID();
        const resetTokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_TOKENS) || '{}');
        
        resetTokens[email] = {
          token: resetToken,
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        };
        
        localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(resetTokens));
        
        // In real app, send email with reset link
        console.log(`Password reset link: /reset-password?token=${resetToken}&email=${email}`);
        
        resolve({ success: true });
      }, 500);
    });
  },

  resetPassword: (email: string, token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const resetTokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_TOKENS) || '{}');
        const tokenData = resetTokens[email];

        if (!tokenData || tokenData.token !== token) {
          resolve({ success: false, error: 'Invalid or expired reset token' });
          return;
        }

        if (Date.now() > tokenData.expiresAt) {
          resolve({ success: false, error: 'Reset token has expired' });
          return;
        }

        const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
        
        if (!usersDb[email]) {
          resolve({ success: false, error: 'User not found' });
          return;
        }

        usersDb[email].password = newPassword;
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDb));

        // Remove used token
        delete resetTokens[email];
        localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(resetTokens));

        resolve({ success: true });
      }, 500);
    });
  },

  updateSessionActivity: (): void => {
    localStorage.setItem(STORAGE_KEYS.SESSION_TIMEOUT, Date.now().toString());
  },

  checkSessionTimeout: (): boolean => {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.SESSION_TIMEOUT);
    if (!lastActivity) return false;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity > SESSION_DURATION;
  },
};
