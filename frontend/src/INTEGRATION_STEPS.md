# Backend Integration Steps

## ✅ Setup Complete!

All API integration files have been created and configured to match your backend team's specifications.

---

## 🚀 Quick Start Guide

### **Current Mode: MOCK DATA (Testing Mode)**

The application is currently in **mock data mode** for testing without a backend. To switch to real backend integration:

### **Step 1: Start Your Backend Server**

Make sure your backend is running on:
```
http://localhost:5000
```

### **Step 2: Enable Backend Mode**

Edit `/lib/config.ts` and change:

```typescript
export const config = {
  useMockData: false,  // ← Change this from true to false
};
```

### **Step 3: Test the Integration**

1. **Sign Up** - Create a new account
2. **Login** - Log in with your credentials
3. **Test Features** - Try adding classes, todos, etc.

---

## 📁 Files Already Configured

✅ `/lib/api.ts` - Base URL set to `http://localhost:5000`  
✅ `/lib/auth.ts` - Login & Register endpoints configured  
✅ `/lib/timetable-api.ts` - All timetable endpoints configured  
✅ `/lib/todo-api.ts` - Todo endpoints configured  
✅ `/lib/ta-api.ts` - TA availability endpoints configured  
✅ `/lib/ai-api.ts` - All AI endpoints configured  
✅ `/lib/config.ts` - Complete API routes reference  
✅ `/types/api.ts` - TypeScript types updated  
✅ `/App.tsx` - Handles both mock and backend modes  
✅ `/components/Login.tsx` - Uses API layer  
✅ `/components/SignUp.tsx` - Uses API layer  

---

## 🔑 API Endpoints Reference

### **Authentication**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Sign up

### **Student Routes**
- `GET /api/timetable` - Get classes
- `POST /api/timetable` - Add class
- `PUT /api/timetable/:id` - Update class
- `DELETE /api/timetable/:id` - Delete class
- `POST /api/timetable/upload` - Upload PDF (form-data)
- `GET /api/todos` - Get todos
- `POST /api/todos` - Add todo
- `POST /api/student/ai-feedback` - AI study feedback
- `POST /api/student/generate-plan` - AI study plan

### **Faculty Routes**
- `GET /api/timetable` - Get faculty schedule
- `GET /api/faculty/tas` - Get all TAs
- `POST /api/faculty/timetable` - Add class for faculty/TA
- `PUT /api/faculty/timetable/:id` - Update/assign class
- `POST /api/faculty/generate-schedule` - AI schedule optimization
- `POST /api/faculty/analyze-workload` - AI workload analysis
- `POST /api/faculty/teaching-report` - AI teaching report

### **TA Routes**
- `GET /api/timetable` - Get TA schedule
- `GET /api/ta/availability` - Get unavailable times
- `POST /api/ta/availability` - Add unavailable time
- `DELETE /api/ta/availability/:id` - Remove unavailable time
- `POST /api/ta/analyze-schedule` - AI schedule analysis

### **Generic AI**
- `POST /api/generate-summary` - AI motivation/generic prompts

---

## 🧪 Testing Checklist

### **Phase 1: Authentication** (Current Priority)
- [ ] Backend server running on `http://localhost:5000`
- [ ] Set `useMockData: false` in `/lib/config.ts`
- [ ] Test sign up with new account
- [ ] Test login with created account
- [ ] Verify token is saved
- [ ] Test logout

### **Phase 2: Student Features**
- [ ] Fetch timetable
- [ ] Add new class
- [ ] Edit class
- [ ] Delete class
- [ ] Upload PDF timetable
- [ ] Add todo
- [ ] Delete todo
- [ ] Test AI features

### **Phase 3: Faculty Features**
- [ ] Get faculty schedule
- [ ] Get list of TAs
- [ ] Add class
- [ ] Assign class to TA
- [ ] Test AI features

### **Phase 4: TA Features**
- [ ] Get TA schedule
- [ ] Set availability
- [ ] Delete availability
- [ ] Test AI features

---

## 🔧 Troubleshooting

### **Problem: "CORS Error"**
**Solution:** Backend needs to allow requests from `http://localhost:5173` (or your frontend URL)

Backend should have CORS configuration like:
```javascript
// Express.js example
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### **Problem: "401 Unauthorized"**
**Solution:** 
- Check if token is being sent in Authorization header
- Verify backend is validating the token correctly
- Token format: `Authorization: Bearer <token>`

### **Problem: "Network Error"**
**Solution:**
- Verify backend is running on `http://localhost:5000`
- Check backend console for errors
- Verify endpoint paths match

### **Problem: "404 Not Found"**
**Solution:**
- Check endpoint paths in backend match exactly
- Example: `/api/auth/login` not `/auth/login`

---

## 📝 How It Works

### **Mock Mode** (`useMockData: true`)
- Uses `localStorage` for data
- No backend required
- Perfect for testing UI

### **Backend Mode** (`useMockData: false`)
- All requests go to `http://localhost:5000`
- JWT token stored in `localStorage.authToken`
- Every authenticated request includes `Authorization: Bearer <token>`

---

## 🔐 Authentication Flow

1. User fills signup/login form
2. Frontend sends POST to `/api/auth/register` or `/api/auth/login`
3. Backend returns: `{ user: {...}, token: "..." }`
4. Frontend saves token in `localStorage.authToken`
5. All subsequent API calls include header: `Authorization: Bearer <token>`
6. Backend validates token and returns data

---

## 💡 Next Steps

### **For Testing Without Backend:**
Keep `useMockData: true` and test the UI

### **For Backend Integration:**
1. Confirm backend is running
2. Set `useMockData: false`
3. Test authentication first
4. Then test other features

### **For Production:**
1. Create `.env` file with production backend URL:
   ```
   VITE_API_BASE_URL=https://your-backend.com
   ```
2. Set `useMockData: false`
3. Deploy frontend

---

## 📞 Need Help?

- Backend routes reference: `/lib/config.ts` → `API_ROUTES`
- API types: `/types/api.ts`
- API documentation: `/lib/README.md`

---

## ✨ Ready to Test!

Once your backend team confirms the server is running:

1. Set `useMockData: false` in `/lib/config.ts`
2. Refresh your app
3. Try signing up!

All API calls will automatically use the backend. 🚀
