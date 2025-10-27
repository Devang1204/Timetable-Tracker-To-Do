# Backend Integration Guide

This directory contains all API integration utilities for connecting to the backend.

## File Structure

```
lib/
├── api.ts              # Base API utility with fetch wrapper
├── auth.ts             # Authentication API calls
├── timetable-api.ts    # Timetable/Schedule API calls
├── todo-api.ts         # Todo/Task API calls
├── ta-api.ts           # TA Management & Availability API calls
├── config.ts           # Configuration and API routes documentation
└── README.md           # This file
```

## Setup Instructions

### 1. Configure Backend URL

Update the backend API URL in your environment or in `/lib/config.ts`:

**Option A: Using Environment Variables (Recommended)**
Create a `.env` file in your project root:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

**Option B: Direct Configuration**
Edit `/lib/config.ts` and update the `apiBaseUrl` value.

### 2. Update API Endpoints

In each API file (`auth.ts`, `timetable-api.ts`, etc.), update the endpoint paths to match your backend routes:

```typescript
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',        // Update this
  SIGNUP: '/auth/signup',      // Update this
  // ... etc
};
```

### 3. Enable Backend Integration

In `/lib/config.ts`, set `useMockData: false` when your backend is ready:

```typescript
export const config = {
  useMockData: false,  // Set to false to use real backend
};
```

## Usage Examples

### Authentication

```typescript
import { login, signUp, logout } from './lib/auth';

// Login
const response = await login({ email: 'user@example.com', password: 'password' });
// Returns: { user: {...}, token: '...' }

// Sign Up
const newUser = await signUp({ 
  username: 'John', 
  email: 'john@example.com', 
  password: 'password123',
  role: 'student' 
});

// Logout
await logout();
```

### Timetable Operations

```typescript
import { getStudentTimetable, addStudentClass } from './lib/timetable-api';

// Get timetable
const classes = await getStudentTimetable();

// Add new class
const newClass = await addStudentClass({
  subject: 'Math',
  startTime: '09:00',
  endTime: '10:30',
  location: 'Room 101',
  dayOfWeek: 0,
});
```

### Todo Operations

```typescript
import { getTodos, addTodo, toggleTodo } from './lib/todo-api';

// Get all todos
const todos = await getTodos();

// Add todo
const newTodo = await addTodo({
  description: 'Complete assignment',
  dueDate: '2025-10-25',
  completed: false,
});

// Toggle completion
await toggleTodo(todoId);
```

## Backend Requirements

Share this with your backend team:

### Required Response Formats

**1. Authentication Endpoints**

`POST /auth/login`
```json
Request: {
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "user": {
    "id": "user123",
    "username": "John Doe",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt_token_here"
}
```

`POST /auth/signup`
```json
Request: {
  "username": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "student"
}

Response: {
  "user": {
    "id": "user123",
    "username": "John Doe",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt_token_here"
}
```

### Required Headers

All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Error Response Format

```json
{
  "message": "Error description",
  "statusCode": 400,
  "errors": {
    "field": ["error message"]
  }
}
```

## Testing

### Test with Mock Data

Keep `useMockData: true` in config.ts while developing without backend.

### Test with Real Backend

1. Ensure backend is running
2. Update `VITE_API_BASE_URL` in .env
3. Set `useMockData: false` in config.ts
4. Test authentication flow first
5. Test each feature (timetable, todos, TA management)

## Common Issues

**CORS Errors**
- Backend must allow requests from your frontend origin
- Backend should include CORS headers

**401 Unauthorized**
- Check if token is being sent in Authorization header
- Verify token is not expired
- Check if backend is validating token correctly

**Network Errors**
- Verify backend URL is correct
- Ensure backend server is running
- Check network/firewall settings

## API Route Reference

See `/lib/config.ts` → `API_ROUTES` for complete list of endpoints.
