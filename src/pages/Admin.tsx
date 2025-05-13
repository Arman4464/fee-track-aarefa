
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Payment, paymentService } from "@/services/paymentService";
import { Parent, userService } from "@/services/userService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash, X, Check } from "lucide-react";

const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "P";
  for (let i = 0; i < 7; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += "1!"; // Ensure it has a number and special character
  return password;
};

const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const Admin = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newParentEmail, setNewParentEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showParentDeleteDialog, setShowParentDeleteDialog] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [showUpdateFeeDialog, setShowUpdateFeeDialog] = useState(false);
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"Paid" | "Unpaid">("Paid");
  const [updating, setUpdating] = useState(false);
  const [paymentToUpdate, setPaymentToUpdate] = useState<Payment | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedParents, fetchedPayments] = await Promise.all([
        userService.getAllParents(),
        paymentService.getAllPayments()
      ]);
      setParents(fetchedParents);
      setPayments(fetchedPayments);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddParent = async () => {
    if (!newParentEmail || !newParentEmail.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address"
      });
      return;
    }
    
    try {
      const password = generatePassword();
      setGeneratedPassword(password);
      
      // In a real app, we would create the user in Supabase here
      await userService.addParent(newParentEmail);
      
      setShowPasswordDialog(true);
      toast({
        title: "Success",
        description: "Parent account created successfully"
      });
      
      // Refresh parent list
      const updatedParents = await userService.getAllParents();
      setParents(updatedParents);
      
      // Reset form
      setNewParentEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add parent"
      });
    }
  };

  const confirmDeleteParent = (parent: Parent) => {
    setParentToDelete(parent);
    setShowParentDeleteDialog(true);
  };

  const handleDeleteParent = async () => {
    if (!parentToDelete) return;
    
    try {
      // Delete parent and their payments
      await userService.deleteParent(parentToDelete.id);
      await paymentService.deleteParentPayments(parentToDelete.id);
      
      toast({
        title: "Success",
        description: `Parent ${parentToDelete.email} deleted successfully`
      });
      
      // Refresh data
      await fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete parent"
      });
    } finally {
      setShowParentDeleteDialog(false);
      setParentToDelete(null);
    }
  };

  const openUpdateFeeDialog = (parent: Parent) => {
    setSelectedParent(parent.id);
    setShowUpdateFeeDialog(true);
  };

  const createOrUpdateFee = async () => {
    if (!selectedParent || !selectedMonth || !selectedYear) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select all required fields"
      });
      return;
    }
    
    setUpdating(true);
    
    try {
      const parent = parents.find(p => p.id === selectedParent);
      if (!parent) throw new Error("Parent not found");
      
      // Check if payment record already exists
      const existingPayment = payments.find(
        p => p.parentId === selectedParent && 
             p.month === selectedMonth && 
             p.year === parseInt(selectedYear)
      );
      
      if (existingPayment) {
        // Update existing payment
        const updatedPayment = await paymentService.updatePaymentStatus(existingPayment.id, selectedStatus);
        
        // Update local state
        setPayments(payments.map(p => 
          p.id === updatedPayment.id ? updatedPayment : p
        ));
      } else {
        // Create new payment
        const newPayment = await paymentService.addPayment({
          parentId: selectedParent,
          parentEmail: parent.email,
          month: selectedMonth,
          year: parseInt(selectedYear),
          status: selectedStatus,
          amount: 500, // Default fee amount
          date: selectedStatus === "Paid" ? new Date().toISOString().split('T')[0] : undefined
        });
        
        // Update local state
        setPayments([...payments, newPayment]);
      }
      
      toast({
        title: "Success",
        description: "Fee status updated successfully"
      });
      
      // Close dialog and reset form
      setShowUpdateFeeDialog(false);
      setSelectedParent("");
      setSelectedMonth("");
      setSelectedYear("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update fee status"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getPaymentsForParent = (parentId: string) => {
    return payments.filter(p => p.parentId === parentId);
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <NavBar />
      <div className="container mx-auto p-6 flex-1">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="parents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="parents">Manage Parents</TabsTrigger>
            <TabsTrigger value="fees">Manage Fees</TabsTrigger>
          </TabsList>
          
          <TabsContent value="parents">
            <Card>
              <CardHeader>
                <CardTitle>Add New Parent</CardTitle>
                <CardDescription>
                  Create a new parent account with an email and auto-generated password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="email">Parent Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="parent@example.com"
                      value={newParentEmail}
                      onChange={(e) => setNewParentEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleAddParent} className="btn-hover mt-6">
                    <Plus className="mr-2 h-4 w-4" /> Add Parent
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Parent Accounts</CardTitle>
                <CardDescription>
                  All registered parents in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : parents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered Payments</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parents.map((parent, index) => (
                        <TableRow key={parent.id} className="table-row-stagger" style={{animationDelay: `${index * 0.1}s`}}>
                          <TableCell className="font-medium">{parent.email}</TableCell>
                          <TableCell>{getPaymentsForParent(parent.id).length}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openUpdateFeeDialog(parent)}
                                className="btn-hover"
                              >
                                Update Fees
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteParent(parent)}
                                className="btn-hover"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No parents registered yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle>Fee Payments</CardTitle>
                <CardDescription>
                  All fee payments across all parents
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
                        <TableHead>Parent</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, index) => (
                        <TableRow key={payment.id} className="table-row-stagger" style={{animationDelay: `${index * 0.1}s`}}>
                          <TableCell className="font-medium">{payment.parentEmail}</TableCell>
                          <TableCell>{payment.month} {payment.year}</TableCell>
                          <TableCell>₹{payment.amount}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "Paid" ? "default" : "destructive"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.date || "—"}</TableCell>
                          <TableCell>
                            {payment.status === "Paid" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentToUpdate(payment);
                                  paymentService.updatePaymentStatus(payment.id, "Unpaid").then(updatedPayment => {
                                    setPayments(payments.map(p => 
                                      p.id === payment.id ? updatedPayment : p
                                    ));
                                    toast({
                                      title: "Status Updated",
                                      description: "Payment marked as Unpaid"
                                    });
                                  });
                                }}
                                className="btn-hover"
                              >
                                <X className="h-4 w-4 mr-1" /> Mark Unpaid
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentToUpdate(payment);
                                  paymentService.updatePaymentStatus(payment.id, "Paid").then(updatedPayment => {
                                    setPayments(payments.map(p => 
                                      p.id === payment.id ? updatedPayment : p
                                    ));
                                    toast({
                                      title: "Status Updated",
                                      description: "Payment marked as Paid"
                                    });
                                  });
                                }}
                                className="btn-hover"
                              >
                                <Check className="h-4 w-4 mr-1" /> Mark Paid
                              </Button>
                            )}
                          </TableCell>
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
          </TabsContent>
        </Tabs>
        
        {/* Password Display Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Parent Account Created</DialogTitle>
              <DialogDescription>
                Parent account has been created successfully. Please save this password in a secure location.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-secondary p-4 rounded-md mt-2">
              <div className="mb-2 text-sm text-muted-foreground">Email:</div>
              <div className="font-mono font-bold mb-4">{newParentEmail}</div>
              <div className="mb-2 text-sm text-muted-foreground">Password:</div>
              <div className="font-mono font-bold">{generatedPassword}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              In a real application, this would be sent via email. For this demo, you'll need to communicate it directly.
            </p>
            <DialogFooter>
              <Button onClick={() => setShowPasswordDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Parent Confirmation Dialog */}
        <AlertDialog open={showParentDeleteDialog} onOpenChange={setShowParentDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the parent account {parentToDelete?.email} and all associated payment records.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteParent} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Update Fee Dialog */}
        <Dialog open={showUpdateFeeDialog} onOpenChange={setShowUpdateFeeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Fee Status</DialogTitle>
              <DialogDescription>
                Mark fees as paid or unpaid for a specific month.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="parent">Parent</Label>
                <Select
                  value={selectedParent}
                  onValueChange={setSelectedParent}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as "Paid" | "Unpaid")}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateFeeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createOrUpdateFee} disabled={updating}>
                {updating ? "Updating..." : "Update Fee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
