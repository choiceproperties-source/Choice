import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, useLocation } from 'wouter';
import { Mail, Lock, User, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState, useMemo } from 'react';
import { z } from 'zod';

const extendedSignupSchema = signupSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and privacy policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ExtendedSignupInput = z.infer<typeof extendedSignupSchema>;

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

export default function Signup() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ExtendedSignupInput>({
    resolver: zodResolver(extendedSignupSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const password = form.watch('password');
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthPercentage = (passwordStrength / 5) * 100;

  const onSubmit = async (data: ExtendedSignupInput) => {
    setLoading(true);
    try {
      await signup(data.email, data.fullName, data.password);
      setLocation('/');
    } catch (err: any) {
      form.setError('root', { message: err.message || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="max-w-md w-full p-8 shadow-xl border-t-4 border-t-primary">
          <h2 className="text-3xl font-bold text-primary mb-2">Create Account</h2>
          <p className="text-sm text-muted-foreground mb-6">Join Choice Properties today and start exploring properties</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm flex items-center gap-2">
                      <User className="h-4 w-4" /> Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        disabled={loading}
                        data-testid="input-fullname"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled={loading}
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          disabled={loading}
                          autoComplete="new-password"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-toggle-password"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    {password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i < passwordStrength ? 'bg-green-500' : 'bg-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {passwordStrength === 0 ? 'Very weak' : 
                           passwordStrength === 1 ? 'Weak' : 
                           passwordStrength === 2 ? 'Fair' : 
                           passwordStrength === 3 ? 'Good' : 
                           passwordStrength === 4 ? 'Strong' : 
                           'Very strong'}
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-sm flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          disabled={loading}
                          autoComplete="new-password"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-toggle-confirm-password"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                        data-testid="checkbox-terms"
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="flex-1">
                      <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                        I agree to the{' '}
                        <Link href="/terms">
                          <span className="text-primary font-semibold hover:underline">Terms of Service</span>
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy">
                          <span className="text-primary font-semibold hover:underline">Privacy Policy</span>
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/50 p-3 rounded" data-testid="text-error">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="button-submit"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login">
              <span className="text-primary font-semibold cursor-pointer hover:underline" data-testid="link-login">Sign in</span>
            </Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
