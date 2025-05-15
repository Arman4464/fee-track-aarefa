
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
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('user_id');
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      if (!userRoles?.length) {
        return [];
      }
      
      // Get user details from auth.users using admin API
      // This would require a Supabase edge function in a real app
      // For now we'll just fetch the students to get the parent emails
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('parent_id, email')
        .order('parent_id');
      
      if (studentsError) {
        setError(studentsError.message);
        throw studentsError;
      }
      
      // Create a map of parent IDs to emails
      const parentEmails: Record<string, string> = {};
      students?.forEach(student => {
        if (student.parent_id) {
          // Use student email as parent email if available
          if (student.email) {
            parentEmails[student.parent_id] = student.email;
          }
        }
      });
      
      // Map user IDs to emails
      const registeredUsers = userRoles.map(role => ({
        id: role.user_id,
        email: parentEmails[role.user_id] || `user-${role.user_id.slice(0, 8)}`
      }));
      
      return registeredUsers;
    }
  });

  return {
    users,
    isLoading,
    error
  };
}
