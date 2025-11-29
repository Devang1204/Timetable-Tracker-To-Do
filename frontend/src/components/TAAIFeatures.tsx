import { useState } from 'react';
import { TAScheduleEntry, AvailabilitySlot } from '../TADashboard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sparkles, Calendar, BookOpen, TrendingUp, Loader2, Clock, Brain, X, Bot } from 'lucide-react';
import { toast } from 'sonner';
import * as aiApi from '../lib/ai-api';
import { config } from '../lib/config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

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
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false); // Keep dialog for consistency if needed, but we are moving to side panel

  const handleScheduleAnalysis = async () => {
    if (config.useMockData) {
        setLoadingFeature('schedule');
        setTimeout(() => {
            setAiResponse({
                title: 'Schedule Analysis',
                content: "Mock Analysis: Your schedule is balanced.",
                suggestions: ["Mock Tip 1", "Mock Tip 2"]
            });
            setLoadingFeature(null);
        }, 1000);
        return;
    }

    setLoadingFeature('schedule');
    try {
        const response = await aiApi.analyzeTASchedule();
        setAiResponse({
            title: 'Schedule Analysis',
            content: response.analysis,
            suggestions: response.recommendations
        });
        toast.success('Analysis complete!');
    } catch (error) {
        console.error("Error analyzing schedule:", error);
        toast.error("Failed to analyze schedule.");
    } finally {
        setLoadingFeature(null);
    }
  };

  const handlePreparationTips = async () => {
    if (config.useMockData) { /* mock */ return; }
    setLoadingFeature('prep');
    try {
        const response = await aiApi.getTAPreparationTips();
        setAiResponse({
            title: 'Session Preparation Tips',
            content: response.analysis,
            suggestions: response.recommendations
        });
        toast.success('Tips generated!');
    } catch (error) {
        console.error("Error getting tips:", error);
        toast.error("Failed to get preparation tips.");
    } finally {
        setLoadingFeature(null);
    }
  };

  const handleTimeManagement = async () => {
    if (config.useMockData) { /* mock */ return; }
    setLoadingFeature('time');
    try {
        const response = await aiApi.getTATimeManagement();
        setAiResponse({
            title: 'Time Management Insights',
            content: response.analysis,
            suggestions: response.recommendations
        });
        toast.success('Insights generated!');
    } catch (error) {
        console.error("Error getting time management:", error);
        toast.error("Failed to get insights.");
    } finally {
        setLoadingFeature(null);
    }
  };

  const handleCareerGuidance = async () => {
    if (config.useMockData) { /* mock */ return; }
    setLoadingFeature('career');
    try {
        const response = await aiApi.getTACareerGuidance();
        setAiResponse({
            title: 'TA Career Development',
            content: response.analysis,
            suggestions: response.recommendations
        });
        toast.success('Guidance generated!');
    } catch (error) {
        console.error("Error getting career guidance:", error);
        toast.error("Failed to get guidance.");
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
            <Button onClick={handleScheduleAnalysis} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'schedule' ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Calendar className="w-5 h-5 text-blue-600" />}
              Analyze Schedule
            </Button>

            <Button onClick={handlePreparationTips} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'prep' ? <Loader2 className="w-5 h-5 animate-spin text-green-600" /> : <BookOpen className="w-5 h-5 text-green-600" />}
              Preparation Tips
            </Button>

            <Button onClick={handleTimeManagement} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'time' ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <Clock className="w-5 h-5 text-purple-600" />}
              Time Management
            </Button>

            <Button onClick={handleCareerGuidance} disabled={!!loadingFeature} className="w-full justify-start gap-3 h-12 text-base" variant="outline">
              {loadingFeature === 'career' ? <Loader2 className="w-5 h-5 animate-spin text-orange-600" /> : <TrendingUp className="w-5 h-5 text-orange-600" />}
              Career Guidance
            </Button>
          </div>
        </Card>

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
    </div>
  );
}

