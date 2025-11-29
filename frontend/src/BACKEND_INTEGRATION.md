# Backend Integration Checklist

## 📋 Overview
This document provides step-by-step instructions for integrating your backend API with the Academic Management System frontend.

---

## 🚀 Quick Start

### Step 1: Provide Backend Routes to Frontend Team

Share these exact endpoint specifications with the frontend integration:

#### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/verify` - Verify JWT token

#### Student Timetable Endpoints
- `GET /api/timetable` - Get all classes for logged-in student
- `POST /api/timetable` - Add new class
- `PUT /api/timetable/:id` - Update class
- `DELETE /api/timetable/:id` - Delete class

#### Faculty Timetable Endpoints
- `GET /api/faculty/timetable` - Get all classes (Self + TAs)
- `POST /api/faculty/timetable` - Add new class
- `PUT /api/faculty/timetable/:id` - Update class
- `DELETE /api/faculty/timetable/:id` - Delete class

#### TA Schedule Endpoints
- `GET /timetable/ta` - Get assigned schedule
- `PUT /timetable/ta/:id` - Update schedule entry

#### Todo Endpoints
- `GET /todos` - Get all todos
- `POST /todos` - Create new todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo
- `POST /todos/:id/toggle` - Toggle completion status

#### TA Management Endpoints (Faculty only)
- `GET /tas` - Get all TAs
- `POST /tas` - Add new TA
- `PUT /tas/:id` - Update TA
- `DELETE /tas/:id` - Remove TA

#### TA Availability Endpoints
- `GET /tas/availability` - Get availability slots
- `POST /tas/availability` - Add availability slot
- `PUT /tas/availability/:id` - Update slot
- `DELETE /tas/availability/:id` - Delete slot

---

## 🔧 Frontend Configuration Steps

### Step 2: Update Backend URL

**Option A: Environment Variable (Recommended)**

Create a `.env` file in project root:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

For production:
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

**Option B: Direct Configuration**

Edit `/lib/api.ts`:
```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
```

### Step 3: Update Endpoint Paths (If Different)

If your backend uses different endpoint paths, update them in:

1. `/lib/auth.ts` - Update `AUTH_ENDPOINTS`
2. `/lib/timetable-api.ts` - Update `TIMETABLE_ENDPOINTS`
3. `/lib/todo-api.ts` - Update `TODO_ENDPOINTS`
4. `/lib/ta-api.ts` - Update `TA_ENDPOINTS`

### Step 4: Enable Backend Mode

Edit `/lib/config.ts`:
```typescript
export const config = {
  useMockData: false,  // Change from true to false
};
```

---

## 📤 Expected Request Formats

### Login Request
```json
POST /auth/login
{
  "email": "student@example.com",
  "password": "Password123"
}
```

### Signup Request
```json
POST /auth/signup
{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "student"
}
```

### Add Timetable Class Request
```json
POST /timetable/student
{
  "subject": "Mathematics",
  "startTime": "09:00",
  "endTime": "10:30",
  "location": "Room 301",
  "dayOfWeek": 0,
  "color": "#3b82f6"
}
```

### Add Todo Request
```json
POST /todos
{
  "description": "Complete assignment",
  "dueDate": "2025-10-30",
  "completed": false,
  "linkedClassId": "class123"
}
```

---

## 📥 Expected Response Formats

### Auth Response (Login/Signup)
```json
{
  "user": {
    "id": "user123",
    "username": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Timetable Entry Response
```json
{
  "id": "class123",
  "subject": "Mathematics",
  "startTime": "09:00",
  "endTime": "10:30",
  "location": "Room 301",
  "dayOfWeek": 0,
  "color": "#3b82f6"
}
```

### Todo Response
```json
{
  "id": "todo123",
  "description": "Complete assignment",
  "dueDate": "2025-10-30",
  "completed": false,
  "linkedClassId": "class123"
}
```

### Error Response
```json
{
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

## 🔐 Authentication Flow

1. **User signs up** → Frontend sends POST to `/auth/signup`
2. **Backend returns** → `{ user: {...}, token: "..." }`
3. **Frontend stores** → Token in `localStorage.authToken`
4. **All subsequent requests** → Include header: `Authorization: Bearer <token>`
5. **User logs out** → Frontend calls `/auth/logout` and clears localStorage

---

## 🛡️ Required Backend Features

### CORS Configuration
Backend must allow requests from frontend origin:
```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:5173', // or your frontend URL
  credentials: true
}));
```

### JWT Token Validation
All protected routes must:
1. Check for `Authorization` header
2. Verify token is valid
3. Extract user info from token
4. Return 401 if token is invalid/expired

### Request Headers
Backend should expect:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🧪 Testing Integration

### Phase 1: Test Authentication
1. ✅ Test signup with new user
2. ✅ Test login with created user
3. ✅ Verify token is returned
4. ✅ Test logout

### Phase 2: Test Data Operations
1. ✅ Test GET requests (fetch data)
2. ✅ Test POST requests (create data)
3. ✅ Test PUT requests (update data)
4. ✅ Test DELETE requests (remove data)

### Phase 3: Test Error Handling
1. ✅ Test with invalid credentials
2. ✅ Test with expired token
3. ✅ Test with missing required fields
4. ✅ Test network errors

---

## 📝 Files You Need to Modify

### Required Changes:
1. **`.env`** - Add `VITE_API_BASE_URL`
2. **`/lib/config.ts`** - Set `useMockData: false`

### Optional Changes (if endpoints differ):
3. `/lib/auth.ts` - Update endpoint paths
4. `/lib/timetable-api.ts` - Update endpoint paths
5. `/lib/todo-api.ts` - Update endpoint paths
6. `/lib/ta-api.ts` - Update endpoint paths

### Files You DON'T Need to Modify:
- `/lib/api.ts` - Generic fetch wrapper
- `/types/api.ts` - TypeScript types
- `/components/*` - UI components (will work automatically)
- `/App.tsx` - Main app logic

---

## 🔍 Debugging Tips

### Check Console for Errors
Open browser console (F12) to see:
- Network requests
- API responses
- Error messages

### Common Issues

**"CORS Error"**
- Solution: Backend needs CORS headers

**"401 Unauthorized"**
- Solution: Check token in Authorization header
- Verify token is not expired

**"Network Error / Failed to Fetch"**
- Solution: Check if backend is running
- Verify API URL is correct

**"404 Not Found"**
- Solution: Check endpoint paths match backend routes

---

## 📞 Communication with Backend Team

### Share with Backend Team:

1. **This document** (`BACKEND_INTEGRATION.md`)
2. **API Structure** (`/lib/config.ts` → `API_ROUTES`)
3. **Type Definitions** (`/types/api.ts`)
4. **Expected formats** (from this document)

### Ask Backend Team:

1. ✅ What is the backend URL?
2. ✅ Are the endpoint paths exactly as listed above?
3. ✅ What is the JWT expiry time?
4. ✅ Is CORS configured for frontend origin?
5. ✅ Are all required endpoints implemented?

---

## ✅ Integration Complete When:

- [ ] Backend URL is configured
- [ ] User can sign up successfully
- [ ] User can login successfully
- [ ] Token is stored and used in requests
- [ ] User can fetch their timetable
- [ ] User can add/edit/delete classes
- [ ] User can add/edit/delete todos
- [ ] Faculty can manage TAs
- [ ] TAs can set availability
- [ ] Logout clears session
- [ ] Error messages display correctly

---

## 📚 Additional Resources

- **API Documentation**: `/lib/README.md`
- **API Configuration**: `/lib/config.ts`
- **Type Definitions**: `/types/api.ts`
