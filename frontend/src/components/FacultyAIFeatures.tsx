import { useState } from 'react';
// Assuming interfaces are defined/imported correctly
export interface FacultyTimetableEntry { id: number | string; subject: string; startTime: string; endTime: string; location: string; dayOfWeek: number; assignee: string; assigneeName?: string; assigneeUserId?: number; color?: string; }
export interface TA { id: number | string; name: string; email: string; role?: string; subjects?: string[]; color?: string; password?: string; }

import { Button } from './ui/button';
import { Card } from './ui/card';
// Corrected icon imports based on your original file
import { Sparkles, Calendar, TrendingUp, Zap, Loader2, BookOpen, Users, Brain } from 'lucide-react'; // Added Brain back
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
  const [dialogOpen, setDialogOpen] = useState(false); // For general AI responses (Analyze/Report)
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  // ============================================
  // ✅ --- State for Generate Schedule Dialog ---
  // ============================================
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Helper to show AI response in dialog
  const showResponse = (title: string, content: string, suggestions: string[] = []) => {
      setAiResponse({ title, content, suggestions });
      setDialogOpen(true);
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

  // --- Suggest TA Assignments --- (Keep your existing API call logic/placeholder)
  const handleSuggestTAAssignments = async () => {
    if (config.useMockData) { /* ... keep mock ... */ return; }
    // Keep placeholder or implement API call
    toast.info("Suggest TA Assignments feature needs backend implementation.");
    // setLoadingFeature('assign'); try { ... } catch { ... } finally { ... }
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Generate Optimal Schedule Button */}
        <Button
          // ============================================
          // ✅ --- onClick opens the dialog ---
          // ============================================
          onClick={() => setGenerateDialogOpen(true)}
          disabled={!!loadingFeature}
          className="w-full justify-start gap-2 h-auto py-4"
          variant="outline"
        >
          <div className="flex items-start gap-3 w-full">
            {loadingFeature === 'schedule' ? <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" /> : <Calendar className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />}
            <div className="text-left">
              <div className="font-medium">Generate Optimal Schedule</div>
              <div className="text-xs text-gray-500 font-normal"> AI-powered schedule optimization </div>
            </div>
          </div>
        </Button>

        {/* Analyze Workload Button */}
        <Button onClick={handleAnalyzeWorkload} disabled={!!loadingFeature} className="w-full justify-start gap-2 h-auto py-4" variant="outline">
          <div className="flex items-start gap-3 w-full">
            {loadingFeature === 'workload' ? <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" /> : <TrendingUp className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />}
            <div className="text-left"> <div className="font-medium">Analyze Workload</div> <div className="text-xs text-gray-500 font-normal"> Review teaching load distribution </div> </div>
          </div>
        </Button>

        {/* Suggest TA Assignments Button */}
        <Button onClick={handleSuggestTAAssignments} disabled={!!loadingFeature} className="w-full justify-start gap-2 h-auto py-4" variant="outline">
          <div className="flex items-start gap-3 w-full">
            {loadingFeature === 'assign' ? <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" /> : <Zap className="w-5 h-5 shrink-0 mt-0.5 text-purple-600" />}
            <div className="text-left"> <div className="font-medium">Suggest TA Assignments</div> <div className="text-xs text-gray-500 font-normal"> Smart TA-to-class matching </div> </div>
          </div>
        </Button>

        {/* Generate Teaching Report Button */}
        <Button onClick={handleGenerateReport} disabled={!!loadingFeature} className="w-full justify-start gap-2 h-auto py-4" variant="outline">
          <div className="flex items-start gap-3 w-full">
            {loadingFeature === 'report' ? <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" /> : <BookOpen className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />}
            <div className="text-left"> <div className="font-medium">Generate Teaching Report</div> <div className="text-xs text-gray-500 font-normal"> Comprehensive weekly summary </div> </div>
          </div>
        </Button>
      </div>

      {/* AI Powered Insights Card */}
      <Card className="p-4 bg-purple-50 border-purple-200 mt-4">
        {/* ... Keep original Card content ... */}
        <div className="flex items-start gap-3"> <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" /> <div> <p className="text-sm text-purple-900 mb-1"> AI-Powered Schedule Management </p> <p className="text-xs text-purple-700"> Our AI analyzes your teaching patterns... </p> </div> </div>
      </Card>


      {/* AI Response Dialog (For Analyze/Report/Suggest) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* ... Keep original Dialog content ... */}
        <DialogContent className="sm:max-w-[600px]"> <DialogHeader> <DialogTitle className="flex items-center gap-2"> <Sparkles className="w-5 h-5 text-purple-600" /> {aiResponse?.title || 'AI Response'} </DialogTitle> <DialogDescription className="pt-4 text-base whitespace-pre-line"> {aiResponse?.content || 'Loading...'} </DialogDescription> </DialogHeader> {aiResponse?.suggestions && aiResponse.suggestions.length > 0 && ( <div className="space-y-3 pt-4 border-t border-gray-200 mt-4"> <h4 className="font-medium">Recommendations:</h4> <ul className="space-y-2"> {aiResponse.suggestions.map((suggestion, index) => ( <li key={index} className="flex items-start gap-2 text-sm text-gray-700"> <span className="text-purple-600 mt-1">•</span> <span>{suggestion}</span> </li> ))} </ul> </div> )} </DialogContent>
      </Dialog>

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