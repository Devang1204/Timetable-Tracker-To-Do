// Assuming interfaces are defined/imported correctly
import { TAScheduleEntry, AvailabilitySlot } from '../TADashboard'; // Adjust path if needed
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface TAOverviewProps {
  schedule: TAScheduleEntry[];
  availability: AvailabilitySlot[];
}

export function TAOverview({ schedule = [], availability = [] }: TAOverviewProps) {
  
  // ============================================
  // ✅ --- FIX: Dynamic Day Filtering ---
  // ============================================
  const today = new Date(); // Get CURRENT date
  // Convert JS Date day (Sun=0, Mon=1...) to Mon=0...
  const todayIndex = (today.getDay() + 6) % 7; 
  
  const todaySchedule = schedule.filter(s => s.dayOfWeek === todayIndex).sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );
  // ============================================

  
  const totalHours = schedule.reduce((acc, s) => {
    try {
        const [startHour, startMin] = s.startTime.split(':').map(Number);
        const [endHour, endMin] = s.endTime.split(':').map(Number);
        const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
        return acc + (isNaN(hours) ? 0 : hours); // Add safety check
    } catch { return acc; }
  }, 0);

  const unavailableSlots = availability.filter(a => !a.isAvailable); // This logic might need review
  
  const sessionTypes = {
    Tutorial: schedule.filter(s => s.type === 'Tutorial').length,
    Lab: schedule.filter(s => s.type === 'Lab').length,
    'Office Hours': schedule.filter(s => s.type === 'Office Hours').length,
  };

  const uniqueSubjects = new Set(schedule.map(s => s.subject.split(' - ')[0]));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sessions Today */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-blue-100 rounded-lg p-2"> <Calendar className="w-5 h-5 text-blue-600" /> </div> <div> <p className="text-sm text-gray-600">Sessions Today</p> <p className="text-2xl font-semibold">{todaySchedule.length}</p> </div> </div> </Card>
        {/* Weekly Hours */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-green-100 rounded-lg p-2"> <Clock className="w-5 h-5 text-green-600" /> </div> <div> <p className="text-sm text-gray-600">Weekly Hours</p> <p className="text-2xl font-semibold">{totalHours.toFixed(1)}</p> </div> </div> </Card>
        {/* Subjects */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-purple-100 rounded-lg p-2"> <BookOpen className="w-5 h-5 text-purple-600" /> </div> <div> <p className="text-sm text-gray-600">Subjects</p> <p className="text-2xl font-semibold">{uniqueSubjects.size}</p> </div> </div> </Card>
        {/* Unavailable Slots */}
        <Card className="p-4"> <div className="flex items-center gap-3"> <div className="bg-orange-100 rounded-lg p-2"> <AlertCircle className="w-5 h-5 text-orange-600" /> </div> <div> <p className="text-sm text-gray-600">Unavailable Slots</p> <p className="text-2xl font-semibold">{unavailableSlots.length}</p> </div> </div> </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              {/* ============================================ */}
              {/* ✅ --- FIX: Dynamic Date Header --- */}
              {/* ============================================ */}
              <h3 className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {/* ============================================ */}
            </div>
            
            <div className="space-y-3">
              {/* ============================================ */}
              {/* ✅ --- FIX: Use dynamic 'todaySchedule' --- */}
              {/* ============================================ */}
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No sessions scheduled for today</p>
                  <p className="text-sm">Enjoy your free day!</p>
                </div>
              ) : (
                todaySchedule.map(session => (
                  <div
                    key={session.id?.toString()}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <span className="text-sm">{session.startTime}</span>
                      <div className="w-0.5 h-6 bg-gray-300"></div>
                      <span className="text-sm text-gray-500">{session.endTime}</span>
                    </div>
                    
                    <div
                      className="w-1 h-full rounded-full min-h-[60px]"
                      style={{ backgroundColor: session.color }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4>{session.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.location}
                          </p>
                        </div>
                        {session.type && <Badge variant="secondary">{session.type}</Badge>}
                      </div>
                      {/* ============================================ */}
                      {/* ✅ --- FIX: Removed Static Faculty Name --- */}
                      {/* ============================================ */}
                      {/* <p className="text-sm text-gray-500 mt-2">
                        Faculty: {session.facultyName} // This was hardcoded
                      </p> 
                      */}
                    </div>
                  </div>
                ))
              )}
              {/* ============================================ */}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Session Distribution */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2"> <BookOpen className="w-4 h-4 text-purple-600" /> Session Types </h3>
            <div className="space-y-3">
              {Object.entries(sessionTypes).map(([type, count]) => (
                count > 0 && ( <div key={type} className="flex items-center justify-between p-2 rounded-lg border border-gray-200"> <span className="text-sm">{type}</span> <Badge variant="outline">{count}</Badge> </div> )
              ))}
               {Object.values(sessionTypes).every(c => c === 0) && <p className="text-sm text-gray-500 text-center py-2">No sessions found</p>}
            </div>
          </Card>

          {/* Unavailability Notice */}
          {unavailableSlots.length > 0 && (
            <Card className="p-6 bg-orange-50 border-orange-200">
              <h3 className="mb-3 flex items-center gap-2"> <AlertCircle className="w-4 h-4 text-orange-600" /> Unavailable Times </h3>
              <div className="space-y-2">
                {unavailableSlots.map(slot => {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // Only 0-4
                  return (
                    slot.dayOfWeek >= 0 && slot.dayOfWeek <= 4 ? // Check for valid day index
                    <div key={slot.id?.toString()} className="text-sm">
                      <p> {days[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime} </p>
                      {slot.reason && ( <p className="text-xs text-orange-700 mt-1">{slot.reason}</p> )}
                    </div>
                    : null
                  );
                })}
              </div>
            </Card>
          )}

          {/* Weekly Summary */}
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="mb-3">Weekly Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"> <span className="text-gray-700">Total Sessions:</span> <span>{schedule.length}</span> </div>
              <div className="flex justify-between"> <span className="text-gray-700">Total Hours:</span> <span>{totalHours.toFixed(1)} hrs</span> </div>
              <div className="flex justify-between"> <span className="text-gray-700">Avg per Day:</span> <span>{(totalHours / 5).toFixed(1)} hrs</span> </div>
              <div className="flex justify-between pt-2 border-t border-green-200"> <span className="flex items-center gap-1"> <CheckCircle2 className="w-3 h-3 text-green-600" /> Status: </span> <span className="text-green-700">Active</span> </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}