import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { GraduationCap, Mail, Lock, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '../lib/config';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToSignup: () => void;
}

export function Login({ onLogin, onNavigateToSignup }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Call the backend API
        await onLogin(formData.email, formData.password);
      } catch (error) {
        // Error handling is done in the onLogin function
        console.error('Login failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email) {
      toast.error('Please enter your email address first');
      return;
    }
    
    // Mock password reset - in real implementation, this would call an API
    toast.success('Password reset link sent to your email!');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Stickers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left - Book Stack */}
        <svg className="absolute top-12 left-8 opacity-20" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect x="10" y="40" width="45" height="7" rx="2" fill="#3B82F6" />
          <rect x="15" y="30" width="40" height="7" rx="2" fill="#8B5CF6" />
          <rect x="12" y="20" width="43" height="7" rx="2" fill="#EC4899" />
        </svg>

        {/* Top Right - Calendar */}
        <svg className="absolute top-16 right-10 opacity-15" width="85" height="85" viewBox="0 0 85 85" fill="none">
          <rect x="15" y="20" width="55" height="45" rx="4" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
          <line x1="15" y1="30" x2="70" y2="30" stroke="#3B82F6" strokeWidth="2.5" />
          <circle cx="28" cy="42" r="2.5" fill="#8B5CF6" />
          <circle cx="42" cy="42" r="2.5" fill="#8B5CF6" />
          <circle cx="56" cy="42" r="2.5" fill="#8B5CF6" />
          <circle cx="28" cy="52" r="2.5" fill="#EC4899" />
          <circle cx="42" cy="52" r="2.5" fill="#EC4899" />
        </svg>

        {/* Left Middle - Checkmark Circle */}
        <svg className="absolute top-1/3 left-12 opacity-18" width="65" height="65" viewBox="0 0 65 65" fill="none">
          <circle cx="32.5" cy="32.5" r="27" fill="#10B981" opacity="0.3" />
          <path d="M20 32.5 L28 40 L45 23" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        {/* Right Middle - Lightbulb */}
        <svg className="absolute top-1/2 right-14 opacity-20" width="65" height="65" viewBox="0 0 65 65" fill="none">
          <circle cx="32.5" cy="27" r="13" fill="#F59E0B" opacity="0.3" />
          <rect x="28" y="40" width="9" height="11" rx="2" fill="#F59E0B" opacity="0.5" />
          <line x1="24" y1="14" x2="20" y2="10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <line x1="41" y1="14" x2="45" y2="10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="27" x2="10" y2="27" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Bottom Left - Star */}
        <svg className="absolute bottom-20 left-16 opacity-20" width="55" height="55" viewBox="0 0 55 55" fill="none">
          <path d="M27.5 5 L30 22 L43 12 L32 27.5 L50 30 L32 33 L43 48 L27.5 38 L12 48 L23 33 L5 30 L23 27.5 L12 12 L25 22 Z" fill="#F59E0B" />
        </svg>

        {/* Bottom Right - Graduation Cap */}
        <svg className="absolute bottom-24 right-12 opacity-18" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path d="M35 15 L10 26 L35 37 L60 26 Z" fill="#3B82F6" opacity="0.4" />
          <path d="M35 37 L35 50" stroke="#3B82F6" strokeWidth="2.5" />
          <rect x="31" y="50" width="8" height="4" rx="1" fill="#3B82F6" opacity="0.5" />
          <path d="M15 28 L15 38 Q15 43 35 47 Q55 43 55 38 L55 28" stroke="#3B82F6" strokeWidth="2" fill="none" />
        </svg>

        {/* Top Left Corner - Small Dots */}
        <svg className="absolute top-24 left-20 opacity-18" width="45" height="45" viewBox="0 0 45 45" fill="none">
          <circle cx="10" cy="10" r="3.5" fill="#8B5CF6" />
          <circle cx="23" cy="10" r="3.5" fill="#8B5CF6" />
          <circle cx="36" cy="10" r="3.5" fill="#8B5CF6" />
          <circle cx="10" cy="23" r="3.5" fill="#EC4899" />
          <circle cx="23" cy="23" r="3.5" fill="#EC4899" />
        </svg>

        {/* Top Right - Pencil */}
        <svg className="absolute top-28 right-24 opacity-15" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect x="15" y="8" width="13" height="52" rx="2" fill="#8B5CF6" opacity="0.4" transform="rotate(45 35 35)" />
          <path d="M12 58 L20 50 L28 58 Z" fill="#EC4899" opacity="0.5" />
        </svg>

        {/* Left Bottom - Geometric Circles */}
        <svg className="absolute bottom-32 left-8 opacity-15" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="25" stroke="#10B981" strokeWidth="2" fill="none" />
          <circle cx="40" cy="40" r="16" stroke="#10B981" strokeWidth="2" fill="none" />
          <circle cx="40" cy="40" r="8" fill="#10B981" opacity="0.3" />
        </svg>

        {/* Right Top - Brain/AI */}
        <svg className="absolute top-40 right-20 opacity-15" width="75" height="75" viewBox="0 0 75 75" fill="none">
          <circle cx="37.5" cy="37.5" r="30" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
          <path d="M25 37.5 Q30 30 37.5 30 Q45 30 50 37.5" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <path d="M25 37.5 Q30 45 37.5 45 Q45 45 50 37.5" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <circle cx="30" cy="33" r="2.5" fill="#8B5CF6" />
          <circle cx="45" cy="33" r="2.5" fill="#8B5CF6" />
        </svg>

        {/* Bottom Center - Plus Signs */}
        <svg className="absolute bottom-16 left-1/3 opacity-18" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <line x1="12" y1="12" x2="12" y2="20" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="16" x2="16" y2="16" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="28" x2="35" y2="36" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="31" y1="32" x2="39" y2="32" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Left Top - Trophy */}
        <svg className="absolute top-32 left-6 opacity-18" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M18 13 L18 22 Q18 30 26 30" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <path d="M42 13 L42 22 Q42 30 34 30" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <rect x="22" y="8" width="16" height="22" rx="2" fill="#F59E0B" opacity="0.3" />
          <rect x="26" y="30" width="8" height="7" fill="#F59E0B" opacity="0.4" />
          <rect x="22" y="37" width="16" height="3" rx="1" fill="#F59E0B" />
        </svg>

        {/* Right Bottom - Clock */}
        <svg className="absolute bottom-40 right-8 opacity-15" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="28" stroke="#EC4899" strokeWidth="2.5" fill="none" />
          <line x1="35" y1="35" x2="35" y2="16" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="35" x2="48" y2="35" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="35" r="3.5" fill="#EC4899" />
        </svg>
      </div>

      <Card className="max-w-md w-full p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Info Alert for Mock Data Mode */}
        {config.useMockData && (
          <Alert className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              <div className="text-yellow-900 font-semibold mb-1">🎨 Demo Mode Active</div>
              <div className="text-yellow-700 text-xs">
                Don't have an account? Click "Register" below to create one. Try all three roles!
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                placeholder="Enter your password"
              />
            </div>
            {errors.password && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New user?{' '}
            <button
              onClick={onNavigateToSignup}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
