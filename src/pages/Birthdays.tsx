import { useState, useEffect } from "react";
import {
  Cake,
  Gift,
  MessageCircle,
  Search,
  Filter,
  Calendar,
  PartyPopper,
  Users,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BirthdayMember,
  isBirthdayToday,
  getDaysUntilBirthday,
  formatBirthday,
  getMonthFromBirthday,
} from "@/lib/birthdayUtils";

const MONTHS = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const Birthdays = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<BirthdayMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [todayCount, setTodayCount] = useState(0);
  const [thisWeekCount, setThisWeekCount] = useState(0);
  const [thisMonthCount, setThisMonthCount] = useState(0);

  useEffect(() => {
    loadBirthdays();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, selectedMonth, members]);

  const loadBirthdays = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select(
        "id, full_name, date_of_birth, phone_number, levels (level_number)",
      )
      .not("date_of_birth", "is", null)
      .order("date_of_birth");

    if (error) {
      console.error("Error loading birthdays:", error);
      toast({
        title: "Error",
        description: "Failed to load birthdays",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const birthdayMembers: BirthdayMember[] =
      data?.map((member) => ({
        id: member.id,
        full_name: member.full_name,
        date_of_birth: member.date_of_birth!,
        phone_number: member.phone_number,
        level_number: (member as any).levels?.level_number ?? null,
        daysUntil: getDaysUntilBirthday(member.date_of_birth!),
      })) || [];

    // Sort by upcoming birthday
    birthdayMembers.sort((a, b) => a.daysUntil - b.daysUntil);

    // Calculate stats
    const today = new Date();
    const currentMonth = today.getMonth();

    let todayBirthdays = 0;
    let weekBirthdays = 0;
    let monthBirthdays = 0;

    birthdayMembers.forEach((member) => {
      const memberMonth = getMonthFromBirthday(member.date_of_birth);
      if (isBirthdayToday(member.date_of_birth)) {
        todayBirthdays++;
      }
      if (member.daysUntil <= 7) {
        weekBirthdays++;
      }
      if (memberMonth === currentMonth) {
        monthBirthdays++;
      }
    });

    setTodayCount(todayBirthdays);
    setThisWeekCount(weekBirthdays);
    setThisMonthCount(monthBirthdays);
    setMembers(birthdayMembers);
    setIsLoading(false);
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((member) =>
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by month
    if (selectedMonth !== "All Months") {
      const monthIndex = MONTHS.indexOf(selectedMonth) - 1;
      filtered = filtered.filter((member) => {
        return getMonthFromBirthday(member.date_of_birth) === monthIndex;
      });
    }

    setFilteredMembers(filtered);
  };

  const exportBirthdaysPDF = () => {
    if (filteredMembers.length === 0) {
      toast({
        title: "No Data",
        description: "No birthdays to export",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "portrait" });
    const monthLabel =
      selectedMonth === "All Months" ? "All Months" : selectedMonth;
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`MFMCF FUTA Chapter — Birthdays (${monthLabel})`, 14, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${dateStr}   Total: ${filteredMembers.length}`,
      14,
      21,
    );

    const sortByLevel = (arr: BirthdayMember[]) =>
      [...arr].sort((a, b) => {
        const lvlA = parseInt(a.level_number || "", 10);
        const lvlB = parseInt(b.level_number || "", 10);
        if (!isNaN(lvlA) && !isNaN(lvlB)) return lvlB - lvlA;
        if (!isNaN(lvlA)) return -1;
        if (!isNaN(lvlB)) return 1;
        return 0;
      });

    if (selectedMonth !== "All Months") {
      // Single month — flat table sorted by level
      const sorted = sortByLevel(filteredMembers);
      autoTable(doc, {
        startY: 27,
        head: [["#", "Full Name", "Level", "Birthday", "Phone Number"]],
        body: sorted.map((m, i) => [
          i + 1,
          m.full_name,
          m.level_number || "-",
          formatBirthday(m.date_of_birth),
          m.phone_number || "-",
        ]),
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: {
          fillColor: [137, 32, 172],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 240, 250] },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "center", cellWidth: 26 },
        },
        margin: { left: 14, right: 14 },
      });
    } else {
      // All months — grouped by month
      let currentY = 27;

      MONTHS.slice(1).forEach((month) => {
        const monthIndex = MONTHS.indexOf(month) - 1;
        const monthMembers = filteredMembers.filter(
          (m) => getMonthFromBirthday(m.date_of_birth) === monthIndex,
        );
        if (monthMembers.length === 0) return;

        // Month heading
        if (currentY > 250) {
          doc.addPage();
          currentY = 15;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(137, 32, 172);
        doc.text(`${month} (${monthMembers.length})`, 14, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        currentY += 3;

        autoTable(doc, {
          startY: currentY,
          head: [["#", "Full Name", "Level", "Birthday", "Phone Number"]],
          body: sortByLevel(monthMembers).map((m, i) => [
            i + 1,
            m.full_name,
            m.level_number || "-",
            formatBirthday(m.date_of_birth),
            m.phone_number || "-",
          ]),
          styles: { fontSize: 8.5, cellPadding: 2 },
          headStyles: {
            fillColor: [137, 32, 172],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [245, 240, 250] },
          columnStyles: {
            0: { halign: "center", cellWidth: 12 },
            2: { halign: "center", cellWidth: 18 },
            3: { halign: "center", cellWidth: 26 },
          },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      });
    }

    const fileSuffix =
      selectedMonth === "All Months"
        ? "all-months"
        : selectedMonth.toLowerCase();
    doc.save(
      `mfmcf-birthdays_${fileSuffix}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast({
      title: "Success",
      description: `Exported ${filteredMembers.length} birthday${filteredMembers.length !== 1 ? "s" : ""} to PDF`,
    });
  };

  const formatWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "234" + digits.slice(1);
    if (digits.startsWith("234")) return digits;
    return "234" + digits;
  };

  const sendBirthdayWish = (member: BirthdayMember) => {
    if (!member.phone_number) {
      toast({
        title: "No phone number",
        description: "This member doesn't have a phone number on file.",
        variant: "destructive",
      });
      return;
    }
    const message = `Happy Birthday ${member.full_name}! 🎉🎂 Wishing you a wonderful day filled with joy and God's blessings. With love, MFMCF FUTA Chapter.`;
    const url = `https://wa.me/${formatWhatsAppNumber(member.phone_number)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Cake className="h-7 w-7 text-primary" />
            Birthdays
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage member birthdays
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Gift className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisWeekCount}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisMonthCount}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={exportBirthdaysPDF}
                disabled={filteredMembers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {selectedMonth === "All Months"
                  ? "Export All to PDF"
                  : `Export ${selectedMonth} to PDF`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Birthday List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Birthdays
              </span>
              <Badge variant="outline">{filteredMembers.length} members</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading birthdays...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Cake className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No birthdays found</p>
                {(searchQuery || selectedMonth !== "All Months") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedMonth("All Months");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const isToday = isBirthdayToday(member.date_of_birth);
                  const isThisWeek =
                    member.daysUntil <= 7 && member.daysUntil > 0;

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        isToday
                          ? "bg-primary/10 border-primary/20"
                          : isThisWeek
                            ? "bg-accent/50 border-accent"
                            : "hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isToday ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          {isToday ? (
                            <PartyPopper className="h-5 w-5 text-primary" />
                          ) : (
                            <Cake className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatBirthday(member.date_of_birth)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isToday ? (
                          <Badge className="bg-primary text-primary-foreground">
                            Today!
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {member.daysUntil === 0
                              ? "Today"
                              : member.daysUntil === 1
                                ? "Tomorrow"
                                : `in ${member.daysUntil} days`}
                          </Badge>
                        )}

                        {(isToday || isThisWeek) && (
                          <Button
                            size="sm"
                            variant={isToday ? "default" : "outline"}
                            className={
                              isToday
                                ? "bg-green-600 hover:bg-green-700"
                                : "border-green-600 text-green-600 hover:bg-green-50"
                            }
                            onClick={() => sendBirthdayWish(member)}
                            disabled={!member.phone_number}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            WhatsApp Wish
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Birthdays;
