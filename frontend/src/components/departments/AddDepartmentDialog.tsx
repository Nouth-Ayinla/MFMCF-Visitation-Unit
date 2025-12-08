import { useState } from "react";
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

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDepartmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddDepartmentDialogProps) {
  const [departmentName, setDepartmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

    setIsSubmitting(true);

    // Check for duplicate (case-insensitive)
    const { data: existing } = await supabase
      .from("departments")
      .select("id, name")
      .ilike("name", trimmedName)
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

    // Insert new department
    const { error } = await supabase
      .from("departments")
      .insert({ name: trimmedName });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add department. Please try again.",
        variant: "destructive",
      });
    } else {
      setDepartmentName("");
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department to organize members
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
              Add Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
