import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar, TrendingUp, ArrowUpRight, Clock, LayoutDashboard, Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { StatsWidget } from "@/components/dashboard/widgets/StatsWidget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/QuickActionsWidget";
import { BirthdayWidget } from "@/components/dashboard/widgets/BirthdayWidget";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardStats {
  totalMembers: number;
  totalFirstTimers: number;
  totalAttendanceThisMonth: number;
  attendanceRate: number;
}

interface AttendanceTrend {
  date: string;
  count: number;
}

interface LevelDistribution {
  level: string;
  count: number;
}

interface RecentActivity {
  id: string;
  type: string;
  name: string;
  timestamp: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Dashboard = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { widgets, removeWidget, resetLayout } = useDashboardLayout();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalFirstTimers: 0,
    totalAttendanceThisMonth: 0,
    attendanceRate: 0,
  });
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<LevelDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadStats(),
      loadAttendanceTrend(),
      loadLevelDistribution(),
      loadRecentActivity(),
    ]);
    setIsLoading(false);
  };

  const loadStats = async () => {
    const { data: members } = await supabase
      .from("members")
      .select("id, is_first_timer");

    const totalMembers = members?.filter(m => !m.is_first_timer).length || 0;
    const totalFirstTimers = members?.filter(m => m.is_first_timer).length || 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("id")
      .gte("attendance_date", startOfMonth.toISOString().split('T')[0]);

    const totalAttendanceThisMonth = attendanceData?.length || 0;
    const attendanceRate = totalMembers > 0 ? Math.round((totalAttendanceThisMonth / totalMembers) * 100) : 0;

    setStats({
      totalMembers,
      totalFirstTimers,
      totalAttendanceThisMonth,
      attendanceRate,
    });
  };

  const loadAttendanceTrend = async () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(startOfDay(date), 'yyyy-MM-dd');
    });

    const { data } = await supabase
      .from("attendance")
      .select("attendance_date")
      .gte("attendance_date", last7Days[0])
      .lte("attendance_date", last7Days[6]);

    const trendData = last7Days.map(date => ({
      date: format(new Date(date), 'MMM dd'),
      count: data?.filter(a => a.attendance_date === date).length || 0,
    }));

    setAttendanceTrend(trendData);
  };

  const loadLevelDistribution = async () => {
    const { data: members } = await supabase
      .from("members")
      .select("level_id, levels(level_number)")
      .eq("is_first_timer", false);

    const distribution: { [key: string]: number } = {};
    members?.forEach(member => {
      const memberLevels = member.levels as { level_number: string } | null;
      const level = memberLevels?.level_number || 'Unknown';
      distribution[level] = (distribution[level] || 0) + 1;
    });

    const distData = Object.entries(distribution).map(([level, count]) => ({
      level: level === 'Unknown' ? 'Unknown' : `${level} Level`,
      count,
    }));

    setLevelDistribution(distData);
  };

  const loadRecentActivity = async () => {
    const { data: recentMembers } = await supabase
      .from("members")
      .select("id, full_name, registered_at, is_first_timer")
      .order("registered_at", { ascending: false })
      .limit(5);

    const activities: RecentActivity[] = recentMembers?.map(m => ({
      id: m.id,
      type: m.is_first_timer ? "New First-Timer" : "New Member",
      name: m.full_name,
      timestamp: m.registered_at,
    })) || [];

    setRecentActivity(activities);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'stats_members':
        return (
          <DashboardWidget
            id={widgetId}
            title="Total Members"
            onRemove={removeWidget}
          >
            <StatsWidget
              icon={Users}
              value={stats.totalMembers}
              label="Active Members"
              description="Active fellowship members"
            />
          </DashboardWidget>
        );

      case 'stats_firsttimers':
        return (
          <DashboardWidget
            id={widgetId}
            title="First-Timers"
            onRemove={removeWidget}
          >
            <StatsWidget
              icon={UserCheck}
              value={stats.totalFirstTimers}
              label="New Visitors"
              description="New visitors to track"
            />
          </DashboardWidget>
        );

      case 'stats_attendance':
        return (
          <DashboardWidget
            id={widgetId}
            title="This Month"
            onRemove={removeWidget}
          >
            <StatsWidget
              icon={Calendar}
              value={stats.totalAttendanceThisMonth}
              label="Total Attendance"
              description="Total attendance records"
            />
          </DashboardWidget>
        );

      case 'stats_rate':
        return (
          <DashboardWidget
            id={widgetId}
            title="Attendance Rate"
            onRemove={removeWidget}
          >
            <StatsWidget
              icon={TrendingUp}
              value={`${stats.attendanceRate}%`}
              label="Average Rate"
              description="Average this month"
            />
          </DashboardWidget>
        );

      case 'quick_actions':
        return (
          <DashboardWidget
            id={widgetId}
            title="Quick Actions"
            onRemove={removeWidget}
          >
            <QuickActionsWidget />
          </DashboardWidget>
        );

      case 'attendance_trend':
        return (
          <DashboardWidget
            id={widgetId}
            title="Attendance Trend (Last 7 Days)"
            onRemove={removeWidget}
            isDraggable={false}
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Attendance"
                />
              </LineChart>
            </ResponsiveContainer>
          </DashboardWidget>
        );

      case 'level_distribution':
        return (
          <DashboardWidget
            id={widgetId}
            title="Members by Level"
            onRemove={removeWidget}
            isDraggable={false}
          >
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={levelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                  nameKey="level"
                >
                  {levelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [value, 'Members']}
                />
              </PieChart>
            </ResponsiveContainer>
          </DashboardWidget>
        );

      case 'recent_activity':
        return (
          <DashboardWidget
            id={widgetId}
            title="Recent Activity"
            onRemove={removeWidget}
            isDraggable={false}
          >
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">{activity.type}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DashboardWidget>
        );

      case 'birthdays':
        return (
          <DashboardWidget
            id={widgetId}
            title="Birthdays"
            onRemove={removeWidget}
            isDraggable={false}
          >
            <BirthdayWidget />
          </DashboardWidget>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Welcome back, {userRole ? userRole.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'User'}!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Customize</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={resetLayout}>
                  Reset to Default Layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate("/manage-members")} size="sm" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">View All Members</span>
              <span className="sm:hidden">Members</span>
              <ArrowUpRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Carousel for Stats Cards */}
        <div className="md:hidden">
          {widgets.filter(w => ['stats_members', 'stats_firsttimers', 'stats_attendance', 'stats_rate'].includes(w)).length > 0 && (
            <Carousel 
              className="w-full px-1" 
              opts={{ align: "start", loop: true }}
              plugins={[
                Autoplay({
                  delay: 3000,
                  stopOnInteraction: true,
                })
              ]}
            >
              <CarouselContent className="-ml-2">
                {widgets
                  .filter(w => ['stats_members', 'stats_firsttimers', 'stats_attendance', 'stats_rate'].includes(w))
                  .map((widgetId) => (
                    <CarouselItem key={widgetId} className="pl-2 basis-[90%] xs:basis-[85%] sm:basis-1/2">
                      {renderWidget(widgetId)}
                    </CarouselItem>
                  ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-3">
                <CarouselPrevious className="static translate-y-0 h-8 w-8" />
                <CarouselNext className="static translate-y-0 h-8 w-8" />
              </div>
            </Carousel>
          )}
          
          {/* Other widgets on mobile */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4">
            {widgets
              .filter(w => !['stats_members', 'stats_firsttimers', 'stats_attendance', 'stats_rate'].includes(w))
              .map((widgetId) => (
                <div key={widgetId}>
                  {renderWidget(widgetId)}
                </div>
              ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
          {widgets.map((widgetId) => (
            <div key={widgetId} className={
              widgetId === 'attendance_trend' || widgetId === 'level_distribution' || widgetId === 'recent_activity'
                ? 'md:col-span-2'
                : ''
            }>
              {renderWidget(widgetId)}
            </div>
          ))}
        </div>

        {widgets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Widgets</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your dashboard is empty. Click "Customize" to reset to default layout.
              </p>
              <Button onClick={resetLayout}>Reset to Default</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;