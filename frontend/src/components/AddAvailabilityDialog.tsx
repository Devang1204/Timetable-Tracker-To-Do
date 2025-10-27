import { useState } from 'react';
import { AvailabilitySlot, TAScheduleEntry } from '../TADashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (slotData: Omit<AvailabilitySlot, 'id'>) => void;
  schedule: TAScheduleEntry[];
}

const days = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
];

export function AddAvailabilityDialog({ 
  open, 
  onOpenChange, 
  onSave,
  schedule 
}: AddAvailabilityDialogProps) {
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    reason: ''
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const checkConflict = (day: number, start: string, end: string) => {
    const conflicts = schedule.filter(s => {
      if (s.dayOfWeek !== day) return false;
      const sessionStart = parseInt(s.startTime.replace(':', ''));
      const sessionEnd = parseInt(s.endTime.replace(':', ''));
      const slotStart = parseInt(start.replace(':', ''));
      const slotEnd = parseInt(end.replace(':', ''));
      
      return (slotStart < sessionEnd && slotEnd > sessionStart);
    });

    if (conflicts.length > 0) {
      setConflictWarning(`Warning: This overlaps with your scheduled session "${conflicts[0].subject}"`);
    } else {
      setConflictWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      isAvailable: false,
      reason: formData.reason || undefined
    });
    setFormData({
      dayOfWeek: 0,
      startTime: '',
      endTime: '',
      reason: ''
    });
    setConflictWarning(null);
  };

  const handleTimeChange = () => {
    if (formData.startTime && formData.endTime) {
      checkConflict(formData.dayOfWeek, formData.startTime, formData.endTime);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Unavailable Time</DialogTitle>
          <DialogDescription>
            Specify when you're unavailable to help with scheduling future sessions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                value={formData.dayOfWeek.toString()}
                onValueChange={(value) => {
                  setFormData({ ...formData, dayOfWeek: parseInt(value) });
                  handleTimeChange();
                }}
              >
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                    handleTimeChange();
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    handleTimeChange();
                  }}
                  required
                />
              </div>
            </div>

            {conflictWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">{conflictWarning}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Doctor's appointment, Personal commitment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFormData({ dayOfWeek: 0, startTime: '', endTime: '', reason: '' });
                setConflictWarning(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Mark Unavailable</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
