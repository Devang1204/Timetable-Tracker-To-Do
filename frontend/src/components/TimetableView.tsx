import { useState } from 'react';
// Make sure this interface matches what StudentDashboard provides
interface TimetableViewEntry {
  id?: number | string;
  subject: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  location?: string;
  dayOfWeek?: number; // 0=Monday, 1=Tuesday, etc.
  color?: string;
}

import { Button } from './ui/button';
import { AddClassDialog } from './AddClassDialog';
import { Upload, Plus, Edit, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface TimetableViewProps {
  timetable: TimetableViewEntry[];
  onAddClass: (classData: any) => void;
  onUpdateClass: (id: string | number, classData: any) => void;
  onDeleteClass: (id: string | number) => void;
  onUploadTimetable: (file: File) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function TimetableView({
  timetable,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onUploadTimetable
}: TimetableViewProps) {
  // console.log("Data received by TimetableView:", timetable); // Keep for debugging if needed

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TimetableViewEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | number | null>(null);

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.ics,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onUploadTimetable(file);
      }
    };
    input.click();
  };

  const handleEdit = (classEntry: TimetableViewEntry) => {
    setEditingClass(classEntry);
    setAddDialogOpen(true);
  };

  const handleDelete = (id: string | number | undefined) => {
    if (id === undefined) return;
    setClassToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (classToDelete !== null) {
      onDeleteClass(classToDelete);
    }
    setDeleteDialogOpen(false);
    setClassToDelete(null);
  };

  // Helper to check if a slot is within an entry's time range
  const isTimeWithinEntry = (slotTime: string, entry: TimetableViewEntry): boolean => {
    if (!entry || !entry.startTime || !entry.endTime) return false;
    try {
      const [startH, startM] = entry.startTime.split(':').map(Number);
      const [endH, endM] = entry.endTime.split(':').map(Number);
      const [slotH, slotM] = slotTime.split(':').map(Number);
      if ([startH, startM, endH, endM, slotH, slotM].some(isNaN)) return false;

      const entryStartMinutes = startH * 60 + startM;
      let entryEndMinutes = endH * 60 + endM;
      // Handle midnight crossing if necessary, though unlikely for single day view
      if (entryEndMinutes <= entryStartMinutes) entryEndMinutes += 24 * 60;
      const slotTimeMinutes = slotH * 60 + slotM;

      return slotTimeMinutes >= entryStartMinutes && slotTimeMinutes < entryEndMinutes;
    } catch {
      return false;
    }
  };


  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleUploadClick} variant="outline" className="gap-2">
          <Upload className="w-4 h-4" /> Upload Timetable
        </Button>
        <Button onClick={() => { setEditingClass(null); setAddDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Class Manually
        </Button>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] border border-gray-200 rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200"></div> {/* Time column header */}
            {days.map(day => (
              <div key={day} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                <span className="text-sm font-medium">{day}</span>
              </div>
            ))}
          </div>

          {/* Time Slots Rows */}
          {timeSlots.map((time) => (
            // ============================================
            // ✅ --- Change min-h-[60px] to min-h-[80px] ---
            // ============================================
            <div key={time} className="grid grid-cols-6 border-b border-gray-200 last:border-b-0 min-h-[80px]"> {/* INCREASED HEIGHT */}
            {/* ============================================ */}
              {/* Time Column Cell */}
              <div className="p-2 border-r border-gray-200 bg-gray-50 flex items-start justify-center">
                <span className="text-xs text-gray-500">{time}</span>
              </div>
              {/* Day Column Cells */}
              {days.map((_, dayIndex) => {
                // Find the class that STARTS at this specific dayIndex and time
                const classEntryStarting = timetable.find(entry =>
                  entry.dayOfWeek === dayIndex && entry.startTime === time
                );

                // Find if any class COVERS this slot (started earlier)
                const classEntryCovering = timetable.find(entry =>
                  entry.dayOfWeek === dayIndex &&
                  entry.startTime !== time && // Started before this slot
                  isTimeWithinEntry(time, entry) // But covers this slot
                );

                // Don't render anything if this cell is covered by a previous class
                if (classEntryCovering) {
                  return (
                    <div
                      key={`${dayIndex}-${time}`}
                      className="border-r border-gray-200 last:border-r-0 relative" // Empty cell, part of a larger block
                    ></div>
                  );
                }

                // Calculate row span only if a class starts here
                let rowSpan = 1;
                if (classEntryStarting) {
                   try {
                       const [startH, startM] = classEntryStarting.startTime.split(':').map(Number);
                       const [endH, endM] = classEntryStarting.endTime.split(':').map(Number);
                       const startMinutes = startH * 60 + startM;
                       let endMinutes = endH * 60 + endM;
                       if (endMinutes <= startMinutes) endMinutes += 24*60; // Handle midnight if needed
                       rowSpan = Math.max(1, Math.ceil((endMinutes - startMinutes) / 60)); // Assumes 60 min slots
                   } catch { rowSpan = 1; }
                }

                return (
                  <div
                    key={`${dayIndex}-${time}`}
                    className="border-r border-gray-200 last:border-r-0 relative" // Cell container
                    style={{ gridRow: classEntryStarting ? `span ${rowSpan}` : 'auto' }}
                  >
                    {/* Render the class block only if a class starts here */}
                    {classEntryStarting && (
                      <div
                        className="absolute inset-1 rounded-md p-2 text-white overflow-hidden cursor-pointer flex flex-col justify-between group"
                        style={{ backgroundColor: classEntryStarting.color || '#3b82f6' }}
                      >
                        {/* Content */}
                        <div>
                            <div className="text-sm font-semibold truncate">{classEntryStarting.subject}</div>
                            <div className="text-xs opacity-90 truncate">
                              {classEntryStarting.startTime} - {classEntryStarting.endTime}
                            </div>
                            {classEntryStarting.location && <div className="text-xs opacity-90 truncate">{classEntryStarting.location}</div>}
                        </div>

                        {/* Action Buttons (Always present, hidden by default) */}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost" size="icon"
                            onClick={(e) => { e.stopPropagation(); handleEdit(classEntryStarting); }}
                            className="bg-white/30 hover:bg-white/50 text-white w-5 h-5 p-0.5 rounded"
                          > <Edit className="w-3 h-3" /> </Button>
                          <Button
                             variant="ghost" size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDelete(classEntryStarting.id); }}
                            className="bg-white/30 hover:bg-white/50 text-white w-5 h-5 p-0.5 rounded"
                          > <Trash2 className="w-3 h-3" /> </Button>
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
      <AddClassDialog
        open={addDialogOpen}
        onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setEditingClass(null); }}
        onSave={(classData) => {
          if (editingClass && editingClass.id !== undefined) {
            onUpdateClass(editingClass.id, classData);
          } else {
            onAddClass(classData);
          }
          setAddDialogOpen(false); setEditingClass(null);
        }}
        editingClass={editingClass}
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