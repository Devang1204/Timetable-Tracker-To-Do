import { useState, useEffect } from 'react';
import { TAScheduleView } from './components/TAScheduleView';
import { TAAvailability } from './components/TAAvailability';
import { TAAIFeatures } from './components/TAAIFeatures';
import { TAOverview } from './components/TAOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { GraduationCap, LayoutDashboard, Calendar, Clock, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

// --- Import API functions ---
import * as timetableApi from './lib/timetable-api';
import * as taApi from './lib/ta-api';
import { config } from './lib/config';
import * as authApi from './lib/auth';

// Interface matching Backend Response for Timetable
export interface TimetableEntryFromBackend {
    id: number;
    user_id: number;
    role: string;
    subject: string;
    start_time: string; // ISO Timestamp string
    end_time: string;   // ISO Timestamp string
    location: string | null;
}

// Interface for Frontend State/Display (TA Schedule Entry)
export interface TAScheduleEntry {
  id: number | string;
  subject: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  location: string;
  dayOfWeek: number; // 0 = Monday, etc.
  type?: 'Tutorial' | 'Lab' | 'Office Hours';
  color?: string;
}

// Interface matching Backend Response for Availability
export interface AvailabilitySlotFromBackend {
  id: number;
  user_id: number;
  day_of_week: string; // e.g., "Monday"
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  reason: string | null;
  created_at?: string;
}

// Interface for Frontend State/Display (Availability Slot)
export interface AvailabilitySlot {
  id: number | string;
  dayOfWeek: number; // 0 = Monday, etc.
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  isAvailable?: boolean;
  reason?: string;
}

// --- Mock Data ---
const mockSchedule: TAScheduleEntry[] = [ /* ... */ ];
const mockAvailability: AvailabilitySlot[] = [ /* ... */ ];

// --- Color Logic ---
const subjectColorMap: { [key: string]: string } = { /* ... */ };
const defaultClassColor = '#10b981';
const getColorForSubject = (subject: string | undefined): string => { /* ... */ };

// --- Formatting Helper for TA Schedule ---
const formatTAScheduleEntry = (entry: TimetableEntryFromBackend): TAScheduleEntry => {
    const startDate = entry.start_time ? new Date(entry.start_time) : null;
    let type: TAScheduleEntry['type'] = undefined;
    if (entry.subject?.toLowerCase().includes('tutorial')) type = 'Tutorial';
    else if (entry.subject?.toLowerCase().includes('lab')) type = 'Lab';
    else if (entry.subject?.toLowerCase().includes('office hour')) type = 'Office Hours';

    return {
      id: entry.id,
      subject: entry.subject,
      startTime: startDate ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      endTime: entry.end_time ? new Date(entry.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      location: entry.location || 'N/A',
      dayOfWeek: startDate ? (startDate.getDay() + 6) % 7 : 0, // Mon=0
      type: type,
      color: getColorForSubject(entry.subject) || defaultClassColor
    };
};

// --- Formatting Helper for Availability ---
const dayNameToIndex: { [key: string]: number } = { 'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6 };
// --- ADDED: Helper to convert index back to name ---
const dayIndexToName: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatAvailabilitySlot = (entry: AvailabilitySlotFromBackend): AvailabilitySlot => {
    return {
        id: entry.id,
        dayOfWeek: dayNameToIndex[entry.day_of_week.toLowerCase()] ?? -1,
        startTime: entry.start_time ? entry.start_time.substring(0, 5) : 'N/A',
        endTime: entry.end_time ? entry.end_time.substring(0, 5) : 'N/A',
        isAvailable: false,
        reason: entry.reason || undefined
    };
};


interface TADashboardProps {
  onChangeRole: () => void;
  userName: string;
}

export default function TADashboard({ onChangeRole, userName }: TADashboardProps) {
  const [schedule, setSchedule] = useState<TAScheduleEntry[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch initial data ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (config.useMockData) {
        console.warn("TADashboard running in mock data mode.");
        setSchedule(mockSchedule);
        setAvailability(mockAvailability);
        setIsLoading(false);
        return;
      }

      try {
          const currentUser = authApi.getCurrentUser();
          if (!currentUser || currentUser.role !== 'ta') {
             await authApi.logout(); onChangeRole(); toast.error("Invalid session. Please log in again."); setIsLoading(false); return;
          }
          console.log("TADashboard: Fetching Schedule...");
          const rawSchedule = await timetableApi.getTimetable();
          console.log("TADashboard: Fetched Raw Schedule:", rawSchedule);
          const formattedSchedule = (Array.isArray(rawSchedule) ? rawSchedule : []).map(formatTAScheduleEntry);
          setSchedule(formattedSchedule);

          console.log("TADashboard: Fetching Availability...");
          const rawAvailability = await taApi.getAvailability();
          console.log("TADashboard: Fetched Raw Availability:", rawAvailability);
          const formattedAvailability = (Array.isArray(rawAvailability) ? rawAvailability : []).map(formatAvailabilitySlot);
          setAvailability(formattedAvailability);

      } catch (error) {
          console.error("Failed to load TA dashboard data:", error);
          toast.error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setSchedule([]); setAvailability([]);
      } finally {
          setIsLoading(false);
      }
    };
    loadData();
  }, [onChangeRole]);


  // --- Handlers ---
  // ============================================
  // ✅ --- FIX: Transform day index to day STRING ---
  // ============================================
  // The 'slotData' object comes from the form with camelCase keys
  // and 'dayOfWeek' as a number (index 0-6)
  const handleAddAvailability = async (slotData: { dayOfWeek: number; startTime: string; endTime: string; reason?: string }) => {
    console.log("handleAddAvailability received (camelCase):", slotData);
    if (config.useMockData) { /* ... */ return; }

    // --- Convert day index back to string name ---
    const dayString = dayIndexToName[slotData.dayOfWeek];
    if (!dayString) {
        console.error("Invalid day index received from form:", slotData.dayOfWeek);
        toast.error("Invalid day selected.");
        return;
    }

    // Transform keys AND day value for the backend
    const backendSlotData = {
        day_of_week: dayString, // Send "Monday", "Tuesday", etc.
        start_time: slotData.startTime,
        end_time: slotData.endTime,
        reason: slotData.reason
    };

    try {
        console.log("Calling addAvailabilitySlot API with (snake_case):", backendSlotData);
        // Validation (backend also validates)
        if (!backendSlotData.day_of_week || !backendSlotData.start_time || !backendSlotData.end_time) {
            toast.error("Day, start time, and end time are required.");
            return;
        }

        const newSlotFromBackend = await taApi.addAvailabilitySlot(backendSlotData); // Send corrected data
        
        if (newSlotFromBackend && newSlotFromBackend.id) {
            const formattedSlot = formatAvailabilitySlot(newSlotFromBackend);
            setAvailability(prev => [...prev, formattedSlot].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
            toast.success("Availability slot added!");
        } else { throw new Error("Backend did not return the created slot."); }
    } catch(error){
        console.error("Failed to add availability:", error);
        toast.error(`Failed to add slot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveAvailability = async (id: string | number) => {
     console.log(`handleRemoveAvailability called for ID: ${id}`);
     if (config.useMockData) { /* ... */ return; }
     try {
         console.log("Calling deleteAvailabilitySlot API...");
         await taApi.deleteAvailabilitySlot(Number(id));
         setAvailability(prev => prev.filter(a => a.id !== id));
         toast.success("Availability slot removed!");
     } catch (error) {
         console.error("Failed to remove availability:", error);
         toast.error(`Failed to remove slot: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
  };

  // --- Render loading state ---
  if (isLoading) {
    return (
       <div className="min-h-screen flex items-center justify-center"> <div className="text-center"> <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" /> <p className="text-gray-600">Loading Dashboard...</p> </div> </div>
     );
  }

  // --- Render the dashboard UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-neutral-50 to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-800 to-teal-900 border-b border-teal-700 sticky top-0 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg p-2.5 shadow-lg border border-teal-500"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <GraduationCap className="w-6 h-6 text-teal-50" />
              </motion.div>
              <div>
                <h1 className="text-teal-50" style={{ fontFamily: "'Lora', serif" }}>Teaching Assistant Dashboard</h1>
                <p className="text-teal-200 text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>Welcome back, {userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-teal-200 hidden sm:inline" style={{ fontFamily: "'Open Sans', sans-serif" }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onChangeRole}
                className="gap-2 border-red-500 text-red-400 hover:bg-red-900/30 hover:border-red-400 hover:text-red-300 transition-all duration-300"
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
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-stone-300 shadow-lg p-1.5">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-700 data-[state=active]:to-teal-800 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: "spring", stiffness: 400 }}>
                <LayoutDashboard className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-700 data-[state=active]:to-cyan-800 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <motion.div whileHover={{ scale: 1.2, rotate: -10 }} transition={{ type: "spring", stiffness: 400 }}>
                <Calendar className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">Assigned Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-700 data-[state=active]:to-amber-800 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <motion.div 
                whileHover={{ scale: 1.2 }}
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-700 data-[state=active]:to-violet-800 data-[state=active]:text-white transition-all duration-300" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <motion.div 
                whileHover={{ scale: 1.2 }} 
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">AI Assistant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <TAOverview
              schedule={schedule}
              availability={availability}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-lg shadow-xl border-2 border-cyan-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-cyan-700 to-cyan-800 p-2 rounded-lg shadow-md"
                >
                  <Calendar className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="text-cyan-900" style={{ fontFamily: "'Lora', serif" }}>Assigned Schedule</h2>
              </div>
              <TAScheduleView schedule={schedule} />
            </div>
          </TabsContent>

          <TabsContent value="availability" className="mt-0">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg shadow-xl border-2 border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="bg-gradient-to-br from-amber-700 to-amber-800 p-2 rounded-lg shadow-md"
                >
                  <Clock className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="text-amber-900" style={{ fontFamily: "'Lora', serif" }}>Availability Management</h2>
              </div>
              <TAAvailability
                schedule={schedule}
                availability={availability}
                onAddAvailability={handleAddAvailability}
                onRemoveAvailability={handleRemoveAvailability}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-lg shadow-xl border-2 border-violet-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 3, -3, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut"
                  }}
                  className="bg-gradient-to-br from-violet-700 to-violet-800 p-2 rounded-lg shadow-md"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="text-violet-900" style={{ fontFamily: "'Lora', serif" }}>AI Assistant</h2>
              </div>
              <TAAIFeatures schedule={schedule} availability={availability} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}