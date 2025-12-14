import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string | number | boolean;
  description: string | null;
}

interface SettingsState {
  fellowship_name: string;
  contact_email: string;
  attendance_reminder_enabled: boolean;
  first_timer_follow_up_days: number;
}

const Settings = () => {
  const { toast } = useToast();
  const { user, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    fellowship_name: "",
    contact_email: "",
    attendance_reminder_enabled: false,
    first_timer_follow_up_days: 7,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isSuperAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only visitation coordinators can access settings",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, loading, isSuperAdmin, navigate, toast]);

  useEffect(() => {
    if (user && isSuperAdmin()) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const settingsObj: Partial<SettingsState> = {};
      data.forEach((setting) => {
        const key = setting.setting_key as keyof SettingsState;
        if (key === 'fellowship_name' || key === 'contact_email') {
          settingsObj[key] = String(setting.setting_value ?? '');
        } else if (key === 'attendance_reminder_enabled') {
          settingsObj[key] = Boolean(setting.setting_value);
        } else if (key === 'first_timer_follow_up_days') {
          settingsObj[key] = Number(setting.setting_value) || 7;
        }
      });
      setSettings(prev => ({ ...prev, ...settingsObj }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      updated_by: user.id,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("system_settings")
        .update({
          setting_value: update.setting_value,
          updated_by: update.updated_by,
        })
        .eq("setting_key", update.setting_key);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to update ${update.setting_key}`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    }

    toast({
      title: "Success",
      description: "Settings saved successfully",
    });
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isSuperAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage fellowship settings and preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure basic fellowship information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fellowship_name">Fellowship Name</Label>
            <Input
              id="fellowship_name"
              value={settings.fellowship_name}
              onChange={(e) => setSettings({ ...settings, fellowship_name: e.target.value })}
              placeholder="MFM Campus Fellowship - FUTA Chapter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              placeholder="info@mfmfuta.org"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Settings</CardTitle>
          <CardDescription>Configure attendance and follow-up reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Attendance Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send reminders to mark attendance
              </p>
            </div>
            <Switch
              checked={settings.attendance_reminder_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, attendance_reminder_enabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_timer_follow_up_days">First-Timer Follow-up Days</Label>
            <Input
              id="first_timer_follow_up_days"
              type="number"
              min="1"
              max="30"
              value={settings.first_timer_follow_up_days}
              onChange={(e) =>
                setSettings({ ...settings, first_timer_follow_up_days: parseInt(e.target.value) })
              }
            />
            <p className="text-sm text-muted-foreground">
              Number of days before sending follow-up reminder for first-timers
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
