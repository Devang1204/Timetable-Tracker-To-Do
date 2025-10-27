import { useState, useEffect } from 'react';
// Assuming TA interface is defined correctly elsewhere
// import { TA } from '../FacultyApp';
export interface TA {
  id?: number | string;
  name: string;
  email: string;
  role?: string;
  subjects?: string[];
  color?: string;
  password?: string; // Add password for the form data type
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
import { Badge } from './ui/badge';
import { X, Lock, AlertCircle, Mail, User } from 'lucide-react'; // Added icons

interface AddTADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onSave now expects password
  onSave: (taData: Omit<TA, 'id' | 'role' | 'color'> & { password?: string }) => void;
}

const colors = [
  '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'
];

// Initial state function
const getInitialState = () => ({
  name: '',
  email: '',
  subjects: [] as string[],
  currentSubject: '',
  color: colors[0],
  password: '', // Added password state
  confirmPassword: '' // Added confirm password state
});

export function AddTADialog({ open, onOpenChange, onSave }: AddTADialogProps) {
  const [formData, setFormData] = useState(getInitialState);
  // Add state for form errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialState());
      setErrors({}); // Clear errors too
    }
  }, [open]);

  const handleAddSubject = () => {
    if (formData.currentSubject.trim() && !formData.subjects.includes(formData.currentSubject.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, formData.currentSubject.trim()],
        currentSubject: ''
      });
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter(s => s !== subject)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubject();
    }
  };

  // --- Form Validation ---
  const validateForm = (): boolean => {
      const newErrors: typeof errors = {};
      if (!formData.name.trim()) {
          newErrors.name = 'Full Name is required';
      }
      if (!formData.email.trim()) {
          newErrors.email = 'Email Address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.password) {
          newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) { // Example: min 6 chars
          newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0; // Return true if no errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form before saving
    if (!validateForm()) {
        return; // Stop submission if form is invalid
    }
    // Prepare data to send (including password)
    const dataToSend: Omit<TA, 'id' | 'role' | 'color'> & { password?: string } = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subjects: formData.subjects,
      color: formData.color,
      password: formData.password // Include password
    };
    onSave(dataToSend);
    // No need to reset form here, useEffect handles it
    onOpenChange(false); // Close dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Teaching Assistant</DialogTitle>
          <DialogDescription>
            Add a new TA to help manage your classes and sessions. Set an initial password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  placeholder="e.g., Sarah Mitchell"
                  required
                />
              </div>
               {errors.name && ( <div className="flex items-center gap-1 text-sm text-red-600"> <AlertCircle className="w-3 h-3" /> <span>{errors.name}</span> </div> )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
               <div className="relative">
                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <Input
                   id="email"
                   type="email"
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                   className="pl-10"
                   placeholder="e.g., sarah.mitchell@university.edu"
                   required
                 />
               </div>
               {errors.email && ( <div className="flex items-center gap-1 text-sm text-red-600"> <AlertCircle className="w-3 h-3" /> <span>{errors.email}</span> </div> )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Create Initial Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  placeholder="Enter initial password (min 6 chars)"
                  required
                />
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 text-sm text-red-600"> <AlertCircle className="w-3 h-3" /> <span>{errors.password}</span> </div>
              )}
            </div>
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                  placeholder="Confirm initial password"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 text-sm text-red-600"> <AlertCircle className="w-3 h-3" /> <span>{errors.confirmPassword}</span> </div>
              )}
            </div>


            {/* Subjects/Expertise */}
            <div className="space-y-2">
              <Label htmlFor="subjects">Subjects/Expertise (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="subjects"
                  value={formData.currentSubject}
                  onChange={(e) => setFormData({ ...formData, currentSubject: e.target.value })}
                  onKeyDown={handleKeyPress} // Use onKeyDown for Enter key
                  placeholder="e.g., Calculus I"
                />
                <Button type="button" onClick={handleAddSubject} variant="outline">
                  Add
                </Button>
              </div>
              {formData.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 border border-gray-200 rounded p-2 min-h-[40px]">
                  {formData.subjects.map(subject => (
                    <Badge key={subject} variant="secondary" className="gap-1 items-center py-0.5 px-1.5">
                      <span className="text-xs">{subject}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subject)}
                        className="ml-1 hover:text-red-600 focus:outline-none"
                         aria-label={`Remove subject ${subject}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Assign Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    title={`Select color ${color}`}
                    aria-label={`Select color ${color}`}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                      formData.color === color ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900 scale-110' : 'border-transparent hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}> Cancel </Button>
            <Button type="submit">Add TA</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}