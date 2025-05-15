
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RegisteredUser = {
  id: string;
  email: string;
};

export function useRegisteredUsers() {
  const [error, setError] = useState<string | null>(null);

  // Fetch users from user_roles table
  const { data: users, isLoading } = useQuery({
    queryKey: ['registeredUsers'],
    queryFn: async () => {
      try {
        // Get user roles first
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id');
        
        if (rolesError) {
          setError(rolesError.message);
          throw rolesError;
        }
        
        if (!userRoles?.length) {
          return [];
        }
        
        // Get all registered users
        const registeredUsers: RegisteredUser[] = [];
        
        for (const role of userRoles) {
          // Try to get email from students table using parent_id
          const { data: students } = await supabase
            .from('students')
            .select('email')
            .eq('parent_id', role.user_id)
            .limit(1);
          
          let email = students && students.length > 0 && students[0].email 
            ? students[0].email 
            : `user-${role.user_id.slice(0, 8)}`;
            
          registeredUsers.push({
            id: role.user_id,
            email: email
          });
        }
        
        return registeredUsers;
      } catch (err: any) {
        console.error('Error fetching registered users:', err);
        setError(err.message);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    users,
    isLoading,
    error
  };
}
