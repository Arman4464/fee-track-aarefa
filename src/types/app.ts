
import type { Database } from '@/integrations/supabase/types';

// Re-export Supabase types for convenience
export type Student = Database['public']['Tables']['students']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];

// Custom app types that extend Supabase types
export type StudentWithPayments = Student & {
  payments?: Payment[];
};

// Form submission types
export type StudentFormData = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'parent_id'>;
export type PaymentFormData = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;

// Auth context user type
export type AppUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

// Payment Mark type
export type PaymentMark = 'Paid' | 'Unpaid' | 'Next Month';

// Month type for academic year
export type AcademicMonth = {
  name: string;
  monthYear: string;
  displayText: string;
};
