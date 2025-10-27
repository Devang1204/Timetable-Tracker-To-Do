import { useState } from 'react';
import { TA, FacultyTimetableEntry } from '../FacultyApp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface AssignTADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tas: TA[];
  timetable: FacultyTimetableEntry[];
  onAssign: (taId: string, classId: string) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function AssignTADialog({ 
  open, 
  onOpenChange, 
  tas, 
  timetable, 
  onAssign 
}: AssignTADialogProps) {
  const [selectedTA, setSelectedTA] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTA && selectedClass) {
      onAssign(selectedTA, selectedClass);
      setSelectedTA('');
      setSelectedClass('');
    }
  };

  const availableClasses = timetable.filter(c => c.assignee === 'self');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign TA to Class</DialogTitle>
          <DialogDescription>
            Select a TA and a class to create an assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ta">Select Teaching Assistant</Label>
              <Select value={selectedTA} onValueChange={setSelectedTA}>
                <SelectTrigger id="ta">
                  <SelectValue placeholder="Choose a TA" />
                </SelectTrigger>
                <SelectContent>
                  {tas.map(ta => (
                    <SelectItem key={ta.id} value={ta.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ta.color }}
                        />
                        {ta.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTA && (
                <div className="text-sm text-gray-600">
                  {tas.find(t => t.id === selectedTA)?.subjects.map(subject => (
                    <Badge key={subject} variant="secondary" className="mr-1 text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No classes available for assignment
                    </div>
                  ) : (
                    availableClasses.map(classEntry => (
                      <SelectItem key={classEntry.id} value={classEntry.id}>
                        <div className="flex flex-col">
                          <span>{classEntry.subject}</span>
                          <span className="text-xs text-gray-500">
                            {days[classEntry.dayOfWeek]} • {classEntry.startTime}-{classEntry.endTime} • {classEntry.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {availableClasses.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  All your classes are already assigned to TAs. You need to have classes assigned to yourself to delegate them.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedTA('');
                setSelectedClass('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedTA || !selectedClass}>
              Assign TA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
