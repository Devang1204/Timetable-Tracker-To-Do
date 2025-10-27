// Assuming TimetableEntry and TodoItem interfaces are imported from App.tsx or a types file
import { TimetableEntry, TodoItem } from '../App';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Calendar, ListTodo, CheckCircle2, AlertCircle, Clock, BookOpen, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { Badge } from './ui/badge';
import { Button } from './ui/button'; // Added Button import

interface OverviewProps {
  timetable: TimetableEntry[]; // Receives the FULL timetable (with colors)
  todos: TodoItem[];
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to safely format date string
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


export function Overview({
  timetable = [], // Default to empty array
  todos = [],     // Default to empty array
}: OverviewProps) {

  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // --- Filter for Today's Classes ---
  const today = new Date(); // Use actual current date
  const todayIndex = (today.getDay() + 6) % 7; // Mon=0... Fri=4
  const todaysTimetable = timetable.filter(entry => entry.dayOfWeek === todayIndex)
                          .sort((a,b) => { // Sort today's classes by start time
                              try { return parseInt(a.startTime.replace(':','')) - parseInt(b.startTime.replace(':','')); } catch { return 0; }
                          });

  // --- Logic for Current/Upcoming Class ---
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  let currentClass: TimetableEntry | null = null;
  let upcomingClass: TimetableEntry | null = null;
  for (const entry of todaysTimetable) { // Iterate over already sorted today's classes
      try {
          const [startH, startM] = entry.startTime.split(':').map(Number);
          const [endH, endM] = entry.endTime.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
              currentClass = entry;
              const currentIndex = todaysTimetable.indexOf(entry);
              if (currentIndex < todaysTimetable.length - 1) {
                  upcomingClass = todaysTimetable[currentIndex + 1];
              }
              break;
          }
          if (!currentClass && startMinutes > currentTimeMinutes) {
              upcomingClass = entry;
              break;
          }
      } catch { continue; }
  }


  // --- Logic for Overdue/Upcoming Tasks ---
  const todayDateOnly = new Date();
  todayDateOnly.setHours(0,0,0,0);
  const overdueTodos = todos.filter(t => { /* ... keep existing logic ... */ });
  const upcomingTodos = todos.filter(t => { /* ... keep existing logic ... */ })
                             .sort((a, b) => { /* ... keep existing logic ... */ });

  // Get unique subjects from the full timetable
  const uniqueSubjects = new Set(timetable.map(c => c.subject));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Today */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-blue-100 rounded-lg p-2"> <Calendar className="w-5 h-5 text-blue-600" /> </div> <div> <p className="text-sm text-gray-600">Classes Today</p> <p className="text-2xl font-semibold">{todaysTimetable.length}</p> </div> </div> </Card>
        {/* Tasks Completed */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-green-100 rounded-lg p-2"> <CheckCircle2 className="w-5 h-5 text-green-600" /> </div> <div> <p className="text-sm text-gray-600">Tasks Completed</p> <p className="text-2xl font-semibold">{completedTodos}/{totalTodos}</p> </div> </div> </Card>
        {/* Overdue Tasks */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-red-100 rounded-lg p-2"> <AlertCircle className="w-5 h-5 text-red-600" /> </div> <div> <p className="text-sm text-gray-600">Overdue Tasks</p> <p className="text-2xl font-semibold">{overdueTodos.length}</p> </div> </div> </Card>
        {/* Total Subjects */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-purple-100 rounded-lg p-2"> <BookOpen className="w-5 h-5 text-purple-600" /> </div> <div> <p className="text-sm text-gray-600">Total Subjects</p> <p className="text-2xl font-semibold">{uniqueSubjects.size}</p> </div> </div> </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Was Timetable Preview, now Today's Schedule Details) */}
        <div className="lg:col-span-2 space-y-6">
            {/* Today's Full Schedule List */}
            <Card className="p-4">
                <h3 className="mb-3 text-base font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Today's Full Schedule
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Limit height */}
                  {todaysTimetable.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">No classes scheduled today</p>
                  ) : (
                    todaysTimetable.map(classEntry => (
                      <div key={classEntry.id} className="flex items-start gap-2 p-2 rounded-md border border-gray-100 bg-white">
                        <div className="w-1 h-auto self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: classEntry.color || defaultColor }}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{classEntry.subject}</p>
                          <p className="text-xs text-gray-600"> {classEntry.startTime} - {classEntry.endTime} </p>
                          {classEntry.location && <p className="text-xs text-gray-500 truncate">{classEntry.location}</p>}
                        </div>
                         {/* Optional: Add a small button/icon here if needed */}
                      </div>
                    ))
                  )}
                </div>
            </Card>

             {/* Task Completion Progress (Moved to left column) */}
             <Card className="p-4">
                <h3 className="mb-3 text-base font-medium">Task Completion</h3>
                <div className="space-y-2">
                  <Progress value={completionRate} className="h-1.5" />
                  <p className="text-xs text-gray-600">
                    {completionRate}% completed ({completedTodos}/{totalTodos})
                  </p>
                </div>
              </Card>

        </div>


        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">

          {/* ============================================ */}
          {/* ✅ --- Current Class Card --- */}
          {/* ============================================ */}
          <Card className="p-4">
            <h3 className="mb-3 text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" /> Current Class
            </h3>
            {currentClass ? (
              <div className="flex items-start gap-2 p-2 rounded-md border border-green-200 bg-green-50">
                 <div className="w-1 h-auto self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: currentClass.color || defaultColor }}/>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold text-green-700 truncate">{currentClass.subject}</p>
                   <p className="text-xs text-green-600">{currentClass.startTime} - {currentClass.endTime}</p>
                   {currentClass.location && <p className="text-xs text-gray-500 truncate">{currentClass.location}</p>}
                 </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">No class currently in session.</p>
            )}
          </Card>
          {/* ============================================ */}


          {/* ============================================ */}
          {/* ✅ --- Upcoming Class Card --- */}
          {/* ============================================ */}
          <Card className="p-4">
            <h3 className="mb-3 text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Upcoming Class
            </h3>
            {upcomingClass ? (
              <div className="flex items-start gap-2 p-2 rounded-md border border-blue-200 bg-blue-50">
                 <div className="w-1 h-auto self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: upcomingClass.color || defaultColor }}/>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold text-blue-700 truncate">{upcomingClass.subject}</p>
                   <p className="text-xs text-blue-600">{upcomingClass.startTime} - {upcomingClass.endTime}</p>
                   {upcomingClass.location && <p className="text-xs text-gray-500 truncate">{upcomingClass.location}</p>}
                 </div>
              </div>
            ) : (
              // Show slightly different message depending on if there was a current class
              <p className="text-xs text-gray-500 py-4 text-center">
                {currentClass ? 'No more classes scheduled after this one today.' : 'No classes scheduled for the rest of today.'}
              </p>
            )}
          </Card>
           {/* ============================================ */}

          {/* Upcoming Tasks */}
          <Card className="p-4">
            <h3 className="mb-3 text-base font-medium flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-green-600" /> Upcoming Tasks (Next 3 Days)
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {upcomingTodos.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No upcoming tasks due soon</p>
              ) : (
                upcomingTodos.slice(0, 5).map(todo => {
                   const dueDate = todo.dueDate || todo.due_date;
                   const taskDesc = todo.description || todo.task || 'No Description';
                   const isDueToday = isToday(dueDate);
                  return (
                    <div key={todo.id?.toString()} className="p-1.5 rounded-md border border-gray-100 hover:bg-gray-50 flex justify-between items-center">
                      <p className="text-xs flex-1 truncate mr-2">{taskDesc}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                         {isDueToday ? ( <Badge variant="default" className="text-xs bg-orange-500 h-4 px-1.5">Today</Badge> )
                          : ( <span className="text-xs text-gray-500"> {formatDateShort(dueDate)} </span> )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}