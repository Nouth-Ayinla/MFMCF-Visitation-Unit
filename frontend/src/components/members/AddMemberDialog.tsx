import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number must be less than 20 digits"),
  date_of_birth: z.string().regex(/^\d{2}-\d{2}$/, "Date must be in MM-DD format"),
  gender: z.enum(["Male", "Female"]).optional(),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  department_id: z.string().optional(),
  level_id: z.string().optional(),
  is_first_timer: z.boolean(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMemberDialog({ open, onOpenChange, onSuccess }: AddMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [levels, setLevels] = useState<{ id: string; level_number: string }[]>([]);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      is_first_timer: false,
      full_name: "",
      phone_number: "",
      date_of_birth: "",
      address: "",
    },
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;
  
  const { clearSavedData } = useFormAutoSave({
    form,
    key: "add_member",
  });

  const watchedGender = watch("gender");
  const watchedDepartment = watch("department_id");
  const watchedLevel = watch("level_id");

  useEffect(() => {
    loadDepartmentsAndLevels();
  }, []);

  const loadDepartmentsAndLevels = async () => {
    const [deptResult, levelResult] = await Promise.all([
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("levels").select("id, level_number").order("level_number"),
    ]);

    if (deptResult.data) setDepartments(deptResult.data);
    if (levelResult.data) setLevels(levelResult.data);
  };

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("members").insert({
        full_name: data.full_name,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        gender: data.gender || null,
        address: data.address || null,
        department_id: data.department_id || null,
        level_id: data.level_id || null,
        is_first_timer: data.is_first_timer,
        promoted_to_member_at: data.is_first_timer ? null : new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Member added successfully!");
      clearSavedData();
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to add member: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input id="phone_number" {...register("phone_number")} />
              {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number.message}</p>}
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth (MM-DD) *</Label>
              <Input id="date_of_birth" type="text" placeholder="MM-DD" {...register("date_of_birth")} />
              {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>}
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={watchedGender || ""} onValueChange={(value) => setValue("gender", value as "Male" | "Female")}>
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
              <Label htmlFor="department_id">Department</Label>
              <Select value={watchedDepartment || ""} onValueChange={(value) => setValue("department_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label htmlFor="level_id">Level</Label>
              <Select value={watchedLevel || ""} onValueChange={(value) => setValue("level_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.level_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="is_first_timer" className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="is_first_timer" {...register("is_first_timer")} className="h-4 w-4" />
                <span>Mark as First-Timer</span>
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
