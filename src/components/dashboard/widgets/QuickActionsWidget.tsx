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
      label: "Register <br /> New Member",
      onClick: () => setIsAddMemberOpen(true),
      variant: "default" as const,
    },
    {
      icon: Calendar,
      label: "Mark Attendance",
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
            <span className="text-xs font-medium">{action.label}</span>
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
