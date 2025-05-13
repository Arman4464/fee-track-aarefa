
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AppUser } from "@/types/app";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  currentUser: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  loginAttempts: number;
  loginLocked: boolean;
  lockoutTimestamp: number | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginLocked, setLoginLocked] = useState(false);
  const [lockoutTimestamp, setLockoutTimestamp] = useState<number | null>(null);
  const navigate = useNavigate();

  // Check for login lockout from local storage
  useEffect(() => {
    const storedLockoutTime = localStorage.getItem("lockoutTime");

    if (storedLockoutTime) {
      const lockoutTime = parseInt(storedLockoutTime);
      if (lockoutTime > Date.now()) {
        setLoginLocked(true);
        setLockoutTimestamp(lockoutTime);
      } else {
        localStorage.removeItem("lockoutTime");
      }
    }
    
    // Load login attempts count
    const storedAttempts = localStorage.getItem("loginAttempts");
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Get user role to determine if admin
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('is_admin')
            .eq('user_id', session.user.id)
            .single();
            
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            isAdmin: roleData?.is_admin || false
          });
          
          // Reset login attempts on successful login
          setLoginAttempts(0);
          localStorage.removeItem("loginAttempts");
        } else {
          setCurrentUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        // Get user role to determine if admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single();
          
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || '',
          isAdmin: roleData?.is_admin || false
        });
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if lockout period has expired
  useEffect(() => {
    if (!loginLocked || !lockoutTimestamp) return;

    const checkLockout = setInterval(() => {
      if (Date.now() > lockoutTimestamp) {
        setLoginLocked(false);
        setLockoutTimestamp(null);
        setLoginAttempts(0);
        localStorage.removeItem("lockoutTime");
        localStorage.removeItem("loginAttempts");
        clearInterval(checkLockout);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkLockout);
  }, [loginLocked, lockoutTimestamp]);

  const login = async (email: string, password: string) => {
    if (loginLocked) {
      const remainingTime = Math.ceil(
        (lockoutTimestamp! - Date.now()) / 1000 / 60
      );
      toast({
        variant: "destructive",
        title: "Account locked",
        description: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Handle failed login
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem("loginAttempts", newAttempts.toString());
        
        // Lock account after 3 failed attempts
        if (newAttempts >= 3) {
          const lockoutTime = Date.now() + 10 * 60 * 1000; // 10 minutes
          setLoginLocked(true);
          setLockoutTimestamp(lockoutTime);
          localStorage.setItem("lockoutTime", lockoutTime.toString());
          
          toast({
            variant: "destructive",
            title: "Account locked",
            description: "Too many failed attempts. Try again in 10 minutes.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: `Invalid email or password. Attempts remaining: ${3 - newAttempts}`,
          });
        }
        throw error;
      }

      // Successful login will trigger onAuthStateChange
      if (data.user) {
        // Get user role to determine navigation
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('user_id', data.user.id)
          .single();
        
        // Reset login attempts
        setLoginAttempts(0);
        localStorage.removeItem("loginAttempts");
        
        // Redirect based on user role
        if (roleData?.is_admin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
      
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message,
        });
        throw error;
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
      });
      
      // Successful registration will also automatically sign in the user
      // which will trigger onAuthStateChange
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout error",
        description: "An unexpected error occurred during logout.",
      });
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    loginAttempts,
    loginLocked,
    lockoutTimestamp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
