import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MemberDataCollection from "./pages/MemberDataCollection";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import FirstTimers from "./pages/FirstTimers";
import Birthdays from "./pages/Birthdays";
import Settings from "./pages/Settings";
import PendingApproval from "./pages/PendingApproval";
import Departments from "./pages/Departments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/members" element={<MemberDataCollection />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator", "assistant_coordinator", "president", "central", "level_coordinator", "admin"]}>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-members"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator", "assistant_coordinator", "level_coordinator"]}>
                  <AppLayout>
                    <Members />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator", "assistant_coordinator", "level_coordinator"]}>
                  <AppLayout>
                    <Attendance />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator", "assistant_coordinator", "president", "central", "admin"]}>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator"]}>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/first-timers"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator", "assistant_coordinator", "level_coordinator"]}>
                  <AppLayout>
                    <FirstTimers />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/birthdays"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator", "assistant_coordinator", "level_coordinator"]}>
                  <AppLayout>
                    <Birthdays />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator"]}>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute allowedRoles={["visitation_coordinator"]}>
                  <AppLayout>
                    <Departments />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
