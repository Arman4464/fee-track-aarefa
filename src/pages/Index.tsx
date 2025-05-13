
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import { motion } from "@/utils/motion";

const Index = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to appropriate dashboard
    if (currentUser) {
      navigate(currentUser.isAdmin ? "/admin" : "/dashboard");
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <NavBar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <motion.div 
          className="max-w-4xl w-full text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to <span className="text-primary">AarefaTution</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your tuition payments and student information all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link to="/login">
              <Button size="lg" variant="default" className="text-lg px-8 py-6 btn-hover">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 btn-hover">
                Register
              </Button>
            </Link>
          </div>
          
          <div className="pt-12 text-muted-foreground">
            <p>
              Are you an admin? <Link to="/login" className="text-primary hover:underline">Login here</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
