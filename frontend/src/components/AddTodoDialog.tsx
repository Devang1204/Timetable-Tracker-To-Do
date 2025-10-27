import { useState, useEffect } from 'react';
// *** Assuming TodoItem and TimetableEntry are defined elsewhere or imported ***
// import { TodoItem, TimetableEntry } from '../App'; 
interface TimetableEntry {
  id?: number | string;
  subject: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  dayOfWeek?: number;
  color?: string;
}
interface TodoItem {
  id?: number | string;
  task?: string; // Optional if using description
  description?: string; // Optional if using task
  due_date?: string; // Optional if using dueDate
  dueDate?: string; // Optional if using due_date
  completed?: boolean;
  linkedClassId?: string;
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
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Ensure onSave expects the correct structure (e.g., description, dueDate)
  onSave: (todoData: { description: string; dueDate: string; completed: boolean; linkedClassId?: string }) => void;
  timetable: TimetableEntry[]; // Make sure TimetableEntry includes 'id' and 'subject'
}

export function AddTodoDialog({ open, onOpenChange, onSave, timetable }: AddTodoDialogProps) {
  const [formData, setFormData] = useState({
    description: '',
    dueDate: '',
    linkedClassId: '', // Keep empty string for initial state (placeholder will show)
  });

   // Reset form when dialog opens or closes
   useEffect(() => {
    if (open) {
      // Reset form when dialog opens
       setFormData({
         description: '',
         dueDate: '',
         linkedClassId: '', // Reset selection
       });
    }
  }, [open]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use 'none' value if linkedClassId is still empty or explicitly 'none'
    const finalLinkedClassId = (!formData.linkedClassId || formData.linkedClassId === "none")
        ? undefined // Send undefined if 'None' was selected or nothing was selected
        : formData.linkedClassId;

    onSave({
      description: formData.description.trim(), // Trim whitespace
      dueDate: formData.dueDate,
      completed: false, // Default completed status
      linkedClassId: finalLinkedClassId,
    });
    // Don't need to reset formData here, useEffect handles it when dialog closes/reopens
    // setFormData({ description: '', dueDate: '', linkedClassId: '' });
    onOpenChange(false); // Close dialog on save
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New To-Do</DialogTitle>
          <DialogDescription>
            Create a new task to track your assignments and activities.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Complete Mathematics homework"
                required
                rows={3}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date" // Use date type for better UX
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            {/* Link to Class */}
            <div className="space-y-2">
              <Label htmlFor="linkedClass">Link to Class (Optional)</Label>
              <Select
                value={formData.linkedClassId} // Controlled component
                onValueChange={(value) => setFormData({ ...formData, linkedClassId: value })}
              >
                <SelectTrigger id="linkedClass">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {/* ============================================ */}
                  {/* ✅ --- FIX: Change value="" to value="none" --- */}
                  {/* ============================================ */}
                  <SelectItem value="none">None</SelectItem>
                  {/* ============================================ */}
                  {(timetable || []).map(classEntry => (
                    // Ensure classEntry.id is a string or number, not undefined/null
                    classEntry.id !== undefined && classEntry.id !== null ? (
                      <SelectItem key={String(classEntry.id)} value={String(classEntry.id)}>
                        {classEntry.subject} ({classEntry.startTime}) {/* Display time for context */}
                      </SelectItem>
                    ) : null // Don't render item if id is missing
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                // No need to reset formData here due to useEffect
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Add To-Do</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}