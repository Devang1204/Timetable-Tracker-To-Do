// Timetable API calls matching backend routes

// Ensure 'del' is imported along with others
import { get, post, put, del, apiRequest } from './api';
import { getAuthToken } from './auth';

// Timetable endpoints - includes faculty-specific ones now
const TIMETABLE_ENDPOINTS = {
  // Student/Generic
  BASE: '/api/timetable',
  ENTRY: (id: number | string) => `/api/timetable/${id}`, // Accept number or string
  UPLOAD: '/api/timetable/upload',

  // Faculty-specific endpoints
  FACULTY_BASE: '/api/faculty/timetable',
  FACULTY_ENTRY: (id: number | string) => `/api/faculty/timetable/${id}`, // Accept number or string (Used by PUT and DELETE)
  FACULTY_TAS: '/api/faculty/tas', // GET TAs
  FACULTY_DELETE_TA: (id: number | string) => `/api/faculty/tas/${id}`, // DELETE TA
};

// Interface matching Backend Response for Timetable
export interface TimetableEntryFromBackend {
    id: number;
    user_id: number;
    role: string;
    subject: string;
    start_time: string; // ISO Timestamp string
    end_time: string;   // ISO Timestamp string
    location: string | null;
    is_recurring?: boolean; // Optional fields based on your table
    recurring_pattern?: string | null;
    recurring_end_date?: string | null;
}

// Interface for Frontend State/Display (e.g., in StudentDashboard)
export interface TimetableEntry {
  id?: number | string;
  subject: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  location?: string;
  dayOfWeek?: number; // 0=Monday, 1=Tuesday, etc.
  color?: string;
}

// Interface for Frontend State/Display (e.g., in FacultyDashboard)
export interface FacultyTimetableEntry {
  id: number | string; // Use number from backend, string for mock
  subject: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  location: string;
  dayOfWeek: number; // 0 = Monday, 1 = Tuesday, etc.
  assignee: string; // 'self' or TA user ID (use string ID for consistency)
  assigneeName?: string;
  assigneeUserId?: number; // Store the actual user ID
  color?: string;
}


/**
 * Student & TA Timetable APIs
 * (Both use the same /api/timetable endpoint, backend filters by user token)
 */

// Fetches timetable for the logged-in user (Student or TA)
export async function getTimetable(): Promise<TimetableEntryFromBackend[]> {
  const token = getAuthToken();
  return get<TimetableEntryFromBackend[]>(TIMETABLE_ENDPOINTS.BASE, token || undefined);
}

// Adds a timetable entry for the logged-in user (Student or TA)
export async function addTimetableEntry(classData: any): Promise<TimetableEntryFromBackend> {
  const token = getAuthToken();
  // Ensure classData matches backend POST /api/timetable expectations
  return post<TimetableEntryFromBackend>(TIMETABLE_ENDPOINTS.BASE, classData, token || undefined);
}

// Updates a timetable entry owned by the logged-in user (Student or TA)
export async function updateTimetableEntry(id: number | string, classData: any): Promise<TimetableEntryFromBackend> {
  const token = getAuthToken();
  // Ensure classData matches backend PUT /api/timetable/:id expectations
  return put<TimetableEntryFromBackend>(TIMETABLE_ENDPOINTS.ENTRY(id), classData, token || undefined);
}

// Deletes a timetable entry owned by the logged-in user (Student or TA)
export async function deleteTimetableEntry(id: number | string): Promise<{ success: boolean, message: string }> {
  const token = getAuthToken();
  // Assuming backend DELETE /api/timetable/:id sends back { success: true, message: '...' }
   const response = await del<{ success: boolean, message: string }>(TIMETABLE_ENDPOINTS.ENTRY(id), token || undefined);
   if (!response || !response.success) {
       // Throw an error if the backend didn't confirm success
       throw new Error(response?.message || 'Failed to delete timetable entry.');
   }
   return response; // Return the success object
}

/**
 * Upload PDF Timetable (Student only?)
 */
export async function uploadTimetablePDF(file: File): Promise<{ success: boolean, message: string }> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('timetableFile', file); // Key must match backend multer setup

  // Use apiRequest directly for FormData to handle headers correctly
  const response = await apiRequest<{ success: boolean, message: string }>(TIMETABLE_ENDPOINTS.UPLOAD, {
    method: 'POST',
    body: formData,
    token: token || undefined, // Pass token directly to apiRequest
  });
  return response;
}


/**
 * Faculty Timetable APIs
 */

// Faculty uses the faculty-specific endpoint to get self + TA schedules
export async function getFacultyTimetable(): Promise<TimetableEntryFromBackend[]> {
  const token = getAuthToken();
  return get<TimetableEntryFromBackend[]>(TIMETABLE_ENDPOINTS.FACULTY_BASE, token || undefined);
}

// Faculty adds classes using POST /api/faculty/timetable
export async function addFacultyTimetableEntry(classData: any): Promise<TimetableEntryFromBackend> {
  const token = getAuthToken();
   // Ensure classData matches backend POST /api/faculty/timetable expectations
  return post<TimetableEntryFromBackend>(TIMETABLE_ENDPOINTS.FACULTY_BASE, classData, token || undefined);
}

// Faculty updates/assigns classes using PUT /api/faculty/timetable/:id
export async function updateFacultyTimetableEntry(id: number | string, classData: any): Promise<TimetableEntryFromBackend> {
  const token = getAuthToken();
   // Ensure classData matches backend PUT /api/faculty/timetable/:id expectations
  return put<TimetableEntryFromBackend>(TIMETABLE_ENDPOINTS.FACULTY_ENTRY(id), classData, token || undefined);
}

/**
 * Get list of all TAs (Faculty only)
 */
export async function getFacultyTAs(): Promise<Array<{ id: number; name: string; email: string; role: string; }>> {
  const token = getAuthToken();
  return get<Array<{ id: number; name: string; email: string; role: string; }>>(TIMETABLE_ENDPOINTS.FACULTY_TAS, token || undefined);
}

/**
 * Remove TA and Reassign Classes (Faculty Only)
 */
export async function removeTAAndReassign(taId: number | string): Promise<{ success: boolean, message: string }> {
  const token = getAuthToken();
  // Calls DELETE /api/faculty/tas/:id
  return del<{ success: boolean, message: string }>(TIMETABLE_ENDPOINTS.FACULTY_DELETE_TA(taId), token || undefined);
}

// ============================================
// ✅ --- ADDED Faculty Delete Timetable Function ---
// ============================================
/**
 * Delete Timetable Entry (Faculty Only - Broader Permissions)
 */
export async function deleteFacultyTimetableEntry(id: number | string): Promise<{ success: boolean, message: string }> {
  const token = getAuthToken();
  // Calls DELETE /api/faculty/timetable/:id
  return del<{ success: boolean, message: string }>(TIMETABLE_ENDPOINTS.FACULTY_ENTRY(id), token || undefined);
}
// ============================================