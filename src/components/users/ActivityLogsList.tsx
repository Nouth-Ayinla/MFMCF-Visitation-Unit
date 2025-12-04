import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { History, Loader2 } from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  performed_by: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  user_profile?: {
    email: string;
    full_name: string;
  };
  performer_profile?: {
    email: string;
    full_name: string;
  };
}

export const ActivityLogsList = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityLogs();
  }, []);

  const loadActivityLogs = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("user_activity_logs")
      .select(`
        *,
        user_profile:profiles!user_activity_logs_user_id_fkey(email, full_name),
        performer_profile:profiles!user_activity_logs_performed_by_fkey(email, full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as unknown as ActivityLog[]);
    }
    
    setLoading(false);
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      role_assigned: "default",
      role_updated: "secondary",
      role_removed: "destructive",
    };

    return (
      <Badge variant={variants[action] || "default"}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getActionDescription = (log: ActivityLog) => {
    const user = log.user_profile?.full_name || log.user_profile?.email || "User";
    const performer = log.performer_profile?.full_name || log.performer_profile?.email || "System";

    switch (log.action) {
      case "role_assigned":
        return `${performer} assigned ${(log.new_data?.role as string)?.replace(/_/g, " ")} role to ${user}`;
      case "role_updated":
        return `${performer} updated ${user}'s role from ${(log.old_data?.role as string)?.replace(/_/g, " ")} to ${(log.new_data?.role as string)?.replace(/_/g, " ")}`;
      case "role_removed":
        return `${performer} removed ${(log.old_data?.role as string)?.replace(/_/g, " ")} role from ${user}`;
      default:
        return `${performer} performed ${log.action} on ${user}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>Recent user management activities</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity logs yet
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{getActionDescription(log)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
