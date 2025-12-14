import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, Loader2, UserPlus, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_approved: boolean;
}

interface PendingApprovalsListProps {
  onApprovalChange?: () => void;
}

export const PendingApprovalsList = ({
  onApprovalChange,
}: PendingApprovalsListProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {}
  );
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<string>("user");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    loadPendingUsers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("pending-approvals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: "is_approved=eq.false",
        },
        () => {
          loadPendingUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading pending users:", error);
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive",
      });
    } else {
      setPendingUsers(data || []);
    }

    setLoading(false);
  };

  const approveUser = async (userId: string) => {
    setProcessingId(userId);
    const selectedRole = selectedRoles[userId] || "user";

    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from("profiles")
        .update({
          is_approved: true,
          approved_by: user?.id ?? null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (approvalError) throw approvalError;

      // Assign role if selected
      if (selectedRole) {
        // First delete any existing role
        await supabase.from("user_roles").delete().eq("user_id", userId);

        // Insert new role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: selectedRole as
            | "visitation_coordinator"
            | "assistant_coordinator"
            | "president"
            | "central"
            | "level_coordinator"
            | "admin"
            | "user",
        });

        if (roleError) throw roleError;
      }

      toast({
        title: "User Approved",
        description: "User has been approved and can now access the system",
      });

      loadPendingUsers();
      onApprovalChange?.();
    } catch (error: unknown) {
      console.error("Approval error:", error);
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message || "Failed to approve user",
        variant: "destructive",
      });
    }

    setProcessingId(null);
  };

  const rejectUser = async (userId: string, userEmail: string) => {
    setProcessingId(userId);

    try {
      // Delete the profile (will cascade to auth.users if set up, or just remove access)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User Rejected",
        description: `${userEmail} has been removed from the system`,
      });

      loadPendingUsers();
      onApprovalChange?.();
    } catch (error: unknown) {
      console.error("Rejection error:", error);
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message || "Failed to reject user",
        variant: "destructive",
      });
    }

    setProcessingId(null);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === pendingUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingUsers.map((u) => u.id)));
    }
  };

  const bulkApproveUsers = async () => {
    if (selectedUsers.size === 0) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        // Update approval status
        const { error: approvalError } = await supabase
          .from("profiles")
          .update({
            is_approved: true,
            approved_by: user?.id ?? null,
            approved_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (approvalError) throw approvalError;

        // Assign role
        await supabase.from("user_roles").delete().eq("user_id", userId);

        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: bulkRole as
            | "visitation_coordinator"
            | "assistant_coordinator"
            | "president"
            | "central"
            | "level_coordinator"
            | "admin"
            | "user",
        });

        if (roleError) throw roleError;
        successCount++;
      } catch (error: unknown) {
        console.error("Bulk approval error for user:", userId, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Bulk Approval Complete",
        description: `${successCount} user(s) approved successfully${
          errorCount > 0 ? `, ${errorCount} failed` : ""
        }`,
      });
    }

    if (errorCount > 0 && successCount === 0) {
      toast({
        title: "Bulk Approval Failed",
        description: "Failed to approve selected users",
        variant: "destructive",
      });
    }

    setSelectedUsers(new Set());
    setIsBulkProcessing(false);
    loadPendingUsers();
    onApprovalChange?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Check className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No pending approvals</p>
          <p className="text-sm text-muted-foreground mt-1">
            All users have been reviewed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Approvals
              <Badge variant="secondary" className="ml-2">
                {pendingUsers.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Review and approve new user registrations
            </CardDescription>
          </div>

          {/* Bulk Actions */}
          {pendingUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select
                value={bulkRole}
                onValueChange={setBulkRole}
                disabled={isBulkProcessing}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Bulk role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="level_coordinator">
                    Level Coordinator
                  </SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="president">President</SelectItem>
                  <SelectItem value="assistant_coordinator">
                    Assistant Coordinator
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={bulkApproveUsers}
                disabled={selectedUsers.size === 0 || isBulkProcessing}
                className="whitespace-nowrap"
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Approve Selected ({selectedUsers.size})
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select All */}
        {pendingUsers.length > 1 && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedUsers.size === pendingUsers.length}
              onCheckedChange={toggleSelectAll}
              disabled={isBulkProcessing}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({pendingUsers.length} users)
            </label>
          </div>
        )}

        {pendingUsers.map((pendingUser) => {
          const isProcessing = processingId === pendingUser.id;

          return (
            <div
              key={pendingUser.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg transition-colors ${
                selectedUsers.has(pendingUser.id)
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedUsers.has(pendingUser.id)}
                  onCheckedChange={() => toggleSelectUser(pendingUser.id)}
                  disabled={isProcessing || isBulkProcessing}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {pendingUser.full_name || "No name"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pendingUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Signed up:{" "}
                    {format(
                      new Date(pendingUser.created_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
                <Select
                  value={selectedRoles[pendingUser.id] || "user"}
                  onValueChange={(value) =>
                    setSelectedRoles((prev) => ({
                      ...prev,
                      [pendingUser.id]: value,
                    }))
                  }
                  disabled={isProcessing || isBulkProcessing}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="level_coordinator">
                      Level Coordinator
                    </SelectItem>
                    <SelectItem value="central">Central</SelectItem>
                    <SelectItem value="president">President</SelectItem>
                    <SelectItem value="assistant_coordinator">
                      Assistant Coordinator
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveUser(pendingUser.id)}
                    disabled={isProcessing || isBulkProcessing}
                    className="flex-1 sm:flex-none"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isProcessing || isBulkProcessing}
                        className="flex-1 sm:flex-none"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject User?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {pendingUser.email} from
                          the system. They will need to sign up again if they
                          want to request access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            rejectUser(pendingUser.id, pendingUser.email)
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
