
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
  const navigate = useNavigate();

  // Set up auth state listener
  useEffect(() => {
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

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password",
        });
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
