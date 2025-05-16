
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RegisteredUser = {
  id: string;
  email: string;
};

export function useRegisteredUsers() {
  const [error, setError] = useState<string | null>(null);

  // Fetch users from auth.users table via user_roles
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
          // Get email directly from auth.users table via raw RPC call
          // We need to use a customized approach since TypeScript doesn't know about our custom function
          const { data: userData, error: authError } = await supabase
            .rpc('get_user_email', { user_id: role.user_id }) as any;
          
          if (authError) {
            console.error('Error fetching user email:', authError);
            // Use fallback ID as email if we can't get the actual email
            registeredUsers.push({
              id: role.user_id,
              email: `user-${role.user_id.slice(0, 8)}`
            });
            continue;
          }
          
          // If we successfully got the email (userData is an array with objects containing email property)
          if (userData && Array.isArray(userData) && userData.length > 0) {
            registeredUsers.push({
              id: role.user_id,
              email: userData[0].email || `user-${role.user_id.slice(0, 8)}`
            });
          } else {
            // Fallback if no email found
            registeredUsers.push({
              id: role.user_id,
              email: `user-${role.user_id.slice(0, 8)}`
            });
          }
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
