
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import type { Student, Class } from '@/types/app';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

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

            // Get all classes for these students
            for (const student of studentsData) {
              const { data: studentClasses } = await supabase
                .from('student_classes')
                .select('class_id')
                .eq('student_id', student.id);

              if (studentClasses && studentClasses.length > 0) {
                const classIds = studentClasses.map(sc => sc.class_id);
                
                const { data: classDetails } = await supabase
                  .from('classes')
                  .select('*')
                  .in('id', classIds);

                if (classDetails) {
                  setClasses(prev => {
                    // Remove duplicates when merging classes
                    const existingIds = new Set(prev.map(c => c.id));
                    const newClasses = classDetails.filter(c => !existingIds.has(c.id));
                    return [...prev, ...newClasses];
                  });
                }
              }
            }
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
    email: student.email || "—"
  }));

  const classTableData = classes.map(cls => ({
    id: cls.id,
    name: cls.name,
    description: cls.description || "—"
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
                  headers={['Name', 'Email']}
                  data={studentTableData}
                  keyField="id"
                />
              ) : (
                <p className="text-center py-4">No students registered yet.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Classes</CardTitle>
              <CardDescription>Classes your children are enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <ResponsiveTable
                  headers={['Name', 'Description']}
                  data={classTableData}
                  keyField="id"
                />
              ) : (
                <p className="text-center py-4">No classes enrolled yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
