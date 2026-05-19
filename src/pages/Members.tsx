import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Search,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  MessageCircle,
  Copy,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MemberDetailsDialog } from "@/components/members/MemberDetailsDialog";
import { EditMemberDialog } from "@/components/members/EditMemberDialog";
import { DeleteMemberDialog } from "@/components/members/DeleteMemberDialog";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import heroBackground from "@/assets/fellowship-background.jpg";
import mfmLogo from "@/assets/mfm-logo.png";

interface Member {
  id: string;
  full_name: string;
  phone_number: string;
  address: string | null;
  date_of_birth: string;
  gender: string | null;
  level_id: string | null;
  department_id: string | null;
  department_other: string | null;
  how_did_you_hear: string | null;
  is_first_timer: boolean;
  promoted_to_member_at: string | null;
  registered_at: string;
  departments?: { name: string; id: string } | null;
  levels?: { level_number: string; id: string } | null;
}

const Members = () => {
  const { user, canManageAllMembers, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredData, setFilteredData] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [memberTypeFilter, setMemberTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (
      selectedMemberIds.size === filteredData.length &&
      filteredData.length > 0
    ) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredData.map((m) => m.id)));
    }
  };

  const formatWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "234" + digits.slice(1);
    if (digits.startsWith("234")) return digits;
    return "234" + digits;
  };

  const selectedMembers = filteredData.filter((m) =>
    selectedMemberIds.has(m.id),
  );
  const isAllSelected =
    filteredData.length > 0 && selectedMemberIds.size === filteredData.length;

  const sendToAll = async () => {
    if (selectedMembers.length === 0) return;
    setIsSending(true);
    setSentCount(0);
    for (let i = 0; i < selectedMembers.length; i++) {
      const member = selectedMembers[i];
      const url = `https://wa.me/${formatWhatsAppNumber(member.phone_number)}${
        whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""
      }`;
      window.open(url, "_blank", "noopener,noreferrer");
      setSentCount(i + 1);
      if (i < selectedMembers.length - 1) {
        await new Promise((res) => setTimeout(res, 700));
      }
    }
    setIsSending(false);
    toast({
      title: "Done",
      description: `Opened WhatsApp chats for ${selectedMembers.length} member${
        selectedMembers.length !== 1 ? "s" : ""
      }`,
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadMembers();

      const channel = supabase
        .channel("members-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "members",
          },
          () => {
            loadMembers();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, levelFilter, memberTypeFilter, genderFilter, members]);

  const loadMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        *,
        departments (id, name),
        levels (id, level_number)
      `,
      )
      .order("registered_at", { ascending: false });

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
    let filtered = [...members];

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone_number.includes(searchTerm) ||
          member.departments?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.department_other
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((member) => {
        const memberLevel = member.levels?.level_number;

        if (levelFilter === "PDS/UABS") {
          return (
            memberLevel === "PDS" ||
            memberLevel === "UABS" ||
            memberLevel === "PDS/UABS"
          );
        }

        return memberLevel === levelFilter;
      });
    }

    if (memberTypeFilter !== "all") {
      filtered = filtered.filter((member) =>
        memberTypeFilter === "first-timer"
          ? member.is_first_timer
          : !member.is_first_timer,
      );
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter(
        (member) => member.gender?.toLowerCase() === genderFilter.toLowerCase(),
      );
    }

    // Sort by level descending (500 first), UABS/non-numeric/no-level members at the end
    filtered.sort((a, b) => {
      const lvlA = parseInt(a.levels?.level_number || "", 10);
      const lvlB = parseInt(b.levels?.level_number || "", 10);
      const aValid = !isNaN(lvlA);
      const bValid = !isNaN(lvlB);
      if (aValid && bValid) return lvlB - lvlA;
      if (aValid) return -1;
      if (bValid) return 1;
      return 0;
    });

    setFilteredData(filtered);
  };

  const handlePromoteToMember = async (memberId: string) => {
    const { error } = await supabase
      .from("members")
      .update({
        is_first_timer: false,
        promoted_to_member_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to promote member",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Member promoted successfully",
      });
      loadMembers();
    }
  };

  const exportToPDF = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No members to export",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    const genderLabel =
      genderFilter !== "all" ? ` — ${genderFilter} Members` : " — All Members";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`MFMCF FUTA Chapter — Member List${genderLabel}`, 14, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${dateStr}   Total: ${filteredData.length}`, 14, 21);

    const rows = filteredData.map((member, index) => {
      let formattedBirthDate = "";
      if (member.date_of_birth) {
        const date = new Date(member.date_of_birth);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formattedBirthDate = `${month}-${day}`;
      }
      return [
        index + 1,
        member.full_name,
        member.phone_number,
        formattedBirthDate,
        member.gender || "-",
        member.levels?.level_number || "-",
        member.departments?.name || member.department_other || "-",
        member.address || "-",
      ];
    });

    autoTable(doc, {
      startY: 26,
      head: [
        [
          "#",
          "Full Name",
          "Phone Number",
          "Date of Birth",
          "Gender",
          "Level",
          "Department",
          "Address",
        ],
      ],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [137, 32, 172],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 240, 250] },
      columnStyles: {
        0: { halign: "center", cellWidth: 20, overflow: "hidden" },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "center", cellWidth: 16 },
        5: { halign: "center", cellWidth: 14 },
      },
      margin: { left: 14, right: 14 },
    });

    const genderSuffix =
      genderFilter !== "all" ? `_${genderFilter.toLowerCase()}` : "";
    doc.save(
      `mfm-members${genderSuffix}_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    toast({
      title: "Success",
      description: `Exported ${filteredData.length} ${genderFilter !== "all" ? genderFilter.toLowerCase() + " " : ""}member${filteredData.length !== 1 ? "s" : ""} to PDF`,
    });
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div
        className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <img
            src={mfmLogo}
            alt="MFM CF Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 bg-white rounded-full p-2"
          />
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">
            MFMCF FUTA CHAPTER
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#8920AC]">
            Member Management
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Filter & Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Filter by Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                    <SelectItem value="PDS/UABS">PDS/UABS</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={memberTypeFilter}
                  onValueChange={setMemberTypeFilter}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="first-timer">First-Timers</SelectItem>
                    <SelectItem value="member">Members</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Filter by Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 sm:gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing {filteredData.length} of {members.length} members
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedMemberIds.size > 0 && (
                    <Button
                      onClick={() => setWhatsappDialogOpen(true)}
                      size="sm"
                      className="w-full xs:w-auto text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span>WhatsApp ({selectedMemberIds.size})</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    size="sm"
                    className="w-full xs:w-auto text-xs sm:text-sm"
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">Add Member</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    size="sm"
                    className="w-full xs:w-auto text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">
                      {genderFilter !== "all"
                        ? `Export ${genderFilter}s to PDF`
                        : "Export to PDF"}
                    </span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Members</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredData.length > 0 && (
                  <div className="flex items-center gap-2 pb-1">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      id="select-all-mobile"
                    />
                    <label
                      htmlFor="select-all-mobile"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      {isAllSelected ? "Deselect all" : "Select all"}
                    </label>
                  </div>
                )}
                {filteredData.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No members found
                  </div>
                ) : (
                  filteredData.map((member) => (
                    <Card
                      key={member.id}
                      className={`p-4 transition-colors ${selectedMemberIds.has(member.id) ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedMemberIds.has(member.id)}
                              onCheckedChange={() =>
                                toggleSelectMember(member.id)
                              }
                              className="mt-1"
                            />
                            <div className="space-y-1">
                              <h3 className="font-semibold text-base">
                                {member.full_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {member.phone_number}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              member.is_first_timer
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {member.is_first_timer ? "First-Timer" : "Member"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Department:
                            </span>
                            <p className="font-medium truncate">
                              {member.departments?.name ||
                                member.department_other ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Level:
                            </span>
                            <p className="font-medium">
                              {member.levels?.level_number || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedMember(member);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {(canManageAllMembers() ||
                            !member.is_first_timer) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedMember(member);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          {member.is_first_timer && canManageAllMembers() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteToMember(member.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          {isSuperAdmin() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMember(member);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead className="min-w-[150px]">Full Name</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[120px]">
                        Department
                      </TableHead>
                      <TableHead className="min-w-[80px]">Level</TableHead>
                      <TableHead className="min-w-[150px]">Location</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="text-right min-w-[140px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-muted-foreground py-8"
                        >
                          No members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((member, index) => (
                        <TableRow
                          key={member.id}
                          className={
                            selectedMemberIds.has(member.id)
                              ? "bg-green-50 dark:bg-green-950/20"
                              : ""
                          }
                        >
                          <TableCell className="w-10 text-center">
                            <Checkbox
                              checked={selectedMemberIds.has(member.id)}
                              onCheckedChange={() =>
                                toggleSelectMember(member.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-xs w-10">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.full_name}
                          </TableCell>
                          <TableCell>{member.phone_number}</TableCell>
                          <TableCell>
                            {member.departments?.name ||
                              member.department_other ||
                              "-"}
                          </TableCell>
                          <TableCell>
                            {member.levels?.level_number || "-"}
                          </TableCell>
                          <TableCell
                            className="max-w-[180px] truncate"
                            title={member.address || ""}
                          >
                            {member.address || "-"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                member.is_first_timer
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}
                            >
                              {member.is_first_timer ? "First-Timer" : "Member"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(canManageAllMembers() ||
                                !member.is_first_timer) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {member.is_first_timer &&
                                canManageAllMembers() && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      handlePromoteToMember(member.id)
                                    }
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                )}
                              {isSuperAdmin() && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedMember && (
          <>
            <MemberDetailsDialog
              member={selectedMember}
              open={viewDialogOpen}
              onOpenChange={setViewDialogOpen}
            />
            <EditMemberDialog
              member={selectedMember}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSuccess={loadMembers}
            />
            <DeleteMemberDialog
              member={selectedMember}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onSuccess={loadMembers}
            />
          </>
        )}

        <AddMemberDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={loadMembers}
        />

        {/* WhatsApp Message Dialog */}
        <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Message via WhatsApp ({selectedMembers.length} member
                {selectedMembers.length !== 1 ? "s" : ""})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Message Template
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Selected Members
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      const numbers = selectedMembers
                        .map((m) => m.phone_number)
                        .join(", ");
                      navigator.clipboard.writeText(numbers);
                      toast({
                        title: "Copied",
                        description: `${selectedMembers.length} number${selectedMembers.length !== 1 ? "s" : ""} copied to clipboard`,
                      });
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All Numbers
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.phone_number}
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/${formatWhatsAppNumber(member.phone_number)}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs shrink-0"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Open Chat
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {isSending && (
                <p className="text-sm text-muted-foreground flex-1 text-center sm:text-left">
                  Opening chat {sentCount} of {selectedMembers.length}...
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => setWhatsappDialogOpen(false)}
                disabled={isSending}
              >
                Close
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={sendToAll}
                disabled={
                  isSending ||
                  selectedMembers.length === 0 ||
                  !whatsappMessage.trim()
                }
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {isSending
                  ? `Sending ${sentCount}/${selectedMembers.length}...`
                  : `Send to All (${selectedMembers.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Members;
