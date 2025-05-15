
import { supabase } from '@/integrations/supabase/client';
import type { Payment, PaymentMark } from '@/types/app';
import { toast } from '@/hooks/use-toast';
import { generateAcademicYear, getCurrentAcademicYear } from '@/utils/academic-year';

export type PaymentUpdateData = {
  mark?: PaymentMark;
  payment_date?: string | null;
};

export const paymentService = {
  // Get payments for a specific user email
  getPaymentsByEmail: async (userEmail: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_email', userEmail);
      
    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Get all payments (for admin)
  getAllPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('user_email', { ascending: true })
      .order('month_year', { ascending: true });
      
    if (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Update payment status
  updatePayment: async (paymentId: string, updates: PaymentUpdateData): Promise<Payment> => {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
    
    return data;
  },
  
  // Add new payment
  addPayment: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> => {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
    
    return data;
  },
  
  // Delete payment
  deletePayment: async (paymentId: string): Promise<void> => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);
      
    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },
  
  // Initialize or update payments for a school year for a user
  initializeAcademicYearPayments: async (userEmail: string, year: number = getCurrentAcademicYear()): Promise<void> => {
    try {
      const academicMonths = generateAcademicYear(year);
      
      // First check if payments already exist for this user and academic year
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('month_year')
        .eq('user_email', userEmail)
        .in('month_year', academicMonths.map(m => m.monthYear));
      
      // Create a map of existing month_year entries
      const existingMonthYearMap = new Set(existingPayments?.map(p => p.month_year) || []);
      
      // Only create payments for months that don't already exist
      const paymentsToCreate = academicMonths
        .filter(month => !existingMonthYearMap.has(month.monthYear))
        .map(month => ({
          user_email: userEmail,
          month_year: month.monthYear,
          mark: 'Unpaid' as PaymentMark,
          payment_date: null
        }));
      
      if (paymentsToCreate.length > 0) {
        const { error } = await supabase
          .from('payments')
          .insert(paymentsToCreate);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Payments initialized",
          description: `Created ${paymentsToCreate.length} payment records for the academic year`
        });
      }
    } catch (error) {
      console.error("Error initializing payments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize payments"
      });
    }
  }
};
