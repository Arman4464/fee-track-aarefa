
import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
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
import type { StudentFormData } from '@/types/app';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { supabase } from '@/integrations/supabase/client';
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

export default function Admin() {
  const { currentUser } = useAuth();
  const { students, isLoading: studentsLoading, addStudent, deleteStudent } = useStudents();
  const { users, isLoading: usersLoading } = useRegisteredUsers();
  const { initializePayments } = usePayments();
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [year] = useState(getCurrentAcademicYear());

  // Student form
  const studentForm = useForm<StudentFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      grade: '',
    },
  });

  const onStudentSubmit = async (data: StudentFormData) => {
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
    async function fetchUsers() {
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, is_admin');
        
        if (userRoles) {
          // For each user, get their email
          const allEmails: {id: string, email: string}[] = [];
          
          for (const role of userRoles) {
            const { data: auth_users } = await supabase.auth.admin.getUserById(role.user_id);
            if (auth_users && auth_users.user) {
              allEmails.push({
                id: role.user_id,
                email: auth_users.user.email || `user-${role.user_id.slice(0, 6)}`
              });
            }
          }
          
          setRegisteredEmails(allEmails);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    
    if (currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleInitializePayments = () => {
    if (selectedUserEmail) {
      initializePayments.mutate({ 
        email: selectedUserEmail,
        year
      });
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
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => deleteStudent.mutate(student.id)}
      >
        Delete
      </Button>
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
                        <Select value={selectedParentId || ''} onValueChange={setSelectedParentId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a parent" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredEmails.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email}
                              </SelectItem>
                            ))}
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
                              <div className="rounded-md border">
                                <div className="grid grid-cols-2 p-2 font-medium bg-muted">
                                  <div className="px-3 py-2">ID</div>
                                  <div className="px-3 py-2">Email</div>
                                </div>
                                <div className="divide-y">
                                  {registeredEmails.map((user) => (
                                    <div key={user.id} className="grid grid-cols-2 py-2">
                                      <div className="px-3 py-1.5 truncate">{user.id}</div>
                                      <div className="px-3 py-1.5">{user.email}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      {!selectedParentId && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Select a parent before adding a student
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
                      {addStudent.isPending ? "Adding..." : "Add Student"}
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
                  <div className="text-center py-4">Loading students...</div>
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
                {selectedUserEmail && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleInitializePayments}
                    disabled={initializePayments.isPending}
                  >
                    {initializePayments.isPending ? "Initializing..." : "Initialize Payments"}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Select User</FormLabel>
                    <Select value={selectedUserEmail || ''} onValueChange={setSelectedUserEmail}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a user to view payments" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((user: RegisteredUser) => (
                          <SelectItem key={user.id} value={user.email}>
                            {user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedUserEmail ? (
                    <PaymentsTable userEmail={selectedUserEmail} readOnly={false} />
                  ) : (
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
