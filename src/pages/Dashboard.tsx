import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth, type User } from '@/lib/mockAuth';
import { licenseService, type License, type Device, type PiracyAlert } from '@/lib/mockLicenseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, Monitor, AlertTriangle, LogOut, Plus, FileText, Database, Settings, BarChart3, Download, Keyboard, ScrollText } from 'lucide-react';
import { exportService, type ExportFormat, type ExportType } from '@/lib/exportService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LicenseList from '@/components/dashboard/LicenseList';
import DeviceList from '@/components/dashboard/DeviceList';
import AlertsList from '@/components/dashboard/AlertsList';
import CreateLicenseDialog from '@/components/dashboard/CreateLicenseDialog';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useKeyboardShortcuts, type KeyboardShortcut, getShortcutLabel } from '@/hooks/useKeyboardShortcuts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<PiracyAlert[]>([]);
  const [stats, setStats] = useState({ totalActivations: 0, activeDevices: 0, alertsCount: 0 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportType, setExportType] = useState<ExportType>('licenses');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeTab, setActiveTab] = useState('licenses');

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    { key: 'n', ctrl: true, action: () => setCreateDialogOpen(true), description: 'Create new license' },
    { key: 's', ctrl: true, action: () => navigate('/settings'), description: 'Open settings' },
    { key: 'a', ctrl: true, action: () => navigate('/analytics'), description: 'Open analytics' },
    { key: 'l', ctrl: true, action: () => navigate('/audit-log'), description: 'Open audit log' },
    { key: '1', ctrl: true, action: () => setActiveTab('licenses'), description: 'Switch to Licenses tab' },
    { key: '2', ctrl: true, action: () => setActiveTab('devices'), description: 'Switch to Devices tab' },
    { key: '3', ctrl: true, action: () => setActiveTab('alerts'), description: 'Switch to Alerts tab' },
    { key: '/', ctrl: true, action: () => setShowShortcuts(true), description: 'Show keyboard shortcuts' },
  ];

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await mockAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    };
    checkUser();

    // Session timeout check
    const sessionCheckInterval = setInterval(() => {
      if (mockAuth.checkSessionTimeout()) {
        mockAuth.logout();
        navigate('/auth');
        alert('Session expired. Please log in again.');
      } else {
        mockAuth.updateSessionActivity();
      }
    }, 60000); // Check every minute

    return () => clearInterval(sessionCheckInterval);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    const [licenses, devices, alerts, usageStats] = await Promise.all([
      licenseService.getAllLicenses(user.id),
      licenseService.getAllDevices(user.id),
      licenseService.getAlerts(user.id),
      licenseService.getUsageStats(user.id)
    ]);

    setLicenses(licenses);
    setDevices(devices);
    setAlerts(alerts);
    setStats(usageStats);
  };

  const handleLogout = async () => {
    await mockAuth.logout();
    navigate('/auth');
  };

  const handleCreateLicense = async (name: string, maxActivations: number, expiresAt?: string) => {
    if (user) {
      await licenseService.createLicense(user.id, name, maxActivations, expiresAt);
      loadData();
      setCreateDialogOpen(false);
    }
  };

  const handleExport = () => {
    const exportData: any = {};
    
    if (exportType === 'licenses' || exportType === 'all') {
      exportData.licenses = licenses;
    }
    if (exportType === 'devices' || exportType === 'all') {
      exportData.devices = devices;
    }
    if (exportType === 'alerts' || exportType === 'all') {
      exportData.alerts = alerts;
    }
    
    exportService.export(exportData, exportType, exportFormat);
  };

  const handleBackup = async () => {
    const result = await licenseService.backupData();
    if (result.success) {
      alert('Backup completed successfully');
    } else {
      alert('Backup failed: ' + result.error);
    }
  };

  const handleRestore = async () => {
    const result = await licenseService.restoreData();
    if (result.success) {
      alert('Data restored successfully');
      loadData();
    } else {
      alert('Restore failed: ' + result.error);
    }
  };

  if (loading || !user) return <div>Loading...</div>;

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LicenseLock Pro</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts (Ctrl+/)">
              <Keyboard className="w-4 h-4" />
            </Button>
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <StatsOverview
          totalLicenses={licenses.length}
          activeLicenses={licenses.filter(l => l.status === 'active').length}
          stats={stats}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="licenses" className="gap-2">
                  <Key className="w-4 h-4" />
                  Licenses
                </TabsTrigger>
                <TabsTrigger value="devices" className="gap-2">
                  <Monitor className="w-4 h-4" />
                  Devices
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="backup" className="gap-2">
                  <Database className="w-4 h-4" />
                  Backup
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/audit-log')}>
                  <ScrollText className="w-4 h-4 mr-2" />
                  Audit Log
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create License
                </Button>
              </div>
            </div>

            <TabsContent value="licenses">
              <LicenseList licenses={licenses} onUpdate={loadData} />
            </TabsContent>

            <TabsContent value="devices">
              <DeviceList devices={devices} licenses={licenses} onUpdate={loadData} />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsList alerts={alerts} licenses={licenses} onUpdate={loadData} />
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download your data in various formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Export Type</label>
                      <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="licenses">Licenses Only</SelectItem>
                          <SelectItem value="devices">Devices Only</SelectItem>
                          <SelectItem value="alerts">Alerts Only</SelectItem>
                          <SelectItem value="all">All Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Format</label>
                      <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="pdf">PDF (HTML)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleExport} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export {exportType.charAt(0).toUpperCase() + exportType.slice(1)} as {exportFormat.toUpperCase()}
                  </Button>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Export Information</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• CSV: Best for spreadsheet applications</li>
                      <li>• JSON: Best for programmatic access</li>
                      <li>• PDF: Best for reports and documentation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup">
              <Card>
                <CardHeader>
                  <CardTitle>Data Backup & Recovery</CardTitle>
                  <CardDescription>Backup your license data and restore from previous backups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleBackup} variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      Backup Data
                    </Button>
                    <Button onClick={handleRestore} variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      Restore Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <ActivityFeed licenses={licenses} devices={devices} alerts={alerts} />
          </div>
        </div>
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate faster
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">
                  {getShortcutLabel(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <CreateLicenseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateLicense}
      />
    </div>
  );
};

export default Dashboard;
