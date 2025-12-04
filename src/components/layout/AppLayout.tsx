import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 md:ml-0">
          <header className="sticky top-0 z-40 h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <SidebarTrigger className="shrink-0" />
              <div className="truncate">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                  <span className="hidden xs:inline">MFM Campus Fellowship - FUTA</span>
                  <span className="xs:hidden">MFM CF</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <NotificationBell />
              <div className="hidden lg:flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2 text-xs sm:text-sm">Sign Out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
