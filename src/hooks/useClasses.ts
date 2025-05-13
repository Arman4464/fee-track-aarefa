
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Class, ClassFormData } from '@/types/app';

export function useClasses() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch all classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (error) {
        setError(error.message);
        throw error;
      }
      
      return data as Class[];
    }
  });

  // Add a new class
  const addClass = useMutation({
    mutationFn: async (classData: ClassFormData) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([classData])
        .select()
        .single();
      
      if (error) throw error;
      return data as Class;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Class added",
        description: "Class has been successfully added"
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add class: ${error.message}`
      });
    }
  });

  // Update a class
  const updateClass = useMutation({
    mutationFn: async ({ id, ...classData }: ClassFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Class;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Class updated",
        description: "Class has been successfully updated"
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update class: ${error.message}`
      });
    }
  });

  // Delete a class
  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Class deleted",
        description: "Class has been successfully deleted"
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete class: ${error.message}`
      });
    }
  });

  return {
    classes,
    isLoading,
    error,
    addClass,
    updateClass,
    deleteClass
  };
}
