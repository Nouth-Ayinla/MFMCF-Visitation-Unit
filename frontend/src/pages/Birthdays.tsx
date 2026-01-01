import { useState, useEffect } from "react";
import { Cake, Gift, Send, Search, Filter, Calendar, PartyPopper, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// TODO: Replace Supabase with backend API - import { membersApi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BirthdayMember,
  isBirthdayToday,
  getDaysUntilBirthday,
  formatBirthday,
  getAge,
} from "@/lib/birthdayUtils";
import { format } from "date-fns";

const MONTHS = [
  "All Months",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Birthdays = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<BirthdayMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [sendingTo, setSendingTo] = useState<string | null>(null);
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
      .select("id, full_name, date_of_birth, phone_number")
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

    const birthdayMembers: BirthdayMember[] = data?.map((member) => ({
      id: member.id,
      full_name: member.full_name,
      date_of_birth: member.date_of_birth!,
      phone_number: member.phone_number,
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
      const dob = new Date(member.date_of_birth);
      if (isBirthdayToday(member.date_of_birth)) {
        todayBirthdays++;
      }
      if (member.daysUntil <= 7) {
        weekBirthdays++;
      }
      if (dob.getMonth() === currentMonth) {
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
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by month
    if (selectedMonth !== "All Months") {
      const monthIndex = MONTHS.indexOf(selectedMonth) - 1;
      filtered = filtered.filter((member) => {
        const dob = new Date(member.date_of_birth);
        return dob.getMonth() === monthIndex;
      });
    }

    setFilteredMembers(filtered);
  };

  const sendBirthdayWish = async (member: BirthdayMember) => {
    if (!member.phone_number) {
      toast({
        title: "No phone number",
        description: "This member doesn't have a phone number on file.",
        variant: "destructive",
      });
      return;
    }

    setSendingTo(member.id);

    try {
      const { error } = await supabase.functions.invoke("send-birthday-sms", {
        body: {
          phone_number: member.phone_number,
          member_name: member.full_name,
        },
      });

      if (error) throw error;

      toast({
        title: "Birthday wish sent!",
        description: `SMS sent to ${member.full_name}`,
      });
    } catch (error) {
      console.error("Error sending birthday SMS:", error);
      toast({
        title: "Failed to send",
        description: "Could not send birthday wish. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingTo(null);
    }
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
                  const isThisWeek = member.daysUntil <= 7 && member.daysUntil > 0;

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
                            isToday
                              ? "bg-primary/20"
                              : "bg-muted"
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatBirthday(member.date_of_birth)}</span>
                            <span>•</span>
                            <span>
                              {format(new Date(member.date_of_birth), "yyyy")} ({getAge(member.date_of_birth)} years)
                            </span>
                          </div>
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
                            onClick={() => sendBirthdayWish(member)}
                            disabled={sendingTo === member.id || !member.phone_number}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {sendingTo === member.id ? "Sending..." : "Send Wish"}
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
