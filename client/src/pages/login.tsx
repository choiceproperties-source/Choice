import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      login(email, password);
      const users = JSON.parse(localStorage.getItem('choiceProperties_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (found) {
        window.location.href = '/';
      } else {
        setError('Invalid email or password');
      }
    } catch (e) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-primary">
          <h2 className="text-3xl font-bold text-primary mb-2">Welcome Back</h2>
          <p className="text-muted-foreground mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}

            <Button type="submit" className="w-full bg-primary">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link href="/signup">
              <span className="text-primary font-semibold cursor-pointer hover:underline">Sign up</span>
            </Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
