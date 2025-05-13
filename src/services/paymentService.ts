
export type Payment = {
  id: string;
  parentId: string;
  parentEmail: string;
  month: string;
  year: number;
  status: "Paid" | "Unpaid";
  amount: number;
  date?: string;
};

// Mock data for payments
const mockPayments: Payment[] = [
  {
    id: "pay-1",
    parentId: "parent-id",
    parentEmail: "parent@example.com",
    month: "January",
    year: 2025,
    status: "Paid",
    amount: 500,
    date: "2025-01-05"
  },
  {
    id: "pay-2",
    parentId: "parent-id",
    parentEmail: "parent@example.com",
    month: "February",
    year: 2025,
    status: "Paid",
    amount: 500,
    date: "2025-02-03"
  },
  {
    id: "pay-3",
    parentId: "parent-id",
    parentEmail: "parent@example.com",
    month: "March",
    year: 2025,
    status: "Unpaid",
    amount: 500
  },
  {
    id: "pay-4",
    parentId: "parent-id",
    parentEmail: "parent@example.com",
    month: "April",
    year: 2025,
    status: "Unpaid",
    amount: 500
  }
];

// Mock service for payments - would be replaced with Supabase
export const paymentService = {
  // Get payments for a specific parent
  getParentPayments: (parentId: string): Promise<Payment[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const payments = mockPayments.filter(payment => payment.parentId === parentId);
        resolve(payments);
      }, 500);
    });
  },
  
  // Get all payments (for admin)
  getAllPayments: (): Promise<Payment[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockPayments]);
      }, 500);
    });
  },
  
  // Update payment status
  updatePaymentStatus: (paymentId: string, status: "Paid" | "Unpaid"): Promise<Payment> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const paymentIndex = mockPayments.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) {
          reject(new Error("Payment not found"));
          return;
        }
        
        mockPayments[paymentIndex] = {
          ...mockPayments[paymentIndex],
          status,
          date: status === "Paid" ? new Date().toISOString().split('T')[0] : undefined
        };
        
        resolve(mockPayments[paymentIndex]);
      }, 500);
    });
  },
  
  // Add new payment
  addPayment: (payment: Omit<Payment, "id">): Promise<Payment> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPayment = {
          id: `pay-${Date.now()}`,
          ...payment
        };
        mockPayments.push(newPayment);
        resolve(newPayment);
      }, 500);
    });
  },
  
  // Delete payment
  deletePayment: (paymentId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockPayments.findIndex(p => p.id === paymentId);
        if (index === -1) {
          reject(new Error("Payment not found"));
          return;
        }
        mockPayments.splice(index, 1);
        resolve();
      }, 500);
    });
  },
  
  // Delete all payments for a parent
  deleteParentPayments: (parentId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredPayments = mockPayments.filter(p => p.parentId !== parentId);
        mockPayments.length = 0;
        mockPayments.push(...filteredPayments);
        resolve();
      }, 500);
    });
  }
};
