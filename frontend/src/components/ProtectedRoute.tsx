import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, isApproved, loading } = useAuth();

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for user data to be fully loaded before making approval decisions
  // isApproved will be null until profile is fetched
  if (isApproved === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect unapproved users to pending approval page
  // Visitation Coordinators and Assistant Coordinators bypass approval (they approve others)
  const bypassApproval = userRole === 'visitation_coordinator' || userRole === 'assistant_coordinator';
  if (isApproved === false && !bypassApproval) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
