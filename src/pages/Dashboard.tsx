
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { PaymentsTable } from '@/components/PaymentsTable';
import { usePayments } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { getCurrentAcademicYear } from '@/utils/academic-year';
import type { Student } from '@/types/app';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { initializePayments } = usePayments(currentUser?.email);
  const [year] = useState(getCurrentAcademicYear());

  useEffect(() => {
    async function loadData() {
      if (currentUser) {
        try {
          // Load students
          const { data: studentsData } = await supabase
            .from('students')
            .select('*')
            .eq('parent_id', currentUser.id);

          if (studentsData) {
            setStudents(studentsData);
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadData();
  }, [currentUser]);

  const handleInitializePayments = () => {
    if (currentUser?.email) {
      initializePayments.mutate({ 
        email: currentUser.email,
        year
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-10 text-center">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const studentTableData = students.map(student => ({
    id: student.id,
    name: `${student.first_name} ${student.last_name}`,
    grade: student.grade || "—",
    email: student.email || "—"
  }));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Parent Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Children</CardTitle>
              <CardDescription>Students registered under your account</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <ResponsiveTable
                  headers={['Name', 'Grade', 'Email']}
                  data={studentTableData}
                  keyField="id"
                />
              ) : (
                <p className="text-center py-4">No students registered yet.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>School fee payment status</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleInitializePayments}
                disabled={initializePayments.isPending}
              >
                {initializePayments.isPending ? "Initializing..." : "Initialize Payments"}
              </Button>
            </CardHeader>
            <CardContent>
              {currentUser?.email ? (
                <PaymentsTable userEmail={currentUser.email} />
              ) : (
                <p className="text-center py-4">Cannot load payment information.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
