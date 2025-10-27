import { useState } from 'react';
// Import interfaces from where they are defined (e.g., App.tsx or a types file)
import { TodoItem, TimetableEntry } from '../App'; // Adjust path if needed
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { AddTodoDialog } from './AddTodoDialog';
import { Plus, Trash2, Filter, Calendar } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';

interface TodoListProps {
  todos: TodoItem[];
  timetable: TimetableEntry[];
  onAddTodo: (todoData: { description: string; dueDate: string; completed: boolean; linkedClassId?: string }) => void; // Match AddTodoDialog onSave
  onToggleTodo: (id: string | number) => void; // Allow number or string ID
  onDeleteTodo: (id: string | number) => void; // Allow number or string ID
}

type FilterType = 'all' | 'pending' | 'completed' | 'today' | 'upcoming';

// Helper to safely format date string
function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'No Due Date';
    try {
        // Attempt to create a date object. Handle potential invalid strings.
        const date = new Date(dateString);
        // Check if the date object is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        // Format the valid date
        return date.toLocaleDateString('en-GB', { // Example: 23/10/2025
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
}


export function TodoList({ todos = [], timetable = [], onAddTodo, onToggleTodo, onDeleteTodo }: TodoListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | number | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const handleDelete = (id: string | number | undefined) => { // Accept id
    if (id === undefined) return;
    setTodoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (todoToDelete !== null) {
      onDeleteTodo(todoToDelete);
      // Toast moved to StudentDashboard handler
    }
    setDeleteDialogOpen(false);
    setTodoToDelete(null);
  };

  const getLinkedClassName = (linkedClassId?: string) => {
    if (!linkedClassId || !Array.isArray(timetable)) return null;
    const linkedClass = timetable.find(c => String(c.id) === linkedClassId); // Ensure comparison works
    return linkedClass?.subject;
  };

  // Helper functions for date checks (ensure date strings are valid)
  const isToday = (dateString: string | undefined): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false; // Check for invalid date
      const today = new Date(); // Use current date for comparison
      today.setHours(0, 0, 0, 0); // Normalize today to start of day
      date.setHours(0,0,0,0); // Normalize task date to start of day
      return date.getTime() === today.getTime();
    } catch { return false; }
  };

  const isUpcoming = (dateString: string | undefined): boolean => {
     if (!dateString) return false;
     try {
       const date = new Date(dateString);
       if (isNaN(date.getTime())) return false; // Check for invalid date
       const today = new Date();
       today.setHours(0, 0, 0, 0); // Normalize today to start of day
       date.setHours(0,0,0,0); // Normalize task date to start of day
       return date > today;
     } catch { return false; }
  };

  const filteredTodos = (todos || []).filter(todo => {
    // Add checks for todo.completed and todo.dueDate existence
    const dueDate = todo.dueDate || todo.due_date; // Use whichever field exists
    const completed = todo.completed ?? false; // Default to false if missing

    switch (filter) {
      case 'pending':
        return !completed;
      case 'completed':
        return completed;
      case 'today':
        return isToday(dueDate) && !completed;
      case 'upcoming':
        return isUpcoming(dueDate) && !completed;
      default: // 'all'
        return true;
    }
  });

  // Sort todos safely
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const aCompleted = a.completed ?? false;
    const bCompleted = b.completed ?? false;
    const aDueDate = a.dueDate || a.due_date;
    const bDueDate = b.dueDate || b.due_date;

    // Sort completed tasks to the bottom
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }
    // Sort by due date (handle potentially missing dates)
    const dateA = aDueDate ? new Date(aDueDate).getTime() : Infinity;
    const dateB = bDueDate ? new Date(bDueDate).getTime() : Infinity;
     if (isNaN(dateA) && isNaN(dateB)) return 0; // Both invalid, treat as equal
     if (isNaN(dateA)) return 1; // Invalid date goes to bottom
     if (isNaN(dateB)) return -1; // Invalid date goes to bottom
    return dateA - dateB;
  });

  const getDueDateBadge = (dueDate: string | undefined, completed: boolean | undefined) => {
    if (completed || !dueDate) return null;

    try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return null; // Don't show badge for invalid dates

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today
        date.setHours(0, 0, 0, 0); // Normalize due date

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
        } else if (diffDays === 0) {
          return <Badge variant="default" className="text-xs bg-orange-500">Today</Badge>;
        } else if (diffDays === 1) {
          return <Badge variant="secondary" className="text-xs">Tomorrow</Badge>;
        } else if (diffDays <= 3) {
          return <Badge variant="secondary" className="text-xs">{diffDays} days</Badge>;
        }
        return null; // Don't show badge if due date is far away
    } catch {
        return null; // Don't show badge if date parsing fails
    }
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'today': return 'Due Today';
      case 'upcoming': return 'Upcoming';
      default: return 'All Tasks';
    }
  };


  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-between">
         <DropdownMenu>
            {/* ============================================ */}
            {/* ✅ --- FIX: Added asChild prop back --- */}
            {/* ============================================ */}
            <DropdownMenuTrigger asChild>
            {/* ============================================ */}
                <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" /> {getFilterLabel()}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilter('all')}> All Tasks </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('pending')}> Pending </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('completed')}> Completed </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('today')}> Due Today </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('upcoming')}> Upcoming </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add To-Do
        </Button>
      </div>

      {/* To-Do List */}
      <div className="space-y-2">
        {sortedTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks found for "{getFilterLabel()}" filter</p>
            <p className="text-sm">Add your first to-do to get started!</p>
          </div>
        ) : (
          sortedTodos.map(todo => {
            // Ensure todo.id is defined before rendering
            if (todo.id === undefined || todo.id === null) return null;

            const displayDueDate = todo.dueDate || todo.due_date; // Use available date field
            const displayTask = todo.description || todo.task || 'No description'; // Use available task field
            const isCompleted = todo.completed ?? false; // Default to false

            return (
              <div
                key={todo.id.toString()} // Use toString() for key safety
                className={`border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                  isCompleted ? 'bg-gray-50/50 opacity-70' : 'bg-white' // Style completed tasks
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isCompleted}
                    // Make sure onToggleTodo can handle string or number ID
                    onCheckedChange={() => onToggleTodo(todo.id!)} // Use non-null assertion
                    className="mt-1 flex-shrink-0" // Prevent checkbox shrinking
                    aria-label={`Mark task "${displayTask}" as ${isCompleted ? 'incomplete' : 'complete'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {displayTask}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap"> {/* Adjusted margin */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {/* Use the formatDate helper */}
                        {formatDate(displayDueDate)}
                      </div>
                      {getDueDateBadge(displayDueDate, isCompleted)}
                      {getLinkedClassName(todo.linkedClassId) && (
                        <Badge variant="outline" className="text-xs truncate max-w-[100px]"> {/* Add truncation */}
                          {getLinkedClassName(todo.linkedClassId)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon" // Use icon size for consistency
                    // Make sure handleDelete can handle string or number ID
                    onClick={() => handleDelete(todo.id!)} // Use non-null assertion
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 flex-shrink-0" // Prevent button shrinking
                    aria-label={`Delete task "${displayTask}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add To-Do Dialog */}
      <AddTodoDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={onAddTodo} // Pass the handler directly
        timetable={timetable}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader> <AlertDialogTitle>Delete To-Do</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to delete this task? This action cannot be undone. </AlertDialogDescription> </AlertDialogHeader>
          <AlertDialogFooter> <AlertDialogCancel onClick={() => setTodoToDelete(null)}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction> </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}