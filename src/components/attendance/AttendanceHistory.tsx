import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES, ServiceType, getServiceLabel } from "@/lib/serviceTypes";
import { Badge } from "@/components/ui/badge";

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  created_at: string;
  service_type: ServiceType | null;
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
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
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
  }, [startDate, endDate]);

  useEffect(() => {
    filterByServiceType();
  }, [selectedServiceType, records]);

  const loadAttendance = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("attendance")
      .select(`
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
      `)
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate)
      .order("attendance_date", { ascending: false })
      .order("created_at", { ascending: false }) as any;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } else {
      setRecords(data || []);
    }
    setIsLoading(false);
  };

  const filterByServiceType = () => {
    if (selectedServiceType === "all") {
      setFilteredRecords(records);
    } else {
      setFilteredRecords(records.filter(r => r.service_type === selectedServiceType));
    }
  };

  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Service Type", "Member Name", "Phone Number", "Marked By", "Time Marked"];

    const csvContent = [
      headers.join(","),
      ...filteredRecords.map((record) =>
        [
          record.attendance_date,
          record.service_type ? getServiceLabel(record.service_type) : "N/A",
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
      description: `Exported ${filteredRecords.length} records`,
    });
  };

  const groupByDateAndService = () => {
    const grouped: Record<string, { service: ServiceType | null; records: AttendanceRecord[] }[]> = {};
    
    filteredRecords.forEach((record) => {
      const date = record.attendance_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      // Find existing group for this service type on this date
      let serviceGroup = grouped[date].find(g => g.service === record.service_type);
      if (!serviceGroup) {
        serviceGroup = { service: record.service_type, records: [] };
        grouped[date].push(serviceGroup);
      }
      serviceGroup.records.push(record);
    });
    
    return grouped;
  };

  const groupedRecords = groupByDateAndService();

  const getServiceBadgeColor = (serviceType: ServiceType | null): string => {
    switch (serviceType) {
      case 'bible_study': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'revival_hour': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'sunday_service': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading attendance history...</p>
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
              <Label htmlFor="service_type">Service Type</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.icon} {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredRecords.length} attendance records
          </p>
        </CardContent>
      </Card>

      {Object.keys(groupedRecords).length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No attendance records found</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedRecords).map(([date, serviceGroups]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            
            {serviceGroups.map((group, idx) => (
              <Card key={`${date}-${group.service}-${idx}`}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className={getServiceBadgeColor(group.service)}>
                      {group.service ? (
                        <>
                          {SERVICE_TYPES.find(s => s.value === group.service)?.icon} {getServiceLabel(group.service)}
                        </>
                      ) : (
                        'Unknown Service'
                      )}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({group.records.length} present)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member Name</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Marked By</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.members.full_name}</TableCell>
                            <TableCell>{record.members.phone_number}</TableCell>
                            <TableCell>{record.marked_by_profile?.full_name || "N/A"}</TableCell>
                            <TableCell>{new Date(record.created_at).toLocaleTimeString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
