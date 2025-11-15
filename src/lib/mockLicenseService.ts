export interface License {
  id: string;
  key: string;
  name: string;
  maxActivations: number;
  activations: number;
  status: 'active' | 'suspended' | 'expired';
  createdAt: string;
  expiresAt?: string;
  userId: string;
}

export interface Device {
  id: string;
  licenseId: string;
  hwid: string;
  deviceName: string;
  activatedAt: string;
  lastSeen: string;
  ipAddress: string;
  trusted: boolean;
  browser?: string;
  os?: string;
  location?: string;
}

export interface PiracyAlert {
  id: string;
  licenseId: string;
  type: 'max_activations_exceeded' | 'suspicious_activity' | 'multiple_locations' | 'rapid_activation';
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  resolved: boolean;
}

import { auditLog } from './auditLog';

const STORAGE_KEYS = {
  LICENSES: 'licenselock_licenses',
  DEVICES: 'licenselock_devices',
  ALERTS: 'licenselock_alerts',
};

function generateLicenseKey(): string {
  const segments = 4;
  const segmentLength = 5;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  return Array.from({ length: segments }, () =>
    Array.from({ length: segmentLength }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  ).join('-');
}

export const licenseService = {
  verifyLicense: (licenseKey: string, productId?: string): Promise<{ valid: boolean; status: 'valid' | 'expired' | 'invalid'; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLicenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
        const license = allLicenses.find((l: License) => l.key === licenseKey);

        if (!license) {
          resolve({ valid: false, status: 'invalid', error: 'License key not found' });
          return;
        }

        if (license.status === 'expired' || (license.expiresAt && new Date(license.expiresAt) < new Date())) {
          resolve({ valid: false, status: 'expired', error: 'License has expired' });
          return;
        }

        if (license.status !== 'active') {
          resolve({ valid: false, status: 'invalid', error: 'License is not active' });
          return;
        }

        resolve({ valid: true, status: 'valid' });
      }, 500);
    });
  },

  createLicense: (userId: string, name: string, maxActivations: number = 1, expiresAt?: string): Promise<License> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        licenseService.getAllLicenses(userId).then(licenses => {
          const license: License = {
            id: crypto.randomUUID(),
            key: generateLicenseKey(),
            name,
            maxActivations,
            activations: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            expiresAt,
            userId,
          };

          licenses.push(license);
          localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(licenses));

          auditLog.log(userId, 'CREATE', 'license', license.id, `Created license: ${name}`, 'info');

          resolve(license);
        });
      }, 500);
    });
  },

  renewLicense: (licenseId: string, months: number): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLicenses: License[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
        const index = allLicenses.findIndex(l => l.id === licenseId);
        
        if (index === -1) {
          resolve({ success: false, error: 'License not found' });
          return;
        }

        const currentExpiry = allLicenses[index].expiresAt 
          ? new Date(allLicenses[index].expiresAt!) 
          : new Date();
        
        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        
        allLicenses[index].expiresAt = newExpiry.toISOString();
        allLicenses[index].status = 'active';
        localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(allLicenses));

        resolve({ success: true });
      }, 500);
    });
  },

  getAllLicenses: (userId: string): Promise<License[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLicenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
        resolve(allLicenses.filter((l: License) => l.userId === userId));
      }, 500);
    });
  },

  getLicense: (licenseId: string): Promise<License | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLicenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
        resolve(allLicenses.find((l: License) => l.id === licenseId) || null);
      }, 500);
    });
  },

  updateLicenseStatus: (licenseId: string, status: License['status']): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLicenses: License[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
        const index = allLicenses.findIndex(l => l.id === licenseId);
        
        if (index !== -1) {
          const license = allLicenses[index];
          allLicenses[index].status = status;
          localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(allLicenses));
          
          auditLog.log(license.userId, 'UPDATE', 'license', licenseId, `Changed status to: ${status}`, 'info');
        }
        resolve();
      }, 500);
    });
  },

  deleteLicense: (licenseId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allLicenses: License[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
        const license = allLicenses.find(l => l.id === licenseId);
        const filtered = allLicenses.filter(l => l.id !== licenseId);
        localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(filtered));

        if (license) {
          auditLog.log(license.userId, 'DELETE', 'license', licenseId, `Deleted license: ${license.name}`, 'warning');
        }

        // Delete associated devices
        const allDevices: Device[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
        const filteredDevices = allDevices.filter(d => d.licenseId !== licenseId);
        localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filteredDevices));
        resolve();
      }, 500);
    });
  },

  activateDevice: (licenseId: string, hwid: string, deviceName: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        licenseService.getLicense(licenseId).then(license => {
          if (!license) {
            resolve({ success: false, error: 'License not found' });
            return;
          }

          if (license.status !== 'active') {
            resolve({ success: false, error: 'License is not active' });
            return;
          }

          licenseService.getDevicesForLicense(licenseId).then(devices => {
            const existingDevice = devices.find(d => d.hwid === hwid);

            if (existingDevice) {
              // Update last seen
              const allDevices: Device[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
              const index = allDevices.findIndex(d => d.id === existingDevice.id);
              if (index !== -1) {
                allDevices[index].lastSeen = new Date().toISOString();
                localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(allDevices));
              }
              resolve({ success: true });
              return;
            }

            if (devices.length >= license.maxActivations) {
              licenseService.createAlert(licenseId, 'max_activations_exceeded', 
                `Attempted activation beyond limit (${license.maxActivations} max)`, 'high');
              resolve({ success: false, error: 'Maximum activations reached' });
              return;
            }

            const device: Device = {
              id: crypto.randomUUID(),
              licenseId,
              hwid,
              deviceName,
              activatedAt: new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              trusted: false,
            };

            const allDevices = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
            allDevices.push(device);
            localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(allDevices));

            // Update activation count
            const allLicenses: License[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
            const licenseIndex = allLicenses.findIndex(l => l.id === licenseId);
            if (licenseIndex !== -1) {
              allLicenses[licenseIndex].activations = devices.length + 1;
              localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(allLicenses));
            }

            resolve({ success: true });
          });
        });
      }, 500);
    });
  },

  getDevicesForLicense: (licenseId: string): Promise<Device[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allDevices = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
        resolve(allDevices.filter((d: Device) => d.licenseId === licenseId));
      }, 500);
    });
  },

  getAllDevices: (userId: string): Promise<Device[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        licenseService.getAllLicenses(userId).then(licenses => {
          const licenseIds = licenses.map(l => l.id);
          const allDevices = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
          resolve(allDevices.filter((d: Device) => licenseIds.includes(d.licenseId)));
        });
      }, 500);
    });
  },

  deactivateDevice: (deviceId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allDevices: Device[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
        const device = allDevices.find(d => d.id === deviceId);
        
        if (device) {
          const filtered = allDevices.filter(d => d.id !== deviceId);
          localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filtered));

          // Update activation count
          const remainingDevices = filtered.filter(d => d.licenseId === device.licenseId);
          const allLicenses: License[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LICENSES) || '[]');
          const licenseIndex = allLicenses.findIndex(l => l.id === device.licenseId);
          if (licenseIndex !== -1) {
            allLicenses[licenseIndex].activations = remainingDevices.length;
            localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(allLicenses));
          }
        }
        resolve();
      }, 500);
    });
  },

  toggleDeviceTrust: (deviceId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allDevices: Device[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || '[]');
        const index = allDevices.findIndex(d => d.id === deviceId);
        
        if (index !== -1) {
          allDevices[index].trusted = !allDevices[index].trusted;
          localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(allDevices));
        }
        resolve();
      }, 500);
    });
  },

  createAlert: (licenseId: string, type: PiracyAlert['type'], description: string, severity: PiracyAlert['severity']): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const alert: PiracyAlert = {
          id: crypto.randomUUID(),
          licenseId,
          type,
          description,
          severity,
          timestamp: new Date().toISOString(),
          resolved: false,
        };

        const alerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
        alerts.push(alert);
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
        resolve();
      }, 500);
    });
  },

  getAlerts: (userId: string): Promise<PiracyAlert[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        licenseService.getAllLicenses(userId).then(licenses => {
          const licenseIds = licenses.map(l => l.id);
          const allAlerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
          resolve(allAlerts.filter((a: PiracyAlert) => licenseIds.includes(a.licenseId)));
        });
      }, 500);
    });
  },

  resolveAlert: (alertId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allAlerts: PiracyAlert[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
        const index = allAlerts.findIndex(a => a.id === alertId);

        if (index !== -1) {
          allAlerts[index].resolved = true;
          localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(allAlerts));
        }
        resolve();
      }, 500);
    });
  },

  // Usage Monitoring
  logUsage: (licenseId: string, deviceId: string, ipAddress: string, sessionData: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock logging - in real app, this would send to server
        console.log(`Usage logged for license ${licenseId}, device ${deviceId}, IP ${ipAddress}`);
        resolve();
      }, 500);
    });
  },

  getUsageStats: (userId: string): Promise<{ totalActivations: number; activeDevices: number; alertsCount: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        licenseService.getAllLicenses(userId).then(licenses => {
          licenseService.getAllDevices(userId).then(devices => {
            licenseService.getAlerts(userId).then(alerts => {
              const unresolvedAlerts = alerts.filter(a => !a.resolved);
              resolve({
                totalActivations: licenses.reduce((sum, l) => sum + l.activations, 0),
                activeDevices: devices.length,
                alertsCount: unresolvedAlerts.length,
              });
            });
          });
        });
      }, 500);
    });
  },

  // Piracy Detection
  detectPiracy: (licenseId: string, deviceId: string, ipAddress: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        licenseService.getDevicesForLicense(licenseId).then(devices => {
          licenseService.getLicense(licenseId).then(license => {
            if (!license) {
              resolve();
              return;
            }

            // Check for multiple concurrent logins
            const activeDevices = devices.filter(d => d.id !== deviceId);
            if (activeDevices.length >= license.maxActivations) {
              licenseService.createAlert(licenseId, 'max_activations_exceeded', 'Multiple concurrent logins detected', 'high');
            }

            // Check for rapid activations
            const recentActivations = devices.filter(d => new Date(d.activatedAt) > new Date(Date.now() - 60000)); // Last minute
            if (recentActivations.length > 3) {
              licenseService.createAlert(licenseId, 'rapid_activation', 'Rapid activation attempts detected', 'medium');
            }

            // Check for multiple locations
            const uniqueIPs = [...new Set(devices.map(d => d.ipAddress))];
            if (uniqueIPs.length > license.maxActivations * 2) {
              licenseService.createAlert(licenseId, 'multiple_locations', 'License used in multiple locations', 'medium');
            }
            resolve();
          });
        });
      }, 500);
    });
  },

  // Alert and Notification System
  sendNotification: (alert: PiracyAlert): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock notification - in real app, send email/SMS
        console.log(`Notification sent: ${alert.description}`);
        resolve();
      }, 500);
    });
  },

  // Report Generation
  generateReport: (userId: string, type: 'usage' | 'licenses' | 'piracy', dateRange?: { start: string; end: string }): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data: any[] = [];
        let filename = '';

        const generate = async () => {
          switch (type) {
            case 'usage':
              const devices = await licenseService.getAllDevices(userId);
              const licenses = await Promise.all(devices.map(d => licenseService.getLicense(d.licenseId)));
              data = devices.map((d, i) => ({
                license: licenses[i]?.key,
                device: d.deviceName,
                activatedAt: d.activatedAt,
                lastSeen: d.lastSeen,
                ipAddress: d.ipAddress,
              }));
              filename = 'usage_report.csv';
              break;
            case 'licenses':
              data = await licenseService.getAllLicenses(userId);
              filename = 'licenses_report.csv';
              break;
            case 'piracy':
              data = await licenseService.getAlerts(userId);
              filename = 'piracy_report.csv';
              break;
          }

          // Mock CSV generation
          const csv = data.length > 0 ? Object.keys(data[0]).join(',') + '\n' + data.map(row =>
            Object.values(row).join(',')
          ).join('\n') : '';

          // In real app, trigger download
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);

          resolve(csv);
        };
        generate();
      }, 500);
    });
  },

  // Database Management (mock)
  backupData: (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const backup = {
            licenses: localStorage.getItem(STORAGE_KEYS.LICENSES),
            devices: localStorage.getItem(STORAGE_KEYS.DEVICES),
            alerts: localStorage.getItem(STORAGE_KEYS.ALERTS),
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('licenselock_backup', JSON.stringify(backup));
          resolve({ success: true });
        } catch (error) {
          resolve({ success: false, error: 'Backup failed' });
        }
      }, 500);
    });
  },

  restoreData: (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const backupStr = localStorage.getItem('licenselock_backup');
          if (!backupStr) {
            resolve({ success: false, error: 'No backup found' });
            return;
          }

          const backup = JSON.parse(backupStr);
          if (backup.licenses) localStorage.setItem(STORAGE_KEYS.LICENSES, backup.licenses);
          if (backup.devices) localStorage.setItem(STORAGE_KEYS.DEVICES, backup.devices);
          if (backup.alerts) localStorage.setItem(STORAGE_KEYS.ALERTS, backup.alerts);
          resolve({ success: true });
        } catch (error) {
          resolve({ success: false, error: 'Restore failed' });
        }
      }, 500);
    });
  },
};
