
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function NavHeader() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate(currentUser ? '/dashboard' : '/');
  };

  return (
    <div className="flex items-center gap-4">
      <h1
        className="text-2xl font-bold cursor-pointer"
        onClick={handleTitleClick}
      >
        AarefaTution
      </h1>
    </div>
  );
}
