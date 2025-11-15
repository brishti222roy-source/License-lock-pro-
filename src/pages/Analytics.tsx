import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth, type User } from '@/lib/mockAuth';
import { licenseService, type License, type Device } from '@/lib/mockLicenseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Users, Globe, Calendar } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await mockAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
      } else {
        setUser(currentUser);
        await loadData(currentUser);
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const loadData = async (user: User) => {
    const [licensesData, devicesData] = await Promise.all([
      licenseService.getAllLicenses(user.id),
      licenseService.getAllDevices(user.id),
    ]);
    setLicenses(licensesData);
    setDevices(devicesData);
  };

  if (loading || !user) return <div>Loading...</div>;

  // Generate usage trend data (last 7 days)
  const usageTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'MMM dd');
    
    // Mock data - in real app, fetch actual usage data
    const activations = Math.floor(Math.random() * 10) + 5;
    const verifications = Math.floor(Math.random() * 20) + 10;
    
    return {
      date: dateStr,
      activations,
      verifications,
    };
  });

  // License status distribution
  const statusData = [
    { name: 'Active', value: licenses.filter(l => l.status === 'active').length, color: '#10b981' },
    { name: 'Suspended', value: licenses.filter(l => l.status === 'suspended').length, color: '#f59e0b' },
    { name: 'Expired', value: licenses.filter(l => l.status === 'expired').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Device activations by license
  const devicesByLicense = licenses.slice(0, 5).map(license => ({
    name: license.name.length > 15 ? license.name.substring(0, 15) + '...' : license.name,
    devices: license.activations,
    max: license.maxActivations,
  }));

  // Mock geographic data
  const geographicData = [
    { country: 'United States', devices: Math.floor(devices.length * 0.4) },
    { country: 'United Kingdom', devices: Math.floor(devices.length * 0.2) },
    { country: 'Canada', devices: Math.floor(devices.length * 0.15) },
    { country: 'Germany', devices: Math.floor(devices.length * 0.15) },
    { country: 'Others', devices: Math.floor(devices.length * 0.1) },
  ].filter(d => d.devices > 0);

  const chartConfig = {
    activations: {
      label: 'Activations',
      color: '#3b82f6',
    },
    verifications: {
      label: 'Verifications',
      color: '#10b981',
    },
  };

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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">Insights into your license usage and trends</p>
        </div>

        <div className="grid gap-6">
          {/* Usage Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage Trend (Last 7 Days)
              </CardTitle>
              <CardDescription>Daily activations and verifications</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={usageTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="activations" 
                    stroke="var(--color-activations)" 
                    strokeWidth={2}
                    name="Activations"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="verifications" 
                    stroke="var(--color-verifications)" 
                    strokeWidth={2}
                    name="Verifications"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* License Status Distribution */}
            {statusData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    License Status
                  </CardTitle>
                  <CardDescription>Distribution by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Geographic Distribution */}
            {geographicData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Geographic Distribution
                  </CardTitle>
                  <CardDescription>Devices by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[250px]">
                    <BarChart data={geographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="devices" fill="#3b82f6" name="Devices" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Device Activations by License */}
          {devicesByLicense.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Licenses by Device Count
                </CardTitle>
                <CardDescription>Active devices per license</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <BarChart data={devicesByLicense} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="devices" fill="#10b981" name="Active Devices" />
                    <Bar dataKey="max" fill="#e5e7eb" name="Max Allowed" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;