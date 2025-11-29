import { TimetableEntry, TodoItem } from '../StudentDashboard';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Calendar, ListTodo, CheckCircle2, AlertCircle, Clock, BookOpen } from 'lucide-react';
import { Badge } from './ui/badge';

interface OverviewProps {
  timetable: TimetableEntry[];
  todos: TodoItem[];
  onAddClass: (classData: any) => void;
  onUpdateClass: (id: string | number, classData: any) => void;
  onDeleteClass: (id: string | number) => void;
  onUploadTimetable: (file: File) => void;
  onAddTodo: (todoData: any) => void;
  onToggleTodo: (id: string | number) => void;
  onDeleteTodo: (id: string | number) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function Overview({
  timetable,
  todos,
}: OverviewProps) {
  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  const todayClasses = timetable.filter(c => c.dayOfWeek === 1); // Tuesday (index 1)
  
  const overdueTodos = todos.filter(t => {
    const dueDateStr = t.dueDate || t.due_date;
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date(); // Use actual date
    return dueDate < today && !t.completed;
  });

  const upcomingTodos = todos.filter(t => {
    const dueDateStr = t.dueDate || t.due_date;
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysFromNow && !t.completed;
  }).sort((a, b) => {
      const dateA = new Date(a.dueDate || a.due_date || '');
      const dateB = new Date(b.dueDate || b.due_date || '');
      return dateA.getTime() - dateB.getTime();
  });

  const getClassAtTime = (day: number, time: string) => {
    return timetable.find(entry => {
      if (entry.dayOfWeek !== day) return false;
      const entryStart = parseInt(entry.startTime.replace(':', ''));
      const entryEnd = parseInt(entry.endTime.replace(':', ''));
      const slotTime = parseInt(time.replace(':', ''));
      return slotTime >= entryStart && slotTime < entryEnd;
    });
  };

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const uniqueSubjects = new Set(timetable.map(c => c.subject));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg p-2 shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Classes Today</p>
              <p className="text-2xl text-blue-900">{todayClasses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg p-2 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Tasks Completed</p>
              <p className="text-2xl text-green-900">{completedTodos}/{totalTodos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg p-2 shadow-md">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-pink-700">Overdue Tasks</p>
              <p className="text-2xl text-pink-900">{overdueTodos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg p-2 shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700">Total Subjects</p>
              <p className="text-2xl text-purple-900">{uniqueSubjects.size}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetable Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-blue-900">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-1.5 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Weekly Schedule
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[600px] border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm">
                {/* Header Row */}
                <div className="grid grid-cols-6 bg-gradient-to-r from-blue-100 to-purple-100 border-b-2 border-blue-200">
                  <div className="p-2 border-r border-blue-200"></div>
                  {days.map(day => (
                    <div key={day} className="p-2 text-center border-r border-blue-200 last:border-r-0">
                      <span className="text-xs text-blue-900">{day.substring(0, 3)}</span>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-6 border-b border-blue-200 last:border-b-0 min-h-[60px]">
                    <div className="p-2 border-r border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 flex items-start">
                      <span className="text-xs text-blue-700">{time}</span>
                    </div>
                    {days.map((day, dayIndex) => {
                      const classEntry = getClassAtTime(dayIndex, time);
                      const isFirstSlot = classEntry && classEntry.startTime === time;

                      return (
                        <div
                          key={`${day}-${time}`}
                          className="border-r border-blue-200 last:border-r-0 relative bg-white/50"
                        >
                          {isFirstSlot && classEntry && (
                            <div
                              className="absolute inset-1 rounded-md p-1.5 text-white overflow-hidden shadow-md"
                              style={{ backgroundColor: classEntry.color || '#3b82f6' }}
                            >
                              <div className="text-xs">{classEntry.subject}</div>
                              <div className="text-[10px] opacity-90">
                                {classEntry.startTime} - {classEntry.endTime}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-300 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-green-900">Task Completion</h3>
            </div>
            <div className="space-y-3">
              <Progress value={completionRate} className="h-2" />
              <p className="text-sm text-green-700">
                {Math.round(completionRate)}% of tasks completed
              </p>
            </div>
          </Card>

          {/* Today's Classes */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-300 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 text-blue-900">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-white" />
              </div>
              Today's Classes
            </h3>
            <div className="space-y-3">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-blue-600">No classes scheduled today</p>
              ) : (
                todayClasses.map(classEntry => (
                  <div
                    key={classEntry.id}
                    className="flex items-start gap-3 p-3 rounded-lg border-2 border-blue-200 bg-white/70 hover:bg-white transition-colors shadow-sm"
                  >
                    <div
                      className="w-1 h-12 rounded-full shadow-sm"
                      style={{ backgroundColor: classEntry.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-blue-900">{classEntry.subject}</p>
                      <p className="text-xs text-blue-700">
                        {classEntry.startTime} - {classEntry.endTime}
                      </p>
                      <p className="text-xs text-blue-600">{classEntry.location}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="p-6 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-yellow-300 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 text-yellow-900">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-1.5 rounded-lg">
                <ListTodo className="w-4 h-4 text-white" />
              </div>
              Upcoming Tasks
            </h3>
            <div className="space-y-2">
              {upcomingTodos.length === 0 ? (
                <p className="text-sm text-yellow-700">No upcoming tasks</p>
              ) : (
                upcomingTodos.slice(0, 5).map(todo => (
                  <div
                    key={todo.id}
                    className="p-2 rounded-lg border-2 border-yellow-200 bg-white/70 hover:bg-white transition-colors shadow-sm"
                  >
                    <p className="text-sm text-yellow-900">{todo.description || todo.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-yellow-700">
                        {new Date(todo.dueDate || todo.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {new Date(todo.dueDate || todo.due_date).toDateString() === new Date().toDateString() && (
                        <Badge variant="default" className="text-xs bg-orange-500 h-5">Today</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

