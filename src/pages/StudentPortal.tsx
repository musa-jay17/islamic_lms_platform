import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Clock, 
  Award,
  Calendar,
  User,
  Download,
  MessageSquare,
  BarChart3,
  Target
} from 'lucide-react';

const StudentPortal = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [academicRecords, setAcademicRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await fetchProfile(user.id);
      await fetchStudentData(user.id);
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

  const fetchStudentData = async (userId) => {
    try {
      // Fetch enrollments with course details
      const { data: enrollmentData } = await supabase
        .from('course_enrollments_2025_11_15_16_09')
        .select(`
          *,
          courses_2025_11_15_16_09 (*)
        `)
        .eq('student_id', userId);
      
      setEnrollments(enrollmentData || []);

      // Fetch assignments
      const { data: assignmentData } = await supabase
        .from('assignments_2025_11_15_16_09')
        .select(`
          *,
          courses_2025_11_15_16_09 (title),
          assignment_submissions_2025_11_15_16_09 (*)
        `)
        .in('course_id', (enrollmentData || []).map(e => e.course_id));
      
      setAssignments(assignmentData || []);

      // Fetch quizzes
      const { data: quizData } = await supabase
        .from('quizzes_2025_11_15_16_09')
        .select(`
          *,
          courses_2025_11_15_16_09 (title),
          quiz_attempts_2025_11_15_16_09 (*)
        `)
        .in('course_id', (enrollmentData || []).map(e => e.course_id));
      
      setQuizzes(quizData || []);

      // Fetch announcements
      const { data: announcementData } = await supabase
        .from('announcements_2025_11_15_16_09')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(5);
      
      setAnnouncements(announcementData || []);

      // Fetch academic records
      const { data: recordData } = await supabase
        .from('academic_records_2025_11_15_16_09')
        .select(`
          *,
          courses_2025_11_15_16_09 (title, credits)
        `)
        .eq('student_id', userId);
      
      setAcademicRecords(recordData || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load student data');
    }
  };

  const generateTranscript = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate_transcript_2025_11_15_16_09', {
        body: { 
          student_id: user.id,
          transcript_type: 'official'
        }
      });

      if (error) throw error;

      // Create and download HTML file
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${profile?.student_id || 'student'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Transcript downloaded successfully!');
    } catch (error) {
      console.error('Error generating transcript:', error);
      toast.error('Failed to generate transcript');
    }
  };

  const calculateGPA = () => {
    if (academicRecords.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    academicRecords.forEach(record => {
      if (record.final_grade && record.courses_2025_11_15_16_09?.credits) {
        const gradePoints = getGradePoints(record.final_grade);
        const credits = record.courses_2025_11_15_16_09.credits;
        totalPoints += gradePoints * credits;
        totalCredits += credits;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const getGradePoints = (grade) => {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {profile?.full_name || user?.email}
          </h1>
          <p className="text-gray-600">Student ID: {profile?.student_id}</p>
          <div className="mt-4 text-center">
            <span className="arabic-text text-xl text-green-600">طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ</span>
            <p className="text-sm text-gray-600 mt-1">
              "Seeking knowledge is an obligation upon every Muslim"
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assignments.filter(a => !a.assignment_submissions_2025_11_15_16_09?.length).length}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current GPA</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateGPA()}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed Courses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {academicRecords.filter(r => r.completion_status === 'completed').length}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(announcement.publish_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={generateTranscript} className="h-auto p-4 flex flex-col items-center">
                    <Download className="h-6 w-6 mb-2" />
                    <span>Download Transcript</span>
                  </Button>
                  <Link to="/enrollment">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center">
                      <BookOpen className="h-6 w-6 mb-2" />
                      <span>Enroll in New Course</span>
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center">
                      <User className="h-6 w-6 mb-2" />
                      <span>Update Profile</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{enrollment.courses_2025_11_15_16_09?.title}</CardTitle>
                        <CardDescription>
                          {enrollment.courses_2025_11_15_16_09?.description}
                        </CardDescription>
                      </div>
                      <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                        {enrollment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{enrollment.progress_percentage || 0}%</span>
                    </div>
                    <Progress value={enrollment.progress_percentage || 0} className="mb-4" />
                    
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <span>Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                      <span>Credits: {enrollment.courses_2025_11_15_16_09?.credits}</span>
                    </div>
                    
                    <Link to={`/course/${enrollment.course_id}`}>
                      <Button className="w-full">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Access Course
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="grid gap-6">
              {assignments.map((assignment) => {
                const submission = assignment.assignment_submissions_2025_11_15_16_09?.[0];
                const isSubmitted = !!submission;
                const isOverdue = new Date(assignment.due_date) < new Date() && !isSubmitted;
                
                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            {assignment.title}
                            {isSubmitted && <CheckCircle className="ml-2 h-5 w-5 text-green-600" />}
                            {isOverdue && <Clock className="ml-2 h-5 w-5 text-red-600" />}
                          </CardTitle>
                          <CardDescription>
                            Course: {assignment.courses_2025_11_15_16_09?.title}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          isSubmitted ? 'default' : 
                          isOverdue ? 'destructive' : 'secondary'
                        }>
                          {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{assignment.description}</p>
                      
                      <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                        <span>Type: {assignment.assignment_type}</span>
                      </div>
                      
                      {isSubmitted ? (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-green-800 text-sm">
                            Submitted on {new Date(submission.submission_date).toLocaleDateString()}
                            {submission.grade && ` • Grade: ${submission.grade}`}
                          </p>
                        </div>
                      ) : (
                        <Link to={`/assignment/${assignment.id}`}>
                          <Button className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            {isOverdue ? 'Submit Late' : 'Submit Assignment'}
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="grid gap-6">
              {quizzes.map((quiz) => {
                const attempts = quiz.quiz_attempts_2025_11_15_16_09 || [];
                const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
                const attemptsLeft = quiz.max_attempts - attempts.length;
                
                return (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{quiz.title}</CardTitle>
                          <CardDescription>
                            Course: {quiz.courses_2025_11_15_16_09?.title}
                          </CardDescription>
                        </div>
                        <Badge variant={bestScore >= 70 ? 'default' : 'secondary'}>
                          {bestScore ? `Best: ${bestScore}%` : 'Not Attempted'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{quiz.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <span>Time Limit: {quiz.time_limit} minutes</span>
                        <span>Attempts Left: {attemptsLeft}</span>
                        <span>Questions: {quiz.total_questions}</span>
                        <span>Passing Score: 70%</span>
                      </div>
                      
                      {attemptsLeft > 0 ? (
                        <Link to={`/quiz/${quiz.id}`}>
                          <Button className="w-full">
                            <Target className="mr-2 h-4 w-4" />
                            {attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled className="w-full">
                          No Attempts Remaining
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
                <CardDescription>
                  Current GPA: {calculateGPA()} / 4.0
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {academicRecords.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{record.courses_2025_11_15_16_09?.title}</h4>
                        <p className="text-sm text-gray-600">
                          Credits: {record.courses_2025_11_15_16_09?.credits}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={record.final_grade?.startsWith('A') ? 'default' : 'secondary'}>
                          {record.final_grade || 'In Progress'}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {record.completion_status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-gray-900 font-medium">{profile?.full_name}</p>
                  </div>
                  <div>
                    <Label>Student ID</Label>
                    <p className="text-gray-900 font-medium">{profile?.student_id}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Badge>{profile?.role}</Badge>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-gray-900 font-medium">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <p className="text-gray-900 font-medium">
                      {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button>
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentPortal;