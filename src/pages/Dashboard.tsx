
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment, paymentService } from "@/services/paymentService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (currentUser?.id) {
        try {
          const parentPayments = await paymentService.getParentPayments(currentUser.id);
          setPayments(parentPayments);
        } catch (error) {
          console.error("Error fetching payments:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPayments();
  }, [currentUser]);

  // Calculate statistics
  const paidCount = payments.filter(p => p.status === "Paid").length;
  const unpaidCount = payments.filter(p => p.status === "Unpaid").length;
  const totalPaid = payments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <NavBar />
      <div className="container mx-auto p-6 flex-1">
        <h1 className="text-3xl font-bold mb-6">Parent Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="animate-scale-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Fees Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-24" /> : `₹${totalPaid}`}
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-scale-in" style={{animationDelay: "0.1s"}}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {loading ? <Skeleton className="h-8 w-24" /> : (
                  <>
                    {paidCount} <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-scale-in" style={{animationDelay: "0.2s"}}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {loading ? <Skeleton className="h-8 w-24" /> : (
                  <>
                    {unpaidCount} <XCircle className="h-5 w-5 text-red-500 ml-2" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Fee Payment History</CardTitle>
            <CardDescription>
              View all your tuition fee payments here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => (
                    <TableRow key={payment.id} className="table-row-stagger" style={{animationDelay: `${index * 0.1}s`}}>
                      <TableCell className="font-medium">{payment.month} {payment.year}</TableCell>
                      <TableCell>₹{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "Paid" ? "default" : "destructive"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.date || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payment records found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
