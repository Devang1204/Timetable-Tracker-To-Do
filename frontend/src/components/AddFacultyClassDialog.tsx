import { useState, useEffect } from 'react';
// Assuming FacultyTimetableEntry and TA interfaces are defined/imported correctly
// import { FacultyTimetableEntry, TA } from '../FacultyApp'; // Adjust path if needed
export interface FacultyTimetableEntry {
  id: number | string;
  subject: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  location: string;
  dayOfWeek: number; // 0 = Monday, 1 = Tuesday, etc.
  assignee: string; // 'self' or TA user ID (use string ID for consistency)
  assigneeName?: string;
  assigneeUserId?: number; // Store the actual user ID
  color?: string;
}
export interface TA {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  subjects?: string[];
  color?: string;
  password?: string; // For adding TA form
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
// ============================================
// ✅ --- ADDED authApi Import ---
// ============================================
import * as authApi from '../lib/auth'; // Import the authentication functions

interface AddFacultyClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Ensure onSave expects correct structure (likely needs user_id, role, etc. for backend)
  onSave: (classData: any) => void;
  editingClass?: FacultyTimetableEntry | null;
  tas: TA[];
  facultyUserName: string; // The name of the logged-in faculty member
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

// Default color for faculty's own classes (adjust if needed)
const facultyDefaultColor = '#3b82f6';

export function AddFacultyClassDialog({
  open,
  onOpenChange,
  onSave,
  editingClass,
  tas = [], // Add default empty array
  facultyUserName // Destructure the new prop
}: AddFacultyClassDialogProps) {

  // Function to create initial form state
  const createInitialState = (cls: FacultyTimetableEntry | null) => ({
    subject: cls?.subject || '',
    startTime: cls?.startTime || '',
    endTime: cls?.endTime || '',
    location: cls?.location || '',
    dayOfWeek: cls?.dayOfWeek ?? 0,
    assignee: cls?.assignee || 'self',
    assigneeName: cls?.assignee === 'self' ? facultyUserName : (cls?.assigneeName || facultyUserName),
    color: cls?.color || (cls?.assignee === 'self' ? facultyDefaultColor : '#10b981') // Default color logic
  });

  const [formData, setFormData] = useState(createInitialState(editingClass));

  useEffect(() => {
    // Reset form based on editingClass or default when dialog opens/changes
    setFormData(createInitialState(editingClass));
  }, [editingClass, open, facultyUserName]); // Add facultyUserName dependency

  const handleAssigneeChange = (value: string) => {
    if (value === 'self') {
      setFormData({ ...formData, assignee: 'self', assigneeName: facultyUserName, color: facultyDefaultColor });
    } else {
      const ta = tas.find(t => String(t.id) === value);
      if (ta) {
        setFormData({ ...formData, assignee: value, assigneeName: ta.name, color: ta.color || '#10b981' });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Get the currently logged-in faculty user's ID
    const loggedInFaculty = authApi.getCurrentUser();
    if (!loggedInFaculty || loggedInFaculty.role !== 'faculty') {
        console.error("Cannot save class: Faculty user not found or invalid role.");
        // Optionally show a toast error
        return;
    }
    const loggedInFacultyId = loggedInFaculty.id;


    // Prepare data for backend (needs user_id and role)
    const assigneeUserId = formData.assignee === 'self'
        ? loggedInFacultyId // Use the ID fetched via getCurrentUser
        : parseInt(formData.assignee, 10); // Assuming TA IDs are numbers

    const role = formData.assignee === 'self' ? 'faculty' : 'ta';

    const dataToSend = {
        subject: formData.subject.trim(),
        startTime: formData.startTime, // Assuming this is "HH:MM"
        endTime: formData.endTime,     // Assuming this is "HH:MM"
        dayOfWeek: formData.dayOfWeek,   // Send day index
        location: formData.location.trim() || null, // Send location or null
        user_id: assigneeUserId,
        role: role,
        // color: formData.color // Color is often frontend only, backend might ignore
    };

    // Add validation here if needed before saving
    if (!dataToSend.subject || !dataToSend.startTime || !dataToSend.endTime || dataToSend.dayOfWeek === undefined || !dataToSend.user_id || !dataToSend.role) {
        console.error("Missing required fields for saving class:", dataToSend);
        // Optionally show toast error
        return;
    }


    console.log("Saving Faculty Class:", dataToSend); // Debug log
    onSave(dataToSend); // Send the prepared data
    onOpenChange(false); // Close dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingClass ? 'Edit Class/Session' : 'Add New Class/Session'}</DialogTitle>
          <DialogDescription>
            {editingClass ? 'Update the class or session information below.' : 'Fill in the details to add a new class or TA session to the timetable.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Subject Name */}
            <div className="space-y-2"> <Label htmlFor="subject">Subject Name</Label> <Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Advanced Mathematics" required /> </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select value={formData.assignee} onValueChange={handleAssigneeChange}>
                <SelectTrigger id="assignee">
                  {/* Display selected name */}
                  <SelectValue placeholder="Select Assignee">
                    {formData.assignee === 'self' ? `Myself (${facultyUserName})` : (tas.find(t=> String(t.id) === formData.assignee)?.name + ' (TA)')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Myself ({facultyUserName})</SelectItem>
                  {(tas || []).map(ta => (
                    ta.id !== undefined && ta.id !== null ? (
                      <SelectItem key={String(ta.id)} value={String(ta.id)}>
                        {ta.name} (TA)
                      </SelectItem>
                    ) : null
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day of Week */}
            <div className="space-y-2"> <Label htmlFor="day">Day of Week</Label> <Select value={String(formData.dayOfWeek)} onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value, 10) || 0 })}> <SelectTrigger id="day"> <SelectValue placeholder="Select Day" /> </SelectTrigger> <SelectContent> {days.map(day => ( <SelectItem key={day.value} value={String(day.value)}> {day.label} </SelectItem> ))} </SelectContent> </Select> </div>

            {/* Start/End Time */}
            <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="startTime">Start Time</Label> <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required /> </div> <div className="space-y-2"> <Label htmlFor="endTime">End Time</Label> <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required /> </div> </div>

            {/* Location */}
            <div className="space-y-2"> <Label htmlFor="location">Location</Label> <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Hall A, Room 301" /> </div>
            {/* Removed required from location as backend allows null */}

            {/* Color (Optional - Frontend only) */}
            <div className="space-y-2"> <Label htmlFor="color">Color</Label> <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}> <SelectTrigger id="color"> <SelectValue placeholder="Select Color"/> </SelectTrigger> <SelectContent> {colors.map(color => ( <SelectItem key={color.value} value={color.value}> <div className="flex items-center gap-2"> <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }}/> {color.label} </div> </SelectItem> ))} </SelectContent> </Select> </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}> Cancel </Button>
            <Button type="submit"> {editingClass ? 'Update Session' : 'Add Session'} </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}