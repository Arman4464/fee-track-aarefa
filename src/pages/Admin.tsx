
import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import NavHeader from '@/components/NavHeader';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import type { Student, StudentWithPayments } from '@/types/app';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { useRegisteredUsers, RegisteredUser } from '@/hooks/useRegisteredUsers';
import { PaymentsTable } from '@/components/PaymentsTable';
import { usePayments } from '@/hooks/usePayments';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCurrentAcademicYear } from '@/utils/academic-year';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Admin() {
  const { currentUser } = useAuth();
  const { students, isLoading: studentsLoading, addStudent, deleteStudent } = useStudents();
  const { users, isLoading: usersLoading, error: usersError } = useRegisteredUsers();
  const { initializePayments } = usePayments();
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [year] = useState(getCurrentAcademicYear());
  const [selectedUserStudents, setSelectedUserStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentPayments, setSelectedStudentPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Student form
  const studentForm = useForm<any>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      grade: '',
    },
  });

  const onStudentSubmit = async (data: any) => {
    if (currentUser && selectedParentId) {
      addStudent.mutate({
        ...data,
        parent_id: selectedParentId,
      });
      studentForm.reset();
    }
  };

  const [registeredEmails, setRegisteredEmails] = useState<{id: string, email: string}[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  useEffect(() => {
    if (users?.length > 0) {
      setRegisteredEmails(users.map(user => ({
        id: user.id,
        email: user.email
      })));
    }
  }, [users]);

  // Fetch students for the selected user email
  useEffect(() => {
    async function fetchStudentsForUser() {
      if (!selectedUserEmail) {
        setSelectedUserStudents([]);
        setSelectedStudentPayments([]);
        return;
      }

      setLoadingStudents(true);
      try {
        // Find the user ID for the selected email
        const userId = registeredEmails.find(user => user.email === selectedUserEmail)?.id;
        
        if (userId) {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('parent_id', userId);
            
          if (error) {
            console.error('Error fetching students:', error);
            toast({
              title: 'Error',
              description: 'Failed to fetch students for the selected user',
              variant: 'destructive'
            });
          } else {
            setSelectedUserStudents(data || []);
          }
        }
      } catch (err) {
        console.error('Error in fetchStudentsForUser:', err);
      } finally {
        setLoadingStudents(false);
      }

      // Also fetch payments for this user
      setLoadingPayments(true);
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('month_year, mark, payment_date')
          .eq('user_email', selectedUserEmail)
          .order('month_year', { ascending: true });
          
        if (paymentError) {
          console.error('Error fetching payments:', paymentError);
        } else {
          setSelectedStudentPayments(paymentData || []);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoadingPayments(false);
      }
    }

    fetchStudentsForUser();
  }, [selectedUserEmail, registeredEmails]);

  const handleInitializePayments = () => {
    if (selectedUserEmail) {
      initializePayments.mutate({ 
        email: selectedUserEmail,
        year
      });
      toast({
        title: "Initializing payments",
        description: `Creating payment schedule for ${selectedUserEmail}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please select a user email first",
        variant: "destructive"
      });
    }
  };

  // Update payment mark and date
  const handleSavePayment = async (month_year: string, mark: string, payment_date: string | null) => {
    if (!selectedUserEmail) return;
    
    try {
      const { error } = await supabase
        .from('payments')
        .update({ mark, payment_date })
        .eq('user_email', selectedUserEmail)
        .eq('month_year', month_year);
        
      if (error) {
        console.error('Error saving payment:', error);
        toast({
          title: 'Error',
          description: `Failed to save payment: ${error.message}`,
          variant: 'destructive'
        });
      } else {
        setSelectedStudentPayments(prev =>
          prev.map(p => (p.month_year === month_year ? { ...p, mark, payment_date } : p))
        );
        toast({
          title: 'Success',
          description: `Payment updated for ${month_year}`
        });
      }
    } catch (err) {
      console.error('Error in handleSavePayment:', err);
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-10 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const studentTableData = students?.map(student => ({
    id: student.id,
    name: `${student.first_name} ${student.last_name}`,
    grade: student.grade || "—",
    email: student.email || "—",
    actions: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => deleteStudent.mutate(student.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="students" className="flex-1 sm:flex-initial">Students</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 sm:flex-initial">Payment Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Student</CardTitle>
                <CardDescription>Enter student details to register them in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...studentForm}>
                  <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                    <div className="mb-4">
                      <FormLabel>Parent Email</FormLabel>
                      <div className="flex space-x-2 items-center">
                        <Select 
                          value={selectedParentId || ''} 
                          onValueChange={setSelectedParentId}
                          disabled={usersLoading || registeredEmails.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={
                              usersLoading 
                                ? "Loading emails..." 
                                : registeredEmails.length === 0 
                                  ? "No registered emails" 
                                  : "Select a parent"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {usersLoading ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading emails...
                                </div>
                              </SelectItem>
                            ) : registeredEmails.length > 0 ? (
                              registeredEmails.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.email}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No registered emails found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                              View All Emails
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Registered Users</SheetTitle>
                              <SheetDescription>
                                All registered users in the system
                              </SheetDescription>
                            </SheetHeader>
                            <div className="py-4">
                              {usersLoading ? (
                                <div className="text-center p-4 flex flex-col items-center justify-center">
                                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                  Loading users...
                                </div>
                              ) : usersError ? (
                                <div className="text-center p-4 text-red-500">
                                  Error loading users: {usersError}
                                </div>
                              ) : registeredEmails.length > 0 ? (
                                <div className="rounded-md border">
                                  <div className="grid grid-cols-2 p-2 font-medium bg-muted">
                                    <div className="px-3 py-2">ID</div>
                                    <div className="px-3 py-2">Email</div>
                                  </div>
                                  <div className="divide-y">
                                    {registeredEmails.map((user) => (
                                      <div key={user.id} className="grid grid-cols-2 py-2">
                                        <div className="px-3 py-1.5 truncate">{user.id}</div>
                                        <div className="px-3 py-1.5 break-all">{user.email}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-4">No registered emails found</div>
                              )}
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      {!selectedParentId && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Select a parent before adding a student
                        </p>
                      )}
                      {usersError && (
                        <p className="text-sm text-red-500 mt-1">
                          Error loading users: {usersError}
                        </p>
                      )}
                    </div>
                    
                    <FormField
                      control={studentForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={studentForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={studentForm.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <Input placeholder="Grade 5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={studentForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="student@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            For older students who have their own email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={!selectedParentId || addStudent.isPending}
                    >
                      {addStudent.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : "Add Student"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>Manage all students in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="text-center py-4 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    Loading students...
                  </div>
                ) : studentTableData.length > 0 ? (
                  <ResponsiveTable
                    headers={['Name', 'Grade', 'Email', 'Actions']}
                    data={studentTableData}
                    keyField="id"
                    renderCustomCell={(row, key) => {
                      if (key === 'actions') return row.actions;
                      return row[key] || "—";
                    }}
                  />
                ) : (
                  <div className="text-center py-4">No students registered yet.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Payment Preview</CardTitle>
                  <CardDescription>View and manage payment records for users</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleInitializePayments}
                  disabled={initializePayments.isPending || !selectedUserEmail}
                >
                  {initializePayments.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : "Initialize Payments"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Select User</FormLabel>
                    <Select 
                      value={selectedUserEmail || ''} 
                      onValueChange={(val) => setSelectedUserEmail(val)}
                      disabled={usersLoading || !users || users.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          usersLoading 
                            ? "Loading users..." 
                            : !users || users.length === 0 
                              ? "No users found" 
                              : "Select a user to view payments"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {usersLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading users...
                            </div>
                          </SelectItem>
                        ) : users && users.length > 0 ? (
                          users.map((user: RegisteredUser) => (
                            <SelectItem key={user.id} value={user.email}>
                              {user.email}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No users found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Show students for the selected user */}
                  {selectedUserEmail && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-lg font-medium">Students</h3>
                      {loadingStudents ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Loading students...
                        </div>
                      ) : selectedUserStudents.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUserStudents.map(student => (
                            <div key={student.id} className="p-3 border rounded-md bg-muted/30">
                              <p className="font-medium">
                                {student.first_name} {student.last_name}
                                {student.grade && <span className="ml-2 text-muted-foreground">Grade {student.grade}</span>}
                              </p>
                              {student.email && <p className="text-sm text-muted-foreground">{student.email}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No students found for this user</p>
                      )}

                      {/* Payments section */}
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Payments</h3>
                        {loadingPayments ? (
                          <div className="text-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading payments...
                          </div>
                        ) : selectedStudentPayments.length > 0 ? (
                          <div className="space-y-3 max-w-2xl">
                            {selectedStudentPayments.map(payment => (
                              <div key={payment.month_year} className="grid grid-cols-3 gap-3 items-center p-2 border rounded-md">
                                <div className="font-medium">{payment.month_year}</div>
                                <Select
                                  value={payment.mark}
                                  onValueChange={(value) => handleSavePayment(payment.month_year, value, payment.payment_date)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    <SelectItem value="Next Month">Next Month</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={payment.payment_date || ''}
                                  onChange={(e) => handleSavePayment(
                                    payment.month_year, 
                                    payment.mark,
                                    e.target.value || null
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No payments found for this user. Click "Initialize Payments" to create the payment schedule.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedUserEmail && (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a user to view their payment schedule
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
