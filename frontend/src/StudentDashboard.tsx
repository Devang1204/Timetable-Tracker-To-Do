import { useState, useEffect } from 'react';
import { TimetableView } from './components/TimetableView';
import { TodoList } from './components/TodoList';
import { AIFeatures } from './components/AIFeatures';
import { Overview } from './components/Overview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { GraduationCap, LayoutDashboard, Calendar, ListTodo, Sparkles, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import * as timetableApi from './lib/timetable-api';
import * as todoApi from './lib/todo-api';
import { config } from './lib/config';

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
        const newTodoFromBackend = await todoApi.addTodo(apiData);
        const formattedTodo = formatTodoEntry(newTodoFromBackend); // Use helper
        setTodos([...todos, formattedTodo]);
        toast.success("Todo added successfully!");
      } catch (error) {
          console.error("Failed to add todo:", error);
        toast.error(`Failed to add todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
   };

   const handleToggleTodo = async (id: number | string) => {
    if (config.useMockData) { /* ... mock logic ... */ return; }
    // TODO: Implement PUT /api/todos/:id in backend and call here
    toast.info("Toggle functionality needs backend update route.");
    // Example Logic:
    // const todoToToggle = todos.find(t => t.id === id);
    // if (!todoToToggle) return;
    // try {
    //   const updatedTodoFromBackend = await todoApi.updateTodo(Number(id), { completed: !todoToToggle.completed });
    //   const formattedTodo = formatTodoEntry(updatedTodoFromBackend);
    //   setTodos(todos.map(t => t.id === id ? formattedTodo : t));
    //   toast.success("Todo status updated!");
    // } catch (error) {
    //   toast.error("Failed to update todo status.");
    // }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1>Student Dashboard</h1>
                <p className="text-gray-600 text-sm">Welcome back, {userName}!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* ============================================ */}
              {/* ✅ --- Dynamic Date --- */}
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
             <TabsTrigger value="todos" className="gap-2"><ListTodo className="w-4 h-4" /> <span className="hidden sm:inline">To-Do List</span></TabsTrigger>
             <TabsTrigger value="ai" className="gap-2"><Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">AI Assistant</span></TabsTrigger>
          </TabsList>

          {/* Render TabsContent using the state variables */}
          <TabsContent value="overview" className="mt-0">
             <Overview timetable={timetable} todos={todos} />
             {/* Removed handlers from Overview as it's mainly display */}
          </TabsContent>

          <TabsContent value="timetable" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6"> <Calendar className="w-5 h-5 text-blue-600" /> <h2>Weekly Timetable</h2> </div>
              <TimetableView timetable={timetable} onAddClass={handleAddClass} onUpdateClass={handleUpdateClass} onDeleteClass={handleDeleteClass} onUploadTimetable={handleUploadTimetable} />
            </div>
          </TabsContent>

          <TabsContent value="todos" className="mt-0">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <div className="flex items-center gap-2 mb-6"> <ListTodo className="w-5 h-5 text-green-600" /> <h2>To-Do List</h2> </div>
               <TodoList todos={todos} timetable={timetable} onAddTodo={handleAddTodo} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo} />
             </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <div className="flex items-center gap-2 mb-6"> <Sparkles className="w-5 h-5 text-purple-600" /> <h2>AI Assistant</h2> </div>
               <AIFeatures timetable={timetable} todos={todos} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}