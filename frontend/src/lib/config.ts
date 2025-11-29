// Configuration file for backend integration

/**
 * Backend API Configuration
 */

export const config = {
  // Backend API Base URL
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000',
  
  // API Timeout (in milliseconds)
  apiTimeout: 30000,
  
  // Enable/Disable Mock Data (set to false when backend is ready)
  useMockData: false,
  
  // Token expiry time (in milliseconds)
  tokenExpiryTime: 24 * 60 * 60 * 1000, // 24 hours

  // VAPID Public Key for Push Notifications
  vapidPublicKey: 'BMI3GvErjnQvTO9jEj_-LqiHfijBA9vML-0ROSQWRZaTVyS1_CLilFvjH0iRDjRkhg8Az2JxVmqHE6pMWSYeW8Y',
};

/**
 * Complete API Routes Reference
 * Based on backend team's specifications
 */
export const API_ROUTES = {
  // Base URL
  BASE_URL: 'http://localhost:5000',
  
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',           // POST - { email, password }
    REGISTER: '/api/auth/register',     // POST - { name, email, password, role }
  },
  
  // Timetable (Student & TA use same endpoints)
  TIMETABLE: {
    GET_ALL: '/api/timetable',          // GET - Returns all classes for user
    CREATE: '/api/timetable',           // POST - Add new class
    UPDATE: '/api/timetable/:id',       // PUT - Update class
    DELETE: '/api/timetable/:id',       // DELETE - Remove class
    UPLOAD_PDF: '/api/timetable/upload', // POST (form-data) - Upload PDF timetable
  },
  
  // Faculty-specific routes
  FACULTY: {
    GET_TAS: '/api/faculty/tas',                    // GET - List all TAs
    CREATE_CLASS: '/api/faculty/timetable',         // POST - Add class for faculty/TA
    UPDATE_CLASS: '/api/faculty/timetable/:id',     // PUT - Update/assign class
    
    AI: {
      GENERATE_SCHEDULE: '/api/faculty/generate-schedule',  // POST
      ANALYZE_WORKLOAD: '/api/faculty/analyze-workload',    // POST
      TEACHING_REPORT: '/api/faculty/teaching-report',      // POST
    },
  },
  
  // TA-specific routes
  TA: {
    AVAILABILITY: {
      GET_ALL: '/api/ta/availability',      // GET - Get unavailable times
      CREATE: '/api/ta/availability',       // POST - Add unavailable time
      DELETE: '/api/ta/availability/:id',   // DELETE - Remove unavailable time
    },
    
    AI: {
      ANALYZE_SCHEDULE: '/api/ta/analyze-schedule', // POST
    },
  },
  
  // Todos (Student)
  TODO: {
    GET_ALL: '/api/todos',      // GET - Get all todos
    CREATE: '/api/todos',       // POST - { task, due_date }
    UPDATE: '/api/todos/:id',   // PUT - Update todo
    DELETE: '/api/todos/:id',   // DELETE - Remove todo
  },
  
  // Student AI
  STUDENT_AI: {
    GET_FEEDBACK: '/api/student/ai-feedback',      // POST - { prompt }
    GENERATE_PLAN: '/api/student/generate-plan',   // POST - { prompt }
  },
  
  // Generic AI (All users)
  AI: {
    GENERATE_SUMMARY: '/api/generate-summary',     // POST - { prompt }
  },
};

/**
 * Request/Response Format Documentation
 */
export const API_DOCS = {
  /**
   * LOGIN
   * POST /api/auth/login
   * Request: { email: string, password: string }
   * Response: { user: { id, name, email, role }, token: string }
   */
  
  /**
   * REGISTER
   * POST /api/auth/register
   * Request: { name: string, email: string, password: string, role: 'student'|'faculty'|'ta' }
   * Response: { user: { id, name, email, role }, token: string }
   */
  
  /**
   * GET TIMETABLE
   * GET /api/timetable
   * Headers: { Authorization: 'Bearer <token>' }
   * Response: Array of { id, subject, start_time, end_time, location, day_of_week, ... }
   */
  
  /**
   * ADD TODO
   * POST /api/todos
   * Headers: { Authorization: 'Bearer <token>' }
   * Request: { task: string, due_date: string }
   * Response: { id, task, due_date, completed, ... }
   */
};
