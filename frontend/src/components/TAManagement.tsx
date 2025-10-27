import { useState } from 'react';
// Assuming TA and FacultyTimetableEntry interfaces are defined/imported correctly
// import { TA, FacultyTimetableEntry } from '../FacultyApp'; // Adjust path if needed
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
  subjects?: string[]; // Frontend concept
  color?: string; // Frontend concept
}


import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AddTADialog } from './AddTADialog';
import { AssignTADialog } from './AssignTADialog';
import { ViewTAScheduleDialog } from './ViewTAScheduleDialog';
import { Plus, UserPlus, Calendar, Trash2, Mail } from 'lucide-react';
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
import { toast } from 'sonner'; // Use correct import

interface TAManagementProps {
  tas: TA[]; // This might be undefined initially
  timetable: FacultyTimetableEntry[];
  onAddTA: (taData: Omit<TA, 'id' | 'role' | 'color'>) => void; // Adjust type based on AddTADialog
  onRemoveTA: (taId: string | number) => void; // Allow number ID
  onAssignTA: (taId: string | number, classId: string | number) => void; // Allow number IDs
}

export function TAManagement({
  tas, // Removed default [] here, handle check below
  timetable,
  onAddTA,
  onRemoveTA,
  onAssignTA
}: TAManagementProps) {
  const [addTADialogOpen, setAddTADialogOpen] = useState(false);
  const [assignTADialogOpen, setAssignTADialogOpen] = useState(false);
  const [viewScheduleDialogOpen, setViewScheduleDialogOpen] = useState(false);
  const [selectedTA, setSelectedTA] = useState<TA | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taToDelete, setTAToDelete] = useState<string | number | null>(null); // Allow number

  const handleViewSchedule = (ta: TA) => {
    setSelectedTA(ta);
    setViewScheduleDialogOpen(true);
  };

  const handleDeleteTA = (taId: string | number | undefined) => { // Accept undefined
    if (taId === undefined) return;
    setTAToDelete(taId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taToDelete !== null) { // Check explicitly
      onRemoveTA(taToDelete);
      // Toast moved to parent dashboard handler
    }
    setDeleteDialogOpen(false);
    setTAToDelete(null);
  };

  // Calculate stats safely
  const activeTAsCount = (tas || []).filter(ta => (timetable || []).some(c => String(c.assigneeUserId) === String(ta.id))).length;
  const totalTASessions = (timetable || []).filter(c => c.assignee !== 'self').length;
  const avgLoad = (tas && tas.length > 0) ? Math.round(totalTASessions / tas.length) : 0;


  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setAddTADialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add TA
        </Button>
        <Button onClick={() => setAssignTADialogOpen(true)} variant="outline" className="gap-2" disabled={!tas || tas.length === 0 || !timetable || timetable.length === 0}> {/* Disable if no TAs or classes */}
          <UserPlus className="w-4 h-4" />
          Assign TA to Class
        </Button>
      </div>

      {/* TA List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ============================================ */}
        {/* ✅ --- FIX: Added safety check (tas || []) --- */}
        {/* ============================================ */}
        {(!tas || tas.length === 0) ? (
        // ============================================
          <Card className="p-8 col-span-full text-center">
            <div className="text-gray-400 mb-3"> <UserPlus className="w-12 h-12 mx-auto" /> </div>
            <p className="text-gray-600 mb-2">No Teaching Assistants Added</p>
            <p className="text-sm text-gray-500 mb-4"> Add TAs to help manage your classes and sessions </p>
            <Button onClick={() => setAddTADialogOpen(true)} className="gap-2"> <Plus className="w-4 h-4" /> Add Your First TA </Button>
          </Card>
        ) : (
          // Use (tas || []) to ensure map works even if tas is briefly null/undefined
          (tas || []).map(ta => {
            // Ensure timetable is also checked
            const assignedClasses = (timetable || []).filter(c => String(c.assigneeUserId) === String(ta.id)); // Compare as strings

            return (
              <Card key={String(ta.id)} className="p-5 hover:shadow-md transition-shadow flex flex-col"> {/* Use flex col */}
                {/* Top Section */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0"> {/* Allow shrinking */}
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ta.color || defaultTaColor }} />
                    <h3 className="font-medium truncate">{ta.name}</h3> {/* Truncate name */}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTA(ta.id)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Middle Section */}
                <div className="space-y-2 mb-4 flex-1"> {/* Allow middle to grow */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{ta.email}</span>
                  </div>
                  {/* Subjects/Expertise */}
                  {Array.isArray(ta.subjects) && ta.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ta.subjects.map(subject => (
                        <Badge key={subject} variant="secondary" className="text-xs font-normal"> {/* Adjusted style */}
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Section */}
                <div className="pt-3 border-t border-gray-200 mt-auto"> {/* Push to bottom */}
                  <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                    <span>Assigned Classes</span>
                    <Badge variant="outline">{assignedClasses.length}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewSchedule(ta)} className="w-full gap-2">
                    <Calendar className="w-4 h-4" /> View Schedule
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Section */}
      {(tas && tas.length > 0) && (
        <Card className="p-4 bg-blue-50 border-blue-200"> {/* Adjusted padding */}
          <h3 className="mb-3 text-base font-medium">TA Statistics</h3> {/* Adjusted size */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div> <p className="text-xs text-gray-600">Total TAs</p> <p className="text-xl font-semibold">{tas.length}</p> </div>
            <div> <p className="text-xs text-gray-600">TA Sessions</p> <p className="text-xl font-semibold">{totalTASessions}</p> </div>
            <div> <p className="text-xs text-gray-600">Active TAs</p> <p className="text-xl font-semibold">{activeTAsCount}</p> </div>
            <div> <p className="text-xs text-gray-600">Avg Load/TA</p> <p className="text-xl font-semibold">{avgLoad}</p> </div>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <AddTADialog
        open={addTADialogOpen}
        onOpenChange={setAddTADialogOpen}
        // Pass the correct onAddTA handler from props
        onSave={onAddTA}
      />

      <AssignTADialog
        open={assignTADialogOpen}
        onOpenChange={setAssignTADialogOpen}
        tas={tas || []} // Pass empty array if tas is null/undefined
        timetable={timetable || []} // Pass empty array if timetable is null/undefined
        // Pass the correct onAssignTA handler
        onAssign={onAssignTA}
      />

      {/* Ensure ViewTAScheduleDialog handles null TA safely if needed */}
      <ViewTAScheduleDialog
        open={viewScheduleDialogOpen}
        onOpenChange={setViewScheduleDialogOpen}
        ta={selectedTA}
        timetable={timetable || []} // Pass timetable data needed for display
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader> <AlertDialogTitle>Remove TA</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to remove this TA? Check class assignments first. </AlertDialogDescription> </AlertDialogHeader>
          <AlertDialogFooter> <AlertDialogCancel onClick={() => setTAToDelete(null)}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction> </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}