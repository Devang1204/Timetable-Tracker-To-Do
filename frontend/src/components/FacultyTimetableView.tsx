import { useState } from 'react';
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
}


import { Button } from './ui/button';
import { AddFacultyClassDialog } from './AddFacultyClassDialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner'; // Use correct import

interface FacultyTimetableViewProps {
  timetable: FacultyTimetableEntry[];
  tas: TA[];
  onAddClass: (classData: any) => void; // Adjust type based on AddDialog onSave
  onUpdateClass: (id: string | number, classData: any) => void; // Adjust type
  onDeleteClass: (id: string | number) => void;
  // ============================================
  // ✅ --- ADD userName prop ---
  // ============================================
  userName: string; // The logged-in faculty's name
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function FacultyTimetableView({
  timetable,
  tas,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  userName // Destructure the new prop
}: FacultyTimetableViewProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<FacultyTimetableEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | number | null>(null); // Allow number

  const handleEdit = (classEntry: FacultyTimetableEntry) => {
    setEditingClass(classEntry);
    setAddDialogOpen(true); // Open dialog for editing
  };

  const handleDelete = (id: string | number | undefined) => { // Accept undefined for safety
    if (id === undefined) return;
    setClassToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (classToDelete !== null) { // Check for null
      onDeleteClass(classToDelete);
      // Toast moved to parent dashboard handler
    }
    setDeleteDialogOpen(false);
    setClassToDelete(null);
  };

  // Helper to check if a slot is within an entry's time range
  const isTimeWithinEntry = (slotTime: string, entry: FacultyTimetableEntry): boolean => {
    // ... (Keep existing isTimeWithinEntry logic) ...
    if (!entry || !entry.startTime || !entry.endTime) return false;
    try { /* ... time parsing and comparison ... */ } catch { return false; }
  };


  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => { setEditingClass(null); setAddDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Class/TA Session
        </Button>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] border border-gray-200 rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200"></div>
            {days.map(day => ( <div key={day} className="p-3 text-center border-r border-gray-200 last:border-r-0"> <span className="text-sm font-medium">{day}</span> </div> ))}
          </div>

          {/* Time Slots Rows */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-6 border-b border-gray-200 last:border-b-0 min-h-[80px]"> {/* Adjusted height */}
              {/* Time Column Cell */}
              <div className="p-2 border-r border-gray-200 bg-gray-50 flex items-start justify-center"> <span className="text-xs text-gray-500">{time}</span> </div>
              {/* Day Column Cells */}
              {days.map((_, dayIndex) => {
                const classEntryStarting = timetable.find(entry => entry.dayOfWeek === dayIndex && entry.startTime === time);
                const classEntryCovering = timetable.find(entry => entry.dayOfWeek === dayIndex && entry.startTime !== time && isTimeWithinEntry(time, entry));

                if (classEntryCovering) { return ( <div key={`${dayIndex}-${time}`} className="border-r border-gray-200 last:border-r-0 relative"></div> ); }

                let rowSpan = 1;
                if (classEntryStarting) { /* ... keep rowSpan calculation ... */ }

                return (
                  <div key={`${dayIndex}-${time}`} className="border-r border-gray-200 last:border-r-0 relative" style={{ gridRow: classEntryStarting ? `span ${rowSpan}` : 'auto' }}>
                    {classEntryStarting && (
                      <div className="absolute inset-0 rounded-md p-1 text-white overflow-hidden cursor-pointer flex flex-col justify-between group" style={{ backgroundColor: classEntryStarting.color || '#3b82f6' }}>
                        {/* Content */}
                        <div>
                          <div className="text-sm font-semibold truncate">{classEntryStarting.subject}</div>
                          <div className="text-xs opacity-90 truncate">{classEntryStarting.startTime} - {classEntryStarting.endTime}</div>
                          {classEntryStarting.location && <div className="text-xs opacity-90 truncate">{classEntryStarting.location}</div>}
                          {/* Assignee Badge */}
                          <div className="mt-1">
                             <Badge variant="secondary" className="text-xs bg-white/20 hover:bg-white/30 border-white/30 text-white px-1.5 py-0.5">
                               {classEntryStarting.assignee === 'self' ? 'Me' : classEntryStarting.assigneeName}
                             </Badge>
                           </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(classEntryStarting); }} className="bg-white/30 hover:bg-white/50 text-white w-5 h-5 p-0.5 rounded"> <Edit className="w-3 h-3" /> </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(classEntryStarting.id); }} className="bg-white/30 hover:bg-white/50 text-white w-5 h-5 p-0.5 rounded"> <Trash2 className="w-3 h-3" /> </Button>
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

{/* Add/Edit Class Dialog */}
      <AddFacultyClassDialog
        open={addDialogOpen || !!editingClass} // Or however you manage 'open'
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditingClass(null);
        }}
        onSave={(classData) => {
          if (editingClass) {
            onUpdateClass(editingClass.id, classData);
            // toast.success('Class updated successfully!'); // Toast handled in parent
          } else {
            onAddClass(classData);
            // toast.success('Class added successfully!'); // Toast handled in parent
          }
          setAddDialogOpen(false);
          setEditingClass(null);
        }}
        editingClass={editingClass}
        tas={tas}
        // --- ADD THIS LINE --- 👇
        facultyUserName={userName} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader> <AlertDialogTitle>Delete Class</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to delete this class? This action cannot be undone. </AlertDialogDescription> </AlertDialogHeader>
          <AlertDialogFooter> <AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction> </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}