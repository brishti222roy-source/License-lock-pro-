import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth, type User } from '@/lib/mockAuth';
import { auditLog, type AuditLogEntry } from '@/lib/auditLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Download, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const AuditLog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await mockAuth.getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
      } else {
        setUser(currentUser);
        await loadLogs(currentUser);
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const loadLogs = async (user: User) => {
    const logEntries = await auditLog.getLogs(user.id);
    setLogs(logEntries);
    setFilteredLogs(logEntries);
  };

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    if (resourceFilter !== 'all') {
      filtered = filtered.filter(log => log.resource === resourceFilter);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, severityFilter, resourceFilter, logs]);

  const handleExport = async () => {
    if (!user) return;
    const csv = await auditLog.export(user.id);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Audit log exported successfully' });
  };

  const handleClear = async () => {
    if (!user) return;
    if (confirm('Are you sure you want to clear the audit log? This action cannot be undone.')) {
      await auditLog.clear(user.id);
      setLogs([]);
      setFilteredLogs([]);
      toast({ title: 'Cleared', description: 'Audit log has been cleared' });
    }
  };

  const getSeverityBadge = (severity: AuditLogEntry['severity']) => {
    const variants = {
      info: 'default',
      warning: 'secondary',
      error: 'destructive',
    } as const;

    return <Badge variant={variants[severity]}>{severity}</Badge>;
  };

  const uniqueResources = Array.from(new Set(logs.map(log => log.resource)));

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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-2">Track all actions and changes in your account</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>{filteredLogs.length} entries</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClear}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
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
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.resource}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.details || '-'}
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuditLog;