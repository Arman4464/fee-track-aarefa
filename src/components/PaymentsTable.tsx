
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format, parse } from 'date-fns';
import { usePayments } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { MONTHS, generateAcademicYear, getCurrentAcademicYear } from '@/utils/academic-year';
import type { Payment, PaymentMark } from '@/types/app';
import { useAuth } from '@/contexts/AuthContext';

type PaymentsTableProps = {
  userEmail: string;
  readOnly?: boolean;
  year?: number;
};

export function PaymentsTable({ userEmail, readOnly = false, year = getCurrentAcademicYear() }: PaymentsTableProps) {
  const { currentUser } = useAuth();
  const { payments, isLoading, updatePayment } = usePayments(userEmail);
  const [selectedYear] = useState<number>(year);
  const academicMonths = generateAcademicYear(selectedYear);
  
  // Only admins can edit payments (or if readOnly is explicitly set to false)
  const canEdit = currentUser?.isAdmin && !readOnly;
  
  // Create a map of month_year to payment for quick lookup
  const paymentsByMonth: Record<string, Payment> = {};
  payments?.forEach(payment => {
    paymentsByMonth[payment.month_year] = payment;
  });

  // Handle payment mark change
  const handleMarkChange = (payment: Payment, mark: PaymentMark) => {
    updatePayment.mutate({
      id: payment.id,
      updates: { 
        mark,
        // If marked as Paid and no payment date is set, set it to today
        payment_date: mark === 'Paid' && !payment.payment_date ? new Date().toISOString().split('T')[0] : payment.payment_date
      }
    });
  };

  // Handle payment date change
  const handleDateChange = (payment: Payment, date: Date | undefined) => {
    updatePayment.mutate({
      id: payment.id,
      updates: { 
        payment_date: date ? date.toISOString().split('T')[0] : null
      }
    });
  };

  // Helper to get payment status for a month
  const getPaymentForMonth = (monthYear: string) => {
    return paymentsByMonth[monthYear] || null;
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">
        Academic Year {selectedYear}-{selectedYear + 1}
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px_120px] font-medium bg-muted p-2">
          <div className="px-3 py-2">Month</div>
          <div className="px-3 py-2">Status</div>
          <div className="px-3 py-2">Payment Date</div>
        </div>

        <div className="divide-y">
          {academicMonths.map((month) => {
            const payment = getPaymentForMonth(month.monthYear);
            
            return (
              <div key={month.monthYear} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_120px] py-2 items-center">
                <div className="px-3 py-1.5">{month.displayText}</div>
                <div className="px-3 py-1.5">
                  {payment ? (
                    canEdit ? (
                      <Select
                        value={payment.mark}
                        onValueChange={(value) => handleMarkChange(payment, value as PaymentMark)}
                        disabled={updatePayment.isPending}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Next Month">Next Month</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={cn(
                        "inline-block rounded-md px-2 py-1 text-xs font-medium", 
                        payment.mark === 'Paid' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                        payment.mark === 'Next Month' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {payment.mark}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">Not initialized</span>
                  )}
                </div>
                <div className="px-3 py-1.5">
                  {payment ? (
                    canEdit ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={cn(
                              "w-[110px] justify-start text-left font-normal",
                              !payment.payment_date && "text-muted-foreground"
                            )}
                            disabled={updatePayment.isPending || payment.mark !== 'Paid'}
                          >
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            {payment.payment_date 
                              ? format(parse(payment.payment_date, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy')
                              : <span>Set date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={payment.payment_date ? parse(payment.payment_date, 'yyyy-MM-dd', new Date()) : undefined}
                            onSelect={(date) => handleDateChange(payment, date)}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      payment.payment_date ? (
                        <span className="text-sm">
                          {format(parse(payment.payment_date, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">No date</span>
                      )
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
