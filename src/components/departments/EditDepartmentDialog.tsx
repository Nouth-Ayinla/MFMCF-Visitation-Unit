import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface EditDepartmentDialogProps {
  department: Department;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditDepartmentDialog({
  department,
  open,
  onOpenChange,
  onSuccess,
}: EditDepartmentDialogProps) {
  const [departmentName, setDepartmentName] = useState(department.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setDepartmentName(department.name);
  }, [department.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = departmentName.trim();
    if (!trimmedName) {
      toast({
        title: "Validation Error",
        description: "Department name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (trimmedName.length > 100) {
      toast({
        title: "Validation Error",
        description: "Department name must be less than 100 characters",
        variant: "destructive",
      });
      return;
    }

    // No change made
    if (trimmedName === department.name) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    // Check for duplicate (case-insensitive), excluding current department
    const { data: existing } = await supabase
      .from("departments")
      .select("id, name")
      .ilike("name", trimmedName)
      .neq("id", department.id)
      .maybeSingle();

    if (existing) {
      toast({
        title: "Department Exists",
        description: `A department named "${existing.name}" already exists`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Update department
    const { error } = await supabase
      .from("departments")
      .update({ name: trimmedName })
      .eq("id", department.id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
    } else {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department name
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="department-name">Department Name</Label>
            <Input
              id="department-name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="e.g., Computer Science"
              className="mt-2"
              maxLength={100}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
