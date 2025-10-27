import { TAScheduleEntry } from '../TADashboard';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface TAScheduleViewProps {
  schedule: TAScheduleEntry[];
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function TAScheduleView({ schedule }: TAScheduleViewProps) {
  const getSessionAtTime = (day: number, time: string) => {
    return schedule.find(entry => {
      if (entry.dayOfWeek !== day) return false;
      const entryStart = parseInt(entry.startTime.replace(':', ''));
      const entryEnd = parseInt(entry.endTime.replace(':', ''));
      const slotTime = parseInt(time.replace(':', ''));
      return slotTime >= entryStart && slotTime < entryEnd;
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          This is your assigned schedule. All sessions are managed by faculty. Contact your supervising faculty for any changes or concerns.
        </p>
      </Card>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] border border-gray-200 rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200"></div>
            {days.map(day => (
              <div key={day} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                <span className="text-sm">{day}</span>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-6 border-b border-gray-200 last:border-b-0 min-h-[80px]">
              <div className="p-3 border-r border-gray-200 bg-gray-50 flex items-start">
                <span className="text-sm text-gray-600">{time}</span>
              </div>
              {days.map((day, dayIndex) => {
                const session = getSessionAtTime(dayIndex, time);
                const isFirstSlot = session && session.startTime === time;

                return (
                  <div
                    key={`${day}-${time}`}
                    className="border-r border-gray-200 last:border-r-0 relative"
                  >
                    {isFirstSlot && session && (
                      <div
                        className="absolute inset-1 rounded-md p-2 text-white overflow-hidden"
                        style={{ backgroundColor: session.color || '#10b981' }}
                      >
                        <div className="text-sm">{session.subject}</div>
                        <div className="text-xs opacity-90">
                          {session.startTime} - {session.endTime}
                        </div>
                        <div className="text-xs opacity-90">{session.location}</div>
                        <div className="mt-1">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-white/20 hover:bg-white/30 border-white/30"
                          >
                            {session.type}
                          </Badge>
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

      {/* Session Details List */}
      <div>
        <h3 className="mb-4">Session Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedule.map(session => {
            const sessionDuration = (() => {
              const [startHour, startMin] = session.startTime.split(':').map(Number);
              const [endHour, endMin] = session.endTime.split(':').map(Number);
              const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
              return hours;
            })();

            return (
              <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="mb-1">{session.subject}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {session.type}
                    </Badge>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: session.color }}
                  />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{days[session.dayOfWeek]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {session.startTime} - {session.endTime} ({sessionDuration}h)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{session.facultyName}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
