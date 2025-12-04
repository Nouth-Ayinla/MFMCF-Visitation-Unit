import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  how_did_you_hear: string | null;
  is_first_timer: boolean;
  promoted_to_member_at: string | null;
  registered_at: string;
  departments?: { name: string; id: string } | null;
  levels?: { level_number: string; id: string } | null;
}

interface MemberDetailsDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDetailsDialog({
  member,
  open,
  onOpenChange,
}: MemberDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {member.full_name}
            {member.is_first_timer ? (
              <Badge variant="secondary">First-Timer</Badge>
            ) : (
              <Badge>Member</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
            <p className="text-base">{member.phone_number}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
            <p className="text-base">{new Date(member.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <p className="text-base">{member.gender || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Level</p>
            <p className="text-base">{member.levels?.level_number || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Department</p>
            <p className="text-base">
              {member.departments?.name || member.department_other || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">How Did You Hear</p>
            <p className="text-base">{member.how_did_you_hear || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="text-base">{member.address || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
            <p className="text-base">{new Date(member.registered_at).toLocaleDateString()}</p>
          </div>
          {member.promoted_to_member_at && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Promoted to Member</p>
              <p className="text-base">{new Date(member.promoted_to_member_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
