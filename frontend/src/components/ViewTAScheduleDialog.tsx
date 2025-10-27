import { TA, FacultyTimetableEntry } from '../FacultyApp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface ViewTAScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ta: TA | null;
  timetable: FacultyTimetableEntry[];
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function ViewTAScheduleDialog({ 
  open, 
  onOpenChange, 
  ta, 
  timetable 
}: ViewTAScheduleDialogProps) {
  if (!ta) return null;

  const taClasses = timetable
    .filter(c => c.assignee === ta.id)
    .sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ta.color }}
            />
            {ta.name}'s Schedule
          </DialogTitle>
          <DialogDescription>
            {ta.email} • {taClasses.length} {taClasses.length === 1 ? 'class' : 'classes'} assigned
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {taClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No classes assigned yet</p>
              <p className="text-sm">Assign classes to this TA from the TA Management section</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {taClasses.map(classEntry => (
                <div
                  key={classEntry.id}
                  className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4>{classEntry.subject}</h4>
                    <Badge variant="secondary">{days[classEntry.dayOfWeek]}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{classEntry.startTime} - {classEntry.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{classEntry.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {ta.subjects.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Areas of Expertise:</p>
            <div className="flex flex-wrap gap-2">
              {ta.subjects.map(subject => (
                <Badge key={subject} variant="outline">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
