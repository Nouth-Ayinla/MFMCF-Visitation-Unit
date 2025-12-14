import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Eye, Edit, UserPlus, Trash2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadMembers();
      
      const channel = supabase
        .channel('members-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'members'
          },
          () => {
            loadMembers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, levelFilter, memberTypeFilter, members]);

  const loadMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select(`
        *,
        departments (id, name),
        levels (id, level_number)
      `)
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
          member.departments?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.department_other?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((member) => member.levels?.level_number === levelFilter);
    }

    if (memberTypeFilter !== "all") {
      filtered = filtered.filter((member) => 
        memberTypeFilter === "first-timer" ? member.is_first_timer : !member.is_first_timer
      );
    }

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

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No members to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Full Name",
      "Phone Number",
      "Date of Birth",
      "Gender",
      "Level",
      "Department",
      "Address",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map((member) => {
        // Format birth date as MM-DD (without year)
        let formattedBirthDate = "";
        if (member.date_of_birth) {
          const date = new Date(member.date_of_birth);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedBirthDate = `${month}-${day}`;
        }

        return [
          member.full_name,
          member.phone_number,
          formattedBirthDate,
          member.gender || "",
          member.levels?.level_number || "",
          member.departments?.name || member.department_other || "",
          member.address || "",
        ]
          .map((field) => `"${field}"`)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mfm-members_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Exported ${filteredData.length} members`,
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
                </SelectContent>
              </Select>
              <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="first-timer">First-Timers</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing {filteredData.length} of {members.length} members
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setAddDialogOpen(true)} size="sm" className="w-full xs:w-auto text-xs sm:text-sm">
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Add Member</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <Button onClick={exportToCSV} variant="outline" size="sm" className="w-full xs:w-auto text-xs sm:text-sm">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Export to CSV</span>
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
              {filteredData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No members found
                </div>
              ) : (
                filteredData.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base">{member.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{member.phone_number}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          member.is_first_timer ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {member.is_first_timer ? 'First-Timer' : 'Member'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Department:</span>
                          <p className="font-medium truncate">{member.departments?.name || member.department_other || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Level:</span>
                          <p className="font-medium">{member.levels?.level_number || "-"}</p>
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
                        {(canManageAllMembers() || !member.is_first_timer) && (
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
                    <TableHead className="min-w-[150px]">Full Name</TableHead>
                    <TableHead className="min-w-[120px]">Phone</TableHead>
                    <TableHead className="min-w-[120px]">Department</TableHead>
                    <TableHead className="min-w-[80px]">Level</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="text-right min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.phone_number}</TableCell>
                        <TableCell>{member.departments?.name || member.department_other || "-"}</TableCell>
                        <TableCell>{member.levels?.level_number || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            member.is_first_timer ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {member.is_first_timer ? 'First-Timer' : 'Member'}
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
                            {(canManageAllMembers() || !member.is_first_timer) && (
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
                            {member.is_first_timer && canManageAllMembers() && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePromoteToMember(member.id)}
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
      </div>
    </div>
  );
};

export default Members;
