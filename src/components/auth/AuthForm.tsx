import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Swords } from 'lucide-react';
import { SystemMessage } from '@/components/game/SystemMessage';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await signUp(signupEmail, signupPassword, displayName);
    
    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-system-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* System Introduction */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary animate-pulse-glow">
            <Swords className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="font-display text-4xl font-bold text-foreground">
            THE SYSTEM
          </h1>

          <div className="space-y-2">
            <SystemMessage 
              message="You have been chosen."
              delay={500}
            />
            <SystemMessage 
              message="Daily quests will be assigned."
              delay={2000}
            />
            <SystemMessage 
              message="Complete them. Level up. Evolve."
              delay={3500}
              onComplete={() => setShowForm(true)}
            />
          </div>
        </div>

        {/* Auth Form */}
        {showForm && (
          <Card className="glass border-glow animate-fade-in-up">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-primary text-glow-primary">
                Initialize
              </CardTitle>
              <CardDescription>
                Enter The System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="hunter@system.io"
                        required
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-muted/50"
                      />
                    </div>
                    
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full glow-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Enter'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-name">Hunter Name</Label>
                      <Input
                        id="display-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="hunter@system.io"
                        required
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="bg-muted/50"
                      />
                    </div>
                    
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full glow-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Awaken'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
