import { useState, useEffect } from 'react';
import { TimetableView } from './components/TimetableView';
import { TodoList } from './components/TodoList';
import { AIFeatures } from './components/AIFeatures';
import { Overview } from './components/Overview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { GraduationCap, LayoutDashboard, Calendar, ListTodo, Sparkles, LogOut, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import * as timetableApi from './lib/timetable-api';
import * as todoApi from './lib/todo-api';
import { config } from './lib/config';
import { getAuthToken } from './lib/auth';

// Interface for Frontend State/Display
export interface TimetableEntry {
  id?: number | string;
  subject: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  location?: string;
  dayOfWeek?: number; // 0=Monday, 1=Tuesday, etc.
  color?: string;
}

// Interface matching Backend Response Structure
export interface TimetableEntryFromBackend {
    id: number;
    user_id: number;
    role: string;
    subject: string;
    start_time: string; // ISO Timestamp string
    end_time: string;   // ISO Timestamp string
    location: string | null;
    is_recurring: boolean;
    recurring_pattern: string | null;
    recurring_end_date: string | null;
}

export interface TodoItem {
  id?: number | string;
  task: string;
  due_date: string;
  completed?: boolean;
  linkedClassId?: string;
  // Add description and dueDate for consistency if needed by components
  description?: string;
  dueDate?: string;
}

// Interface matching Backend Response Structure
export interface TodoItemFromBackend {
    id: number;
    user_id: number;
    task: string;
    due_date: string; // ISO Timestamp string
    timetable_id: number | null;
    status: string; // e.g., 'pending'
    created_at?: string; // Optional based on backend
}

const mockTimetable: TimetableEntry[] = [ /* ... leave mock data if you still need it ... */ ];
const mockTodos: TodoItem[] = [ /* ... leave mock data if you still need it ... */ ];

// Color Logic (outside component for better performance)
const subjectColorMap: { [key: string]: string } = {
    'IT Workshop': '#41f63bff', // Blue
    'Digital Electronics': '#8b5cf6', // Purple
    'Internet of Things': '#10b981', // Green
    'Environmental Studies': '#f59e0b', // Orange
    'Linear Algebra': '#ec4899', // Pink
    'Problem Solving with C': '#ef4444', // Red
    'Calculus': '#06b6d4', // Cyan
    'International Language': '#64748b', // Slate
    'Entrepreneurship': '#eab308', // Yellow
    'Physics': '#8b5cf6', // Purple (Example)
    'Mathematics': '#3b82f6', // Blue (Example)
    'Chemistry': '#f59e0b', // Orange (Example)
    'IT': '#3b82f6' // Added for the manual entry
    // Add more subjects and unique colors as needed
};
const defaultColor = '#71717a'; // Zinc
const getColorForSubject = (subject: string | undefined): string => {
    if (!subject) return defaultColor;
    const foundKey = Object.keys(subjectColorMap).find(key =>
        subject.toLowerCase().includes(key.toLowerCase())
    );
    return foundKey ? subjectColorMap[foundKey] : defaultColor;
};

// Formatting function (outside component)
const formatTimetableEntry = (entry: TimetableEntryFromBackend): TimetableEntry => {
    const startDate = entry.start_time ? new Date(entry.start_time) : null;
    return {
      id: entry.id,
      subject: entry.subject,
      startTime: startDate
          ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // HH:MM
          : 'N/A',
      endTime: entry.end_time
          ? new Date(entry.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // HH:MM
          : 'N/A',
      location: entry.location || '',
      dayOfWeek: startDate
                 ? (startDate.getDay() + 6) % 7 // Mon=0, Tue=1... Sun=6
                 : 0,
      color: getColorForSubject(entry.subject)
    };
};

const formatTodoEntry = (entry: TodoItemFromBackend): TodoItem => ({
    id: entry.id,
    task: entry.task,
    description: entry.task,
    due_date: entry.due_date,
    dueDate: entry.due_date,
    completed: entry.status === 'completed',
});


interface StudentDashboardProps {
  onChangeRole: () => void;
  userName: string;
}

export default function StudentDashboard({ onChangeRole, userName }: StudentDashboardProps) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- useEffect to fetch data when the component mounts ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (config.useMockData) {
        const coloredMockTimetable = mockTimetable.map(entry => ({
             ...entry,
             color: getColorForSubject(entry.subject)
        }));
        setTimetable(coloredMockTimetable);
        setTodos(mockTodos);
        setIsLoading(false);
      } else {
        try {
          const [rawTimetable, rawTodos] = await Promise.all([
            timetableApi.getTimetable(),
            todoApi.getTodos()
          ]);

          const formattedTimetable = (rawTimetable || []).map(formatTimetableEntry);
          const formattedTodos = (rawTodos || []).map(formatTodoEntry);

          setTimetable(formattedTimetable);
          setTodos(formattedTodos);

        } catch (error) {
          console.error("Failed to load dashboard data:", error);
          toast.error("Failed to load data. Please try again later.");
          setTimetable([]);
          setTodos([]);
        } finally {
            setIsLoading(false);
        }
      }
    };
    loadData();
  }, []); // Empty dependency array means this runs only once on mount

  // --- Handlers ---
   const handleAddClass = async (classData: any) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    try {
        const newClassFromBackend = await timetableApi.addTimetableEntry(classData);
        if (newClassFromBackend && newClassFromBackend.id) {
            const formattedClassForState = formatTimetableEntry(newClassFromBackend); // Use helper
            setTimetable(prevTimetable => [...prevTimetable, formattedClassForState]);
            toast.success("Class added successfully!");
        } else {
             throw new Error("Backend did not return the created class.");
        }
      } catch (error) {
        console.error("Failed to add class:", error);
        toast.error(`Failed to add class: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
   };

  const handleUpdateClass = async (id: number | string, classData: Omit<TimetableEntry, 'id'>) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    // TODO: Implement API call, ensuring data sent matches backend PUT route
    // Example (Needs correct data structure for backend):
    try {
        const backendUpdateData = { // Convert frontend state names to backend names if needed
            subject: classData.subject,
            // You might need dayOfWeek + startTime + endTime here depending on backend PUT
            start_time: classData.startTime, // Example: Assuming backend PUT takes HH:MM ? (Check backend)
            end_time: classData.endTime,     // Example: Assuming backend PUT takes HH:MM ? (Check backend)
            location: classData.location,
            // ... include other fields like is_recurring etc. if needed
        };
        const updatedClassFromBackend = await timetableApi.updateTimetableEntry(Number(id), backendUpdateData);
        const formattedClass = formatTimetableEntry(updatedClassFromBackend); // Format response
        setTimetable(timetable.map(c => c.id === id ? formattedClass : c));
        toast.success("Class updated successfully!");
    } catch (error) {
        console.error("Update failed:", error);
        toast.error("Failed to update class.");
    }
  };

  const handleDeleteClass = async (id: number | string) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    try {
        await timetableApi.deleteTimetableEntry(Number(id));
        setTimetable(timetable.filter(c => c.id !== id));
        toast.success("Class deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete class.");
      }
  };

  const handleUploadTimetable = async (file: File) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    setIsLoading(true);
    try {
        toast.info("Uploading timetable... processing with AI...");
        const response = await timetableApi.uploadTimetablePDF(file);
        toast.success(response.message || "Timetable uploaded successfully!");
        // Refresh timetable after upload
        const rawTimetable = await timetableApi.getTimetable();
        const formattedTimetable = (rawTimetable || []).map(formatTimetableEntry); // Use helper
        setTimetable(formattedTimetable);
      } catch (error) {
        console.error("Upload failed:", error)
        toast.error(`Failed to upload timetable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsLoading(false);
      }
  };

   const handleAddTodo = async (todoData: { description: string, dueDate: string }) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    try {
        // Prepare data for backend (task, due_date)
        const apiData = { task: todoData.description, due_date: todoData.dueDate };
        // Cast to any because todoApi returns TodoItem (frontend type) but we get backend response
        const newTodoFromBackend = await todoApi.addTodo(apiData as any);
        const formattedTodo = formatTodoEntry(newTodoFromBackend as any); // Use helper
        setTodos([...todos, formattedTodo]);
        toast.success("Todo added successfully!");
      } catch (error) {
          console.error("Failed to add todo:", error);
        toast.error(`Failed to add todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
   };

   const handleToggleTodo = async (id: number | string) => {
    if (config.useMockData) {
       // Mock data toggle
       setTodos(todos.map(t => 
         t.id === id ? { ...t, completed: !t.completed } : t
       ));
       return; 
    }

    const todoToToggle = todos.find(t => t.id === id);
    if (!todoToToggle) return;

    try {
      // Optimistic update
      const updatedTodos = todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      setTodos(updatedTodos);

      // API call
      const updatedTodoFromBackend = await todoApi.updateTodo(Number(id), { 
        completed: !todoToToggle.completed 
      });
      
      // Re-sync with backend response to be safe
      // Cast to any because the API return type definition in todo-api.ts is narrower than the actual backend response
      const formattedTodo = formatTodoEntry(updatedTodoFromBackend as any);
      setTodos(prev => prev.map(t => t.id === id ? formattedTodo : t));
      
      toast.success(formattedTodo.completed ? "Task completed!" : "Task marked as pending");
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      toast.error("Failed to update todo status.");
      // Revert on error
      setTodos(todos); 
    }
   };

  const handleDeleteTodo = async (id: number | string) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    try {
        await todoApi.deleteTodo(Number(id));
        setTodos(todos.filter(t => t.id !== id));
        toast.success("Todo deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete todo.");
      }
  };

  const handleEnableNotifications = async () => {
    if (!('serviceWorker' in navigator)) {
        toast.error("Notifications not supported in this browser.");
        return;
    }

    try {
        const register = await navigator.serviceWorker.register('/sw.js');
        
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast.error("Permission denied for notifications.");
            return;
        }

        if (!config.vapidPublicKey) {
             toast.error("VAPID Public Key not configured.");
             return;
        }

        const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
        });

        // Send to backend
        await fetch(`${config.apiBaseUrl}/api/notifications/subscribe`, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        toast.success("Notifications enabled! You will be reminded 10 mins before class.");
    } catch (error) {
        console.error("Notification error:", error);
        toast.error("Failed to enable notifications.");
    }
  };

  // --- Render loading state ---
  if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
           <p className="text-gray-600">Loading Dashboard...</p>
         </div>
       </div>
     );
  }

  // --- Render the dashboard UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-200/50 sticky top-0 z-10 shadow-lg shadow-purple-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2.5 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: "'Poppins', sans-serif" }}>Student Dashboard</h1>
                <p className="text-purple-600 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Welcome back, {userName}! ✨</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-purple-600 hidden sm:inline" style={{ fontFamily: "'Inter', sans-serif" }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEnableNotifications}
                className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 transition-all duration-300"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Enable Notifications</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onChangeRole}
                className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/60 backdrop-blur-sm border border-purple-200/50 shadow-lg p-1.5">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              <motion.div whileHover={{ scale: 1.2, rotate: 15 }} transition={{ type: "spring", stiffness: 400 }}>
                <LayoutDashboard className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-400 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              <motion.div whileHover={{ scale: 1.2, rotate: -15 }} transition={{ type: "spring", stiffness: 400 }}>
                <Calendar className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">Weekly Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-400 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              <motion.div whileHover={{ scale: 1.2, y: -3 }} transition={{ type: "spring", stiffness: 400 }}>
                <ListTodo className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">To-Do List</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              <motion.div 
                whileHover={{ scale: 1.2 }} 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">AI Assistant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <Overview
              timetable={timetable}
              todos={todos}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
              onUploadTimetable={handleUploadTimetable}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
            />
          </TabsContent>

          <TabsContent value="timetable" className="mt-0">
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-xl shadow-lg border-2 border-cyan-200/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-blue-400 to-cyan-500 p-2 rounded-lg shadow-md"
                >
                  <Calendar className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" style={{ fontFamily: "'Raleway', sans-serif" }}>Weekly Timetable</h2>
              </div>
              <TimetableView
                timetable={timetable}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onDeleteClass={handleDeleteClass}
                onUploadTimetable={handleUploadTimetable}
              />
            </div>
          </TabsContent>

          <TabsContent value="todos" className="mt-0">
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl shadow-lg border-2 border-emerald-200/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  whileHover={{ scale: 1.2, y: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg shadow-md"
                >
                  <ListTodo className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" style={{ fontFamily: "'Raleway', sans-serif" }}>To-Do List</h2>
              </div>
              <TodoList
                todos={todos}
                timetable={timetable}
                onAddTodo={handleAddTodo}
                onToggleTodo={handleToggleTodo}
                onDeleteTodo={handleDeleteTodo}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 rounded-xl shadow-lg border-2 border-orange-200/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2, 
                    ease: "easeInOut" 
                  }}
                  className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-lg shadow-md"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Assistant</h2>
              </div>
              <AIFeatures timetable={timetable} todos={todos} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}