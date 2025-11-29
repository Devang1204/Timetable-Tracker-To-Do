import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GraduationCap, User, Mail, Lock, AlertCircle, UserCheck, Users, Info } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '../lib/config';

interface SignUpProps {
  onSignUp: (username: string, email: string, password: string, role: 'student' | 'faculty' | 'ta') => Promise<void>;
  onNavigateToLogin: () => void;
}

export function SignUp({ onSignUp, onNavigateToLogin }: SignUpProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'student' | 'faculty' | 'ta' | ''
  });
  
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
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
        await onSignUp(formData.username, formData.email, formData.password, formData.role);
      } catch (error) {
        // Error handling is done in the onSignUp function
        console.error('Sign up failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-4 h-4" />;
      case 'faculty':
        return <Users className="w-4 h-4" />;
      case 'ta':
        return <UserCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Stickers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left - Notebook */}
        <svg className="absolute top-10 left-6 opacity-18" width="60" height="70" viewBox="0 0 60 70" fill="none">
          <rect x="12" y="8" width="38" height="52" rx="3" fill="#8B5CF6" opacity="0.3" />
          <line x1="12" y1="8" x2="12" y2="60" stroke="#8B5CF6" strokeWidth="2" />
          <line x1="20" y1="18" x2="42" y2="18" stroke="#8B5CF6" strokeWidth="1.5" />
          <line x1="20" y1="25" x2="42" y2="25" stroke="#8B5CF6" strokeWidth="1.5" />
          <line x1="20" y1="32" x2="37" y2="32" stroke="#8B5CF6" strokeWidth="1.5" />
        </svg>

        {/* Top Right - Target */}
        <svg className="absolute top-14 right-8 opacity-18" width="65" height="65" viewBox="0 0 65 65" fill="none">
          <circle cx="32.5" cy="32.5" r="26" stroke="#EC4899" strokeWidth="2.5" fill="none" />
          <circle cx="32.5" cy="32.5" r="17" stroke="#EC4899" strokeWidth="2.5" fill="none" />
          <circle cx="32.5" cy="32.5" r="7" fill="#EC4899" opacity="0.4" />
        </svg>

        {/* Left Upper - Stars Cluster */}
        <svg className="absolute top-28 left-10 opacity-20" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <path d="M15 20 L17 25 L22 25 L18 28 L20 33 L15 30 L10 33 L12 28 L8 25 L13 25 Z" fill="#F59E0B" />
          <path d="M35 8 L36 12 L40 12 L37 14 L38 18 L35 16 L32 18 L33 14 L30 12 L34 12 Z" fill="#EC4899" />
          <circle cx="25" cy="40" r="2.5" fill="#F59E0B" />
        </svg>

        {/* Right Upper - Graduation Cap */}
        <svg className="absolute top-24 right-16 opacity-18" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path d="M35 12 L8 24 L35 36 L62 24 Z" fill="#3B82F6" opacity="0.4" />
          <path d="M35 36 L35 48" stroke="#3B82F6" strokeWidth="2.5" />
          <rect x="31" y="48" width="8" height="4" rx="1" fill="#3B82F6" opacity="0.5" />
          <path d="M13 26 L13 36 Q13 41 35 45 Q57 41 57 36 L57 26" stroke="#3B82F6" strokeWidth="2" fill="none" />
        </svg>

        {/* Left Middle - Brain Icon */}
        <svg className="absolute top-1/3 left-8 opacity-15" width="75" height="75" viewBox="0 0 75 75" fill="none">
          <circle cx="37.5" cy="37.5" r="30" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
          <path d="M25 37.5 Q30 30 37.5 30 Q45 30 50 37.5" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <path d="M25 37.5 Q30 45 37.5 45 Q45 45 50 37.5" stroke="#8B5CF6" strokeWidth="2" fill="none" />
          <circle cx="30" cy="33" r="2.5" fill="#8B5CF6" />
          <circle cx="45" cy="33" r="2.5" fill="#8B5CF6" />
        </svg>

        {/* Right Middle - Lightbulb */}
        <svg className="absolute top-1/2 right-10 opacity-20" width="65" height="65" viewBox="0 0 65 65" fill="none">
          <circle cx="32.5" cy="26" r="13" fill="#F59E0B" opacity="0.3" />
          <rect x="28" y="39" width="9" height="11" rx="2" fill="#F59E0B" opacity="0.5" />
          <line x1="24" y1="13" x2="20" y2="9" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <line x1="41" y1="13" x2="45" y2="9" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="26" x2="10" y2="26" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Bottom Left - Book Stack */}
        <svg className="absolute bottom-20 left-12 opacity-20" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect x="10" y="40" width="45" height="7" rx="2" fill="#3B82F6" />
          <rect x="15" y="30" width="40" height="7" rx="2" fill="#8B5CF6" />
          <rect x="12" y="20" width="43" height="7" rx="2" fill="#EC4899" />
        </svg>

        {/* Bottom Right - Calendar */}
        <svg className="absolute bottom-16 right-14 opacity-15" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="15" y="20" width="50" height="42" rx="4" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
          <line x1="15" y1="30" x2="65" y2="30" stroke="#3B82F6" strokeWidth="2.5" />
          <circle cx="27" cy="40" r="2.5" fill="#8B5CF6" />
          <circle cx="40" cy="40" r="2.5" fill="#8B5CF6" />
          <circle cx="53" cy="40" r="2.5" fill="#8B5CF6" />
          <circle cx="27" cy="50" r="2.5" fill="#EC4899" />
          <circle cx="40" cy="50" r="2.5" fill="#EC4899" />
        </svg>

        {/* Left Bottom - Checkmark */}
        <svg className="absolute bottom-32 left-6 opacity-18" width="65" height="65" viewBox="0 0 65 65" fill="none">
          <circle cx="32.5" cy="32.5" r="27" fill="#10B981" opacity="0.3" />
          <path d="M20 32.5 L28 40 L45 23" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        {/* Right Top Corner - Pencil */}
        <svg className="absolute top-32 right-6 opacity-15" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect x="15" y="8" width="13" height="52" rx="2" fill="#8B5CF6" opacity="0.4" transform="rotate(45 35 35)" />
          <path d="M12 58 L20 50 L28 58 Z" fill="#EC4899" opacity="0.5" />
        </svg>

        {/* Top Center Left - Trophy */}
        <svg className="absolute top-20 left-20 opacity-18" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M18 13 L18 22 Q18 30 26 30" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <path d="M42 13 L42 22 Q42 30 34 30" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <rect x="22" y="8" width="16" height="22" rx="2" fill="#F59E0B" opacity="0.3" />
          <rect x="26" y="30" width="8" height="7" fill="#F59E0B" opacity="0.4" />
          <rect x="22" y="37" width="16" height="3" rx="1" fill="#F59E0B" />
        </svg>

        {/* Bottom Right Corner - Geometric Circles */}
        <svg className="absolute bottom-28 right-6 opacity-15" width="75" height="75" viewBox="0 0 75 75" fill="none">
          <circle cx="37.5" cy="37.5" r="24" stroke="#10B981" strokeWidth="2" fill="none" />
          <circle cx="37.5" cy="37.5" r="15" stroke="#10B981" strokeWidth="2" fill="none" />
          <circle cx="37.5" cy="37.5" r="8" fill="#10B981" opacity="0.3" />
        </svg>

        {/* Left Top Corner - Dots */}
        <svg className="absolute top-20 left-2 opacity-18" width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="8" cy="8" r="3" fill="#8B5CF6" />
          <circle cx="20" cy="8" r="3" fill="#8B5CF6" />
          <circle cx="32" cy="8" r="3" fill="#8B5CF6" />
          <circle cx="8" cy="20" r="3" fill="#EC4899" />
          <circle cx="20" cy="20" r="3" fill="#EC4899" />
        </svg>

        {/* Right Middle Lower - Clock */}
        <svg className="absolute bottom-40 right-20 opacity-15" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="28" stroke="#EC4899" strokeWidth="2.5" fill="none" />
          <line x1="35" y1="35" x2="35" y2="16" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="35" x2="48" y2="35" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="35" r="3.5" fill="#EC4899" />
        </svg>

        {/* Left Lower Middle - Plus Signs */}
        <svg className="absolute bottom-48 left-16 opacity-18" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <line x1="12" y1="12" x2="12" y2="20" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="16" x2="16" y2="16" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="28" x2="35" y2="36" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="31" y1="32" x2="39" y2="32" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Top Right Corner - A+ Badge */}
        <svg className="absolute top-8 right-20 opacity-18" width="60" height="65" viewBox="0 0 60 65" fill="none">
          <circle cx="30" cy="25" r="18" fill="#10B981" opacity="0.3" />
          <polygon points="25,37 30,42 35,37 35,60 30,56 25,60" fill="#10B981" opacity="0.4" />
          <text x="22" y="30" fill="#10B981" fontSize="14" fontWeight="bold">A+</text>
        </svg>
      </div>

      <Card className="max-w-md w-full p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up to get started</p>
        </div>

        {/* Info Alert for Mock Data Mode */}
        {config.useMockData && (
          <Alert className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <div className="text-blue-900 font-semibold mb-1">🎨 Demo Mode Active</div>
              <div className="text-blue-700 text-xs">
                Create accounts for different roles (Student/Faculty/TA) to explore all dashboards. Data is stored locally.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="pl-10"
                placeholder="Choose a username"
              />
            </div>
            {errors.username && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.username}</span>
              </div>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                placeholder="Create a strong password"
              />
            </div>
            {errors.password && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-10"
                placeholder="Confirm your password"
              />
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Select Your Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'student' | 'faculty' | 'ta') => 
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Choose your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    {getRoleIcon('student')}
                    <span>Student</span>
                  </div>
                </SelectItem>
                <SelectItem value="faculty">
                  <div className="flex items-center gap-2">
                    {getRoleIcon('faculty')}
                    <span>Faculty</span>
                  </div>
                </SelectItem>
                <SelectItem value="ta">
                  <div className="flex items-center gap-2">
                    {getRoleIcon('ta')}
                    <span>Teaching Assistant</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.role}</span>
              </div>
            )}
            {formData.role && (
              <p className="text-xs text-gray-500">
                Note: You won't be able to change your role after signing up.
              </p>
            )}
          </div>

          {/* Sign Up Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Click here to login
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}

