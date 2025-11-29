import { useState } from 'react';
// Assuming interfaces are defined/imported correctly
export interface FacultyTimetableEntry { id: number | string; subject: string; startTime: string; endTime: string; location: string; dayOfWeek: number; assignee: string; assigneeName?: string; assigneeUserId?: number; color?: string; }
export interface TA { id: number | string; name: string; email: string; role?: string; subjects?: string[]; color?: string; password?: string; }

import { Button } from './ui/button';
import { Card } from './ui/card';
// Corrected icon imports based on your original file
import { Sparkles, Calendar, TrendingUp, Zap, Loader2, BookOpen, Users, Brain, X, Bot } from 'lucide-react'; // Added Brain back
import { toast } from 'sonner';
// ✅ --- Import the AI API functions ---
import * as aiApi from '../lib/ai-api';
import { config } from '../lib/config'; // Needed if you want to keep mock capability
// ✅ --- Import the new dialog component ---
import { GenerateScheduleDialog } from './GenerateScheduleDialog'; // Assuming it's in the same folder or adjust path

interface FacultyAIFeaturesProps {
  timetable: FacultyTimetableEntry[];
  tas: TA[];
  // ============================================
  // ✅ --- Add facultyUserName prop ---
  // ============================================
  facultyUserName: string;
  // Add prop to refresh timetable after generation if needed
  // onScheduleGenerated?: () => void;
}

interface AIResponse {
  title: string;
  content: string; // Main analysis/report text
  suggestions?: string[]; // List of recommendations
}

export function FacultyAIFeatures({ timetable, tas, facultyUserName }: FacultyAIFeaturesProps) { // Added facultyUserName
  // Use a single loading state
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  // ============================================
  // ✅ --- State for Generate Schedule Dialog ---
  // ============================================
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Helper to show AI response in dialog
  const showResponse = (title: string, content: string, suggestions: string[] = []) => {
      setAiResponse({ title, content, suggestions });
  };

  // ============================================
  // ✅ --- THIS function now handles SUBMISSION from the dialog ---
  // ============================================
  const handleGenerateOptimalSchedule = async (constraints: {
    assigneeUserId: number | string;
    subjects: string[];
    targetRole: 'faculty' | 'ta';
  }) => {
    if (config.useMockData) {
        // Keep your original mock logic here if needed for testing
        setLoadingFeature('schedule');
        setTimeout(() => {
            const myClasses = timetable.filter(c => c.assignee === 'self').length;
            const taClasses = timetable.filter(c => c.assignee !== 'self').length;
            showResponse(
                'Optimized Schedule Analysis (Mock)',
                `Generating mock schedule for ${constraints.assigneeUserId} with subjects: ${constraints.subjects.join(', ')}...`,
                [ 'Mock Suggestion 1', 'Mock Suggestion 2' ]
            );
            setLoadingFeature(null);
            toast.success('Mock analysis complete!');
        }, 1500);
        setGenerateDialogOpen(false); // Close dialog in mock mode too
        return;
    }

    setLoadingFeature('schedule'); // Use a specific key for loading
    setGenerateDialogOpen(false); // Assume dialog closes itself onGenerate, or keep this
    toast.info("Generating schedule with AI... This might take a minute.");
    try {
        // Prepare data for backend (already matches expected structure)
        const response = await aiApi.generateOptimalSchedule(constraints);
        // Assuming response includes a 'message' field on success
        toast.success(response.message || "Schedule generated successfully!");
        // Optionally trigger a refresh of the main timetable view here
        // if (onScheduleGenerated) onScheduleGenerated();
    } catch (error) {
        console.error("Error generating optimal schedule:", error);
        toast.error(`Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setLoadingFeature(null);
    }
  };


  // --- Analyze Workload --- (Keep your existing API call logic)
  const handleAnalyzeWorkload = async () => {
    if (config.useMockData) { /* ... keep mock ... */ return; }
    setLoadingFeature('workload');
    try {
      const response = await aiApi.analyzeWorkload();
      // Use optional chaining and default value for safety
      showResponse('Workload Analysis', response?.analysis || 'No analysis available.', response?.recommendations || []);
      toast.success('Workload analysis complete!');
    } catch (error) {
        console.error("Error analyzing workload:", error);
        toast.error(`Failed to analyze workload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setLoadingFeature(null);
    }
  };

  // --- Suggest TA Assignments ---
  const handleSuggestTAAssignments = async () => {
    if (config.useMockData) { 
        setLoadingFeature('assign');
        setTimeout(() => {
            showResponse(
                'TA Assignment Suggestions',
                'Based on current workload, here are some suggested assignments to balance the load.',
                ['Assign Class A to TA 1', 'Assign Class B to TA 2']
            );
            setLoadingFeature(null);
            toast.success('Suggestions generated!');
        }, 1000);
        return; 
    }
    
    setLoadingFeature('assign');
    try {
      const response = await aiApi.suggestTaAssignments();
      showResponse('TA Assignment Suggestions', response.analysis, response.recommendations || []);
      toast.success('Suggestions generated!');
    } catch (error) {
        console.error("Error getting TA suggestions:", error);
        toast.error(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setLoadingFeature(null);
    }
  };

  // --- Generate Teaching Report --- (Keep your existing API call logic)
  const handleGenerateReport = async () => {
    if (config.useMockData) { /* ... keep mock ... */ return; }
    setLoadingFeature('report');
    try {
      const response = await aiApi.generateTeachingReport();
       // Use optional chaining and default value for safety
      showResponse('Teaching Report Summary', response?.report || 'No report available.', response?.recommendations || []);
      toast.success('Report generated!');
    } catch (error) {
        console.error("Error generating teaching report:", error);
        toast.error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            {/* Generate Optimal Schedule Button */}
            <Button
              onClick={() => setGenerateDialogOpen(true)}
              disabled={!!loadingFeature}
              className="w-full justify-start gap-3 h-12 text-base"
              variant="outline"
            >
              {loadingFeature === 'schedule' ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Calendar className="w-5 h-5 text-blue-600" />}
              Generate Optimal Schedule
            </Button>

            {/* Analyze Workload Button */}
            <Button onClick={handleAnalyzeWorkload} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'workload' ? <Loader2 className="w-5 h-5 animate-spin text-green-600" /> : <TrendingUp className="w-5 h-5 text-green-600" />}
              Analyze Workload
            </Button>

            {/* Suggest TA Assignments Button */}
            <Button onClick={handleSuggestTAAssignments} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'assign' ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <Zap className="w-5 h-5 text-purple-600" />}
              Suggest TA Assignments
            </Button>

            {/* Generate Teaching Report Button */}
            <Button onClick={handleGenerateReport} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'report' ? <Loader2 className="w-5 h-5 animate-spin text-orange-600" /> : <BookOpen className="w-5 h-5 text-orange-600" />}
              Generate Teaching Report
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
                <div className="whitespace-pre-line text-gray-700 leading-relaxed text-lg">
                  {aiResponse.content}
                </div>
                
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

      {/* ============================================ */}
      {/* ✅ --- Render the Generate Schedule Dialog --- */}
      {/* ============================================ */}
      <GenerateScheduleDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        tas={tas} // Pass the list of TAs
        onGenerate={handleGenerateOptimalSchedule} // Pass the submit handler (renamed)
        facultyUserName={facultyUserName} // Pass faculty name
      />

    </div>
  );
}