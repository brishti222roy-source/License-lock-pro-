import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CreateLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, maxActivations: number, expiresAt?: string) => void;
}

const CreateLicenseDialog = ({ open, onOpenChange, onCreate }: CreateLicenseDialogProps) => {
  const [name, setName] = useState('');
  const [maxActivations, setMaxActivations] = useState('1');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationMonths, setExpirationMonths] = useState('12');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let expiresAt: string | undefined;
    if (hasExpiration) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + parseInt(expirationMonths));
      expiresAt = expiry.toISOString();
    }
    
    onCreate(name, parseInt(maxActivations), expiresAt);
    setName('');
    setMaxActivations('1');
    setHasExpiration(false);
    setExpirationMonths('12');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New License</DialogTitle>
          <DialogDescription>
            Generate a new license key for your software
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">License Name</Label>
            <Input
              id="name"
              placeholder="e.g., Premium Plan, Enterprise License"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activations">Maximum Activations</Label>
            <Input
              id="activations"
              type="number"
              min="1"
              value={maxActivations}
              onChange={(e) => setMaxActivations(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              How many devices can use this license simultaneously
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="expiration">Set Expiration Date</Label>
              <Switch
                id="expiration"
                checked={hasExpiration}
                onCheckedChange={setHasExpiration}
              />
            </div>
            
            {hasExpiration && (
              <div className="space-y-2">
                <Label htmlFor="duration">License Duration</Label>
                <Select value={expirationMonths} onValueChange={setExpirationMonths}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">1 Year</SelectItem>
                    <SelectItem value="24">2 Years</SelectItem>
                    <SelectItem value="36">3 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create License
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLicenseDialog;
