import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Member {
  id: string;
  full_name: string;
  phone_number: string;
  address: string | null;
  date_of_birth: string;
  gender: string | null;
  level_id: string | null;
  department_id: string | null;
  department_other: string | null;
  is_first_timer: boolean;
  departments?: { name: string; id: string } | null;
  levels?: { level_number: string; id: string } | null;
}

interface EditMemberDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const memberSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(100),
  phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15),
  address: z.string().trim().max(200).optional(),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  level_id: z.string().optional(),
  department_id: z.string().optional(),
  department_other: z.string().trim().max(100).optional(),
});

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: EditMemberDialogProps) {
  const [formData, setFormData] = useState({
    full_name: member.full_name,
    phone_number: member.phone_number,
    address: member.address || "",
    date_of_birth: member.date_of_birth,
    gender: member.gender || "",
    level_id: member.level_id || "",
    department_id: member.department_id || "",
    department_other: member.department_other || "",
  });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [levels, setLevels] = useState<{ id: string; level_number: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    setFormData({
      full_name: member.full_name,
      phone_number: member.phone_number,
      address: member.address || "",
      date_of_birth: member.date_of_birth,
      gender: member.gender || "",
      level_id: member.level_id || "",
      department_id: member.department_id || "",
      department_other: member.department_other || "",
    });
  }, [member]);

  const loadDropdownData = async () => {
    const [deptData, levelData] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("levels").select("*").order("level_number"),
    ]);

    if (deptData.data) setDepartments(deptData.data);
    if (levelData.data) setLevels(levelData.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = memberSchema.parse(formData);

      const updateData = {
        full_name: validatedData.full_name,
        phone_number: validatedData.phone_number,
        address: validatedData.address || null,
        date_of_birth: validatedData.date_of_birth,
        gender: validatedData.gender,
        level_id: validatedData.level_id || null,
        department_id: validatedData.department_id === "other" ? null : (validatedData.department_id || null),
        department_other: validatedData.department_id === "other" ? validatedData.department_other : null,
      };

      const { error } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update member",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level_id">Level</Label>
              <Select
                value={formData.level_id}
                onValueChange={(value) => setFormData({ ...formData, level_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.level_number} Level
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department_id">Department</Label>
              <Select
                value={formData.department_id || "other"}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.department_id === "other" && (
              <div className="md:col-span-2">
                <Label htmlFor="department_other">Specify Department</Label>
                <Input
                  id="department_other"
                  value={formData.department_other}
                  onChange={(e) => setFormData({ ...formData, department_other: e.target.value })}
                  placeholder="Enter department name"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
