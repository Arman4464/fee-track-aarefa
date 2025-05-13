
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <nav className="bg-background shadow-md border-b border-border animate-fade-in">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">AarefaTution</h1>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <>
                <span className="text-muted-foreground">
                  {currentUser.email}
                </span>
                <Link to={currentUser.isAdmin ? "/admin" : "/dashboard"}>
                  <Button variant="ghost" className="btn-hover">
                    {currentUser.isAdmin ? "Admin Panel" : "Dashboard"}
                  </Button>
                </Link>
                <Button variant="outline" onClick={logout} className="btn-hover">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="btn-hover">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="default" className="btn-hover">Register</Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in">
            {currentUser ? (
              <>
                <div className="text-sm text-muted-foreground px-2">
                  {currentUser.email}
                </div>
                <Link to={currentUser.isAdmin ? "/admin" : "/dashboard"}>
                  <Button variant="ghost" className="w-full text-left justify-start">
                    {currentUser.isAdmin ? "Admin Panel" : "Dashboard"}
                  </Button>
                </Link>
                <Button variant="outline" onClick={logout} className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full text-left justify-start">
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="default" className="w-full">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
