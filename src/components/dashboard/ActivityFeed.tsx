import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Key, Monitor, AlertTriangle, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { License, Device, PiracyAlert } from '@/lib/mockLicenseService';

interface ActivityFeedProps {
  licenses: License[];
  devices: Device[];
  alerts: PiracyAlert[];
}

interface Activity {
  id: string;
  type: 'license' | 'device' | 'alert';
  action: string;
  timestamp: string;
  icon: typeof Key;
  color: string;
}

const ActivityFeed = ({ licenses, devices, alerts }: ActivityFeedProps) => {
  const activities: Activity[] = [
    ...licenses.slice(0, 5).map(l => ({
      id: l.id,
      type: 'license' as const,
      action: `License "${l.name}" created`,
      timestamp: l.createdAt,
      icon: Key,
      color: 'text-blue-600',
    })),
    ...devices.slice(0, 5).map(d => ({
      id: d.id,
      type: 'device' as const,
      action: `Device "${d.deviceName}" activated`,
      timestamp: d.activatedAt,
      icon: Monitor,
      color: 'text-green-600',
    })),
    ...alerts.slice(0, 5).map(a => ({
      id: a.id,
      type: 'alert' as const,
      action: a.description,
      timestamp: a.timestamp,
      icon: AlertTriangle,
      color: 'text-red-600',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className={`p-2 rounded-lg bg-muted`}>
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;