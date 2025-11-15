import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { licenseService, type License } from '@/lib/mockLicenseService';
import { Copy, Trash2, Lock, Unlock, CheckCircle2, ShieldCheck, RefreshCw, Calendar, AlertTriangle, QrCode, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactQRCode from 'react-qr-code';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface LicenseListProps {
  licenses: License[];
  onUpdate: () => void;
}

const LicenseList = ({ licenses, onUpdate }: LicenseListProps) => { // Removed unused 'useMemo'
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrCodeLicense, setQrCodeLicense] = useState<License | null>(null);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'License key copied to clipboard' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRenewLicense = async (license: License, months: number) => {
    const result = await licenseService.renewLicense(license.id, months);
    if (result.success) {
      toast({ 
        title: 'License renewed', 
        description: `${license.name} extended by ${months} month(s)` 
      });
      onUpdate();
    } else {
      toast({ title: 'Renewal failed', description: result.error, variant: 'destructive' });
    }
  };

  const isExpired = (license: License): boolean => {
    return license.expiresAt ? isPast(parseISO(license.expiresAt)) : false;
  };

  const isExpiringSoon = (license: License): boolean => {
    if (!license.expiresAt) return false;
    const daysUntilExpiry = (parseISO(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const handleDownloadQR = async (license: License) => {
    try {
      const svg = document.getElementById(`qr-code-${license.id}`);
      if (!svg) throw new Error('QR Code element not found');

      // Convert SVG to Data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error('Canvas context not available');

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");

        const a = document.createElement('a');
        a.href = pngFile;
        a.download = `license-${license.name}-qr.png`;
        a.click();
        toast({ title: 'QR Code Downloaded', description: 'QR code saved successfully' });
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    } catch (e) {
      toast({ title: 'QR generation failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  const handleDownloadQRDataUrl = async (license: License) => {
    try {
      const dataUrl = await (await import('qrcode')).toDataURL(license.key, {
        width: 1024,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `license-${license.name}-qr.png`;
      toast({ title: 'QR Code Downloaded', description: 'QR code saved successfully' });
    } catch (e) {
      toast({ title: 'QR generation failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  const handleVerifyLicense = async (license: License) => {
    const result = await licenseService.verifyLicense(license.key);
    toast({
      title: result.valid ? 'Valid License' : 'Invalid License',
      description: result.valid ? 'License is valid and active' : result.error,
      variant: result.valid ? 'default' : 'destructive'
    });
  };

  const handleToggleStatus = async (license: License) => {
    const newStatus = license.status === 'active' ? 'suspended' : 'active';
    await licenseService.updateLicenseStatus(license.id, newStatus);
    toast({ 
      title: `License ${newStatus}`, 
      description: `${license.name} is now ${newStatus}` 
    });
    onUpdate();
  };

  const handleDelete = async (license: License) => {
    await licenseService.deleteLicense(license.id);
    toast({ title: 'Deleted', description: 'License has been deleted' });
    onUpdate();
  };

  const getStatusBadge = (status: License['status']) => {
    const variants = {
      active: 'default',
      suspended: 'secondary',
      expired: 'destructive',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (licenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lock className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No licenses yet. Create your first license to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {licenses.map((license) => (
        <Card key={license.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{license.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Created {format(parseISO(license.createdAt), 'MMM dd, yyyy')}
                </p>
                {license.expiresAt && (
                  <div className="flex items-center gap-1 mt-1">
                    {isExpired(license) ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expired {formatDistanceToNow(parseISO(license.expiresAt), { addSuffix: true })}
                      </Badge>
                    ) : isExpiringSoon(license) ? (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        Expires {formatDistanceToNow(parseISO(license.expiresAt), { addSuffix: true })}
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Expires {format(parseISO(license.expiresAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {getStatusBadge(license.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="flex-1 text-sm font-mono">{license.key}</code>
              <Button size="sm" variant="ghost" onClick={() => handleCopyKey(license.key)}>
                {copiedKey === license.key ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Max Activations:</span>
                <p className="font-medium">{license.maxActivations}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Current Activations:</span>
                <p className="font-medium">
                  {license.activations} / {license.maxActivations}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrCodeLicense(license)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerifyLicense(license)}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify
              </Button>
              
              {(isExpired(license) || isExpiringSoon(license)) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renew
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRenewLicense(license, 1)}>
                      1 Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenewLicense(license, 3)}>
                      3 Months
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenewLicense(license, 6)}>
                      6 Months
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenewLicense(license, 12)}>
                      1 Year
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(license)}
                className="flex-1"
              >
                {license.status === 'active' ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Suspend
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the "{license.name}" license. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(license)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeLicense} onOpenChange={() => setQrCodeLicense(null)}>
        {qrCodeLicense && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>License QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code to quickly access the license key
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <div id={`qr-code-${qrCodeLicense.id}`}>
                  <ReactQRCode
                    value={qrCodeLicense.key}
                    size={256}
                    viewBox={`0 0 256 256`}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">{qrCodeLicense.name}</p>
                <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
                  {qrCodeLicense.key}
                </code>
              </div>

              <Button onClick={() => handleDownloadQR(qrCodeLicense)} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default LicenseList;
