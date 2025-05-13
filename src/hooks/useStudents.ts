
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Student, StudentFormData } from '@/types/app';

export function useStudents() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch students for admin (all students) or parent (only their students)
  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('last_name');
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      return data as Student[];
    }
  });

  // Add a new student
  const addStudent = useMutation({
    mutationFn: async (studentData: StudentFormData & { parent_id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student added",
        description: "Student has been successfully added"
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add student: ${error.message}`
      });
    }
  });

  // Update a student
  const updateStudent = useMutation({
    mutationFn: async ({ id, ...studentData }: StudentFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student updated",
        description: "Student has been successfully updated"
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update student: ${error.message}`
      });
    }
  });

  // Delete a student
  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student deleted",
        description: "Student has been successfully deleted"
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete student: ${error.message}`
      });
    }
  });

  return {
    students,
    isLoading,
    error,
    addStudent,
    updateStudent,
    deleteStudent
  };
}
