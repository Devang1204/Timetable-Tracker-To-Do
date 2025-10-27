// Assuming interfaces are imported correctly
import { FacultyTimetableEntry, TA } from '../FacultyDashboard'; // Adjust path if needed
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Calendar, Users, BookOpen, Clock, ListTodo, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'; // Added required icons
import { Badge } from './ui/badge';
import { Button } from './ui/button'; // Added Button import

interface FacultyOverviewProps {
  timetable: FacultyTimetableEntry[];
  tas: TA[];
}

// Helper to safely format date string (short format)
function formatDateShort(dateString: string | undefined): string {
    if (!dateString) return 'No Due Date';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return 'Invalid Date'; }
}

// Helper to check if a date is today
const isToday = (dateString: string | undefined): boolean => {
    if (!dateString) return false;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    } catch { return false; }
};


export function FacultyOverview({
  timetable = [], // Default to empty array
  tas = [],     // Default to empty array
}: FacultyOverviewProps) {

  // --- Filter for Today's Classes ---
  const today = new Date(); // Use actual current date
  // Convert JS Date day (Sun=0, Mon=1... Thu=4...) to Mon=0... Fri=4...
  const todayIndex = (today.getDay() + 6) % 7;

  // Filter the timetable prop
  const todaysClasses = timetable.filter(entry => entry.dayOfWeek === todayIndex)
                          .sort((a,b) => { // Sort today's classes by start time
                              try {
                                  // Convert HH:MM to minutes for reliable sorting
                                  const timeA = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
                                  const timeB = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
                                  return timeA - timeB;
                              } catch { return 0; }
                          });

  // --- Logic for Current/Upcoming Class ---
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  let currentClass: FacultyTimetableEntry | null = null;
  let upcomingClass: FacultyTimetableEntry | null = null;
  for (const entry of todaysClasses) { // Iterate over already sorted today's classes
      try {
          const [startH, startM] = entry.startTime.split(':').map(Number);
          const [endH, endM] = entry.endTime.split(':').map(Number);
          if ([startH, startM, endH, endM].some(isNaN)) continue; // Skip if time is invalid
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          // Check if current time falls within this class
          if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
              currentClass = entry;
              // Find the next class after this one finishes
              const currentIndex = todaysClasses.indexOf(entry);
              if (currentIndex < todaysClasses.length - 1) {
                  upcomingClass = todaysClasses[currentIndex + 1];
              }
              break; // Found current class, no need to look further
          }
          // If no current class found yet, check if this is the next upcoming one
          if (!currentClass && startMinutes > currentTimeMinutes) {
              upcomingClass = entry;
              break; // Found the very next class
          }
      } catch { continue; } // Skip if time parsing fails
  }


  // Calculate other stats (Keep existing logic)
  const activeTAs = tas.length; // Simple count for now
  const totalSubjects = new Set(timetable.map(c => c.subject)).size;
  const myClassesCount = timetable.filter(c => c.assignee === 'self').length; // Classes assigned to faculty


  // --- Logic for Overdue/Upcoming Tasks --- (Needs Todo data, assuming passed or fetched elsewhere)
  // Placeholder: Assuming `todos` are passed as props or fetched in FacultyDashboard
  const todos: any[] = []; // Replace with actual todos prop or state later
  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  const todayDateOnly = new Date(); todayDateOnly.setHours(0,0,0,0);
  const overdueTodos = todos.filter(t => { /* ... keep existing logic ... */ });
  const upcomingTodos = todos.filter(t => { /* ... keep existing logic ... */ })
                             .sort((a, b) => { /* ... keep existing logic ... */ });


  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Today Card */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-blue-100 rounded-lg p-2"> <Calendar className="w-5 h-5 text-blue-600" /> </div> <div> <p className="text-sm text-gray-600">Classes Today</p> <p className="text-2xl font-semibold">{todaysClasses.length}</p> </div> </div> </Card>
        {/* Active TAs Card */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-green-100 rounded-lg p-2"> <Users className="w-5 h-5 text-green-600" /> </div> <div> <p className="text-sm text-gray-600">Active TAs</p> <p className="text-2xl font-semibold">{activeTAs}/{tas.length}</p> </div> </div> </Card>
        {/* Total Subjects Card */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-purple-100 rounded-lg p-2"> <BookOpen className="w-5 h-5 text-purple-600" /> </div> <div> <p className="text-sm text-gray-600">Total Subjects</p> <p className="text-2xl font-semibold">{totalSubjects}</p> </div> </div> </Card>
         {/* My Classes Card */}
         <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-orange-100 rounded-lg p-2"> <Calendar className="w-5 h-5 text-orange-600" /> </div> <div> <p className="text-sm text-gray-600">My Classes</p> <p className="text-2xl font-semibold">{myClassesCount}</p> </div> </div> </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Full Schedule List */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="p-4">
                <h3 className="mb-3 text-base font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Limit height */}
                  {todaysClasses.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">No classes scheduled today</p>
                  ) : (
                    todaysClasses.map(classEntry => (
                      <div key={classEntry.id?.toString()} className="flex items-start gap-2 p-2 rounded-md border border-gray-100 bg-white">
                        <div className="w-1 h-auto self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: classEntry.color || defaultClassColor }}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{classEntry.subject}</p>
                          <p className="text-xs text-gray-600"> {classEntry.startTime} - {classEntry.endTime} </p>
                          {classEntry.location && <p className="text-xs text-gray-500 truncate">{classEntry.location}</p>}
                          {/* Show TA name if not assigned to self */}
                          {classEntry.assignee !== 'self' && <Badge variant="outline" className='text-xs mt-1'>{classEntry.assigneeName}</Badge>}
                        </div>
                         {/* Optional: Add a small button/icon here */}
                         {/* <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"> <ChevronRight className="w-4 h-4"/> </Button> */}
                      </div>
                    ))
                  )}
                </div>
            </Card>
        </div>


        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">

          {/* Current Class Card */}
          <Card className="p-4">
            <h3 className="mb-3 text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" /> Current Class
            </h3>
            {currentClass ? (
              <div className="flex items-start gap-2 p-2 rounded-md border border-green-200 bg-green-50">
                 <div className="w-1 h-auto self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: currentClass.color || defaultClassColor }}/>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold text-green-700 truncate">{currentClass.subject}</p>
                   <p className="text-xs text-green-600">{currentClass.startTime} - {currentClass.endTime}</p>
                   {currentClass.location && <p className="text-xs text-gray-500 truncate">{currentClass.location}</p>}
                   {currentClass.assignee !== 'self' && <Badge variant="outline" className='text-xs mt-1'>{currentClass.assigneeName}</Badge>}
                 </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">No class currently in session.</p>
            )}
          </Card>


          {/* Upcoming Class Card */}
          <Card className="p-4">
            <h3 className="mb-3 text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Upcoming Class
            </h3>
            {upcomingClass ? (
              <div className="flex items-start gap-2 p-2 rounded-md border border-blue-200 bg-blue-50">
                 <div className="w-1 h-auto self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: upcomingClass.color || defaultClassColor }}/>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold text-blue-700 truncate">{upcomingClass.subject}</p>
                   <p className="text-xs text-blue-600">{upcomingClass.startTime} - {upcomingClass.endTime}</p>
                   {upcomingClass.location && <p className="text-xs text-gray-500 truncate">{upcomingClass.location}</p>}
                    {upcomingClass.assignee !== 'self' && <Badge variant="outline" className='text-xs mt-1'>{upcomingClass.assigneeName}</Badge>}
                 </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">
                {currentClass ? 'No more classes scheduled after this one today.' : 'No more classes scheduled for today.'}
              </p>
            )}
          </Card>

          {/* TA Overview (Simplified - just list names) */}
           <Card className="p-4">
             <h3 className="mb-3 text-base font-medium flex items-center gap-2">
               <Users className="w-4 h-4 text-green-600" /> Teaching Assistants ({tas.length})
             </h3>
             <div className="space-y-1.5 max-h-48 overflow-y-auto">
               {tas.length === 0 ? (
                 <p className="text-xs text-gray-500 py-4 text-center">No TAs added yet.</p>
               ) : (
                 tas.map(ta => (
                   <div key={ta.id?.toString()} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: ta.color || defaultTaColor}}></div>
                      <p className="text-xs flex-1 truncate">{ta.name}</p>
                      {/* Optional: Add quick link or action */}
                   </div>
                 ))
               )}
             </div>
           </Card>

           {/* Subject Distribution (Placeholder - Requires calculation) */}
           {/* <Card className="p-4">
              <h3 className="mb-3 text-base font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" /> Subject Distribution
              </h3>
              <div className="space-y-1.5 text-xs text-gray-600">
                 Placeholder for subject counts (You: X, TA: Y)
              </div>
           </Card> */}

        </div>
      </div>
    </div>
  );
}