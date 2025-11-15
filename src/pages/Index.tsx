import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { Button } from '@/components/ui/button';
import { Shield, Key, Monitor, AlertTriangle, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (mockAuth.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Shield className="w-16 h-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LicenseLock Pro
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Protect your software from piracy with advanced license management, 
            device tracking, and real-time security monitoring.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Login
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">License Management</h3>
            <p className="text-sm text-muted-foreground">
              Generate and manage license keys with customizable activation limits
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-accent/10 rounded-lg w-fit mb-4">
              <Monitor className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Device Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Track device activations with hardware ID verification and usage monitoring
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-destructive/10 rounded-lg w-fit mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Piracy Detection</h3>
            <p className="text-sm text-muted-foreground">
              Automatic alerts for suspicious activity and license misuse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
