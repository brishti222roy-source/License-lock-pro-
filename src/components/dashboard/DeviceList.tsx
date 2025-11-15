import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Device, type License, licenseService } from '@/lib/mockLicenseService';
import { Monitor, Trash2, MapPin, Activity, ShieldCheck, ShieldAlert, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface DeviceListProps {
  devices: Device[];
  licenses: License[];
  onUpdate: () => void;
}

const DeviceList = ({ devices, licenses, onUpdate }: DeviceListProps) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDeactivate = async (device: Device) => {
    if (confirm(`Deactivate device "${device.deviceName}"?`)) {
      await licenseService.deactivateDevice(device.id);
      toast({ title: 'Device deactivated', description: 'Device has been removed' });
      onUpdate();
    }
  };

  const handleActivateDevice = async (licenseId: string) => {
    // Mock activation - in real app, this would get actual HWID and device info
    const hwid = `HWID-${Math.random().toString(36).substr(2, 9)}`;
    const deviceName = `Device-${Math.random().toString(36).substr(2, 5)}`;
    const result = await licenseService.activateDevice(licenseId, hwid, deviceName);

    if (result.success) {
      toast({ title: 'Device activated', description: 'New device has been activated' });
      onUpdate();
    } else {
      toast({ title: 'Activation failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleToggleTrust = async (device: Device) => {
    await licenseService.toggleDeviceTrust(device.id);
    toast({ 
      title: device.trusted ? 'Device untrusted' : 'Device trusted',
      description: device.trusted ? 'Device marked as untrusted' : 'Device marked as trusted'
    });
    onUpdate();
  };

  const handleCopyHWID = (hwid: string, deviceId: string) => {
    navigator.clipboard.writeText(hwid);
    setCopiedId(deviceId);
    toast({ title: 'Copied!', description: 'Hardware ID copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLicenseName = (licenseId: string) => {
    const license = licenses.find(l => l.id === licenseId);
    return license?.name || 'Unknown';
  };

  const isDeviceActive = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const hoursSinceLastSeen = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSeen < 24;
  };

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Monitor className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No devices activated yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {devices.map((device) => {
        const isActive = isDeviceActive(device.lastSeen);
        
        return (
          <Card key={device.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${device.trusted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                    {device.trusted ? (
                      <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Monitor className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                      {device.trusted && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Trusted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      License: {getLicenseName(device.licenseId)}
                    </p>
                  </div>
                </div>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block">Last Seen</span>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block">IP Address</span>
                    <p className="font-medium">{device.ipAddress}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Hardware ID</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => handleCopyHWID(device.hwid, device.id)}
                  >
                    {copiedId === device.id ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm font-mono">{device.hwid}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                Activated {format(new Date(device.activatedAt), 'MMM dd, yyyy HH:mm')}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={device.trusted ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleToggleTrust(device)}
                  className="flex-1"
                >
                  {device.trusted ? (
                    <>
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Untrust
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Trust Device
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeactivate(device)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DeviceList;
