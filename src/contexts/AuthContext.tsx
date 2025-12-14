import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole =
  | "visitation_coordinator"
  | "assistant_coordinator"
  | "president"
  | "central"
  | "level_coordinator"
  | "admin"
  | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isApproved: boolean | null;
  loading: boolean;
  isSuperAdmin: () => boolean;
  isAssistantCoordinator: () => boolean;
  isPresident: () => boolean;
  isCentral: () => boolean;
  isLevelCoordinator: () => boolean;
  isAdmin: () => boolean;
  canManageAllMembers: () => boolean;
  canMarkAttendance: () => boolean;
  isPendingApproval: () => boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle token refresh failures
      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed, clear state
        setSession(null);
        setUser(null);
        setUserRole(null);
        setIsApproved(null);
        return;
      }

      // Handle sign out
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setIsApproved(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      // Fetch role and approval status when user changes
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setUserRole(null);
        setIsApproved(null);
      }
    });

    // Check for existing session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Invalid session, clear everything
        console.error("Session error:", error);
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserRole(null);
        setIsApproved(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserData(session.user.id);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    // Fetch role and profile in parallel to avoid race condition
    const [roleResult, profileResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const role = (roleResult.data?.role as AppRole) || null;
    const approved = profileResult.data?.is_approved ?? false;

    // Set both states together to prevent race condition
    setUserRole(role);
    setIsApproved(approved);
  };

  // Role checking functions
  const isSuperAdmin = () => userRole === "visitation_coordinator";
  const isAssistantCoordinator = () => userRole === "assistant_coordinator";
  const isPresident = () => userRole === "president";
  const isCentral = () => userRole === "central";
  const isLevelCoordinator = () => userRole === "level_coordinator";
  const isAdmin = () =>
    userRole === "admin" ||
    userRole === "visitation_coordinator" ||
    userRole === "assistant_coordinator";

  const canManageAllMembers = () =>
    userRole === "visitation_coordinator" ||
    userRole === "assistant_coordinator";

  const canMarkAttendance = () =>
    userRole === "visitation_coordinator" ||
    userRole === "assistant_coordinator" ||
    userRole === "level_coordinator";

  const isPendingApproval = () => isApproved === false;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setIsApproved(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isApproved,
        loading,
        isSuperAdmin,
        isAssistantCoordinator,
        isPresident,
        isCentral,
        isLevelCoordinator,
        isAdmin,
        canManageAllMembers,
        canMarkAttendance,
        isPendingApproval,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
