import { useState } from 'react';
import { TAScheduleEntry, AvailabilitySlot } from '../TADashboard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sparkles, Calendar, BookOpen, TrendingUp, Loader2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner@2.0.3';

interface TAAIFeaturesProps {
  schedule: TAScheduleEntry[];
  availability: AvailabilitySlot[];
}

interface AIResponse {
  title: string;
  content: string;
  suggestions?: string[];
}

export function TAAIFeatures({ schedule, availability }: TAAIFeaturesProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const handleScheduleAnalysis = async () => {
    setLoading(true);
    
    setTimeout(() => {
      const totalHours = schedule.reduce((acc, s) => {
        const [startHour, startMin] = s.startTime.split(':').map(Number);
        const [endHour, endMin] = s.endTime.split(':').map(Number);
        const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
        return acc + hours;
      }, 0);

      const unavailableCount = availability.filter(a => !a.isAvailable).length;
      
      setAiResponse({
        title: 'Schedule Analysis',
        content: `Current Workload:\n• Total sessions: ${schedule.length}\n• Weekly hours: ${totalHours.toFixed(1)} hours\n• Unavailable slots: ${unavailableCount}\n\nYour schedule is ${totalHours < 10 ? 'light' : totalHours < 15 ? 'balanced' : 'busy'}.`,
        suggestions: [
          'Your teaching load is well-distributed across the week',
          'Morning sessions (9-12) tend to have better student engagement',
          'Consider office hours after tutorial sessions for continuity',
          'Keep at least one full day for research and personal study',
          'Maintain regular communication with supervising faculty'
        ]
      });
      setLoading(false);
      setDialogOpen(true);
      toast.success('Analysis complete!');
    }, 1500);
  };

  const handlePreparationTips = async () => {
    setLoading(true);
    
    setTimeout(() => {
      const sessionTypes = {
        Tutorial: schedule.filter(s => s.type === 'Tutorial').length,
        Lab: schedule.filter(s => s.type === 'Lab').length,
        'Office Hours': schedule.filter(s => s.type === 'Office Hours').length,
      };

      setAiResponse({
        title: 'Session Preparation Tips',
        content: `You have ${sessionTypes.Tutorial} tutorial(s), ${sessionTypes.Lab} lab(s), and ${sessionTypes['Office Hours']} office hour session(s) this week.`,
        suggestions: [
          'Review lecture materials 24 hours before each tutorial session',
          'Prepare practice problems that align with current coursework',
          'For lab sessions, test all equipment and software beforehand',
          'Keep a list of frequently asked questions for office hours',
          'Arrive 10 minutes early to set up materials',
          'Document common student difficulties to share with faculty'
        ]
      });
      setLoading(false);
      setDialogOpen(true);
      toast.success('Tips generated!');
    }, 1500);
  };

  const handleTimeManagement = async () => {
    setLoading(true);
    
    setTimeout(() => {
      const totalHours = schedule.reduce((acc, s) => {
        const [startHour, startMin] = s.startTime.split(':').map(Number);
        const [endHour, endMin] = s.endTime.split(':').map(Number);
        const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
        return acc + hours;
      }, 0);

      setAiResponse({
        title: 'Time Management Insights',
        content: `With ${totalHours.toFixed(1)} hours of teaching per week, here's how to manage your time effectively.`,
        suggestions: [
          `Allocate ${(totalHours * 1.5).toFixed(1)} hours for prep work and grading`,
          'Block 2-hour chunks for deep work on research/coursework',
          'Use gaps between sessions for quick student check-ins',
          'Schedule admin tasks (grading, emails) during low-energy periods',
          'Reserve evenings for personal development and rest',
          'Set boundaries - respond to emails within 24-48 hours, not immediately'
        ]
      });
      setLoading(false);
      setDialogOpen(true);
      toast.success('Insights generated!');
    }, 1500);
  };

  const handleCareerGuidance = async () => {
    setLoading(true);
    
    setTimeout(() => {
      setAiResponse({
        title: 'TA Career Development',
        content: 'Your TA experience is valuable for your academic and professional growth. Here are some ways to maximize this opportunity.',
        suggestions: [
          'Document your teaching experiences for future job applications',
          'Ask for feedback from faculty and students to improve',
          'Develop your own teaching materials and methodologies',
          'Network with other TAs and faculty in your department',
          'Consider presenting at teaching conferences or workshops',
          'Request a letter of recommendation highlighting your teaching',
          'Explore different teaching styles and find what works for you'
        ]
      });
      setLoading(false);
      setDialogOpen(true);
      toast.success('Guidance generated!');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          onClick={handleScheduleAnalysis}
          disabled={loading}
          className="w-full justify-start gap-2 h-auto py-4"
          variant="outline"
        >
          <div className="flex items-start gap-3 w-full">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" />
            ) : (
              <Calendar className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            )}
            <div className="text-left">
              <div className="font-medium">Analyze Schedule</div>
              <div className="text-xs text-gray-500 font-normal">
                Get insights on your workload
              </div>
            </div>
          </div>
        </Button>

        <Button
          onClick={handlePreparationTips}
          disabled={loading}
          className="w-full justify-start gap-2 h-auto py-4"
          variant="outline"
        >
          <div className="flex items-start gap-3 w-full">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" />
            ) : (
              <BookOpen className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
            )}
            <div className="text-left">
              <div className="font-medium">Preparation Tips</div>
              <div className="text-xs text-gray-500 font-normal">
                Get ready for your sessions
              </div>
            </div>
          </div>
        </Button>

        <Button
          onClick={handleTimeManagement}
          disabled={loading}
          className="w-full justify-start gap-2 h-auto py-4"
          variant="outline"
        >
          <div className="flex items-start gap-3 w-full">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 shrink-0 mt-0.5 text-purple-600" />
            )}
            <div className="text-left">
              <div className="font-medium">Time Management</div>
              <div className="text-xs text-gray-500 font-normal">
                Balance teaching and studies
              </div>
            </div>
          </div>
        </Button>

        <Button
          onClick={handleCareerGuidance}
          disabled={loading}
          className="w-full justify-start gap-2 h-auto py-4"
          variant="outline"
        >
          <div className="flex items-start gap-3 w-full">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />
            )}
            <div className="text-left">
              <div className="font-medium">Career Guidance</div>
              <div className="text-xs text-gray-500 font-normal">
                Maximize your TA experience
              </div>
            </div>
          </div>
        </Button>
      </div>

      <Card className="p-4 bg-purple-50 border-purple-200 mt-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-purple-900 mb-1">
              AI-Powered TA Support
            </p>
            <p className="text-xs text-purple-700">
              Get personalized advice on managing your teaching responsibilities, balancing your workload, and developing your teaching skills.
            </p>
          </div>
        </div>
      </Card>

      {/* AI Response Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {aiResponse?.title}
            </DialogTitle>
            <DialogDescription className="pt-4 text-base whitespace-pre-line">
              {aiResponse?.content}
            </DialogDescription>
          </DialogHeader>
          {aiResponse?.suggestions && (
            <div className="space-y-3 pt-4">
              <h4 className="font-medium">Recommendations:</h4>
              <ul className="space-y-2">
                {aiResponse.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
