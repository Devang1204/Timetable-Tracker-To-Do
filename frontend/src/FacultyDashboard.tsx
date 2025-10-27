import { useState, useEffect } from 'react';
import { FacultyTimetableView } from './components/FacultyTimetableView';
import { TAManagement } from './components/TAManagement';
import { FacultyAIFeatures } from './components/FacultyAIFeatures';
import { FacultyOverview } from './components/FacultyOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Users, LayoutDashboard, Calendar, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// --- Import API functions ---
// Assuming removeTAAndReassign & deleteFacultyTimetableEntry are in timetableApi
import * as timetableApi from './lib/timetable-api';
import * as authApi from './lib/auth';
import { config } from './lib/config';

// Interface matching Backend Response for Faculty/TA Timetable
export interface TimetableEntryFromBackend {
    id: number;
    user_id: number;
    role: string;
    subject: string;
    start_time: string; // ISO Timestamp string
    end_time: string;   // ISO Timestamp string
    location: string | null;
    is_recurring?: boolean;
    recurring_pattern?: string | null;
    recurring_end_date?: string | null;
}

// Interface for Frontend State/Display (FacultyTimetableEntry)
export interface FacultyTimetableEntry {
  id: number | string;
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

// Interface for TA data (Backend returns User data)
export interface TA {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  subjects?: string[]; // Frontend concept
  color?: string; // Frontend concept
  password?: string; // For adding TA form
}

// --- Color Logic ---
const subjectColorMap: { [key: string]: string } = {
    'IT Workshop': '#f63bb5ff', 'Digital Electronics': '#8b5cf6', 'Internet of Things': '#10b981',
    'Environmental Studies': '#f59e0b', 'Linear Algebra': '#ec4899', 'Problem Solving with C': '#ef4444',
    'Calculus': '#06b6d4', 'International Language': '#64748b', 'Entrepreneurship': '#eab308',
    'Physics': '#8b5cf6', 'Mathematics': '#3b82f6', 'Chemistry': '#f59e0b', 'IT': '#3b82f6',
    'Statistics': '#10b981', 'Advanced Mathematics': '#3b82f6', 'C PROGRAM': '#ef4444', 'LANA': '#ec4899', 'ENGLISH':'#06b6d4'
    // Add more subjects as needed
};
const taColorMap: { [key: number | string]: string } = {};
const defaultTaColor = '#64748b'; // Slate
const defaultClassColor = '#89f63bff'; // Blue
const availableTaColors = ['#10b981', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#eab308']; // Green, Orange, Pink, Red, Cyan, Yellow
let taColorIndex = 0;

const getColorForSubject = (subject: string | undefined): string => {
    if (!subject) return defaultClassColor;
    const foundKey = Object.keys(subjectColorMap).find(key => subject.toLowerCase().includes(key.toLowerCase()));
    return foundKey ? subjectColorMap[foundKey] : defaultClassColor;
};
const getOrAssignTAColor = (taId: number | string): string => {
    if (!taColorMap[taId]) {
        taColorMap[taId] = availableTaColors[taColorIndex % availableTaColors.length];
        taColorIndex++;
    }
    return taColorMap[taId] || defaultTaColor;
};

// --- Formatting Helper ---
const formatFacultyTimetableEntry = (entry: TimetableEntryFromBackend, facultyUserId: number | string | null, tasList: TA[]): FacultyTimetableEntry => {
    const startDate = entry.start_time ? new Date(entry.start_time) : null;
    const isSelf = facultyUserId !== null && String(entry.user_id) === String(facultyUserId);
    const assigneeTA = tasList.find(ta => String(ta.id) === String(entry.user_id));
    let color = defaultClassColor;
    if (isSelf) { color = getColorForSubject(entry.subject); }
    else if (assigneeTA) { color = getOrAssignTAColor(assigneeTA.id); }
    return {
      id: entry.id, subject: entry.subject,
      startTime: startDate ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      endTime: entry.end_time ? new Date(entry.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      location: entry.location || 'N/A', dayOfWeek: startDate ? (startDate.getDay() + 6) % 7 : 0,
      assignee: isSelf ? 'self' : String(entry.user_id), assigneeName: isSelf ? 'Me' : (assigneeTA?.name || `User ${entry.user_id}`),
      assigneeUserId: entry.user_id, color: color
    };
};

interface FacultyDashboardProps { onChangeRole: () => void; userName: string; }

export default function FacultyDashboard({ onChangeRole, userName }: FacultyDashboardProps) {
  const [timetable, setTimetable] = useState<FacultyTimetableEntry[]>([]);
  const [tas, setTAs] = useState<TA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [facultyUserId, setFacultyUserId] = useState<number | string | null>(null);

  // --- Fetch initial data ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      taColorIndex = 0; Object.keys(taColorMap).forEach(key => delete taColorMap[key]); // Reset colors

      if (config.useMockData) {
        console.warn("FacultyDashboard running in mock data mode.");
        // --- Mock Data --- (Keep your mock data here if needed)
        setIsLoading(false);
        return;
      }

      // --- Real Backend ---
      try {
          const currentUser = authApi.getCurrentUser();
          if (!currentUser || currentUser.role !== 'faculty') { await authApi.logout(); onChangeRole(); toast.error("Invalid session. Please log in again."); setIsLoading(false); return; }
          const currentFacultyId = currentUser.id; setFacultyUserId(currentFacultyId);

          console.log("FacultyDashboard: Fetching TAs...");
          const fetchedTAs = await timetableApi.getFacultyTAs(); console.log("FacultyDashboard: Fetched TAs:", fetchedTAs);
          const coloredTAs = (Array.isArray(fetchedTAs) ? fetchedTAs : []).map(ta => ({ ...ta, color: getOrAssignTAColor(ta.id) })); setTAs(coloredTAs);

          console.log("FacultyDashboard: Fetching Timetable...");
          const rawTimetable = await timetableApi.getFacultyTimetable(); console.log("FacultyDashboard: Fetched Raw Timetable:", rawTimetable);
          const formattedTimetable = (Array.isArray(rawTimetable) ? rawTimetable : []).map(entry => formatFacultyTimetableEntry(entry, currentFacultyId!, coloredTAs));
          console.log("FacultyDashboard: Formatted Timetable:", formattedTimetable); setTimetable(formattedTimetable);

        } catch (error) { console.error("Failed to load faculty dashboard data:", error); toast.error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`); setTimetable([]); setTAs([]);
        } finally { setIsLoading(false); }
    };
    loadData();
  }, [onChangeRole]); // Dependency array


  // --- Handlers ---
  const handleAddClass = async (classData: any) => {
    console.log("handleAddClass received from dialog:", classData);
    if (config.useMockData || facultyUserId === null) { console.warn("Skipping handleAddClass"); return; }
    try {
        const backendData = { subject: classData.subject, dayOfWeek: classData.dayOfWeek, startTime: classData.startTime, endTime: classData.endTime, location: classData.location || null, user_id: classData.user_id, role: classData.role, };
        console.log("Sending data to addFacultyTimetableEntry:", backendData);
        if (!backendData.subject || backendData.dayOfWeek === undefined || !backendData.startTime || !backendData.endTime || !backendData.user_id || !backendData.role) { toast.error("Missing required class details before sending to backend."); console.error("Validation failed before API call:", backendData); return; }
        const newClassFromBackend = await timetableApi.addFacultyTimetableEntry(backendData);
        console.log("Received new class from backend:", newClassFromBackend);
        if (newClassFromBackend && newClassFromBackend.id) {
            const formattedClass = formatFacultyTimetableEntry(newClassFromBackend, facultyUserId, tas);
            setTimetable(prev => [...prev, formattedClass]);
            toast.success("Class added successfully!");
        } else { throw new Error("Backend did not return the created class with an ID."); }
    } catch(error){ console.error("Failed to add faculty class:", error); toast.error(`Failed to add class: ${error instanceof Error ? error.message : 'Unknown error'}`); }
  };

  const handleUpdateClass = async (id: string | number, classData: any) => {
    console.log(`handleUpdateClass called for ID ${id} with:`, classData);
    if (config.useMockData || facultyUserId === null) { console.warn("Skipping handleUpdateClass"); return; }
     try {
         const backendData = { subject: classData.subject, dayOfWeek: classData.dayOfWeek, startTime: classData.startTime, endTime: classData.endTime, location: classData.location || null, user_id: classData.user_id, role: classData.role, };
         console.log(`Sending data to updateFacultyTimetableEntry (ID: ${id}):`, backendData);
         if (!backendData.subject || backendData.dayOfWeek === undefined || !backendData.startTime || !backendData.endTime || !backendData.user_id || !backendData.role) { toast.error("Missing required class details for update."); console.error("Update validation failed:", backendData); return; }
         const updatedClassFromBackend = await timetableApi.updateFacultyTimetableEntry(Number(id), backendData);
         console.log("Received updated class from backend:", updatedClassFromBackend);
         const formattedClass = formatFacultyTimetableEntry(updatedClassFromBackend, facultyUserId, tas);
         setTimetable(prev => prev.map(c => c.id === id ? formattedClass : c));
         toast.success("Class updated successfully!");
     } catch (error) { console.error("Failed to update faculty class:", error); toast.error(`Failed to update class: ${error instanceof Error ? error.message : 'Unknown error'}`); }
  };

  const handleDeleteClass = async (id: string | number) => {
    console.log(`handleDeleteClass called for ID: ${id}`);
    if (config.useMockData) { console.warn("Skipping handleDeleteClass"); setTimetable(prev => prev.filter(c => c.id !== id)); toast.success("Class deleted (mock)."); return; }
    try {
        console.log("Calling deleteFacultyTimetableEntry API...");
        // Use the faculty-specific delete which doesn't check ownership strictly
        const response = await timetableApi.deleteFacultyTimetableEntry(id); // Use FACULTY delete (if defined, otherwise use generic)
        // const response = await timetableApi.deleteTimetableEntry(Number(id)); // Or use generic delete

        console.log("Delete API Response:", response);
        // Assuming response format { success: boolean, message: string }
        if (response.success) {
            setTimetable(prev => prev.filter(c => c.id !== id));
            toast.success(response.message || "Class deleted successfully!");
            console.log(`Class ${id} removed from state.`);
        } else { throw new Error(response.message || "Backend reported failure during delete."); }
    } catch (error) { console.error("Failed to delete faculty class:", error); toast.error(`Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`); }
  };


  const handleAssignTA = async (taId: number | string, classId: number | string) => {
    console.log(`handleAssignTA called: TA ID ${taId}, Class ID ${classId}`);
    if (config.useMockData || facultyUserId === null) { console.warn("Skipping handleAssignTA"); return; }
    const classToUpdate = timetable.find(c => c.id === classId);
    const ta = tas.find(t => String(t.id) === String(taId));
    if (!classToUpdate || !ta) { console.error("Could not find class or TA for assignment."); toast.error("Could not find class or TA to assign."); return; }
    try {
         // Reformat existing class data for the PUT request - NEED dayOfWeek
         const backendData = {
            subject: classToUpdate.subject,
            // We need dayOfWeek, startTime, endTime in format backend expects for PUT
            dayOfWeek: classToUpdate.dayOfWeek, // Assuming this exists on classToUpdate
            startTime: classToUpdate.startTime, // Assuming HH:MM
            endTime: classToUpdate.endTime,     // Assuming HH:MM
            location: classToUpdate.location,
            user_id: Number(taId), // Assign to TA
            role: 'ta',            // Set role to TA
         };
         console.log(`Sending data to updateFacultyTimetableEntry for assignment (ID: ${classId}):`, backendData);
         const updatedClassFromBackend = await timetableApi.updateFacultyTimetableEntry(Number(classId), backendData);
         console.log("Received updated class from backend after assignment:", updatedClassFromBackend);
         const formattedClass = formatFacultyTimetableEntry(updatedClassFromBackend, facultyUserId, tas);
         setTimetable(prev => prev.map(c => c.id === classId ? formattedClass : c));
         toast.success(`Assigned ${classToUpdate.subject} to ${ta.name}`);
     } catch (error) { console.error("Failed to assign TA:", error); toast.error(`Failed to assign TA: ${error instanceof Error ? error.message : 'Unknown error'}`); }
  };

  const handleAddTA = async (taData: Omit<TA, 'id' | 'role' | 'color'> & { password?: string }) => {
    console.log("handleAddTA called with data:", taData);
    if (config.useMockData) { console.warn("Skipping handleAddTA"); return; }
    if (!taData.password) { toast.error("Password is required to add a TA."); console.error("handleAddTA failed: Password missing"); return; }
    try {
        const registrationData = { username: taData.name, email: taData.email, password: taData.password, role: 'ta' as const };
        console.log("Attempting to register TA via API with data:", registrationData);
        const response = await authApi.signUp(registrationData);
        console.log("Registration API response:", response);
        if (response && response.user) {
            const newTA: TA = { id: response.user.id, name: response.user.name, email: response.user.email, role: response.user.role, color: getOrAssignTAColor(response.user.id), subjects: taData.subjects || [] };
            setTAs(prev => [...prev, newTA]);
            toast.success(`TA ${newTA.name} added successfully!`);
            console.log("TA added to state:", newTA);
        } else { console.error("Registration response did not include user data.", response); throw new Error("Registration response did not include user data."); }
    } catch(error){
        console.error("Failed to add TA:", error);
        if (error instanceof Error && error.message.toLowerCase().includes('email address already in use')) { toast.error("Failed to add TA: Email address already exists."); }
        else { toast.error(`Failed to add TA: ${error instanceof Error ? error.message : 'Unknown error'}`); }
    }
  };

  const handleRemoveTA = async (taId: string | number) => {
    console.log(`handleRemoveTA called for ID: ${taId}`);
    if (config.useMockData) { /* ... keep mock ... */ return; }
    if (facultyUserId === null) { toast.error("Faculty user ID not available."); return; }
    try {
        console.log("Calling removeTAAndReassign API...");
        // Assuming removeTAAndReassign exists in timetableApi
        const response = await timetableApi.removeTAAndReassign(taId);
        console.log("Remove TA API response:", response);
        if (response.success) {
            const updatedTas = tas.filter(t => t.id !== taId);
            setTAs(updatedTas);
            console.log("Refetching timetable after TA removal...");
            const rawTimetable = await timetableApi.getFacultyTimetable();
            const formattedTimetable = (rawTimetable || []).map(entry => formatFacultyTimetableEntry(entry, facultyUserId!, updatedTas));
            setTimetable(formattedTimetable);
            toast.success(response.message || "TA removed and classes reassigned.");
            console.log(`TA ${taId} removed and timetable updated.`);
        } else { throw new Error(response.message || "Backend reported failure during TA removal."); }
    } catch (error) { console.error("Failed to remove TA:", error); toast.error(`Failed to remove TA: ${error instanceof Error ? error.message : 'Unknown error'}`); }
  };


  // Loading Indicator
  if (isLoading) {
    return (
       <div className="min-h-screen flex items-center justify-center"> <div className="text-center"> <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" /> <p className="text-gray-600">Loading Dashboard...</p> </div> </div>
     );
  }

  // --- Render the dashboard UI ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="bg-blue-600 rounded-lg p-2">
                         <Users className="w-6 h-6 text-white" /> {/* Faculty Icon */}
                     </div>
                     <div>
                         <h1>Faculty Dashboard</h1>
                         <p className="text-gray-600 text-sm">Welcome back, {userName}!</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-4">
                     {/* ============================================ */}
                     {/* ✅ --- Use Dynamic Date --- */}
                     {/* ============================================ */}
                     <span className="text-sm text-gray-600 hidden sm:inline">
                         {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </span>
                     {/* ============================================ */}
                     <Button variant="outline" size="sm" onClick={onChangeRole} className="gap-2"> <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span> </Button>
                 </div>
             </div>
         </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
             <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Overview</span></TabsTrigger>
             <TabsTrigger value="timetable" className="gap-2"><Calendar className="w-4 h-4" /> <span className="hidden sm:inline">Weekly Timetable</span></TabsTrigger>
             <TabsTrigger value="ta" className="gap-2"><Users className="w-4 h-4" /> <span className="hidden sm:inline">TA Management</span></TabsTrigger>
             <TabsTrigger value="ai" className="gap-2"><Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">AI Assistant</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
             {/* ============================================ */}
             {/* ✅ --- Pass userName to Overview --- */}
             {/* ============================================ */}
             <FacultyOverview timetable={timetable} tas={tas} />
             {/* Note: Overview doesn't *need* userName based on previous code */}
          </TabsContent>
          <TabsContent value="timetable" className="mt-0">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6"> <Calendar className="w-5 h-5 text-blue-600" /> <h2>Weekly Timetable</h2> </div>
                {/* ============================================ */}
                {/* ✅ --- Pass userName to TimetableView --- */}
                {/* ============================================ */}
                <FacultyTimetableView timetable={timetable} tas={tas} onAddClass={handleAddClass} onUpdateClass={handleUpdateClass} onDeleteClass={handleDeleteClass} userName={userName} />
             </div>
          </TabsContent>
          <TabsContent value="ta" className="mt-0">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6"> <Users className="w-5 h-5 text-green-600" /> <h2>TA Management</h2> </div>
                <TAManagement tas={tas} timetable={timetable} onAddTA={handleAddTA} onRemoveTA={handleRemoveTA} onAssignTA={handleAssignTA} />
             </div>
          </TabsContent>
          <TabsContent value="ai" className="mt-0">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6"> <Sparkles className="w-5 h-5 text-purple-600" /> <h2>AI Scheduling Assistant</h2> </div>
                 {/* ============================================ */}
                 {/* ✅ --- Pass userName to AIFeatures --- */}
                 {/* ============================================ */}
                <FacultyAIFeatures timetable={timetable} tas={tas} facultyUserName={userName}/>
             </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}