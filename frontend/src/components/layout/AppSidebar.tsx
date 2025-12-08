import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UserCog,
  BarChart3,
  UserPlus,
  Settings as SettingsIcon,
  X,
  Cake,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["visitation_coordinator", "assistant_coordinator", "president", "central", "level_coordinator", "admin"],
  },
  {
    title: "Members",
    url: "/manage-members",
    icon: Users,
    roles: ["visitation_coordinator", "assistant_coordinator", "level_coordinator"],
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: ClipboardCheck,
    roles: ["visitation_coordinator", "assistant_coordinator", "level_coordinator"],
  },
  {
    title: "First-Timers",
    url: "/first-timers",
    icon: UserPlus,
    roles: ["visitation_coordinator", "assistant_coordinator", "level_coordinator"],
  },
  {
    title: "Birthdays",
    url: "/birthdays",
    icon: Cake,
    roles: ["visitation_coordinator", "assistant_coordinator", "level_coordinator"],
  },
  {
    title: "User Management",
    url: "/users",
    icon: UserCog,
    roles: ["visitation_coordinator"],
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Building2,
    roles: ["visitation_coordinator"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["visitation_coordinator", "assistant_coordinator", "president", "central", "admin"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
    roles: ["visitation_coordinator"],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { userRole } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const visibleItems = navItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  return (
    <Sidebar 
      collapsible="icon"
    >
      <SidebarHeader className="border-b px-4 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">MFMCf FUTA</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={() => document.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')?.click()}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={open ? "px-4" : "sr-only"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="flex items-center">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {open && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
