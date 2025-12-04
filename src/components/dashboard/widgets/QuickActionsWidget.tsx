import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, Calendar, Users, FileText } from "lucide-react";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";

export const QuickActionsWidget = () => {
  const navigate = useNavigate();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const actions = [
    {
      icon: UserPlus,
      label: (
        <>
          <div>Register</div>
          <div className="text-[10px] ">New member</div>
        </>
      ),
      onClick: () => setIsAddMemberOpen(true),
      variant: "default" as const,
    },
    {
      icon: Calendar,

      label: (
        <>
          <div>Mark</div>
          <div className="text-[10px] "> Attendance</div>
        </>
      ),
      onClick: () => navigate("/attendance"),
      variant: "secondary" as const,
    },
    {
      icon: Users,
      label: "View Members",
      onClick: () => navigate("/manage-members"),
      variant: "outline" as const,
    },
    {
      icon: FileText,
      label: "View Reports",
      onClick: () => navigate("/reports"),
      variant: "outline" as const,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            onClick={action.onClick}
            className="h-auto flex flex-col gap-2 py-4"
          >
            <action.icon className="h-5 w-5" />
            <div className="text-xs font-medium text-center">
              {action.label}
            </div>
          </Button>
        ))}
      </div>

      <AddMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onSuccess={() => setIsAddMemberOpen(false)}
      />
    </>
  );
};
