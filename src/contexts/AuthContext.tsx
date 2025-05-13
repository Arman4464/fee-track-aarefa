
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

type User = {
  email: string;
  isAdmin: boolean;
  id: string;
} | null;

type AuthContextType = {
  currentUser: User;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  const [currentUser, setCurrentUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginLocked, setLoginLocked] = useState(false);
  const [lockoutTimestamp, setLockoutTimestamp] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // This is a mock implementation - in reality you would use Supabase auth
  // Once Supabase is connected, this would be replaced with actual Supabase auth calls
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
      // Mock login - replace with Supabase
      if (email === "admin@aarefatution.com" && password === "Admin123!") {
        const user = {
          email,
          isAdmin: true,
          id: "admin-id",
        };
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        setLoginAttempts(0);
        navigate("/admin");
        return;
      } else if (email === "parent@example.com" && password === "Parent123!") {
        const user = {
          email,
          isAdmin: false,
          id: "parent-id",
        };
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        setLoginAttempts(0);
        navigate("/dashboard");
        return;
      }

      // Failed login
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
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
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const register = async (email: string, password: string) => {
    try {
      // This is a mock implementation - would be replaced with Supabase
      const newUser = {
        email,
        isAdmin: false,
        id: `user-${Date.now()}`,
      };
      setCurrentUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const logout = () => {
    // Mock logout - would be replaced with Supabase
    setCurrentUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    // Check for stored user and lockout status
    const storedUser = localStorage.getItem("user");
    const storedLockoutTime = localStorage.getItem("lockoutTime");

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    if (storedLockoutTime) {
      const lockoutTime = parseInt(storedLockoutTime);
      if (lockoutTime > Date.now()) {
        setLoginLocked(true);
        setLockoutTimestamp(lockoutTime);
      } else {
        localStorage.removeItem("lockoutTime");
      }
    }

    setLoading(false);
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
        clearInterval(checkLockout);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkLockout);
  }, [loginLocked, lockoutTimestamp]);

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
