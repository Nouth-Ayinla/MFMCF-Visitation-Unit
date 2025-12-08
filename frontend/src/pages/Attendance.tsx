import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MarkAttendance } from "@/components/attendance/MarkAttendance";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { AttendanceStats } from "@/components/attendance/AttendanceStats";

const Attendance = () => {
  const { user, canMarkAttendance, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 h-full flex flex-col">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 flex-1 flex flex-col w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Mark and track member attendance
          </p>
        </div>

        <Tabs defaultValue={canMarkAttendance() ? "mark" : "history"} className="space-y-4 flex-1 flex flex-col">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 h-auto">
            {canMarkAttendance() && <TabsTrigger value="mark" className="text-xs sm:text-sm py-2">Mark</TabsTrigger>}
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2">History</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm py-2">Stats</TabsTrigger>
          </TabsList>

          {canMarkAttendance() && (
            <TabsContent value="mark" className="flex-1">
              <MarkAttendance />
            </TabsContent>
          )}

          <TabsContent value="history" className="flex-1">
            <AttendanceHistory />
          </TabsContent>

          <TabsContent value="stats" className="flex-1">
            <AttendanceStats />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Attendance;
