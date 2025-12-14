import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  bible_study: "Bible Study",
  revival_hour: "Revival Hour",
  sunday_service: "Sunday Service",
};

interface Member {
  id: string;
  full_name: string;
  phone_number: string;
  is_first_timer: boolean;
  departments?: { name: string } | null;
  levels?: { level_number: string } | null;
}

export function MarkAttendance() {
  const { user, userRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceType, setServiceType] = useState<ServiceType>("sunday_service");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [user]);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, members]);

  const loadMembers = async () => {
    setIsLoading(true);

    // Get user's assigned level if level coordinator
    let assignedLevelId = null;
    if (userRole === "level_coordinator") {
      const { data: userRoleData } = await supabase
        .from("user_roles")
        .select("assigned_level_id")
        .eq("user_id", user?.id)
        .single();

      assignedLevelId = userRoleData?.assigned_level_id;
    }

    let query = supabase
      .from("members")
      .select(
        `
        id,
        full_name,
        phone_number,
        is_first_timer,
        level_id,
        departments (name),
        levels (level_number)
      `
      )
      .eq("is_first_timer", false);

    // Filter by level if level coordinator
    if (userRole === "level_coordinator" && assignedLevelId) {
      query = query.eq("level_id", assignedLevelId);
    }

    query = query.order("full_name");

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } else {
      setMembers(data || []);
    }
    setIsLoading(false);
  };

  const filterMembers = () => {
    if (!searchTerm) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone_number.includes(searchTerm)
    );
    setFilteredMembers(filtered);
  };

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedMembers.size === 0) {
      toast({
        title: "No Members Selected",
        description: "Please select at least one member",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const attendanceRecords = Array.from(selectedMembers).map((memberId) => ({
      member_id: memberId,
      marked_by: user?.id,
      attendance_date: selectedDate,
      service_type: serviceType,
    }));

    const { data: insertedRecords, error } = await supabase
      .from("attendance")
      .insert(attendanceRecords)
      .select("id, member_id, attendance_date, marked_by");

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    } else {
      // Log to audit trail
      if (insertedRecords && insertedRecords.length > 0) {
        const auditRecords = insertedRecords.map((record) => ({
          attendance_id: record.id,
          action: "created",
          performed_by: user?.id,
          new_data: record,
        }));

        await supabase.from("attendance_audit").insert(auditRecords);
      }

      toast({
        title: "Success",
        description: `Marked attendance for ${selectedMembers.size} members`,
      });
      setSelectedMembers(new Set());
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Loading members...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 sm:gap-4">
      {/* Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attendance_date" className="text-sm">
                Attendance Date
              </Label>
              <Input
                id="attendance_date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="service_type" className="text-sm">
                Service Type
              </Label>
              <Select value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {SERVICE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Selection */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Select Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs sm:text-sm"
            >
              {selectedMembers.size === filteredMembers.length
                ? "Deselect All"
                : `Select All (${filteredMembers.length})`}
            </Button>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
              {selectedMembers.size} selected
            </div>
          </div>

          <div className="border rounded-lg flex-1 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                No members found
              </p>
            ) : (
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-muted cursor-pointer"
                    onClick={() => toggleMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                      className="mt-1 sm:mt-0 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {member.full_name}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {member.phone_number} •{" "}
                        {member.levels?.level_number || "N/A"} •{" "}
                        {member.departments?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMembers.size > 0 && (
        <Card className="border-primary">
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-sm sm:text-base">
                  {selectedMembers.size} member
                  {selectedMembers.size > 1 ? "s" : ""} selected
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(selectedDate).toLocaleDateString()} • {SERVICE_TYPE_LABELS[serviceType]}
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                {isSubmitting ? "Marking..." : "Mark Attendance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
