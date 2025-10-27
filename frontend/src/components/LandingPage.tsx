import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  GraduationCap, 
  Calendar, 
  CheckSquare, 
  Users, 
  Clock, 
  Brain,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-gray-900 mb-6">
            Smart Timetables, Smarter Studying
          </h1>
          <p className="text-gray-600 mb-8">
            Your AI-powered academic assistant that manages timetables, integrates tasks, and provides intelligent feedback for students, faculty, and teaching assistants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={onNavigateToSignup} className="gap-2">
              Start for Free <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onNavigateToLogin}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-gray-600">
            Powerful features designed for the modern academic environment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="size-6 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Weekly Timetable Management</h3>
            <p className="text-gray-600">
              Upload and manage your academic schedule with ease. Support for PDF imports and manual entry.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckSquare className="size-6 text-purple-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Smart To-Do Lists</h3>
            <p className="text-gray-600">
              Stay organized with integrated task management. Set priorities, deadlines, and track your progress.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="size-6 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-2">AI Study Assistant</h3>
            <p className="text-gray-600">
              Get personalized study recommendations, schedule optimization, and intelligent academic feedback.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="size-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="size-6 text-orange-600" />
            </div>
            <h3 className="text-gray-900 mb-2">TA Management</h3>
            <p className="text-gray-600">
              Faculty can efficiently assign and manage teaching assistants across multiple courses.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="size-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="size-6 text-pink-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Availability Tracking</h3>
            <p className="text-gray-600">
              TAs can set and update their availability, making scheduling conflicts a thing of the past.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="size-6 text-indigo-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Role-Based Access</h3>
            <p className="text-gray-600">
              Secure, customized dashboards for students, faculty, and TAs with appropriate permissions.
            </p>
          </Card>
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
