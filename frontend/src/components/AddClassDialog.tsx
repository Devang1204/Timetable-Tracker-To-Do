import { useState, useEffect } from 'react';
// *** Assuming TimetableEntry is defined elsewhere or import if needed ***
// import { TimetableEntry } from '../App'; // Or wherever it's defined

// Interface matching the expected structure for onSave, maybe defined elsewhere
interface TimetableEntryData {
  subject: string;
  start_time: string; // Use snake_case
  end_time: string;   // Use snake_case
  location?: string;
  dayOfWeek?: number; // Keep camelCase if TimetableEntry uses it, or adjust
  color?: string;
}

// Interface for the actual TimetableEntry used for editing state
interface TimetableEntry {
  id: number | string;
  subject: string;
  startTime: string; // May use camelCase internally
  endTime: string;   // May use camelCase internally
  location: string;
  dayOfWeek: number;
  color?: string;
}


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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Make onSave expect the backend-compatible structure
  onSave: (classData: TimetableEntryData) => void;
  editingClass?: TimetableEntry | null;
}

const days = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
];

const colors = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#06b6d4', label: 'Cyan' },
];

export function AddClassDialog({ open, onOpenChange, onSave, editingClass }: AddClassDialogProps) {
  // State uses camelCase for form consistency
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    location: '',
    dayOfWeek: 0,
    color: '#3b82f6'
  });

  useEffect(() => {
    if (editingClass) {
      setFormData({
        subject: editingClass.subject,
        startTime: editingClass.startTime, // Use camelCase from editing state
        endTime: editingClass.endTime,     // Use camelCase from editing state
        location: editingClass.location,
        dayOfWeek: editingClass.dayOfWeek,
        color: editingClass.color || '#3b82f6'
      });
    } else {
      // Reset form
      setFormData({
        subject: '',
        startTime: '',
        endTime: '',
        location: '',
        dayOfWeek: 0,
        color: '#3b82f6'
      });
    }
  }, [editingClass, open]); // Depend on editingClass and open

  // ============================================
  // ✅ --- THIS FUNCTION IS NOW FIXED ---
  // ============================================
  // Inside AddClassDialog.tsx

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create the object to send to the backend
    // Use the exact names the backend route expects (dayOfWeek, startTime, endTime)
    const dataToSend = {
        subject: formData.subject,
        dayOfWeek: formData.dayOfWeek,     // Include dayOfWeek (as index 0-4)
        startTime: formData.startTime,   // Include startTime (as "HH:MM")
        endTime: formData.endTime,       // Include endTime (as "HH:MM")
        location: formData.location || null, // Send location or null
        role: 'student'                     // Assuming role is always student here
        // Color is not needed by the backend for POST
    };

    // --- Add a console log here to see exactly what's being sent ---
    console.log("Submitting manual class:", dataToSend); 
    // --- End console log ---

    onSave(dataToSend); // Send the data
  };
  // ============================================


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          <DialogDescription>
            {editingClass
              ? 'Update the class information below.'
              : 'Fill in the details to add a new class to your timetable.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Subject Name Input */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Name</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics"
                required
              />
            </div>

            {/* Day of Week Select */}
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                // value={formData.dayOfWeek.toString()} // Keep using dayOfWeek for state
                // onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                 value={String(formData.dayOfWeek)} // Ensure value is a string for Select
                 onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value, 10) || 0 })}
              >
                <SelectTrigger id="day">
                   {/* Display selected day label */}
                   <SelectValue placeholder="Select a day">
                    {days.find(d => d.value === formData.dayOfWeek)?.label}
                  </SelectValue>
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


            {/* Start and End Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime} // Use camelCase state variable
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime} // Use camelCase state variable
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room 301"
                // Make location optional if your backend allows null
                // required
              />
            </div>

             {/* Color Select */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger id="color">
                   {/* Display selected color swatch and label */}
                  <SelectValue placeholder="Select a color">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.color }}/>
                      {colors.find(c => c.value === formData.color)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colors.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingClass ? 'Update Class' : 'Add Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}