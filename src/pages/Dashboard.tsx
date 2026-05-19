import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar, TrendingUp, ArrowUpRight, Clock, LayoutDashboard, Cake, Download } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ServiceType = Database["public"]["Enums"]["service_type"];

interface LevelOption {
  id: string;
  level_number: string;
}

interface MemberForExtract {
  id: string;
  full_name: string;
  phone_number: string;
  departments?: {
    name: string;
  } | null;
}

interface AttendanceForExtract {
  member_id: string;
  attendance_date: string;
  service_type: ServiceType;
}

const SERVICE_SCHEDULE: Record<ServiceType, { label: string; day: number }> = {
  sunday_service: { label: "SUN", day: 0 },
  revival_hour: { label: "TUES", day: 2 },
  bible_study: { label: "THUR", day: 4 },
};

const getServiceSlotsForMonth = (monthValue: string) => {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!year || !month) {
    return [] as { date: string; label: string; serviceType: ServiceType }[];
  }

  const cursor = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const slots: { date: string; label: string; serviceType: ServiceType }[] = [];

  while (cursor <= end) {
    const currentDay = cursor.getDay();
    const isoDate = format(cursor, "yyyy-MM-dd");

    (Object.keys(SERVICE_SCHEDULE) as ServiceType[]).forEach((serviceType) => {
      const schedule = SERVICE_SCHEDULE[serviceType];
      if (schedule.day === currentDay) {
        slots.push({
          date: isoDate,
          label: schedule.label,
          serviceType,
        });
      }
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
};

const escapeCsvField = (value: string) => `"${value.replace(/"/g, '""')}"`;

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
  const { user, loading, userRole, isAdmin } = useAuth();
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
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedExtractMonth, setSelectedExtractMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      if (isAdmin()) {
        loadLevelsForExtract();
      }
    }
  }, [user]);

  const loadLevelsForExtract = async () => {
    const { data, error } = await supabase
      .from("levels")
      .select("id, level_number");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load levels for attendance extraction",
        variant: "destructive",
      });
      return;
    }

    const sortedLevels = [...(data || [])].sort((a, b) => {
      const aNum = Number(a.level_number);
      const bNum = Number(b.level_number);
      const aIsNumeric = !Number.isNaN(aNum);
      const bIsNumeric = !Number.isNaN(bNum);

      if (aIsNumeric && bIsNumeric) return aNum - bNum;
      if (aIsNumeric) return -1;
      if (bIsNumeric) return 1;
      return a.level_number.localeCompare(b.level_number);
    });

    setLevels(sortedLevels);

    if (!selectedLevelId && sortedLevels.length > 0) {
      setSelectedLevelId(sortedLevels[0].id);
    }
  };

  const handleExtractAttendanceByLevel = async () => {
    if (!selectedLevelId) {
      toast({
        title: "Level Required",
        description: "Please select a level to extract attendance.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const selectedLevel = levels.find((level) => level.id === selectedLevelId);

      const slots = getServiceSlotsForMonth(selectedExtractMonth);
      if (slots.length === 0) {
        toast({
          title: "Invalid Month",
          description: "Please choose a valid month.",
          variant: "destructive",
        });
        return;
      }

      const [monthStart, monthPart] = selectedExtractMonth.split("-");
      const startDate = `${monthStart}-${monthPart}-01`;
      const endDate = format(new Date(Number(monthStart), Number(monthPart), 0), "yyyy-MM-dd");

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id, full_name, phone_number, departments(name)")
        .eq("is_first_timer", false)
        .eq("level_id", selectedLevelId)
        .order("full_name", { ascending: true });

      if (memberError) {
        throw new Error(memberError.message || "Failed to load members");
      }

      const members = (memberData || []) as MemberForExtract[];

      if (members.length === 0) {
        toast({
          title: "No Members",
          description: "No members found for the selected level.",
          variant: "destructive",
        });
        return;
      }

      const memberIds = members.map((member) => member.id);

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("member_id, attendance_date, service_type")
        .in("member_id", memberIds)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate);

      if (attendanceError) {
        throw new Error(attendanceError.message || "Failed to load attendance records");
      }

      const attendanceSet = new Set(
        ((attendanceData || []) as AttendanceForExtract[]).map(
          (record) => `${record.member_id}|${record.attendance_date}|${record.service_type}`,
        ),
      );

      const headerRow = [
        "S/N",
        "NAME",
        "PHONE NUMBER",
        "DEPARTMENT",
        ...slots.map((slot) => slot.label),
      ];

      const csvRows = [
        [
          `${selectedLevel?.level_number || "Selected Level"} LEVEL ATTENDANCE - ${format(new Date(`${selectedExtractMonth}-01`), "MMMM yyyy")} `,
        ],
        headerRow,
        ...members.map((member, index) => {
          const attendanceColumns = slots.map((slot) => {
            const key = `${member.id}|${slot.date}|${slot.serviceType}`;
            return attendanceSet.has(key) ? "P" : "";
          });

          return [
            String(index + 1),
            member.full_name,
            member.phone_number,
            member.departments?.name || "",
            ...attendanceColumns,
          ];
        }),
      ];

      const csvContent = csvRows
        .map((row) => row.map((cell) => escapeCsvField(cell)).join(","))
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(selectedLevel?.level_number || "level").replace(/\s+/g, "_")}_${selectedExtractMonth}_attendance.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Extracted attendance for ${selectedLevel?.level_number || "selected level"}.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to extract attendance.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

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

        {isAdmin() && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Attendance Extract by Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={selectedLevelId} onValueChange={setSelectedLevelId}>
                <TabsList className="w-full h-auto justify-start overflow-x-auto whitespace-nowrap bg-transparent p-0 gap-2">
                  {levels.map((level) => (
                    <TabsTrigger
                      key={level.id}
                      value={level.id}
                      className="text-xs sm:text-sm border border-border data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      {level.level_number}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="w-full sm:w-[220px]">
                  <label htmlFor="extract_month" className="text-sm text-muted-foreground">
                    Month
                  </label>
                  <Input
                    id="extract_month"
                    type="month"
                    value={selectedExtractMonth}
                    onChange={(e) => setSelectedExtractMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleExtractAttendanceByLevel}
                  disabled={isExtracting || !selectedLevelId}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExtracting ? "Extracting..." : "Extract Attendance"}
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                Export format: S/N, NAME, PHONE NUMBER, DEPARTMENT, then repeated SUN/TUES/THUR attendance columns.
              </p>
            </CardContent>
          </Card>
        )}

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