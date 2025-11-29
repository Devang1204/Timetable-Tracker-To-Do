import { useState, useEffect, Suspense, lazy } from 'react';
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const FacultyDashboard = lazy(() => import('./FacultyDashboard'));
const TADashboard = lazy(() => import('./TADashboard'));
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { LandingPage } from './components/LandingPage';
import { login, signUp, logout, getCurrentUser, isAuthenticated } from './lib/auth';
import { toast } from 'sonner';
import { config } from './lib/config';
import { ConnectionStatus } from './components/ConnectionStatus';

type UserRole = 'student' | 'faculty' | 'ta';

interface User {
  username: string;
  email: string;
  role: UserRole;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'signup' | 'dashboard'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    // Listen for auth:logout event
    const handleAuthLogout = () => {
      handleLogout();
      toast.error("Session expired. Please login again.");
    };
    window.addEventListener('auth:logout', handleAuthLogout);

    if (config.useMockData) {
      // Mock data mode - use localStorage
      const savedSession = localStorage.getItem('currentSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setUser(session);
        setCurrentView('dashboard');
      }
    } else {
      // Backend mode - check for saved token
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser({
            username: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
          });
          setCurrentView('dashboard');
        }
      }
    }
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (config.useMockData) {
      // Mock data mode - use localStorage
      const savedUser = localStorage.getItem('user_' + email);
      if (!savedUser) {
        toast.error('Account not found. Please sign up first.');
        return;
      }

      const userData = JSON.parse(savedUser);
      if (userData.password !== password) {
        toast.error('Incorrect password. Please try again.');
        return;
      }

      const user: User = {
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };
      
      setUser(user);
      setCurrentView('dashboard');
      localStorage.setItem('currentSession', JSON.stringify(user));
      toast.success('Login successful!');
    } else {
      // Backend mode - call API
      try {
        const response = await login({ email, password });
        const user: User = {
          username: response.user.name,
          email: response.user.email,
          role: response.user.role,
        };
        
        setUser(user);
        setCurrentView('dashboard');
        toast.success('Login successful!');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Login failed. Please check your credentials.');
        }
      }
    }
  };

  const handleSignUp = async (username: string, email: string, password: string, role: UserRole) => {
    if (config.useMockData) {
      // Mock data mode - use localStorage
      const existingUser = localStorage.getItem('user_' + email);
      if (existingUser) {
        toast.error('An account with this email already exists. Please login.');
        return;
      }

      const userData = { username, email, password, role };
      localStorage.setItem('user_' + email, JSON.stringify(userData));
      
      const user: User = { username, email, role };
      setUser(user);
      setCurrentView('dashboard');
      localStorage.setItem('currentSession', JSON.stringify(user));
      toast.success('Account created successfully!');
    } else {
      // Backend mode - call API
      try {
        const response = await signUp({ username, email, password, role });
        const user: User = {
          username: response.user.name,
          email: response.user.email,
          role: response.user.role,
        };
        
        setUser(user);
        setCurrentView('dashboard');
        toast.success('Account created successfully!');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Sign up failed. Please try again.');
        }
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    localStorage.removeItem('currentSession');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing Page View
  if (currentView === 'home') {
    return (
      <>
        <LandingPage
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
        <ConnectionStatus />
      </>
    );
  }

  // Login View
  if (currentView === 'login') {
    return (
      <>
        <Login
          onLogin={handleLogin}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
        <ConnectionStatus />
      </>
    );
  }

  // Sign Up View
  if (currentView === 'signup') {
    return (
      <>
        <SignUp
          onSignUp={handleSignUp}
          onNavigateToLogin={() => setCurrentView('login')}
        />
        <ConnectionStatus />
      </>
    );
  }

  // Dashboard View
  if (currentView === 'dashboard' && user) {
    return (
      <>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Dashboard...</p>
            </div>
          </div>
        }>
          {currentView === 'dashboard' && user?.role === 'student' && (
            <StudentDashboard 
              userName={user.username} 
              onChangeRole={handleLogout} 
            />
          )}

          {currentView === 'dashboard' && user?.role === 'faculty' && (
            <FacultyDashboard 
              userName={user.username} 
              onChangeRole={handleLogout} 
            />
          )}

          {currentView === 'dashboard' && user?.role === 'ta' && (
            <TADashboard 
              userName={user.username} 
              onChangeRole={handleLogout} 
            />
          )}
        </Suspense>
        <ConnectionStatus />
      </>
    );
  }

  return null;
}