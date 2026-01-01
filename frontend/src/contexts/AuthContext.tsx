import { createContext, useContext, useEffect, useState } from "react";
import { authApi, User as ApiUser } from "@/lib/api";

type AppRole = 'visitation_coordinator' | 'assistant_coordinator' | 'president' | 'central' | 'level_coordinator' | 'admin' | 'user';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const response = await authApi.getCurrentUser();
        console.log('🔍 Session check response:', response);
        if (response.success && response.data) {
          const userData = response.data;
          setUser({
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
          });
          setUserRole(userData.role as AppRole);
          setIsApproved(userData.isApproved);
          console.log('✅ Session restored:', userData.email);
        } else {
          console.log('⚠️ No active session found');
          setUser(null);
          setUserRole(null);
          setIsApproved(null);
        }
      } catch (error) {
        console.error('❌ Session error:', error);
        // Clear session data if authentication fails
        setUser(null);
        setUserRole(null);
        setIsApproved(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Role checking functions
  const isSuperAdmin = () => userRole === 'visitation_coordinator';
  const isAssistantCoordinator = () => userRole === 'assistant_coordinator';
  const isPresident = () => userRole === 'president';
  const isCentral = () => userRole === 'central';
  const isLevelCoordinator = () => userRole === 'level_coordinator';
  const isAdmin = () => userRole === 'admin' || userRole === 'visitation_coordinator' || userRole === 'assistant_coordinator';
  
  const canManageAllMembers = () => 
    userRole === 'visitation_coordinator' || userRole === 'assistant_coordinator';
  
  const canMarkAttendance = () => 
    userRole === 'visitation_coordinator' || userRole === 'assistant_coordinator' || userRole === 'level_coordinator';

  const isPendingApproval = () => isApproved === false;

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await authApi.signIn({ email, password });
      console.log('📨 Login response:', response);
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
        });
        setUserRole(userData.role as AppRole);
        setIsApproved(userData.isApproved);
        console.log('✅ Login successful:', userData.email, 'Role:', userData.role);
        return { error: null };
      }
      return { error: new Error(response.message || 'Login failed') };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Attempting signup...');
      const response = await authApi.signUp({ email, password, fullName });
      console.log('📨 Signup response:', response);
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
        });
        setUserRole(userData.role as AppRole);
        setIsApproved(userData.isApproved);
        console.log('✅ Signup successful:', userData.email, 'Approved:', userData.isApproved);
        return { error: null };
      }
      return { error: new Error(response.message || 'Sign up failed') };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      setIsApproved(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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