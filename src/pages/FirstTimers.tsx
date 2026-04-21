import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Send,
  FileDown,
  Trash2,
  Edit,
  Search,
  Filter,
  X,
} from "lucide-react";
import { DeleteMemberDialog } from "@/components/members/DeleteMemberDialog";
import { EditMemberDialog } from "@/components/members/EditMemberDialog";
import {
  formatDistanceToNow,
  format,
  getDay,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  generateFirstTimerDoc,
  generateAllFirstTimersDoc,
  ServiceDay,
  getServiceTypeName,
} from "@/lib/firstTimerExport";

interface FirstTimerMember {
  id: string;
  full_name: string;
  phone_number: string;
  address: string | null;
  date_of_birth: string;
  gender: string | null;
  registered_at: string | null;
  contacted_at: string | null;
  contacted_by: string | null;
  is_first_timer: boolean;
  promoted_to_member_at: string | null;
  follow_up_notes: string | null;
  last_sms_sent_at: string | null;
  level_id: string | null;
  department_id: string | null;
  department_other: string | null;
  how_did_you_hear: string | null;
  attendance?: { count: number }[];
  departments?: { name: string; id: string } | null;
  levels?: { level_number: string; id: string } | null;
  contacted_by_profile?: { full_name: string } | null;
}

const FirstTimers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("this-week");
  const [followUpNote, setFollowUpNote] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedMemberForSms, setSelectedMemberForSms] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    full_name?: string;
  } | null>(null);
  const [exportServiceDay, setExportServiceDay] =
    useState<ServiceDay>("sunday");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<FirstTimerMember | null>(
    null,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // Fetch departments for filter
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch levels for filter
  const { data: levels } = useQuery({
    queryKey: ["levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("levels")
        .select("*")
        .order("level_number");
      if (error) throw error;
      return data;
    },
  });

  // Fetch first-timers with attendance count
  const { data: firstTimers, isLoading } = useQuery({
    queryKey: ["first-timers", selectedTab],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(
          `
          *,
          attendance(count),
          departments(id, name),
          levels(id, level_number),
          contacted_by_profile:profiles!members_contacted_by_fkey(full_name)
        `,
        )
        .order("registered_at", { ascending: false });

      const now = new Date();

      // Handle promoted tab differently
      if (selectedTab === "promoted") {
        query = query
          .eq("is_first_timer", false)
          .not("promoted_to_member_at", "is", null)
          .order("promoted_to_member_at", { ascending: false });
      } else {
        // For time-based and all-time tabs, include anyone who was ever a first-timer
        // (either still marked as first-timer or promoted_to_member_at is not null).
        // The promoted tab remains handled above.
        if (selectedTab === "this-week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query = query
            .gte("registered_at", weekAgo.toISOString())
            .or("is_first_timer.eq.true,promoted_to_member_at.not.is.null");
        } else if (selectedTab === "this-month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query = query
            .gte("registered_at", monthAgo.toISOString())
            .or("is_first_timer.eq.true,promoted_to_member_at.not.is.null");
        } else {
          // All time: anyone who was ever a first-timer
          query = query.or(
            "is_first_timer.eq.true,promoted_to_member_at.not.is.null",
          );
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Apply search and filters to the fetched data
  const filteredFirstTimers = useMemo(() => {
    if (!firstTimers) return [];

    return firstTimers.filter((member) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        member.full_name.toLowerCase().includes(searchLower) ||
        member.phone_number.toLowerCase().includes(searchLower);

      // Department filter
      const matchesDepartment =
        filterDepartment === "all" || member.department_id === filterDepartment;

      // Level filter
      const matchesLevel =
        filterLevel === "all" || member.level_id === filterLevel;

      return matchesSearch && matchesDepartment && matchesLevel;
    });
  }, [firstTimers, searchTerm, filterDepartment, filterLevel]);

  // Mark as contacted mutation
  const markContactedMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("members")
        .update({
          contacted_at: new Date().toISOString(),
          contacted_by: user?.id,
        })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["first-timers"] });
      toast({ title: "Member marked as contacted" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Promote to member mutation
  const promoteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("members")
        .update({
          is_first_timer: false,
          promoted_to_member_at: new Date().toISOString(),
        })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["first-timers"] });
      toast({ title: "Member promoted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add follow-up note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({
      memberId,
      note,
    }: {
      memberId: string;
      note: string;
    }) => {
      const { data: member } = await supabase
        .from("members")
        .select("follow_up_notes")
        .eq("id", memberId)
        .single();

      const existingNotes = member?.follow_up_notes || "";
      const timestamp = new Date().toLocaleString();
      const newNote = `[${timestamp}]: ${note}`;
      const updatedNotes = existingNotes
        ? `${existingNotes}\n\n${newNote}`
        : newNote;

      const { error } = await supabase
        .from("members")
        .update({ follow_up_notes: updatedNotes })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["first-timers"] });
      setFollowUpNote("");
      setSelectedMemberId(null);
      toast({ title: "Follow-up note added" });
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async ({
      phoneNumber,
      message,
      memberId,
    }: {
      phoneNumber: string;
      message: string;
      memberId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { phoneNumber, message, memberId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["first-timers"] });
      setSmsMessage("");
      setSmsDialogOpen(false);
      setSelectedMemberForSms(null);
      toast({
        title: "SMS sent successfully",
        description: "The message has been delivered to the first-timer.",
      });
    },
    onError: (error: unknown) => {
      const err = error as Record<string, unknown> | undefined;
      const message =
        typeof err?.["message"] === "string"
          ? String(err!["message"])
          : undefined;
      const context =
        (err?.["context"] as Record<string, unknown> | undefined) ?? undefined;
      const status =
        context && typeof context["status"] === "number"
          ? (context["status"] as number)
          : undefined;

      const isSessionExpired =
        message?.includes("Session expired") ||
        message?.includes("SESSION_EXPIRED") ||
        status === 401;

      if (isSessionExpired) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast({
          title: "Failed to send SMS",
          description:
            message || "Please check your SMS configuration and try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAddNote = (memberId: string) => {
    if (followUpNote.trim()) {
      addNoteMutation.mutate({ memberId, note: followUpNote });
    }
  };

  const handleSendSms = () => {
    if (smsMessage.trim() && selectedMemberForSms) {
      sendSmsMutation.mutate({
        phoneNumber: selectedMemberForSms.phone_number,
        message: smsMessage,
        memberId: selectedMemberForSms.id,
      });
    }
  };

  const openSmsDialog = (member: FirstTimerMember) => {
    setSelectedMemberForSms({
      id: member.id,
      first_name: member.full_name.split(" ")[0] || "",
      last_name: member.full_name.split(" ").slice(1).join(" ") || "",
      phone_number: member.phone_number,
      full_name: member.full_name,
    });
    setSmsMessage(
      `Hello ${member.full_name}! 👋\n\n` +
        `Thank you for visiting MFMCf FUTA. We're so glad you joined us! ` +
        `We'd love to stay connected with you.\n\n` +
        `God bless you! 🙏`,
    );
    setSmsDialogOpen(true);
  };

  // Get the most recent service day date for export
  const getMostRecentServiceDate = (serviceDay: ServiceDay): Date => {
    const today = new Date();
    const dayOfWeek = getDay(today);

    const serviceDayMap: Record<ServiceDay, number> = {
      sunday: 0,
      tuesday: 2,
      thursday: 4,
    };

    const targetDay = serviceDayMap[serviceDay];
    let daysBack = dayOfWeek - targetDay;
    if (daysBack < 0) daysBack += 7;

    const serviceDate = new Date(today);
    serviceDate.setDate(today.getDate() - daysBack);
    return serviceDate;
  };

  // Export first-timers to Word document
  const handleExportToWord = async () => {
    setIsExporting(true);

    try {
      const serviceDate = getMostRecentServiceDate(exportServiceDay);
      const startDate = startOfDay(serviceDate);
      const endDate = endOfDay(serviceDate);

      // Build query with filters
      let query = supabase
        .from("members")
        .select(
          `
          full_name,
          phone_number,
          department_id,
          level_id,
          departments(name),
          levels(level_number)
        `,
        )
        .eq("is_first_timer", true)
        .gte("registered_at", startDate.toISOString())
        .lte("registered_at", endDate.toISOString())
        .order("full_name");

      // Apply department filter
      if (filterDepartment !== "all") {
        query = query.eq("department_id", filterDepartment);
      }

      // Apply level filter
      if (filterLevel !== "all") {
        query = query.eq("level_id", filterLevel);
      }

      const { data: exportData, error } = await query;

      if (error) throw error;

      // Apply search filter (client-side)
      let filteredExportData = exportData || [];
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredExportData = filteredExportData.filter(
          (member) =>
            member.full_name.toLowerCase().includes(searchLower) ||
            member.phone_number.toLowerCase().includes(searchLower),
        );
      }

      if (filteredExportData.length === 0) {
        toast({
          title: "No first-timers found",
          description: `No first-timers match your search/filter criteria for ${format(
            serviceDate,
            "MMMM d, yyyy",
          )} (${getServiceTypeName(exportServiceDay)})`,
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      await generateFirstTimerDoc(
        filteredExportData,
        exportServiceDay,
        serviceDate,
      );

      toast({
        title: "Export successful",
        description: `Exported ${filteredExportData.length} first-timers to Word document`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export first-timers",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export all first-timers to Word document
  const handleExportAllToWord = async () => {
    setIsExportingAll(true);

    try {
      if (!firstTimers || firstTimers.length === 0) {
        toast({
          title: "No first-timers found",
          description: "There are no first-timers to export",
          variant: "destructive",
        });
        setIsExportingAll(false);
        return;
      }

      // Use all first-timers for export
      await generateAllFirstTimersDoc(firstTimers);

      toast({
        title: "Export successful",
        description: `Exported ${firstTimers.length} first-timers to Word document`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export all first-timers",
        variant: "destructive",
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading first-timers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">First-Timers</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track and follow up with new visitors
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Badge
            variant="secondary"
            className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2"
          >
            {filteredFirstTimers?.length || 0} of {firstTimers?.length || 0}
          </Badge>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label htmlFor="department-filter">Department</Label>
              <Select
                value={filterDepartment}
                onValueChange={setFilterDepartment}
              >
                <SelectTrigger id="department-filter">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div className="space-y-2">
              <Label htmlFor="level-filter">Level</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger id="level-filter">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      Level {level.level_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="space-y-2">
              <Label className="invisible">Actions</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm("");
                  setFilterDepartment("all");
                  setFilterLevel("all");
                }}
                disabled={
                  searchTerm === "" &&
                  filterDepartment === "all" &&
                  filterLevel === "all"
                }
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export First-Timers List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Specific Service Export */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="service-day" className="whitespace-nowrap">
                  Service Day:
                </Label>
                <Select
                  value={exportServiceDay}
                  onValueChange={(value) =>
                    setExportServiceDay(value as ServiceDay)
                  }
                >
                  <SelectTrigger id="service-day" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuesday">
                      Tuesday (Bible Study)
                    </SelectItem>
                    <SelectItem value="thursday">
                      Thursday (Revival Hour)
                    </SelectItem>
                    <SelectItem value="sunday">
                      Sunday (Sunday Service)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExportToWord}
                disabled={isExporting}
                className="w-full sm:w-auto"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export to Word"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Exports first-timers registered on the most recent{" "}
              {getServiceTypeName(exportServiceDay)} (
              {format(
                getMostRecentServiceDate(exportServiceDay),
                "MMM d, yyyy",
              )}
              )
            </p>

            {/* All First-Timers Export */}
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Label className="whitespace-nowrap font-medium">
                  Export All:
                </Label>
                <Button
                  onClick={handleExportAllToWord}
                  disabled={isExportingAll}
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {isExportingAll
                    ? "Exporting..."
                    : "Download All First-Timers Report"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Exports comprehensive report of all {firstTimers?.length || 0}{" "}
                first-timers in the system
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="this-month">This Month</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="promoted">Promoted</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {!filteredFirstTimers || filteredFirstTimers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {searchTerm ||
                  filterDepartment !== "all" ||
                  filterLevel !== "all"
                    ? "No first-timers match your search/filter criteria"
                    : "No first-timers found for this period"}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredFirstTimers.map((member) => {
                const attendanceCount = member.attendance?.[0]?.count || 0;
                const daysSinceFirstVisit = member.registered_at
                  ? formatDistanceToNow(new Date(member.registered_at), {
                      addSuffix: true,
                    })
                  : "N/A";

                return (
                  <Card key={member.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {member.full_name}
                            {member.contacted_at && (
                              <Badge variant="outline" className="text-xs">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Contacted
                              </Badge>
                            )}
                            {member.promoted_to_member_at && (
                              <Badge variant="outline" className="text-xs">
                                Promoted
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone_number}
                            </span>
                            <span>•</span>
                            <span>{member.departments?.name || "No dept"}</span>
                            <span>•</span>
                            <span>
                              {member.levels?.level_number || "No level"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="secondary">
                            {attendanceCount} visits
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Registered {daysSinceFirstVisit}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {member.contacted_at && (
                        <div className="text-sm bg-muted p-3 rounded-md">
                          <p className="text-muted-foreground">
                            Contacted on{" "}
                            {new Date(member.contacted_at).toLocaleDateString()}
                            {member.contacted_by_profile &&
                              ` by ${member.contacted_by_profile.full_name}`}
                          </p>
                        </div>
                      )}

                      {member.follow_up_notes && (
                        <div className="text-sm bg-muted p-3 rounded-md">
                          <p className="font-medium mb-1">Follow-up Notes:</p>
                          <p className="whitespace-pre-wrap text-muted-foreground">
                            {member.follow_up_notes}
                          </p>
                        </div>
                      )}

                      {member.last_sms_sent_at && (
                        <div className="text-sm bg-muted p-3 rounded-md">
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Send className="h-3 w-3" />
                            SMS sent{" "}
                            {formatDistanceToNow(
                              new Date(member.last_sms_sent_at),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                        {!member.contacted_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              markContactedMutation.mutate(member.id)
                            }
                            disabled={markContactedMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark as Contacted
                          </Button>
                        )}

                        {!member.promoted_to_member_at && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => promoteMutation.mutate(member.id)}
                            disabled={promoteMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Promote to Member
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMemberToEdit(member);
                            setEditDialogOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openSmsDialog(member)}
                          className="w-full sm:w-auto"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send SMS
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMemberId(member.id)}
                              className="w-full sm:w-auto"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Follow-up Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="note">Note</Label>
                                <Textarea
                                  id="note"
                                  placeholder="Enter your follow-up note..."
                                  value={followUpNote}
                                  onChange={(e) =>
                                    setFollowUpNote(e.target.value)
                                  }
                                  rows={4}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setFollowUpNote("");
                                    setSelectedMemberId(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    selectedMemberId &&
                                    handleAddNote(selectedMemberId)
                                  }
                                  disabled={
                                    !followUpNote.trim() ||
                                    addNoteMutation.isPending
                                  }
                                >
                                  Add Note
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setMemberToDelete({
                              id: member.id,
                              full_name: member.full_name,
                            })
                          }
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* SMS Dialog */}
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send SMS to{" "}
              {selectedMemberForSms
                ? `${selectedMemberForSms.first_name} ${selectedMemberForSms.last_name}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-sm text-muted-foreground">
                Phone Number
              </Label>
              <p className="font-medium">
                {selectedMemberForSms?.phone_number}
              </p>
            </div>
            <div>
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Enter your message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={6}
                maxLength={1600}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {smsMessage.length} / 1600 characters
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSmsMessage("");
                  setSmsDialogOpen(false);
                  setSelectedMemberForSms(null);
                }}
                disabled={sendSmsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendSms}
                disabled={!smsMessage.trim() || sendSmsMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendSmsMutation.isPending ? "Sending..." : "Send SMS"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      {memberToEdit && (
        <EditMemberDialog
          member={{
            id: memberToEdit.id,
            full_name: memberToEdit.full_name,
            phone_number: memberToEdit.phone_number,
            address: memberToEdit.address,
            date_of_birth: memberToEdit.date_of_birth,
            gender: memberToEdit.gender,
            level_id: memberToEdit.level_id,
            department_id: memberToEdit.department_id,
            department_other: memberToEdit.department_other,
            is_first_timer: memberToEdit.is_first_timer ?? true,
            departments: memberToEdit.departments,
            levels: memberToEdit.levels,
          }}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["first-timers"] });
            setMemberToEdit(null);
            setEditDialogOpen(false);
          }}
        />
      )}

      {/* Delete Member Dialog */}
      {memberToDelete && (
        <DeleteMemberDialog
          member={memberToDelete}
          open={!!memberToDelete}
          onOpenChange={(open) => !open && setMemberToDelete(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["first-timers"] });
            setMemberToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default FirstTimers;
