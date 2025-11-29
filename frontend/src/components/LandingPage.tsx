import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { 
  GraduationCap, 
  Calendar, 
  CheckSquare, 
  Users, 
  Clock, 
  Brain,
  Shield,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { config } from '../lib/config';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-blue-50 relative overflow-hidden">
      {/* Decorative Stickers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left - Book Stack */}
        <svg className="absolute top-20 left-10 opacity-20" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="40" width="50" height="8" rx="2" fill="#3B82F6" />
          <rect x="15" y="30" width="45" height="8" rx="2" fill="#8B5CF6" />
          <rect x="12" y="20" width="48" height="8" rx="2" fill="#EC4899" />
        </svg>

        {/* Top Right - Calendar Icon */}
        <svg className="absolute top-32 right-20 opacity-15" width="100" height="100" viewBox="0 0 100 100" fill="none">
          <rect x="20" y="25" width="60" height="50" rx="4" stroke="#3B82F6" strokeWidth="3" fill="none" />
          <line x1="20" y1="35" x2="80" y2="35" stroke="#3B82F6" strokeWidth="3" />
          <circle cx="35" cy="50" r="3" fill="#8B5CF6" />
          <circle cx="50" cy="50" r="3" fill="#8B5CF6" />
          <circle cx="65" cy="50" r="3" fill="#8B5CF6" />
          <circle cx="35" cy="62" r="3" fill="#EC4899" />
          <circle cx="50" cy="62" r="3" fill="#EC4899" />
        </svg>

        {/* Left Middle - Checkmark Circle */}
        <svg className="absolute top-1/3 left-20 opacity-20" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="30" fill="#10B981" opacity="0.3" />
          <path d="M20 35 L30 45 L50 25" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        {/* Right Middle - Brain/AI */}
        <svg className="absolute top-1/2 right-10 opacity-15" width="90" height="90" viewBox="0 0 90 90" fill="none">
          <circle cx="45" cy="45" r="35" stroke="#8B5CF6" strokeWidth="3" fill="none" />
          <path d="M30 45 Q35 35 45 35 Q55 35 60 45" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
          <path d="M30 45 Q35 55 45 55 Q55 55 60 45" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
          <circle cx="35" cy="40" r="3" fill="#8B5CF6" />
          <circle cx="55" cy="40" r="3" fill="#8B5CF6" />
        </svg>

        {/* Bottom Left - Star Burst */}
        <svg className="absolute bottom-1/3 left-32 opacity-20" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M30 5 L33 27 L50 15 L35 30 L55 35 L35 40 L50 55 L30 43 L10 55 L25 40 L5 35 L25 30 L10 15 L27 27 Z" fill="#F59E0B" />
        </svg>

        {/* Bottom Right - Clock */}
        <svg className="absolute bottom-40 right-32 opacity-15" width="85" height="85" viewBox="0 0 85 85" fill="none">
          <circle cx="42.5" cy="42.5" r="35" stroke="#EC4899" strokeWidth="3" fill="none" />
          <line x1="42.5" y1="42.5" x2="42.5" y2="20" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
          <line x1="42.5" y1="42.5" x2="60" y2="42.5" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
          <circle cx="42.5" cy="42.5" r="4" fill="#EC4899" />
        </svg>

        {/* Middle - Arrow Doodle */}
        <svg className="absolute top-1/4 right-1/3 opacity-15" width="120" height="60" viewBox="0 0 120 60" fill="none">
          <path d="M10 30 Q40 10 70 30 T110 30" stroke="#3B82F6" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M100 20 L110 30 L100 40" stroke="#3B82F6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Top - Light Bulb */}
        <svg className="absolute top-40 left-1/3 opacity-20" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="30" r="15" fill="#F59E0B" opacity="0.3" />
          <rect x="30" y="45" width="10" height="12" rx="2" fill="#F59E0B" opacity="0.5" />
          <line x1="25" y1="15" x2="20" y2="10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="15" x2="50" y2="10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="30" x2="10" y2="30" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Bottom - Pencil */}
        <svg className="absolute bottom-20 left-1/4 opacity-15" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="20" y="10" width="15" height="60" rx="2" fill="#8B5CF6" opacity="0.4" transform="rotate(45 40 40)" />
          <path d="M15 65 L25 55 L35 65 Z" fill="#EC4899" opacity="0.5" />
        </svg>

        {/* Middle Right - Geometric Circles */}
        <svg className="absolute top-2/3 right-20 opacity-15" width="100" height="100" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="30" stroke="#10B981" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="20" stroke="#10B981" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="10" fill="#10B981" opacity="0.3" />
        </svg>

        {/* Top Middle - Trophy */}
        <svg className="absolute top-16 left-2/3 opacity-20" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path d="M20 15 L20 25 Q20 35 30 35" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <path d="M50 15 L50 25 Q50 35 40 35" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <rect x="25" y="10" width="20" height="25" rx="2" fill="#F59E0B" opacity="0.3" />
          <rect x="30" y="35" width="10" height="8" fill="#F59E0B" opacity="0.4" />
          <rect x="25" y="43" width="20" height="4" rx="1" fill="#F59E0B" />
        </svg>

        {/* Bottom Center - Plus Signs */}
        <svg className="absolute bottom-32 left-1/2 opacity-20" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <line x1="15" y1="15" x2="15" y2="25" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="20" x2="20" y2="20" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="35" x2="40" y2="45" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
          <line x1="35" y1="40" x2="45" y2="40" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* NEW STICKERS - Only in upper sections */}
        
        {/* Top Left Corner - Small Stars */}
        <svg className="absolute top-12 left-2 opacity-20" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <path d="M15 20 L17 25 L22 25 L18 28 L20 33 L15 30 L10 33 L12 28 L8 25 L13 25 Z" fill="#F59E0B" />
          <path d="M35 10 L36 13 L39 13 L37 15 L38 18 L35 16 L32 18 L33 15 L31 13 L34 13 Z" fill="#EC4899" />
        </svg>

        {/* Top Right Edge - Notebook */}
        <svg className="absolute top-24 right-5 opacity-15" width="65" height="75" viewBox="0 0 65 75" fill="none">
          <rect x="15" y="10" width="40" height="55" rx="3" fill="#8B5CF6" opacity="0.3" />
          <line x1="15" y1="10" x2="15" y2="65" stroke="#8B5CF6" strokeWidth="2" />
          <line x1="25" y1="22" x2="45" y2="22" stroke="#8B5CF6" strokeWidth="1.5" />
          <line x1="25" y1="30" x2="45" y2="30" stroke="#8B5CF6" strokeWidth="1.5" />
          <line x1="25" y1="38" x2="40" y2="38" stroke="#8B5CF6" strokeWidth="1.5" />
        </svg>

        {/* Left Side - Graduation Cap Small */}
        <svg className="absolute top-64 left-5 opacity-20" width="75" height="75" viewBox="0 0 75 75" fill="none">
          <path d="M37.5 15 L10 28 L37.5 41 L65 28 Z" fill="#3B82F6" opacity="0.4" />
          <path d="M37.5 41 L37.5 55" stroke="#3B82F6" strokeWidth="2.5" />
          <rect x="33" y="55" width="9" height="4" rx="1" fill="#3B82F6" opacity="0.5" />
          <path d="M15 31 L15 42 Q15 48 37.5 52 Q60 48 60 42 L60 31" stroke="#3B82F6" strokeWidth="2" fill="none" />
        </svg>

        {/* Right Side Upper - Target/Goal */}
        <svg className="absolute top-56 right-12 opacity-18" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="28" stroke="#EC4899" strokeWidth="2.5" fill="none" />
          <circle cx="35" cy="35" r="18" stroke="#EC4899" strokeWidth="2.5" fill="none" />
          <circle cx="35" cy="35" r="8" fill="#EC4899" opacity="0.4" />
        </svg>

        {/* Left Upper - Wavy Underline */}
        <svg className="absolute top-48 left-16 opacity-18" width="90" height="30" viewBox="0 0 90 30" fill="none">
          <path d="M5 15 Q15 8 25 15 T45 15 T65 15 T85 15" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>

        {/* Right Side - Paper/Document Stack */}
        <svg className="absolute top-80 right-24 opacity-15" width="60" height="70" viewBox="0 0 60 70" fill="none">
          <rect x="8" y="8" width="40" height="52" rx="2" fill="#3B82F6" opacity="0.2" />
          <rect x="12" y="12" width="40" height="52" rx="2" fill="#3B82F6" opacity="0.3" />
          <rect x="16" y="16" width="40" height="52" rx="2" fill="#3B82F6" opacity="0.4" />
          <line x1="22" y1="28" x2="45" y2="28" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="22" y1="35" x2="45" y2="35" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="22" y1="42" x2="38" y2="42" stroke="#3B82F6" strokeWidth="1.5" />
        </svg>

        {/* Upper Left - Small Dots Pattern */}
        <svg className="absolute top-36 left-8 opacity-20" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <circle cx="10" cy="10" r="4" fill="#8B5CF6" />
          <circle cx="25" cy="10" r="4" fill="#8B5CF6" />
          <circle cx="40" cy="10" r="4" fill="#8B5CF6" />
          <circle cx="10" cy="25" r="4" fill="#EC4899" />
          <circle cx="25" cy="25" r="4" fill="#EC4899" />
          <circle cx="40" cy="25" r="4" fill="#EC4899" />
        </svg>

        {/* Upper Right - Mathematical Symbols */}
        <svg className="absolute top-44 right-16 opacity-18" width="55" height="55" viewBox="0 0 55 55" fill="none">
          <text x="5" y="20" fill="#F59E0B" fontSize="24" fontWeight="bold">π</text>
          <text x="25" y="45" fill="#10B981" fontSize="20" fontWeight="bold">∑</text>
          <circle cx="45" cy="15" r="8" stroke="#3B82F6" strokeWidth="2" fill="none" />
        </svg>

        {/* Left Middle Upper - Heart/Like */}
        <svg className="absolute top-72 left-28 opacity-18" width="55" height="55" viewBox="0 0 55 55" fill="none">
          <path d="M27.5 45 C27.5 45 7.5 32 7.5 20 C7.5 12 12.5 8 17.5 8 C22.5 8 27.5 12 27.5 12 C27.5 12 32.5 8 37.5 8 C42.5 8 47.5 12 47.5 20 C47.5 32 27.5 45 27.5 45 Z" fill="#EC4899" opacity="0.3" />
        </svg>

        {/* Right Upper Middle - Sparkles */}
        <svg className="absolute top-68 right-6 opacity-20" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <path d="M15 5 L16 15 L25 14 L17 20 L20 28 L15 22 L10 28 L13 20 L5 14 L14 15 Z" fill="#F59E0B" />
          <circle cx="38" cy="35" r="3" fill="#F59E0B" />
          <circle cx="42" cy="15" r="2.5" fill="#F59E0B" />
        </svg>

        {/* Upper Center Right - Ribbon Badge */}
        <svg className="absolute top-52 right-40 opacity-15" width="65" height="75" viewBox="0 0 65 75" fill="none">
          <circle cx="32.5" cy="30" r="20" fill="#10B981" opacity="0.3" />
          <polygon points="27,45 32.5,50 38,45 38,70 32.5,65 27,70" fill="#10B981" opacity="0.4" />
          <text x="27" y="35" fill="#10B981" fontSize="16" fontWeight="bold">A+</text>
        </svg>

        {/* Left Side Mid - Folder Icon */}
        <svg className="absolute top-80 left-12 opacity-18" width="70" height="60" viewBox="0 0 70 60" fill="none">
          <path d="M10 20 L10 50 L60 50 L60 20 L40 20 L35 15 L10 15 Z" fill="#8B5CF6" opacity="0.3" />
          <rect x="10" y="20" width="50" height="30" rx="2" stroke="#8B5CF6" strokeWidth="2" fill="none" />
        </svg>

        {/* Upper Left Center - Doodle Circle */}
        <svg className="absolute top-56 left-36 opacity-18" width="45" height="45" viewBox="0 0 45 45" fill="none">
          <circle cx="22.5" cy="22.5" r="18" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="5,5" fill="none" />
          <path d="M15 22.5 L22 29 L32 16" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-8 text-blue-600" />
              <span className="text-blue-600">AcademicHub</span>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onNavigateToLogin}>
                Login
              </Button>
              <Button onClick={onNavigateToSignup}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Demo Mode Banner */}
      {config.useMockData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <AlertDescription className="ml-2">
              <span className="font-semibold text-blue-900">Demo Mode Active!</span>
              <span className="text-blue-700"> Create an account to explore Student, Faculty, or TA dashboards. All data is stored locally in your browser.</span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-gray-900 mb-6 font-extrabold">
            Smart Timetables, Smarter Studying
          </h1>
          <p className="text-gray-600 mb-8">
            Your AI-powered academic assistant that manages timetables, integrates tasks, and provides intelligent feedback for students, faculty, and teaching assistants.
          </p>
          <div className="flex justify-center">
            <Button size="lg" onClick={onNavigateToSignup} className="gap-2">
              Start for Free <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <motion.h2 
            className="text-gray-900 mb-4 relative inline-block"
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="relative">
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Everything You Need to 
              </motion.span>
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 font-extrabold"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
              >
                {" "}Succeed
              </motion.span>
              <motion.svg 
                className="absolute -bottom-2 left-0 w-full" 
                height="8" 
                viewBox="0 0 200 8" 
                fill="none" 
                preserveAspectRatio="none"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.8, ease: "easeInOut" }}
              >
                <motion.path 
                  d="M0 4 Q50 0, 100 4 T200 4" 
                  stroke="#F59E0B" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round"
                />
              </motion.svg>
            </span>
          </motion.h2>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Powerful features designed for the modern academic environment
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <motion.div 
                className="size-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Calendar className="size-6 text-blue-600" />
              </motion.div>
              <h3 className="text-gray-900 mb-2">Weekly Timetable Management</h3>
              <p className="text-gray-600">
                Upload and manage your academic schedule with ease. Support for PDF imports and manual entry.
              </p>
            </Card>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <motion.div 
                className="size-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CheckSquare className="size-6 text-purple-600" />
              </motion.div>
              <h3 className="text-gray-900 mb-2">Smart To-Do Lists</h3>
              <p className="text-gray-600">
                Stay organized with integrated task management. Set priorities, deadlines, and track your progress.
              </p>
            </Card>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <motion.div 
                className="size-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Brain className="size-6 text-green-600" />
              </motion.div>
              <h3 className="text-gray-900 mb-2">AI Study Assistant</h3>
              <p className="text-gray-600">
                Get personalized study recommendations, schedule optimization, and intelligent academic feedback.
              </p>
            </Card>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <motion.div 
                className="size-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Users className="size-6 text-orange-600" />
              </motion.div>
              <h3 className="text-gray-900 mb-2">TA Management</h3>
              <p className="text-gray-600">
                Faculty can efficiently assign and manage teaching assistants across multiple courses.
              </p>
            </Card>
          </motion.div>

          {/* Feature 5 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <motion.div 
                className="size-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Clock className="size-6 text-pink-600" />
              </motion.div>
              <h3 className="text-gray-900 mb-2">Availability Tracking</h3>
              <p className="text-gray-600">
                TAs can set and update their availability, making scheduling conflicts a thing of the past.
              </p>
            </Card>
          </motion.div>

          {/* Feature 6 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <motion.div 
                className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="size-6 text-indigo-600" />
              </motion.div>
              <h3 className="text-gray-900 mb-2">Role-Based Access</h3>
              <p className="text-gray-600">
                Secure, customized dashboards for students, faculty, and TAs with appropriate permissions.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Role-Specific Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-4">
            Built for Every Role
          </h2>
          <p className="text-gray-600">
            Tailored experiences for different academic roles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Students */}
          <div className="text-center">
            <div className="size-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="size-8 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-3">For Students</h3>
            <ul className="text-gray-600 space-y-2">
              <li>Track your weekly schedule</li>
              <li>Manage assignments & deadlines</li>
              <li>Get AI-powered study tips</li>
              <li>View course materials</li>
            </ul>
          </div>

          {/* Faculty */}
          <div className="text-center">
            <div className="size-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="size-8 text-purple-600" />
            </div>
            <h3 className="text-gray-900 mb-3">For Faculty</h3>
            <ul className="text-gray-600 space-y-2">
              <li>Manage course schedules</li>
              <li>Assign teaching assistants</li>
              <li>Track TA availability</li>
              <li>AI assistance for planning</li>
            </ul>
          </div>

          {/* TAs */}
          <div className="text-center">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="size-8 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-3">For TAs</h3>
            <ul className="text-gray-600 space-y-2">
              <li>View assigned schedules</li>
              <li>Set availability windows</li>
              <li>Track assignments</li>
              <li>Coordinate with faculty</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white">
          <div className="max-w-2xl mx-auto">
            <Zap className="size-12 mx-auto mb-4" />
            <h2 className="mb-4">
              Ready to Transform Your Academic Life?
            </h2>
            <p className="mb-8 text-blue-50">
              Join thousands of students, faculty, and TAs who are already experiencing smarter academic management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={onNavigateToSignup}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Create Free Account
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={onNavigateToLogin}
                className="border-white text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="size-6 text-blue-600" />
              <span className="text-gray-900">AcademicHub</span>
            </div>
            <p>© 2025 AcademicHub. All rights reserved.</p>
            <p className="mt-2">Your AI-Powered Academic Assistant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
