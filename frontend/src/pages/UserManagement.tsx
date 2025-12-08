import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Loader2, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { ActivityLogsList } from "@/components/users/ActivityLogsList";
import { PendingApprovalsList } from "@/components/users/PendingApprovalsList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
}

interface UserRole {
  user_id: string;
  role: string;
  assigned_level_id: string | null;
  assigned_department_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Level {
  id: string;
  level_number: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isSuperAdmin()) {
      loadData();

      // Subscribe to real-time updates for new users
      const profilesChannel = supabase
        .channel('user-management-profiles')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profiles'
          },
          () => {
            // Reload data when a new profile is created
            loadData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_roles'
          },
          () => {
            // Reload data when user roles are updated
            loadData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_roles'
          },
          () => {
            // Reload data when new user roles are assigned
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profilesChannel);
      };
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    
    // Load all profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("email") as any;

    // Filter for approved users client-side until migration is run
    const approvedProfiles = (profilesData || []).filter((p: any) => p.is_approved !== false);
    
    // Count pending users
    const pendingProfiles = (profilesData || []).filter((p: any) => p.is_approved === false);
    setPendingCount(pendingProfiles.length);

    // Load user roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role, assigned_level_id, assigned_department_id");

    // Load departments and levels
    const { data: deptData } = await supabase
      .from("departments")
      .select("id, name")
      .order("name");

    const { data: levelData } = await supabase
      .from("levels")
      .select("id, level_number")
      .order("level_number");

    if (approvedProfiles) setUsers(approvedProfiles);
    if (deptData) setDepartments(deptData);
    if (levelData) setLevels(levelData);

    // Create a map of user roles
    const rolesMap: Record<string, UserRole> = {};
    rolesData?.forEach(role => {
      rolesMap[role.user_id] = role;
    });
    setUserRoles(rolesMap);

    setLoading(false);
  };

  const updateUserRole = async (userId: string, role: string) => {
    setUpdating(userId);
    
    try {
      // First, delete any existing roles for this user
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      // Then insert the new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as "visitation_coordinator" | "assistant_coordinator" | "president" | "central" | "level_coordinator" | "admin" | "user" });

      if (error) {
        console.error("Role update error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update user role",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
        loadData();
      }
    } catch (error) {
      console.error("Role update error:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
    
    setUpdating(null);
  };

  const updateAssignment = async (
    userId: string,
    field: 'assigned_level_id' | 'assigned_department_id',
    value: string | null
  ) => {
    setUpdating(userId);
    
    // Convert "none" to null for database
    const dbValue = value === "none" ? null : value;
    
    const { error } = await supabase
      .from("user_roles")
      .update({ [field]: dbValue })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
      loadData();
    }
    
    setUpdating(null);
  };

  const deleteUserRole = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove user role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User role removed successfully",
      });
      loadData();
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage user roles, assignments, and activity</p>
          </div>
        </div>
        <InviteUserDialog onUserInvited={loadData} />
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approvals
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <PendingApprovalsList onApprovalChange={loadData} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Roles & Assignments</CardTitle>
              <CardDescription>
                Manage user roles and assign level coordinators to specific departments and levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Level</TableHead>
                      <TableHead>Assigned Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const userRole = userRoles[user.id];
                      const isUpdatingThis = updating === user.id;

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.full_name || "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={userRole?.role || ""}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                              disabled={isUpdatingThis}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="No role assigned" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="level_coordinator">Level Coordinator</SelectItem>
                                <SelectItem value="central">Central</SelectItem>
                                <SelectItem value="president">President</SelectItem>
                                <SelectItem value="assistant_coordinator">Assistant Coordinator</SelectItem>
                                <SelectItem value="visitation_coordinator">Visitation Coordinator</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {userRole?.role === 'level_coordinator' ? (
                              <Select
                                value={userRole.assigned_level_id || "none"}
                                onValueChange={(value) => updateAssignment(user.id, 'assigned_level_id', value)}
                                disabled={isUpdatingThis}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {levels.map((level) => (
                                    <SelectItem key={level.id} value={level.id}>
                                      Level {level.level_number}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {userRole?.role === 'level_coordinator' ? (
                              <Select
                                value={userRole.assigned_department_id || "none"}
                                onValueChange={(value) => updateAssignment(user.id, 'assigned_department_id', value)}
                                disabled={isUpdatingThis}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue placeholder="Select dept" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {userRole && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isUpdatingThis}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove User Role?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove the role assignment for {user.email}. The user will remain in the system but will have no assigned role.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserRole(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove Role
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
