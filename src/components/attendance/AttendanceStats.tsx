import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalMembers: number;
  todayAttendance: number;
  weekAttendance: number;
  monthAttendance: number;
  averageWeekly: number;
  attendanceRate: number;
}

export function AttendanceStats() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    todayAttendance: 0,
    weekAttendance: 0,
    monthAttendance: 0,
    averageWeekly: 0,
    attendanceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split("T")[0];

    try {
      // Basic queries
      const membersRes = await supabase
        .from("members")
        .select("id", { count: "exact", head: true });
      const todayRes = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("attendance_date", today);
      const weekRes = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .gte("attendance_date", weekAgoStr);
      const monthRes = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .gte("attendance_date", monthAgoStr);

      const totalMembers = membersRes.count || 0;
      const todayAttendance = todayRes.count || 0;
      const weekAttendance = weekRes.count || 0;
      const monthAttendance = monthRes.count || 0;

      const averageWeekly =
        totalMembers > 0 ? weekAttendance / totalMembers : 0;
      // Attendance rate based on 4 services per month
      const totalPossibleAttendance = totalMembers * 4;
      const attendanceRate =
        totalPossibleAttendance > 0
          ? (monthAttendance / totalPossibleAttendance) * 100
          : 0;

      setStats({
        totalMembers,
        todayAttendance,
        weekAttendance,
        monthAttendance,
        averageWeekly: Math.round(averageWeekly * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance statistics",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Loading statistics...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Active fellowship members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Attendance
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalMembers > 0
                  ? `${Math.round(
                      (stats.todayAttendance / stats.totalMembers) * 100
                    )}% of members`
                  : "No members"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthAttendance}</div>
              <p className="text-xs text-muted-foreground">
                Total records (last 30 days)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Rate */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Overall Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Activity
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekAttendance}</div>
              <p className="text-xs text-muted-foreground">
                Total attendance this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Attendance Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Based on expected services per month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
