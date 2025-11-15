import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { mockAuth } from '@/lib/mockAuth';
import { useToast } from '@/hooks/use-toast';
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/passwordValidation';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '', rememberMe: false });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '', licenseKey: '' });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [], isValid: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await mockAuth.login(loginForm.email, loginForm.password);
    
    if (result.success) {
      toast({ title: 'Welcome back!', description: 'Successfully logged in' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    const strength = validatePasswordStrength(signupForm.password);
    if (!strength.isValid) {
      toast({ 
        title: 'Weak password', 
        description: strength.feedback.join('. '), 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);

    const result = await mockAuth.register(signupForm.email, signupForm.password, signupForm.name, signupForm.licenseKey);

    if (result.success) {
      toast({ title: 'Account created!', description: 'You can now log in' });
      setSignupForm({ name: '', email: '', password: '', confirmPassword: '', licenseKey: '' });
      setPasswordStrength({ score: 0, feedback: [], isValid: false });
    } else {
      toast({ title: 'Signup failed', description: result.error, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await mockAuth.requestPasswordReset(forgotPasswordEmail);

    if (result.success) {
      toast({ 
        title: 'Reset email sent', 
        description: 'Check your email for password reset instructions' 
      });
      setForgotPasswordEmail('');
      setShowForgotPassword(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  const handlePasswordChange = (password: string) => {
    setSignupForm({ ...signupForm, password });
    setPasswordStrength(validatePasswordStrength(password));
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);

    // First, try to register the demo user if not exists
    await mockAuth.register('13000123022@ticollege.org', 'brishti@123', 'Demo User', 'DEMO1-DEMO2-DEMO3-DEMO4');
    // Even if registration fails (user exists), proceed to login

    const loginResult = await mockAuth.login('brishti@sps.com', 'brishti@123');

    if (loginResult.success) {
      toast({ title: 'Demo login successful!', description: 'Welcome to LicenseLock Pro' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Demo login failed', description: loginResult.error, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">LicenseLock Pro</CardTitle>
          <CardDescription>Protect your software from piracy</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send you a link to reset your password
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Button>
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Logging in...' : 'Demo Login'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signupForm.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupForm.password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.score <= 1 ? 'text-red-500' :
                          passwordStrength.score === 2 ? 'text-orange-500' :
                          passwordStrength.score === 3 ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {getPasswordStrengthLabel(passwordStrength.score)}
                        </span>
                      </div>
                      <Progress 
                        value={(passwordStrength.score / 4) * 100} 
                        className="h-1"
                      />
                      {passwordStrength.feedback.length > 0 && (
                        <div className="space-y-1">
                          {passwordStrength.feedback.map((fb, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {fb}
                            </p>
                          ))}
                        </div>
                      )}
                      {passwordStrength.isValid && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Password meets requirements
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-license">License Key</Label>
                  <Input
                    id="signup-license"
                    type="text"
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                    value={signupForm.licenseKey}
                    onChange={(e) => setSignupForm({ ...signupForm, licenseKey: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
