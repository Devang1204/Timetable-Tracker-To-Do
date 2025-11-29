import { useState } from 'react';
import { TAScheduleEntry, AvailabilitySlot } from '../TADashboard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AddAvailabilityDialog } from './AddAvailabilityDialog';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

interface TAAvailabilityProps {
  schedule: TAScheduleEntry[];
  availability: AvailabilitySlot[];
  onAddAvailability: (slot: Omit<AvailabilitySlot, 'id'>) => void;
  onRemoveAvailability: (id: string) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function TAAvailability({ 
  schedule, 
  availability, 
  onAddAvailability, 
  onRemoveAvailability 
}: TAAvailabilityProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setSlotToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (slotToDelete) {
      onRemoveAvailability(slotToDelete);
      toast.success('Availability slot removed successfully!');
    }
    setDeleteDialogOpen(false);
    setSlotToDelete(null);
  };

  const unavailableSlots = availability.filter(a => !a.isAvailable);

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 mb-1">
              Manage Your Availability
            </p>
            <p className="text-xs text-blue-700">
              Mark times when you're unavailable to help with scheduling. Faculty will be notified of your unavailable slots.
            </p>
          </div>
        </div>
      </Card>

      {/* Action Button */}
      <div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Mark Unavailable Time
        </Button>
      </div>

      {/* Current Availability Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Sessions */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Your Scheduled Sessions
          </h3>
          <div className="space-y-2">
            {schedule.length === 0 ? (
              <p className="text-sm text-gray-500">No sessions assigned yet</p>
            ) : (
              schedule.map(session => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: session.color }}
                    />
                    <span className="text-sm">{session.subject}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {days[session.dayOfWeek]} • {session.startTime} - {session.endTime}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Unavailable Times */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Marked Unavailable
          </h3>
          <div className="space-y-2">
            {unavailableSlots.length === 0 ? (
              <p className="text-sm text-gray-500">
                No unavailable times marked. You're available for all time slots.
              </p>
            ) : (
              unavailableSlots.map(slot => (
                <div
                  key={slot.id}
                  className="p-3 rounded-lg border border-orange-200 bg-orange-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">
                          {days[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      {slot.reason && (
                        <p className="text-xs text-orange-700">{slot.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Weekly Availability Overview */}
      <Card className="p-6">
        <h3 className="mb-4">Weekly Availability Overview</h3>
        <div className="space-y-3">
          {days.map((day, dayIndex) => {
            const daySchedule = schedule.filter(s => s.dayOfWeek === dayIndex);
            const dayUnavailable = unavailableSlots.filter(s => s.dayOfWeek === dayIndex);
            
            return (
              <div key={day} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                <div className="w-24">
                  <span className="text-sm">{day}</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {daySchedule.length === 0 && dayUnavailable.length === 0 ? (
                    <Badge variant="outline" className="text-xs">
                      Fully Available
                    </Badge>
                  ) : (
                    <>
                      {daySchedule.map(session => (
                        <Badge key={session.id} variant="secondary" className="text-xs">
                          {session.startTime}-{session.endTime}: Scheduled
                        </Badge>
                      ))}
                      {dayUnavailable.map(slot => (
                        <Badge key={slot.id} variant="destructive" className="text-xs bg-orange-500">
                          {slot.startTime}-{slot.endTime}: Unavailable
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Availability Dialog */}
      <AddAvailabilityDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={(slotData) => {
          onAddAvailability(slotData);
          toast.success('Unavailable time marked successfully!');
          setAddDialogOpen(false);
        }}
        schedule={schedule}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Unavailable Time</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this unavailable time slot? You will be marked as available during this time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
