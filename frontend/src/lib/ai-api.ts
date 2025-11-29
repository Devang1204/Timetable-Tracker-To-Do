// AI Features API calls matching backend routes

import { get, post, del, apiRequest } from './api'; // Ensure all methods are imported
import { getAuthToken } from './auth';

// AI endpoints for different roles
const AI_ENDPOINTS = {
  // Student AI endpoints
  STUDENT_FEEDBACK: '/api/student/ai-feedback',
  STUDENT_STUDY_PLAN: '/api/student/generate-plan',
  
  // Faculty AI endpoints
  FACULTY_GENERATE_SCHEDULE: '/api/faculty/generate-schedule',
  FACULTY_ANALYZE_WORKLOAD: '/api/faculty/analyze-workload',
  FACULTY_TEACHING_REPORT: '/api/faculty/teaching-report',
  // ============================================
  // ✅ --- ADDED Suggest TA Assignments Route ---
  // ============================================
  FACULTY_SUGGEST_ASSIGNMENTS: '/api/faculty/suggest-ta-assignments',
  
  // TA AI endpoints
  TA_ANALYZE_SCHEDULE: '/api/ta/analyze-schedule',
  TA_PREPARATION_TIPS: '/api/ta/preparation-tips',
  TA_TIME_MANAGEMENT: '/api/ta/time-management',
  TA_CAREER_GUIDANCE: '/api/ta/career-guidance',
  
  // Generic AI endpoint (for motivation, etc.)
  GENERATE_TEXT: '/api/generate-text',
};

// Response Interfaces
interface FeedbackResponse {
  success: boolean;
  feedback: string;
  suggestions?: string[];
}
interface PlanResponse {
  success: boolean;
  plan: string | any; // Allow plan to be an object (structured) or string
}
interface TextResponse {
  text: string;
}
interface ScheduleResponse {
  success: boolean;
  schedule: unknown; // Or a more specific type
  message?: string;
}
interface AnalysisResponse {
  success: boolean;
  analysis: string;
  recommendations?: string[];
}
interface ReportResponse {
  success: boolean;
  report: string;
  recommendations?: string[];
}
// Interface for the new suggestion response
interface SuggestionResponse {
    success: boolean;
    analysis: string; // The main text response
    recommendations?: string[]; // The list of suggestions
}


/**
 * Student AI Features
 */

export async function getStudyFeedback(): Promise<FeedbackResponse> {
  const token = getAuthToken();
  // Backend route expects no body for feedback
  return post<FeedbackResponse>(AI_ENDPOINTS.STUDENT_FEEDBACK, {}, token || undefined);
}

export async function generateStudyPlan(input: string | { goal: string; duration: string; topics?: string }): Promise<PlanResponse> {
  const token = getAuthToken();
  const body = typeof input === 'string' ? { prompt: input } : input;
  return post<PlanResponse>(AI_ENDPOINTS.STUDENT_STUDY_PLAN, body, token || undefined);
}

/**
 * Faculty AI Features
 */

export async function generateOptimalSchedule(data: {
  subjects: string[];
  assigneeUserId: number;
  [key: string]: unknown;
}): Promise<ScheduleResponse> {
  const token = getAuthToken();
  return post<ScheduleResponse>(AI_ENDPOINTS.FACULTY_GENERATE_SCHEDULE, data, token || undefined);
}

export async function analyzeWorkload(): Promise<AnalysisResponse> {
  const token = getAuthToken();
  // Backend route expects no body, just token
  return post<AnalysisResponse>(AI_ENDPOINTS.FACULTY_ANALYZE_WORKLOAD, {}, token || undefined);
}

export async function generateTeachingReport(): Promise<ReportResponse> {
  const token = getAuthToken();
  // Backend route expects no body, just token
  return post<ReportResponse>(AI_ENDPOINTS.FACULTY_TEACHING_REPORT, {}, token || undefined);
}

// ============================================
// ✅ --- ADDED Suggest TA Assignments Function ---
// ============================================
export async function suggestTaAssignments(): Promise<SuggestionResponse> {
    const token = getAuthToken();
    // Backend route expects no body, just token
    return post<SuggestionResponse>(AI_ENDPOINTS.FACULTY_SUGGEST_ASSIGNMENTS, {}, token || undefined);
}
// ============================================


/**
 * TA AI Features
 */

export async function analyzeTASchedule(): Promise<AnalysisResponse> {
  const token = getAuthToken();
  return post<AnalysisResponse>(AI_ENDPOINTS.TA_ANALYZE_SCHEDULE, {}, token || undefined);
}

export async function getTAPreparationTips(): Promise<AnalysisResponse> {
  const token = getAuthToken();
  return post<AnalysisResponse>(AI_ENDPOINTS.TA_PREPARATION_TIPS, {}, token || undefined);
}

export async function getTATimeManagement(): Promise<AnalysisResponse> {
  const token = getAuthToken();
  return post<AnalysisResponse>(AI_ENDPOINTS.TA_TIME_MANAGEMENT, {}, token || undefined);
}

export async function getTACareerGuidance(): Promise<AnalysisResponse> {
  const token = getAuthToken();
  return post<AnalysisResponse>(AI_ENDPOINTS.TA_CAREER_GUIDANCE, {}, token || undefined);
}

/**
 * Generic AI Features (All users)
 */

export async function generateText(prompt: string): Promise<TextResponse> {
  // This route might not require auth, check server.js
  const token = getAuthToken(); // Send token if available, backend might not use it
  return post<TextResponse>(AI_ENDPOINTS.GENERATE_TEXT, { prompt }, token || undefined);
}