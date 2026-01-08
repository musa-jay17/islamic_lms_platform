import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  BookOpen, 
  FileText, 
  Users, 
  Plus,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';

const InstructorPortal = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await fetchProfile(user.id);
      await fetchInstructorData(user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles_2025_11_15_16_09')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchInstructorData = async (userId) => {
    try {
      // Fetch instructor's courses
      const { data: courseData } = await supabase
        .from('courses_2025_11_15_16_09')
        .select('*')
        .eq('instructor_id', userId);
      
      setCourses(courseData || []);

      if (courseData && courseData.length > 0) {
        const courseIds = courseData.map(c => c.id);

        // Fetch assignments for instructor's courses
        const { data: assignmentData } = await supabase
          .from('assignments_2025_11_15_16_09')
          .select(`
            *,
            courses_2025_11_15_16_09 (title)
          `)
          .in('course_id', courseIds);
        
        setAssignments(assignmentData || []);

        // Fetch submissions for instructor's assignments
        const { data: submissionData } = await supabase
          .from('assignment_submissions_2025_11_15_16_09')
          .select(`
            *,
            assignments_2025_11_15_16_09 (title),
            user_profiles_2025_11_15_16_09 (full_name, student_id)
          `)
          .in('assignment_id', (assignmentData || []).map(a => a.id));
        
        setSubmissions(submissionData || []);

        // Fetch enrolled students
        const { data: enrollmentData } = await supabase
          .from('course_enrollments_2025_11_15_16_09')
          .select(`
            *,
            user_profiles_2025_11_15_16_09 (full_name, student_id, email),
            courses_2025_11_15_16_09 (title)
          `)
          .in('course_id', courseIds);
        
        setStudents(enrollmentData || []);
      }

    } catch (error) {
      console.error('Error fetching instructor data:', error);
      toast.error('Failed to load instructor data');
    }
  };

  const getStats = () => {
    return {
      totalCourses: courses.length,
      totalStudents: students.length,
      pendingSubmissions: submissions.filter(s => !s.grade).length,
      totalAssignments: assignments.length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading instructor portal...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Instructor Portal
          </h1>
          <p className="text-gray-600">Welcome, {profile?.full_name || user?.email}</p>
          <div className="mt-4 text-center">
            <span className="arabic-text text-xl text-green-600">إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ</span>
            <p className="text-sm text-gray-600 mt-1">
              "Only those fear Allah, from among His servants, who have knowledge" (Quran 35:28)
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">My Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assignments</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{submission.user_profiles_2025_11_15_16_09?.full_name}</p>
                          <p className="text-sm text-gray-600">{submission.assignments_2025_11_15_16_09?.title}</p>
                        </div>
                        <Badge variant={submission.grade ? 'default' : 'secondary'}>
                          {submission.grade || 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courses.map((course) => {
                      const courseStudents = students.filter(s => s.course_id === course.id);
                      const avgProgress = courseStudents.length > 0 
                        ? courseStudents.reduce((sum, s) => sum + (s.progress_percentage || 0), 0) / courseStudents.length
                        : 0;
                      
                      return (
                        <div key={course.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-gray-600">{courseStudents.length} students</p>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(avgProgress)}% avg
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="h-auto p-4 flex flex-col items-center">
                    <Plus className="h-6 w-6 mb-2" />
                    <span>Create Assignment</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Grade Submissions</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>View Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                    <Users className="h-6 w-6 mb-2" />
                    <span>Manage Students</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>

            <div className="grid gap-6">
              {courses.map((course) => {
                const courseStudents = students.filter(s => s.course_id === course.id);
                const courseAssignments = assignments.filter(a => a.course_id === course.id);
                
                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                        <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                          {course.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Students:</span>
                          <p>{courseStudents.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Assignments:</span>
                          <p>{courseAssignments.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p>{course.duration_weeks} weeks</p>
                        </div>
                        <div>
                          <span className="font-medium">Credits:</span>
                          <p>{course.credits}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Link to={`/course/${course.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Course
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Assignment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Assignments</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </div>

            <div className="grid gap-6">
              {assignments.map((assignment) => {
                const assignmentSubmissions = submissions.filter(s => s.assignment_id === assignment.id);
                const gradedSubmissions = assignmentSubmissions.filter(s => s.grade);
                
                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription>
                            Course: {assignment.courses_2025_11_15_16_09?.title}
                          </CardDescription>
                        </div>
                        <Badge variant={new Date(assignment.due_date) > new Date() ? 'default' : 'secondary'}>
                          {new Date(assignment.due_date) > new Date() ? 'Active' : 'Closed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{assignment.description}</p>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Due Date:</span>
                          <p>{new Date(assignment.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Submissions:</span>
                          <p>{assignmentSubmissions.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Graded:</span>
                          <p>{gradedSubmissions.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="capitalize">{assignment.assignment_type}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Link to={`/assignment/${assignment.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Submissions
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>Students enrolled in your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((enrollment) => (
                    <div key={enrollment.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{enrollment.user_profiles_2025_11_15_16_09?.full_name}</h4>
                        <p className="text-sm text-gray-600">
                          ID: {enrollment.user_profiles_2025_11_15_16_09?.student_id} • 
                          Course: {enrollment.courses_2025_11_15_16_09?.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                          {enrollment.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          Progress: {enrollment.progress_percentage || 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grading Tab */}
          <TabsContent value="grading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
                <CardDescription>Assignments waiting for your review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.filter(s => !s.grade).map((submission) => (
                    <div key={submission.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{submission.assignments_2025_11_15_16_09?.title}</h4>
                        <p className="text-sm text-gray-600">
                          Student: {submission.user_profiles_2025_11_15_16_09?.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(submission.submission_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Pending</Badge>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Grade
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {submissions.filter(s => !s.grade).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>All submissions have been graded!</p>
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
};

export default InstructorPortal;