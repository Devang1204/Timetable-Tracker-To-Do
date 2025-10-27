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
  
  // Generic AI endpoint (for motivation, etc.)
  GENERATE_SUMMARY: '/api/generate-summary',
};

// Response Interfaces
interface FeedbackResponse {
  success: boolean;
  feedback: string;
  suggestions?: string[];
}
interface PlanResponse {
  success: boolean;
  plan: string;
}
interface SummaryResponse {
  summary: string;
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

export async function generateStudyPlan(prompt: string): Promise<PlanResponse> {
  const token = getAuthToken();
  return post<PlanResponse>(AI_ENDPOINTS.STUDENT_STUDY_PLAN, { prompt }, token || undefined);
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

export async function analyzeTASchedule(): Promise<AnalysisResponse> { // Assuming it returns AnalysisResponse
  const token = getAuthToken();
  // Backend route expects no body, just token
  return post<AnalysisResponse>(AI_ENDPOINTS.TA_ANALYZE_SCHEDULE, {}, token || undefined);
}

/**
 * Generic AI Features (All users)
 */

export async function generateSummary(prompt: string): Promise<SummaryResponse> {
  // This route might not require auth, check server.js
  const token = getAuthToken(); // Send token if available, backend might not use it
  return post<SummaryResponse>(AI_ENDPOINTS.GENERATE_SUMMARY, { prompt }, token || undefined);
}