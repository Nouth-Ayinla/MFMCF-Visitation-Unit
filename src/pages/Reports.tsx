import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, FileText, Calendar as CalendarIcon, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportData {
  totalMembers: number;
  totalFirstTimers: number;
  attendanceCount: number;
  attendanceByLevel: { level: string; count: number }[];
  attendanceByDepartment: { department: string; count: number }[];
  membersByGender: { gender: string; count: number }[];
  memberGrowth: { month: string; count: number }[];
}

const Reports = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("this-month");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      updateDateRange();
    }
  }, [dateRange, user]);

  const updateDateRange = () => {
    const today = new Date();
    let start: Date, end: Date;

    switch (dateRange) {
      case "this-month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "this-year":
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case "last-month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "last-year":
        const lastYear = new Date(today.getFullYear() - 1, 0);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select a valid date range",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Fetch members data
      const { data: members } = await supabase
        .from("members")
        .select("*, departments(name), levels(level_number)")
        .gte("registered_at", startStr)
        .lte("registered_at", endStr + "T23:59:59");

      // Fetch attendance data
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*, members(level_id, department_id, levels(level_number), departments(name))")
        .gte("attendance_date", startStr)
        .lte("attendance_date", endStr);

      // Process data
      const totalMembers = members?.filter(m => !m.is_first_timer).length || 0;
      const totalFirstTimers = members?.filter(m => m.is_first_timer).length || 0;
      const attendanceCount = attendance?.length || 0;

      // Attendance by level
      const levelMap: { [key: string]: number } = {};
      attendance?.forEach(a => {
        const memberData = a.members as { levels?: { level_number: string } | null; departments?: { name: string } | null } | null;
        const level = memberData?.levels?.level_number || 'Unknown';
        levelMap[level] = (levelMap[level] || 0) + 1;
      });
      const attendanceByLevel = Object.entries(levelMap).map(([level, count]) => ({
        level: level === 'Unknown' ? 'Unknown' : `${level} Level`,
        count,
      }));

      // Attendance by department
      const deptMap: { [key: string]: number } = {};
      attendance?.forEach(a => {
        const memberData = a.members as { levels?: { level_number: string } | null; departments?: { name: string } | null } | null;
        const dept = memberData?.departments?.name || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      const attendanceByDepartment = Object.entries(deptMap).map(([department, count]) => ({
        department,
        count,
      }));

      // Members by gender
      const genderMap: { [key: string]: number } = {};
      members?.forEach(m => {
        const gender = m.gender || 'Not specified';
        genderMap[gender] = (genderMap[gender] || 0) + 1;
      });
      const membersByGender = Object.entries(genderMap).map(([gender, count]) => ({
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        count,
      }));

      setReportData({
        totalMembers,
        totalFirstTimers,
        attendanceCount,
        attendanceByLevel,
        attendanceByDepartment,
        membersByGender,
        memberGrowth: [],
      });

      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    let csvContent = `Report Type: ${reportType}\n`;
    csvContent += `Date Range: ${format(startDate!, 'MMM dd, yyyy')} - ${format(endDate!, 'MMM dd, yyyy')}\n\n`;

    csvContent += "SUMMARY\n";
    csvContent += `Total Members,${reportData.totalMembers}\n`;
    csvContent += `Total First-Timers,${reportData.totalFirstTimers}\n`;
    csvContent += `Total Attendance Records,${reportData.attendanceCount}\n\n`;

    if (reportData.attendanceByLevel.length > 0) {
      csvContent += "ATTENDANCE BY LEVEL\n";
      csvContent += "Level,Count\n";
      reportData.attendanceByLevel.forEach(item => {
        csvContent += `${item.level},${item.count}\n`;
      });
      csvContent += "\n";
    }

    if (reportData.attendanceByDepartment.length > 0) {
      csvContent += "ATTENDANCE BY DEPARTMENT\n";
      csvContent += "Department,Count\n";
      reportData.attendanceByDepartment.forEach(item => {
        csvContent += `${item.department},${item.count}\n`;
      });
      csvContent += "\n";
    }

    if (reportData.membersByGender.length > 0) {
      csvContent += "MEMBERS BY GENDER\n";
      csvContent += "Gender,Count\n";
      reportData.membersByGender.forEach(item => {
        csvContent += `${item.gender},${item.count}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mfm-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Report has been exported to CSV",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Generate and export detailed reports
          </p>
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview Report</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                    <SelectItem value="members">Members Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={generateReport} disabled={isGenerating} className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
              {reportData && (
                <Button onClick={exportReport} variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {reportData && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalMembers}</div>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">First-Timers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalFirstTimers}</div>
                  <p className="text-xs text-muted-foreground">New visitors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Records</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.attendanceCount}</div>
                  <p className="text-xs text-muted-foreground">Total records</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportData.attendanceByLevel.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance by Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.attendanceByLevel.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.level}</span>
                          <span className="text-sm text-muted-foreground">{item.count} records</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.attendanceByDepartment.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.attendanceByDepartment.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.department}</span>
                          <span className="text-sm text-muted-foreground">{item.count} records</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.membersByGender.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Members by Gender</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.membersByGender.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.gender}</span>
                          <span className="text-sm text-muted-foreground">{item.count} members</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
