export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

const STORAGE_KEY = 'licenselock_audit_log';
const MAX_ENTRIES = 1000;

export const auditLog = {
  log: (
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): void => {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: '127.0.0.1', // Mock IP
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity,
    };

    const logs: AuditLogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    logs.unshift(entry);

    // Keep only the latest MAX_ENTRIES
    if (logs.length > MAX_ENTRIES) {
      logs.splice(MAX_ENTRIES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  },

  getLogs: (userId: string, limit?: number): Promise<AuditLogEntry[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const userLogs = allLogs.filter(log => log.userId === userId);
        resolve(limit ? userLogs.slice(0, limit) : userLogs);
      }, 300);
    });
  },

  getLogsByResource: (userId: string, resource: string, resourceId?: string): Promise<AuditLogEntry[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = allLogs.filter(log => 
          log.userId === userId && 
          log.resource === resource &&
          (!resourceId || log.resourceId === resourceId)
        );
        resolve(filtered);
      }, 300);
    });
  },

  clear: (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLogs: AuditLogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = allLogs.filter(log => log.userId !== userId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        resolve();
      }, 300);
    });
  },

  export: (userId: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const logs = await auditLog.getLogs(userId);
        const csv = [
          'Timestamp,Action,Resource,Resource ID,Details,Severity,IP Address',
          ...logs.map(log => 
            `${log.timestamp},${log.action},${log.resource},${log.resourceId || ''},${log.details || ''},${log.severity},${log.ipAddress || ''}`
          )
        ].join('\n');
        resolve(csv);
      }, 300);
    });
  },
};