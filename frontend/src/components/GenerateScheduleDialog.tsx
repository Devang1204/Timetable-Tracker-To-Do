import { useState, useEffect } from 'react';
// Assuming TA interface is defined/imported correctly
// import { TA } from '../FacultyDashboard'; // Adjust path if needed
export interface TA { id: number | string; name: string; email: string; role?: string; subjects?: string[]; color?: string; }


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
// ✅ --- Import Textarea ---
import { Textarea } from './ui/textarea'; // Import Textarea
import { toast } from 'sonner';
// Import auth function to get current user ID easily
import { getCurrentUser } from '../lib/auth';

interface GenerateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tas: TA[]; // List of available TAs
  // Function called when Generate button is clicked
  onGenerate: (constraints: {
    assigneeUserId: number | string; // ID of TA or faculty's own ID
    subjects: string[];
    targetRole: 'faculty' | 'ta'; // Role of the assignee
    // Add other optional constraints if needed later
  }) => void;
  // Pass faculty name for the dropdown
  facultyUserName: string;
}

// No longer need ALL_POSSIBLE_SUBJECTS

export function GenerateScheduleDialog({
  open,
  onOpenChange,
  tas,
  onGenerate,
  facultyUserName
}: GenerateScheduleDialogProps) {

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('self'); // 'self' or TA ID (string)
  // ============================================
  // ✅ --- State for subjects input ---
  // ============================================
  const [subjectsString, setSubjectsString] = useState<string>(''); // Store subjects as comma-separated string

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedAssigneeId('self');
      setSubjectsString(''); // Reset subjects input
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ============================================
    // ✅ --- Split subjects string into array ---
    // ============================================
    const subjectsArray = subjectsString
                          .split(',') // Split by comma
                          .map(s => s.trim()) // Remove whitespace around each subject
                          .filter(s => s !== ''); // Remove any empty strings

    // Validation
    if (subjectsArray.length === 0) {
      toast.error("Please enter at least one subject, separated by commas.");
      return;
    }
    if (!selectedAssigneeId) {
        toast.error("Please select who the schedule is for.");
        return;
    }

    const currentUser = getCurrentUser(); // Get logged-in faculty details
    const facultyId = currentUser?.id;

    if (selectedAssigneeId === 'self' && !facultyId) {
         toast.error("Could not determine your user ID. Please log in again.");
         return;
    }

    // Ensure assigneeUserId is correctly typed (number | string) based on what backend expects
    const assigneeUserId: number | string = selectedAssigneeId === 'self' ? facultyId! : selectedAssigneeId;
    const targetRole: 'faculty' | 'ta' = selectedAssigneeId === 'self' ? 'faculty' : 'ta';

    // Prepare constraints object
    const constraints = {
      assigneeUserId: assigneeUserId,
      subjects: subjectsArray, // Use the processed array
      targetRole: targetRole,
      // Add other constraints here if you add form fields for them
    };

    console.log("Generating schedule with constraints:", constraints); // Debug log
    onGenerate(constraints); // Call the handler passed from parent
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Generate Optimal Schedule</DialogTitle>
          <DialogDescription>
            Select the assignee and enter the subjects (comma-separated), and the AI will generate a schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">

            {/* Assignee Selection */}
            <div className="space-y-2">
              <Label htmlFor="assignee-schedule">Generate Schedule For</Label>
              <Select
                value={selectedAssigneeId}
                onValueChange={(value) => setSelectedAssigneeId(value)}
              >
                <SelectTrigger id="assignee-schedule">
                  <SelectValue placeholder="Select Assignee" />
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

            {/* ============================================ */}
            {/* ✅ --- Subject Input (Textarea) --- */}
            {/* ============================================ */}
            <div className="space-y-2">
              <Label htmlFor="subjects-input">Subjects to Include (comma-separated)</Label>
              <Textarea
                id="subjects-input"
                value={subjectsString}
                onChange={(e) => setSubjectsString(e.target.value)}
                placeholder="e.g., Calculus I, Advanced Mathematics, Linear Algebra"
                rows={3} // Adjust height as needed
                required // Make input required
              />
               {subjectsString.trim() === '' && ( // Show hint if empty
                   <p className="text-xs text-muted-foreground">Enter at least one subject.</p>
              )}
            </div>
            {/* ============================================ */}


            {/* Optional: Add fields for preferred days/times, other notes later */}

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Generate Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}