
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { paymentService, PaymentUpdateData } from '@/services/paymentService';
import { getCurrentAcademicYear } from '@/utils/academic-year';
import type { Payment } from '@/types/app';

export function usePayments(userEmail?: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isAdmin = !userEmail; // If no userEmail is provided, we assume it's an admin view

  // Fetch payments for specific user or all payments for admin
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', userEmail],
    queryFn: async () => {
      if (isAdmin) {
        return await paymentService.getAllPayments();
      } else {
        return await paymentService.getPaymentsByEmail(userEmail);
      }
    },
    enabled: isAdmin || !!userEmail
  });

  // Initialize academic year payments
  const initializePayments = useMutation({
    mutationFn: async ({ email, year }: { email: string, year: number }) => {
      await paymentService.initializeAcademicYearPayments(email, year);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', userEmail] });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to initialize payments: ${error.message}`
      });
    }
  });

  // Update a payment
  const updatePayment = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: PaymentUpdateData }) => {
      return await paymentService.updatePayment(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', userEmail] });
      toast({
        title: "Payment updated",
        description: "Payment has been successfully updated"
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update payment: ${error.message}`
      });
    }
  });

  // Add a new payment
  const addPayment = useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
      return await paymentService.addPayment(payment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', userEmail] });
      toast({
        title: "Payment added",
        description: "Payment has been successfully added"
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add payment: ${error.message}`
      });
    }
  });

  // Delete a payment
  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      await paymentService.deletePayment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', userEmail] });
      toast({
        title: "Payment deleted",
        description: "Payment has been successfully deleted"
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete payment: ${error.message}`
      });
    }
  });

  return {
    payments,
    isLoading,
    error,
    initializePayments,
    updatePayment,
    addPayment,
    deletePayment
  };
}
