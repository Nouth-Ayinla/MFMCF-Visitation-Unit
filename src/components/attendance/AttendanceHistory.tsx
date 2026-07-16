import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Calendar, Filter, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ServiceType = Database["public"]["Enums"]["service_type"];

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  bible_study: "Bible Study",
  revival_hour: "Revival Hour",
  sunday_service: "Sunday Service",
};

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  created_at: string;
  service_type: ServiceType;
  marked_by: string | null;
  members: {
    full_name: string;
    phone_number: string;
  };
  marked_by_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const formatRoleLabel = (role: string): string => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getRoleBadgeStyles = (role: string | null) => {
  if (!role) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      label: "Self-Marked",
    };
  }

  switch (role) {
    case "visitation_coordinator":
      return {
        bg: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30",
        label: "Visitation Coord.",
      };
    case "assistant_coordinator":
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
        label: "Asst. Coord.",
      };
    case "admin":
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        label: "Admin",
      };
    case "level_coordinator":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
        label: "Level Coord.",
      };
    case "president":
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
        label: "President",
      };
    case "central":
      return {
        bg: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30",
        label: "Central",
      };
    case "user":
      return {
        bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30",
        label: "User",
      };
    default:
      return {
        bg: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        label: formatRoleLabel(role),
      };
  }
};

export function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");
  const [markedByFilter, setMarkedByFilter] = useState<"all" | "admin" | "self">("all");
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

    const loadUserRoles = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (!error && data) {
        const rolesMap: Record<string, string> = {};
        data.forEach((ur) => {
          rolesMap[ur.user_id] = ur.role;
        });
        setUserRoles(rolesMap);
      }
    };

    loadUserRoles();
  }, []);

  useEffect(() => {
    if (startDate) {
      loadAttendance();
    }
  }, [startDate, endDate, serviceTypeFilter, markedByFilter]);

  const loadAttendance = async () => {
    setIsLoading(true);
    let query = supabase
      .from("attendance")
      .select(
        `
        id,
        attendance_date,
        created_at,
        service_type,
        marked_by,
        members!attendance_member_id_fkey (
          full_name,
          phone_number
        ),
        marked_by_profile:profiles!attendance_marked_by_fkey (
          full_name,
          email
        )
      `
      )
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate);

    if (serviceTypeFilter !== "all") {
      query = query.eq("service_type", serviceTypeFilter);
    }

    if (markedByFilter === "self") {
      query = query.is("marked_by", null);
    } else if (markedByFilter === "admin") {
      query = query.not("marked_by", "is", null);
    }

    const { data, error } = await query
      .order("attendance_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } else {
      setRecords((data || []) as AttendanceRecord[]);
    }
    setIsLoading(false);
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Date",
      "Service Type",
      "Member Name",
      "Phone Number",
      "Marked By",
      "Marker Role",
      "Time Marked",
    ];

    const csvContent = [
      headers.join(","),
      ...records.map((record) => {
        const markerName = record.marked_by
          ? record.marked_by_profile?.full_name || "Unknown Admin"
          : "Self-Marked";
        const markerRole = record.marked_by
          ? formatRoleLabel(userRoles[record.marked_by] || "Admin")
          : "Member";

        return [
          record.attendance_date,
          SERVICE_TYPE_LABELS[record.service_type],
          record.members.full_name,
          record.members.phone_number,
          markerName,
          markerRole,
          new Date(record.created_at).toLocaleString(),
        ]
          .map((field) => `"${field}"`)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Exported ${records.length} records`,
    });
  };

  // Group records by date
  const groupByDate = () => {
    const grouped: Record<string, AttendanceRecord[]> = {};

    records.forEach((record) => {
      const date = record.attendance_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    return grouped;
  };

  const groupedRecords = groupByDate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Loading attendance history...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="service_type_filter">Service Type</Label>
              <Select value={serviceTypeFilter} onValueChange={(value) => setServiceTypeFilter(value as ServiceType | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {SERVICE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="marked_by_filter">Marked By</Label>
              <Select value={markedByFilter} onValueChange={(value) => setMarkedByFilter(value as "all" | "admin" | "self")}>
                <SelectTrigger>
                  <SelectValue placeholder="All markers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="admin">Admins & Coords</SelectItem>
                  <SelectItem value="self">Self-Marked (Public)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {records.length} attendance records
          </p>
        </CardContent>
      </Card>

      {Object.keys(groupedRecords).length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No attendance records found
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedRecords).map(([date, dateRecords]) => (
          <Card key={date}>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                <span className="text-sm font-normal text-muted-foreground">
                  ({dateRecords.length} present)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {record.members.full_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {SERVICE_TYPE_LABELS[record.service_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.members.phone_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {record.marked_by && record.marked_by_profile ? (
                              <>
                                <Avatar className="h-7 w-7 border shadow-sm shrink-0">
                                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px] uppercase">
                                    {(record.marked_by_profile.full_name || "")
                                      .split(" ")
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium leading-none truncate max-w-[150px]" title={record.marked_by_profile.full_name || ""}>
                                    {record.marked_by_profile.full_name}
                                  </span>
                                  {record.marked_by_profile.email && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={record.marked_by_profile.email}>
                                      {record.marked_by_profile.email}
                                    </span>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 font-medium whitespace-nowrap rounded",
                                    getRoleBadgeStyles(userRoles[record.marked_by]).bg
                                  )}
                                >
                                  {getRoleBadgeStyles(userRoles[record.marked_by]).label}
                                </Badge>
                              </>
                            ) : (
                              <>
                                <Avatar className="h-7 w-7 border border-emerald-100 bg-emerald-50/50 shadow-sm shrink-0 dark:border-emerald-950 dark:bg-emerald-950/20">
                                  <AvatarFallback className="bg-transparent text-emerald-600 dark:text-emerald-400">
                                    <Globe className="h-3.5 w-3.5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 leading-none">
                                    Self-Marked
                                  </span>
                                  <span className="text-[10px] text-emerald-500/80">
                                    Public check-in
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 font-medium whitespace-nowrap rounded",
                                    getRoleBadgeStyles(null).bg
                                  )}
                                >
                                  {getRoleBadgeStyles(null).label}
                                </Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(record.created_at).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
