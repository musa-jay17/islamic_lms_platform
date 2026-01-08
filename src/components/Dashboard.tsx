import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar,
  GraduationCap,
  FileText,
  Award,
  MessageSquare,
  User,
  LogOut,
  Settings,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Demo announcements for when user is not logged in
  const demoAnnouncements = [
    {
      id: 'demo1',
      title: 'Welcome to Madrasa Al-Hikmah LMS',
      content: 'Explore our comprehensive Islamic learning platform. Sign up to access courses, assignments, and track your progress.',
      publish_date: new Date().toISOString()
    },
    {
      id: 'demo2', 
      title: 'New Quranic Studies Course Available',
      content: 'Join our beginner-friendly Quranic Studies course featuring Tajweed, memorization techniques, and Tafsir.',
      publish_date: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'demo3',
      title: 'Arabic Language Program',
      content: 'Master Classical Arabic with our structured curriculum designed for Islamic studies students.',
      publish_date: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    checkUser();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      // Reset data when user logs out
      setCourses([]);
      setEnrollments([]);
      setAssignments([]);
      setQuizzes([]);
      setAnnouncements([]);
      setLoading(false);
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      fetchProfile(user.id);
    }
  };

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles_2025_11_15_16_09')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch courses (public data)
      const { data: coursesData } = await supabase
        .from('courses_2025_11_15_16_09')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      setCourses(coursesData || []);

      // Fetch announcements (public data)
      const { data: announcementsData } = await supabase
        .from('announcements_2025_11_15_16_09')
        .select('*')
        .eq('is_published', true)
        .order('publish_date', { ascending: false })
        .limit(5);
      
      setAnnouncements(announcementsData || []);

      // Fetch user enrollments if logged in
      if (user) {
        const { data: enrollmentsData } = await supabase
          .from('course_enrollments_2025_11_15_16_09')
          .select(`
            *,
            courses_2025_11_15_16_09 (*)
          `)
          .eq('student_id', user.id);
        
        setEnrollments(enrollmentsData || []);

        // Fetch assignments for enrolled courses
        const courseIds = enrollmentsData?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          const { data: assignmentsData } = await supabase
            .from('assignments_2025_11_15_16_09')
            .select('*')
            .in('course_id', courseIds)
            .eq('is_published', true)
            .order('due_date', { ascending: true });
          
          setAssignments(assignmentsData || []);

          const { data: quizzesData } = await supabase
            .from('quizzes_2025_11_15_16_09')
            .select('*')
            .in('course_id', courseIds)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          
          setQuizzes(quizzesData || []);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error('Sign in failed: ' + error.message);
      } else {
        toast.success('Signed in successfully!');
        // Auth state listener will handle the rest
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleSignUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        toast.error('Sign up failed: ' + error.message);
      } else {
        toast.success('Account created! Please check your email for verification.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during sign up');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      // Auth state listener will handle clearing user state
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const enrollInCourse = async (courseId) => {
    if (!user) {
      toast.error('Please sign in to enroll in courses');
      return;
    }

    setEnrolling(courseId);
    try {
      const { error } = await supabase
        .from('course_enrollments_2025_11_15_16_09')
        .insert({
          student_id: user.id,
          course_id: courseId
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You are already enrolled in this course');
        } else {
          toast.error('Enrollment failed: ' + error.message);
        }
      } else {
        toast.success('Successfully enrolled in course!');
        fetchData();
      }
    } catch (error) {
      toast.error('An unexpected error occurred during enrollment');
    } finally {
      setEnrolling(null);
    }
  };

  const handleDemoSignUp = () => {
    setActiveTab('overview');
    toast.info('Please scroll down to sign up for full access to the LMS!');
  };

  const generateTranscript = async () => {
    if (!user) return;

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

      toast.success('Transcript generated and downloaded!');
    } catch (error) {
      toast.error('Failed to generate transcript: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LMS Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Madrasa Al-Hikmah LMS</h1>
                <p className="text-sm text-gray-600">Learning Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile?.full_name || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
                  <p className="text-xs text-blue-600">You're viewing the LMS in demo mode. Sign up to access full features!</p>
                </div>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleDemoSignUp}>
                Sign Up Now
              </Button>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user ? 'grid-cols-6' : 'grid-cols-2'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                      <p className="text-3xl font-bold text-green-600">{enrollments.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                      <p className="text-3xl font-bold text-orange-600">{assignments.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
                      <p className="text-3xl font-bold text-blue-600">{quizzes.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Student ID</p>
                      <p className="text-lg font-bold text-gray-900">{profile?.student_id}</p>
                    </div>
                    <User className="h-8 w-8 text-gray-600" />
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
                  {(user ? announcements : demoAnnouncements).map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(announcement.publish_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {!user && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Sign up now</strong> to access personalized announcements, course materials, and track your academic progress!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Available Courses</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const isEnrolled = enrollments.some(e => e.course_id === course.id);
                return (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="mb-2">
                          {course.category.toUpperCase()}
                        </Badge>
                        <Badge variant={course.level === 'beginner' ? 'default' : course.level === 'intermediate' ? 'secondary' : 'destructive'}>
                          {course.level}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {course.duration_weeks} weeks
                        </div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          {course.credits} credits
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Max {course.max_students} students
                        </div>
                      </div>
                      
                      {isEnrolled ? (
                        <Badge variant="default" className="w-full justify-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enrolled
                        </Badge>
                      ) : (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => enrollInCourse(course.id)}
                          disabled={enrolling === course.id}
                        >
                          {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
            
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <Badge variant={assignment.assignment_type === 'essay' ? 'default' : 'secondary'}>
                        {assignment.assignment_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1" />
                          {assignment.max_points} points
                        </div>
                      </div>
                      <Button size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Quizzes</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                      </div>
                      <Badge variant={quiz.quiz_type === 'graded' ? 'default' : 'secondary'}>
                        {quiz.quiz_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {quiz.time_limit_minutes} minutes
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        {quiz.max_points} points
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {quiz.attempts_allowed} attempt(s) allowed
                      </div>
                    </div>
                    <Button className="w-full">
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Academic Records</h2>
              <Button onClick={generateTranscript} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Generate Transcript
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Course Enrollments</CardTitle>
                <CardDescription>Your current course progress and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{enrollment.courses_2025_11_15_16_09?.title}</h4>
                        <p className="text-sm text-gray-600">
                          Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'}>
                          {enrollment.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          Progress: {enrollment.progress_percentage}%
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
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-lg font-medium">{profile?.full_name}</p>
                  </div>
                  <div>
                    <Label>Student ID</Label>
                    <p className="text-lg font-medium">{profile?.student_id}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-lg font-medium">{profile?.email}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant="default">{profile?.status}</Badge>
                  </div>
                  <div>
                    <Label>Enrollment Date</Label>
                    <p className="text-lg font-medium">
                      {profile?.enrollment_date ? new Date(profile.enrollment_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Badge variant="secondary">{profile?.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AuthComponent = ({ onSignIn, onSignUp }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      onSignUp(email, password, fullName);
    } else {
      onSignIn(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GraduationCap className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Madrasa Al-Hikmah LMS</CardTitle>
          <CardDescription>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-green-600 hover:text-green-700 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;