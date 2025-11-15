import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Key, Shield, Monitor, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsOverviewProps {
  totalLicenses: number;
  activeLicenses: number;
  stats: {
    totalActivations: number;
    activeDevices: number;
    alertsCount: number;
  };
}

const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
};

const StatsOverview = ({ totalLicenses, activeLicenses, stats }: StatsOverviewProps) => {
  // Mock previous values for trend calculation (in real app, fetch from history)
  const previousStats = {
    totalLicenses: Math.max(0, totalLicenses - Math.floor(Math.random() * 3)),
    activeLicenses: Math.max(0, activeLicenses - Math.floor(Math.random() * 2)),
    totalActivations: Math.max(0, (stats.totalActivations || 0) - Math.floor(Math.random() * 5)),
    alertsCount: Math.max(0, stats.alertsCount - Math.floor(Math.random() * 2)),
  };

  const displayStats = [
    {
      title: 'Total Licenses',
      value: totalLicenses,
      icon: Key,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      trend: calculateTrend(totalLicenses, previousStats.totalLicenses),
      description: 'All time',
    },
    {
      title: 'Active Licenses',
      value: activeLicenses,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      progress: totalLicenses > 0 ? (activeLicenses / totalLicenses) * 100 : 0,
      description: `${totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 0}% of total`,
    },
    {
      title: 'Active Devices',
      value: stats.activeDevices || 0,
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      trend: calculateTrend(stats.activeDevices || 0, previousStats.totalActivations),
      description: 'Currently connected',
    },
    {
      title: 'Security Alerts',
      value: stats.alertsCount,
      icon: AlertTriangle,
      color: stats.alertsCount > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: stats.alertsCount > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-900/20',
      trend: calculateTrend(stats.alertsCount, previousStats.alertsCount),
      description: stats.alertsCount > 0 ? 'Needs attention' : 'All clear',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              {stat.trend && (
                <div className={`flex items-center text-xs font-medium ${
                  stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend.isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stat.trend.value.toFixed(1)}%
                </div>
              )}
            </div>
            {stat.progress !== undefined && (
              <Progress value={stat.progress} className="h-1" />
            )}
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;
