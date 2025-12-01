import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !name || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('choiceProperties_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        setError('Email already registered');
        return;
      }

      signup(email, name, password);
      window.location.href = '/';
    } catch (e) {
      setError('Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-green-600">
          <h2 className="text-3xl font-bold text-primary mb-2">Create Account</h2>
          <p className="text-muted-foreground mb-6">Join Choice Properties today</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="font-semibold text-sm mb-2 flex items-center gap-2">
                <User className="h-4 w-4" /> Full Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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

            <div>
              <label className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}

            <Button type="submit" className="w-full bg-primary">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login">
              <span className="text-primary font-semibold cursor-pointer hover:underline">Sign in</span>
            </Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
