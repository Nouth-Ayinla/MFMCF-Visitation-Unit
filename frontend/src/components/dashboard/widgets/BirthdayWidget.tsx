import { useState, useEffect } from "react";
import { Cake, Gift, Send, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BirthdayMember,
  isBirthdayToday,
  getDaysUntilBirthday,
  formatBirthday,
} from "@/lib/birthdayUtils";

export const BirthdayWidget = () => {
  const { toast } = useToast();
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayMember[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayMember[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    setIsLoading(true);
    const { data: members, error } = await supabase
      .from("members")
      .select("id, full_name, date_of_birth, phone_number")
      .not("date_of_birth", "is", null);

    if (error) {
      console.error("Error loading birthdays:", error);
      setIsLoading(false);
      return;
    }

    const today: BirthdayMember[] = [];
    const upcoming: BirthdayMember[] = [];

    members?.forEach((member) => {
      if (!member.date_of_birth) return;

      const daysUntil = getDaysUntilBirthday(member.date_of_birth);
      const birthdayMember: BirthdayMember = {
        id: member.id,
        full_name: member.full_name,
        date_of_birth: member.date_of_birth,
        phone_number: member.phone_number,
        daysUntil,
      };

      if (isBirthdayToday(member.date_of_birth)) {
        today.push(birthdayMember);
      } else if (daysUntil <= 7 && daysUntil > 0) {
        upcoming.push(birthdayMember);
      }
    });

    // Sort upcoming by days until birthday
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    setTodayBirthdays(today);
    setUpcomingBirthdays(upcoming);
    setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-muted-foreground">Loading birthdays...</p>
      </div>
    );
  }

  const hasNoBirthdays = todayBirthdays.length === 0 && upcomingBirthdays.length === 0;

  if (hasNoBirthdays) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Cake className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming birthdays in the next 7 days</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[280px]">
      <div className="space-y-4">
        {/* Today's Birthdays */}
        {todayBirthdays.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">TODAY</span>
              <Badge variant="secondary" className="text-xs">
                {todayBirthdays.length}
              </Badge>
            </div>
            {todayBirthdays.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                    <Cake className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBirthday(member.date_of_birth)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => sendBirthdayWish(member)}
                  disabled={sendingTo === member.id || !member.phone_number}
                  className="h-8"
                >
                  <Send className="h-3 w-3 mr-1" />
                  {sendingTo === member.id ? "Sending..." : "Send"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">UPCOMING</span>
              <Badge variant="outline" className="text-xs">
                {upcomingBirthdays.length}
              </Badge>
            </div>
            {upcomingBirthdays.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBirthday(member.date_of_birth)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  in {member.daysUntil} day{member.daysUntil !== 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
