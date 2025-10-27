import { useState } from 'react';
// Assuming TimetableEntry and TodoItem interfaces are correctly defined/imported
import { TimetableEntry, TodoItem } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sparkles, Brain, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';
// ✅ --- Import the AI API functions ---
import * as aiApi from '../lib/ai-api';
import { config } from '../lib/config'; // Needed if you want to keep mock capability

interface AIFeaturesProps {
  timetable: TimetableEntry[];
  todos: TodoItem[];
}

// Interface to expect from backend for feedback
interface FeedbackResponse {
    feedback: string;
    suggestions?: string[]; // Make suggestions optional
}

interface AIResponse {
  title: string;
  content: string;
  suggestions?: string[]; // Keep suggestions if you plan to use them
}

export function AIFeatures({ timetable, todos }: AIFeaturesProps) {
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null); // Track which feature is loading
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  // --- Get Study Feedback ---
  const handleGetStudyFeedback = async () => {
    if (config.useMockData) {
      // Keep mock logic if needed for testing
      setLoadingFeature('feedback');
      setTimeout(() => { /* ... mock response ... */ setLoadingFeature(null); setDialogOpen(true); }, 1500);
      return;
    }

    setLoadingFeature('feedback');
    try {
      // ✅ --- Call the backend API ---
      // Assuming getStudyFeedback now returns { feedback: string, suggestions: string[] }
      const response: FeedbackResponse = await aiApi.getStudyFeedback();

      // ============================================
      // ✅ --- FIX: Use Suggestions from API Response ---
      // ============================================
      setAiResponse({
        title: 'Your Study Analysis',
        content: response.feedback, // Use feedback from API
        suggestions: response.suggestions || [] // Use suggestions from API or empty array
      });
      // ============================================

      setDialogOpen(true);
      toast.success('AI feedback generated!');
    } catch (error) {
      console.error("Error getting AI feedback:", error);
      toast.error(`Failed to get feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingFeature(null);
    }
  };

  // --- Generate Study Plan ---
  const handleGenerateStudyPlan = async () => {
     if (config.useMockData) { /* ... mock logic ... */ return; }
     const userPrompt = window.prompt("What should the study plan focus on? (e.g., 'Prepare for my Calculus final next Friday')");
     if (!userPrompt) return; // User cancelled
     setLoadingFeature('plan');
     try {
       const response = await aiApi.generateStudyPlan(userPrompt);
       setAiResponse({
         title: 'Personalized Study Plan',
         content: response.plan,
         // suggestions: [] // Optionally add suggestions parsing for study plan too
       });
       setDialogOpen(true);
       toast.success('Study plan generated!');
     } catch (error) {
       console.error("Error generating study plan:", error);
       toast.error(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
     } finally {
       setLoadingFeature(null);
     }
  };

  // --- Get Motivation ---
  const handleGetMotivation = async () => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    setLoadingFeature('motivation');
    try {
        const motivationalPrompt = "Give me a short, powerful motivational quote for a student who is feeling tired.";
        const response = await aiApi.generateSummary(motivationalPrompt);
        setAiResponse({
            title: 'Motivational Boost',
            content: response.summary,
            // Suggestions for motivation can remain static or be generated too
             suggestions: [
               'Take a 5-minute break to recharge',
               'Celebrate your recent accomplishments',
               'Visualize your success',
             ]
        });
        setDialogOpen(true);
        toast.success('Here\'s some motivation for you!');
    } catch (error) {
        console.error("Error getting motivation:", error);
        toast.error(`Failed to get motivation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setLoadingFeature(null);
    }
  };


  return (
    <div className="space-y-3">
      {/* Get Study Feedback Button */}
      <Button onClick={handleGetStudyFeedback} disabled={!!loadingFeature} className="w-full justify-start gap-2" variant="outline">
        {loadingFeature === 'feedback' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        Get Study Feedback
      </Button>

      {/* Generate Study Plan Button */}
      <Button onClick={handleGenerateStudyPlan} disabled={!!loadingFeature} className="w-full justify-start gap-2" variant="outline">
        {loadingFeature === 'plan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
        Generate Study Plan
      </Button>

      {/* Get Motivation Button */}
      <Button onClick={handleGetMotivation} disabled={!!loadingFeature} className="w-full justify-start gap-2" variant="outline">
        {loadingFeature === 'motivation' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Get Motivation
      </Button>

      {/* AI Powered Insights Card */}
      <div className="pt-2"> <Card className="p-3 bg-purple-50 border-purple-200"> <div className="flex items-start gap-2"> <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5" /> <div> <p className="text-sm text-purple-900"> AI-powered insights help you optimize your study schedule and stay on track! </p> </div> </div> </Card> </div>

      {/* AI Response Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"> <Sparkles className="w-5 h-5 text-purple-600" /> {aiResponse?.title || 'AI Response'} </DialogTitle>
            <DialogDescription className="pt-4 text-base whitespace-pre-line"> {aiResponse?.content || 'Loading...'} </DialogDescription>
          </DialogHeader>
          {/* Render suggestions only if they exist and the array is not empty */}
          {aiResponse?.suggestions && aiResponse.suggestions.length > 0 && (
            <div className="space-y-3 pt-4">
              <h4 className="font-medium">Suggestions:</h4>
              <ul className="space-y-2">
                {aiResponse.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm"> <span className="text-purple-600 mt-1">•</span> <span>{suggestion}</span> </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}