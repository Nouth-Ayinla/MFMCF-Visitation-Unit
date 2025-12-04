import { useState, useEffect } from "react";
import { Bell, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface MemberPayload {
  is_first_timer: boolean;
  full_name: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Subscribe to real-time updates for new members
    const membersChannel = supabase
      .channel('dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'members'
        },
        (payload) => {
          const newMember = payload.new as MemberPayload;
          addNotification({
            type: newMember.is_first_timer ? 'first_timer' : 'new_member',
            title: newMember.is_first_timer ? 'New First-Timer' : 'New Member',
            message: `${newMember.full_name} has been registered`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          addNotification({
            type: 'attendance',
            title: 'Attendance Marked',
            message: 'New attendance record has been added',
          });
        }
      )
      .subscribe();

    // Check for birthdays and add notifications
    checkBirthdays();

    return () => {
      supabase.removeChannel(membersChannel);
    };
  }, [user]);

  const checkBirthdays = async () => {
    const { data: members } = await supabase
      .from("members")
      .select("full_name, date_of_birth")
      .not("date_of_birth", "is", null);

    if (!members) return;

    const today = new Date();
    members.forEach((member) => {
      if (!member.date_of_birth) return;
      const dob = new Date(member.date_of_birth);
      if (today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate()) {
        // Check if we've already added this notification today
        const notificationKey = `birthday_${member.full_name}_${today.toDateString()}`;
        const existingNotifications = localStorage.getItem('dashboard_notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        const alreadyNotified = notifications.some(
          (n: Notification) => n.type === 'birthday' && n.message.includes(member.full_name) && 
            new Date(n.created_at).toDateString() === today.toDateString()
        );

        if (!alreadyNotified) {
          addNotification({
            type: 'birthday',
            title: '🎂 Birthday Today!',
            message: `${member.full_name} celebrates their birthday today!`,
          });
        }
      }
    });
  };

  const loadNotifications = () => {
    const stored = localStorage.getItem('dashboard_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
    }
  };

  const addNotification = (data: { type: string; title: string; message: string }) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem('dashboard_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('dashboard_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('dashboard_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('dashboard_notifications');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications yet
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-card hover:bg-accent/50' 
                        : notification.type === 'birthday'
                        ? 'bg-primary/10 hover:bg-primary/15 border-primary/30'
                        : 'bg-primary/5 hover:bg-primary/10 border-primary/20'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {notification.type === 'birthday' && (
                          <Cake className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        )}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
