import { useState } from 'react';
import { TimetableEntry, TodoItem } from '../StudentDashboard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Sparkles, Brain, BookOpen, TrendingUp, Loader2, X, Bot } from 'lucide-react';
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

// Interface for Study Plan Structure
interface StudyPlanTask {
    time: string;
    activity: string;
    outcome: string;
}

interface StudyPlanDay {
    day: string;
    focus: string;
    tasks: StudyPlanTask[];
}

interface StudyPlanResponse {
    plan: StudyPlanDay[];
    note: string;
}

interface AIResponse {
  title: string;
  content: string | StudyPlanResponse; // Can be string or structured plan
  suggestions?: string[]; // Keep suggestions if you plan to use them
}

export function AIFeatures({ timetable, todos }: AIFeaturesProps) {
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null); // Track which feature is loading
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  // --- Study Plan Dialog State ---
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planGoal, setPlanGoal] = useState('');
  const [planDuration, setPlanDuration] = useState('');
  const [planTopics, setPlanTopics] = useState('');

  // --- Get Study Feedback ---
  const handleGetStudyFeedback = async () => {
    if (config.useMockData) {
      // Keep mock logic if needed for testing
      setLoadingFeature('feedback');
      setTimeout(() => { 
          setAiResponse({
              title: 'Your Study Analysis',
              content: "This is a mock analysis of your study schedule. It looks like you have a lot of free time on Tuesday.",
              suggestions: ["Study more on Tuesday", "Relax on Sunday"]
          });
          setLoadingFeature(null); 
      }, 1500);
      return;
    }

    setLoadingFeature('feedback');
    try {
      // ✅ --- Call the backend API ---
      // Assuming getStudyFeedback now returns { feedback: string, suggestions: string[] }
      const response: FeedbackResponse = await aiApi.getStudyFeedback();
      console.log("Frontend received AI feedback:", response); // Debug log

      if (!response || (!response.feedback && (!response.suggestions || response.suggestions.length === 0))) {
          throw new Error("Received empty response from AI.");
      }

      // ============================================
      // ✅ --- FIX: Use Suggestions from API Response ---
      // ============================================
      
      let content = response.feedback || "No detailed analysis text provided.";
      const suggestions = response.suggestions || [];

      // Client-side fix for stale backend response
      if (content.includes("Please check the suggestions below") && suggestions.length === 0) {
          content = "Analysis complete. No specific suggestions could be generated at this time. Try adding more classes to your timetable for better insights.";
          toast.warning("Backend update pending. Please restart the backend server for the best experience.");
      }

      setAiResponse({
        title: 'Your Study Analysis',
        content: content,
        suggestions: suggestions
      });
      // ============================================

      toast.success('AI feedback generated!');
    } catch (error) {
      console.error("Error getting AI feedback:", error);
      toast.error(`Failed to get feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingFeature(null);
    }
  };

  // --- Open Study Plan Dialog ---
  const handleOpenStudyPlanDialog = () => {
      setPlanGoal('');
      setPlanDuration('');
      setPlanTopics('');
      setPlanDialogOpen(true);
  };

  // --- Submit Study Plan Request ---
  const handleSubmitStudyPlan = async () => {
     if (!planGoal.trim()) {
         toast.error("Please enter a goal or subject.");
         return;
     }
     
     setPlanDialogOpen(false);
     setLoadingFeature('plan');

     if (config.useMockData) { 
         setTimeout(() => {
             setAiResponse({
                 title: 'Personalized Study Plan',
                 content: { plan: [], note: "Mock Plan: Study Calculus for 3 days." },
             });
             setLoadingFeature(null);
         }, 1000);
         return; 
     }

     try {
       const response = await aiApi.generateStudyPlan({
           goal: planGoal,
           duration: planDuration || '1 day',
           topics: planTopics
       });
       
       // Check if response.plan is the new structure or old string
       let content: string | StudyPlanResponse;
       if (response.plan && typeof response.plan === 'object' && !Array.isArray(response.plan) && 'plan' in response.plan) {
           // It's the new structure { plan: [...], note: ... }
           content = response.plan as StudyPlanResponse;
       } else if (response.plan && Array.isArray(response.plan)) {
           // It's the new structure but maybe just the array part? (Depends on backend implementation details)
           // Based on my backend change: res.json({ success: true, plan: planData }); where planData is { plan: [], note: "" }
           content = response.plan as unknown as StudyPlanResponse;
       } else {
           // Fallback for old string response
           content = String(response.plan);
       }
       
       setAiResponse({
         title: 'Personalized Study Plan',
         content: content,
       });
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
        // Dynamic prompt to avoid repetition
        const topics = ["perseverance", "focus", "rest", "ambition", "learning", "overcoming failure", "discipline"];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const motivationalPrompt = `Give me a short, powerful, unique motivational quote about ${randomTopic} for a student who is feeling tired. Do not repeat previous quotes.`;
        
        const response = await aiApi.generateText(motivationalPrompt);
        
        const fallbackQuote = "Success is not final, failure is not fatal: it is the courage to continue that counts. – Winston Churchill";
        const content = response.text && response.text.trim().length > 0 ? response.text : fallbackQuote;

        setAiResponse({
            title: 'Motivational Boost',
            content: content,
            // Suggestions for motivation can remain static or be generated too
             suggestions: [
               'Take a 5-minute break to recharge',
               'Celebrate your recent accomplishments',
               'Visualize your success',
             ]
        });
        toast.success('Here\'s some motivation for you!');
    } catch (error) {
        console.error("Error getting motivation:", error);
        toast.error(`Failed to get motivation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setLoadingFeature(null);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
      {/* Left Column: Actions */}
      <div className="space-y-4 lg:col-span-1">
        <Card className="p-5 shadow-md border-purple-100">
          <h3 className="font-semibold mb-4 text-lg text-purple-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Tools
          </h3>
          <div className="space-y-3">
            {/* Get Study Feedback Button */}
            <Button onClick={handleGetStudyFeedback} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'feedback' ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <TrendingUp className="w-5 h-5 text-purple-600" />}
              Get Study Feedback
            </Button>

            {/* Generate Study Plan Button */}
            <Button onClick={handleOpenStudyPlanDialog} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'plan' ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <BookOpen className="w-5 h-5 text-blue-600" />}
              Generate Study Plan
            </Button>

            {/* Get Motivation Button */}
            <Button onClick={handleGetMotivation} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'motivation' ? <Loader2 className="w-5 h-5 animate-spin text-yellow-600" /> : <Sparkles className="w-5 h-5 text-yellow-600" />}
              Get Motivation
            </Button>
          </div>
        </Card>

        {/* AI Powered Insights Card */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-sm"> 
          <div className="flex items-start gap-3"> 
            <div className="bg-white p-2 rounded-full shadow-sm">
              <Sparkles className="w-5 h-5 text-purple-600" /> 
            </div>
            <div> 
              <p className="text-sm text-purple-900 font-medium leading-relaxed"> 
                AI-powered insights help you optimize your study schedule and stay on track! Select a tool above to get started.
              </p> 
            </div> 
          </div> 
        </Card> 
      </div>

      {/* Right Column: Results */}
      <div className="lg:col-span-2">
        {aiResponse ? (
          <Card className="h-full p-6 shadow-lg border-purple-100 bg-white/80 backdrop-blur-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                {aiResponse.title}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setAiResponse(null)} className="hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
              <div className="prose prose-purple max-w-none">
                {typeof aiResponse.content === 'string' ? (
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed text-lg">
                      {aiResponse.content}
                    </div>
                ) : (
                    // Render Structured Study Plan
                    <div className="space-y-6">
                        {(aiResponse.content as StudyPlanResponse).plan.map((day, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden">
                                <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                                    <h4 className="font-bold text-purple-900">{day.day}</h4>
                                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">{day.focus}</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {day.tasks.map((task, tIdx) => (
                                        <div key={tIdx} className="p-4 hover:bg-gray-50 transition-colors grid grid-cols-12 gap-4">
                                            <div className="col-span-3 text-sm font-semibold text-gray-500">{task.time}</div>
                                            <div className="col-span-9">
                                                <p className="font-medium text-gray-800">{task.activity}</p>
                                                <p className="text-sm text-gray-500 mt-1">Outcome: {task.outcome}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(aiResponse.content as StudyPlanResponse).note && (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-yellow-800 text-sm italic flex gap-2">
                                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {(aiResponse.content as StudyPlanResponse).note}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Render suggestions only if they exist and the array is not empty */}
                {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                  <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Recommended Actions:
                    </h4>
                    <ul className="space-y-3">
                      {aiResponse.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-700 bg-white p-3 rounded-lg shadow-sm border border-purple-100/50"> 
                          <span className="text-purple-600 mt-1 font-bold">•</span> 
                          <span>{suggestion}</span> 
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50/50">
            <div className="text-center p-8 max-w-md">
              <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                <Bot className="w-12 h-12 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Ready to Assist</h3>
              <p className="text-gray-500">Select an AI tool from the left menu to generate insights, study plans, or get motivation.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Study Plan Input Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Personalized Study Plan</DialogTitle>
            <DialogDescription>
              Tell the AI what you need to study, and it will create a schedule for you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal">Goal / Subject</Label>
              <Input
                id="goal"
                placeholder="e.g., Prepare for Calculus Final, Learn React Basics"
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration / Deadline</Label>
              <Input
                id="duration"
                placeholder="e.g., 3 days, Until next Friday, 1 week"
                value={planDuration}
                onChange={(e) => setPlanDuration(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="topics">Specific Topics / Chapters (Optional)</Label>
              <Textarea
                id="topics"
                placeholder="e.g., Integration by parts, Limits, Derivatives. (The AI will focus on these)"
                value={planTopics}
                onChange={(e) => setPlanTopics(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitStudyPlan} disabled={!planGoal.trim()}>Generate Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}