
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useStudentClasses() {
  const queryClient = useQueryClient();

  // Assign a student to a class
  const assignStudentToClass = useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string, classId: string }) => {
      const { data, error } = await supabase
        .from('student_classes')
        .insert([{ student_id: studentId, class_id: classId }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Student assigned",
        description: "Student has been successfully assigned to the class"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to assign student to class: ${error.message}`
      });
    }
  });

  // Remove a student from a class
  const removeStudentFromClass = useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string, classId: string }) => {
      const { error } = await supabase
        .from('student_classes')
        .delete()
        .eq('student_id', studentId)
        .eq('class_id', classId);
      
      if (error) throw error;
      return { studentId, classId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: "Student removed",
        description: "Student has been successfully removed from the class"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to remove student from class: ${error.message}`
      });
    }
  });

  return {
    assignStudentToClass,
    removeStudentFromClass
  };
}
