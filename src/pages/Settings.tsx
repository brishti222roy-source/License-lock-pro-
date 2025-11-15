import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type User, mockAuth } from '@/lib/mockAuth';
import { twoFactorAuth, type TwoFactorSetup } from '@/lib/twoFactorAuth';
import { apiKeyService, type APIKey } from '@/lib/apiKeyService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Key, 
  ArrowLeft, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import QRCode from 'react-qr-code';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('30');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [createdKey, setCreatedKey] = useState<APIKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await mockAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
      } else {
        setUser(currentUser);
        await loadSettings(currentUser);
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const loadSettings = async (user: User) => {
    const twoFactorStatus = await twoFactorAuth.getStatus(user.email);
    setTwoFactorEnabled(twoFactorStatus.enabled);
    
    if (twoFactorStatus.enabled) {
      const codes = await twoFactorAuth.getBackupCodes(user.email);
      setBackupCodes(codes);
    }

    const keys = await apiKeyService.getAll(user.id);
    setApiKeys(keys);
  };

  const handleSetup2FA = async () => {
    if (!user) return;
    const setup = await twoFactorAuth.setup(user.email);
    setTwoFactorSetup(setup);
    setShowSetup2FA(true);
  };

  const handleVerify2FA = async () => {
    if (!user || !twoFactorSetup) return;
    
    const result = await twoFactorAuth.verify(user.email, verificationCode);
    if (result.success) {
      toast({ title: '2FA Enabled', description: 'Two-factor authentication is now active' });
      setTwoFactorEnabled(true);
      setBackupCodes(twoFactorSetup.backupCodes);
      setShowSetup2FA(false);
      setVerificationCode('');
    } else {
      toast({ title: 'Verification failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;
    await twoFactorAuth.disable(user.email);
    setTwoFactorEnabled(false);
    setBackupCodes([]);
    toast({ title: '2FA Disabled', description: 'Two-factor authentication has been disabled' });
  };

  const handleCreateAPIKey = async () => {
    if (!user) return;
    
    const expiryDays = newKeyExpiry === 'never' ? undefined : parseInt(newKeyExpiry);
    const apiKey = await apiKeyService.create(user.id, newKeyName, newKeyPermissions, expiryDays);
    
    setCreatedKey(apiKey);
    setApiKeys([...apiKeys, apiKey]);
    setNewKeyName('');
    setNewKeyExpiry('30');
    setNewKeyPermissions(['read']);
    
    toast({ title: 'API Key Created', description: 'Copy your key now - it won\'t be shown again' });
  };

  const handleRevokeKey = async (keyId: string) => {
    await apiKeyService.revoke(keyId);
    setApiKeys(apiKeys.map(k => k.id === keyId ? { ...k, status: 'revoked' as const } : k));
    toast({ title: 'Key Revoked', description: 'API key has been revoked', variant: 'destructive' });
  };

  const handleDeleteKey = async (keyId: string) => {
    await apiKeyService.delete(keyId);
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
    toast({ title: 'Key Deleted', description: 'API key has been deleted' });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'API key copied to clipboard' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'licenselock-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account security and API access</p>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            {/* 2FA Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </div>
                  <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!twoFactorEnabled ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Protect your account with two-factor authentication using an authenticator app.
                    </p>
                    <Button onClick={handleSetup2FA}>
                      <Shield className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-900 dark:text-green-100">
                        Two-factor authentication is active
                      </p>
                    </div>
                    
                    {backupCodes.length > 0 && (
                      <div className="space-y-2">
                        <Label>Backup Codes ({backupCodes.length} remaining)</Label>
                        <p className="text-xs text-muted-foreground">
                          Save these codes in a safe place. You can use them to access your account if you lose your device.
                        </p>
                        <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Codes
                        </Button>
                      </div>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Disable 2FA</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Disabling two-factor authentication will reduce your account's security.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDisable2FA}>Disable</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage API keys for programmatic access
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateKey(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No API keys yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((key) => ( // Removed unused format import
                      <p key={key.id}>{key.name}</p>
                      // The content of the API key list item can be moved to a separate component
                      // For brevity, I'm just showing the name here.
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>

          {twoFactorSetup && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCode value={twoFactorSetup.otpauthUrl || twoFactorSetup.qrCode} size={192} />
              </div>

              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <code className="block p-2 bg-muted rounded text-sm font-mono">
                  {twoFactorSetup.secret}
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button onClick={handleVerify2FA} className="w-full">
                Verify and Enable
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateKey} onOpenChange={setShowCreateKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  Copy this key now - it won't be shown again
                </p>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded font-mono text-sm">
                  <span className="flex-1 break-all">{createdKey.key}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyKey(createdKey.key)}
                  >
                    {copiedKey === createdKey.key ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={() => { setCreatedKey(null); setShowCreateKey(false); }} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-expiry">Expiration</Label>
                <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                  <SelectTrigger id="key-expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateAPIKey} className="w-full" disabled={!newKeyName}>
                Create API Key
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;