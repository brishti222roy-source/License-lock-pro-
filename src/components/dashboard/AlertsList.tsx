import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type PiracyAlert, type License, licenseService } from '@/lib/mockLicenseService';
import { AlertTriangle, CheckCircle2, Shield, Bell, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AlertsListProps {
  alerts: PiracyAlert[];
  licenses: License[];
  onUpdate: () => void;
}

const AlertsList = ({ alerts, licenses, onUpdate }: AlertsListProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleResolve = async (alert: PiracyAlert) => {
    await licenseService.resolveAlert(alert.id);
    toast({ title: 'Alert resolved', description: 'Alert has been marked as resolved' });
    onUpdate();
  };

  const handleResolveAll = async () => {
    const unresolvedAlerts = alerts.filter(a => !a.resolved);
    if (unresolvedAlerts.length === 0) return;
    
    if (confirm(`Resolve all ${unresolvedAlerts.length} active alerts?`)) {
      await Promise.all(unresolvedAlerts.map(a => licenseService.resolveAlert(a.id)));
      toast({ 
        title: 'All alerts resolved', 
        description: `${unresolvedAlerts.length} alerts marked as resolved` 
      });
      onUpdate();
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getLicenseName(alert.licenseId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const handleSendNotification = async (alert: PiracyAlert) => {
    await licenseService.sendNotification(alert);
    toast({ title: 'Notification sent', description: 'Admin has been notified' });
  };

  const getLicenseName = (licenseId: string) => {
    const license = licenses.find(l => l.id === licenseId);
    return license?.name || 'Unknown';
  };

  const getSeverityBadge = (severity: PiracyAlert['severity']) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    } as const;

    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    };

    return <Badge variant={variants[severity]}>{labels[severity]}</Badge>;
  };

  const getAlertIcon = (type: PiracyAlert['type']) => {
    return <AlertTriangle className="w-5 h-5" />;
  };

  const unresolvedAlerts = filteredAlerts.filter(a => !a.resolved);
  const resolvedAlerts = filteredAlerts.filter(a => a.resolved);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="max_activations_exceeded">Max Activations</SelectItem>
            <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
            <SelectItem value="multiple_locations">Multiple Locations</SelectItem>
            <SelectItem value="rapid_activation">Rapid Activation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-green-600 mb-4" />
            <p className="text-muted-foreground text-center">
              All clear! No security alerts.
            </p>
          </CardContent>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No alerts match your filters.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {unresolvedAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Alerts ({unresolvedAlerts.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolveAll}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Resolve All
            </Button>
          </div>
          <div className="grid gap-4">
            {unresolvedAlerts.map((alert) => (
              <Card key={alert.id} className="border-destructive/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                        alert.severity === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Security Alert</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          License: {getLicenseName(alert.licenseId)}
                        </p>
                      </div>
                    </div>
                    {getSeverityBadge(alert.severity)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{alert.description}</p>

                  <div className="text-xs text-muted-foreground">
                    Detected {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendNotification(alert)}
                      className="flex-1"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(alert)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Resolved Alerts</h3>
          <div className="grid gap-4">
            {resolvedAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Resolved</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          License: {getLicenseName(alert.licenseId)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Resolved</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsList;
