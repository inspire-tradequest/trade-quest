
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/integrations/supabase/client";
import { authApi, profileApi } from "@/api/client";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { session } = await authApi.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Event listener for auth state changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleStorageChange = (event: StorageEvent) => {
    // If user or token was changed in another tab
    if (event.key === 'tradequest_auth_token' || event.key === 'tradequest_user') {
      if (!event.newValue) {
        // If token was removed, sign out user
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (event.key === 'tradequest_user' && event.newValue) {
        // If user was updated
        const newUser = JSON.parse(event.newValue);
        setUser(newUser);
        fetchProfile(newUser.id);
      }
    }
  };

  async function fetchProfile(userId: string) {
    try {
      const profileData = await profileApi.getProfile(userId);
      setProfile(profileData);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      const { user, session } = await authApi.signIn(email, password);
      
      setSession(session);
      setUser(user);
      
      if (user) {
        await fetchProfile(user.id);
      }
      
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string) {
    try {
      setIsLoading(true);
      const { user, session } = await authApi.signUp(email, password);
      
      // If no session is returned, email verification may be required
      if (session) {
        setSession(session);
        setUser(user);
        
        if (user) {
          await fetchProfile(user.id);
        }
      }
      
      toast({
        title: "Account created",
        description: "Please check your email for verification instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      await authApi.signOut();
      
      setSession(null);
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
