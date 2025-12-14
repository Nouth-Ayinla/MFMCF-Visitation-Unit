import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
}

export const SuccessDialog = ({ 
  open, 
  onOpenChange, 
  title = "Welcome to the family!",
  subtitle = "We're glad you joined us."
}: SuccessDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center max-w-sm border-none shadow-lg">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-full border-[3px] border-[#8920AC] flex items-center justify-center">
            <Check className="h-10 w-10 text-[#8920AC] stroke-[3]" />
          </div>
          <h2 className="text-2xl font-bold text-[#8920AC]">{title}</h2>
          <p className="text-muted-foreground text-base">{subtitle}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
