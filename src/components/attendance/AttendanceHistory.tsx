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
import { Download, Calendar, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

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
  members: {
    full_name: string;
    phone_number: string;
  };
  marked_by_profile?: {
    full_name: string;
  };
}

export function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (startDate) {
      loadAttendance();
    }
  }, [startDate, endDate, serviceTypeFilter]);

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
        members!attendance_member_id_fkey (
          full_name,
          phone_number
        ),
        marked_by_profile:profiles!attendance_marked_by_fkey (
          full_name
        )
      `
      )
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate);

    if (serviceTypeFilter !== "all") {
      query = query.eq("service_type", serviceTypeFilter);
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
      "Time Marked",
    ];

    const csvContent = [
      headers.join(","),
      ...records.map((record) =>
        [
          record.attendance_date,
          SERVICE_TYPE_LABELS[record.service_type],
          record.members.full_name,
          record.members.phone_number,
          record.marked_by_profile?.full_name || "N/A",
          new Date(record.created_at).toLocaleString(),
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <TableRow key={record.id}>
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
                          {record.marked_by_profile?.full_name || "N/A"}
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
