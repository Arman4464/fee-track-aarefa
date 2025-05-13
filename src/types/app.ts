
import type { Database } from '@/integrations/supabase/types';

// Re-export Supabase types for convenience
export type Student = Database['public']['Tables']['students']['Row'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type StudentClass = Database['public']['Tables']['student_classes']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];

// Custom app types that extend Supabase types
export type StudentWithClasses = Student & {
  classes?: Class[];
};

export type ClassWithStudents = Class & {
  students?: Student[];
};

// Form submission types
export type StudentFormData = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'parent_id'>;
export type ClassFormData = Omit<Class, 'id' | 'created_at' | 'updated_at'>;

// Auth context user type
export type AppUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};
