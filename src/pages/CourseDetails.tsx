import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  BookOpen, 
  FileText, 
  Users, 
  Clock,
  Award,
  CheckCircle,
  Play,
  Download,
  MessageSquare
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses_2025_11_15_16_09')
        .select(`
          *,
          user_profiles_2025_11_15_16_09 (full_name)
        `)
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch course modules
      const { data: moduleData } = await supabase
        .from('course_modules_2025_11_15_16_09')
        .select('*')
        .eq('course_id', id)
        .order('module_order');

      setModules(moduleData || []);

      // Fetch assignments
      const { data: assignmentData } = await supabase
        .from('assignments_2025_11_15_16_09')
        .select('*')
        .eq('course_id', id)
        .order('due_date');

      setAssignments(assignmentData || []);

      // Fetch quizzes
      const { data: quizData } = await supabase
        .from('quizzes_2025_11_15_16_09')
        .select('*')
        .eq('course_id', id)
        .order('created_at');

      setQuizzes(quizData || []);

      // Check enrollment status
      if (user) {
        const { data: enrollmentData } = await supabase
          .from('course_enrollments_2025_11_15_16_09')
          .select('*')
          .eq('course_id', id)
          .eq('student_id', user.id)
          .single();

        setEnrollment(enrollmentData);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async () => {
    if (!user) {
      toast.error('Please sign in to enroll');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments_2025_11_15_16_09')
        .insert({
          student_id: user.id,
          course_id: id,
          enrollment_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You are already enrolled in this course');
        } else {
          throw error;
        }
      } else {
        toast.success('Successfully enrolled in the course!');
        fetchCourseData(); // Refresh data
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Instructor: {course.user_profiles_2025_11_15_16_09?.full_name}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {course.duration_weeks} weeks
                </span>
                <span className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  {course.credits} credits
                </span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {course.category.toUpperCase()}
              </Badge>
              <br />
              <Badge variant={course.level === 'beginner' ? 'default' : 'secondary'}>
                {course.level}
              </Badge>
            </div>
          </div>

          {/* Enrollment Status */}
          {enrollment ? (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-600">✓ Enrolled</p>
                    <p className="text-sm text-gray-600">
                      Progress: {enrollment.progress_percentage || 0}%
                    </p>
                  </div>
                  <Progress value={enrollment.progress_percentage || 0} className="w-32" />
                </div>
              </CardContent>
            </Card>
          ) : user ? (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Ready to start learning?</p>
                    <p className="text-sm text-gray-600">Enroll now to access course materials</p>
                  </div>
                  <Button onClick={enrollInCourse}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Sign in to enroll</p>
                    <p className="text-sm text-gray-600">Create an account to access this course</p>
                  </div>
                  <Link to="/enrollment">
                    <Button>
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{course.description}</p>
                    
                    {course.learning_objectives && (
                      <div>
                        <h4 className="font-semibold mb-2">Learning Objectives</h4>
                        <p className="text-gray-600">{course.learning_objectives}</p>
                      </div>
                    )}

                    {course.prerequisites && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Prerequisites</h4>
                        <p className="text-gray-600">{course.prerequisites}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Course Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modules:</span>
                        <span className="font-medium">{modules.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assignments:</span>
                        <span className="font-medium">{assignments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quizzes:</span>
                        <span className="font-medium">{quizzes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{course.duration_weeks} weeks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credits:</span>
                        <span className="font-medium">{course.credits}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {enrollment && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Overall Progress</span>
                            <span className="text-sm font-medium">{enrollment.progress_percentage || 0}%</span>
                          </div>
                          <Progress value={enrollment.progress_percentage || 0} />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}</p>
                          <p>Status: <Badge variant="secondary">{enrollment.status}</Badge></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={module.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded mr-3">
                            {index + 1}
                          </span>
                          {module.title}
                        </CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                      {enrollment && (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Start Module
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Duration: {module.duration_hours} hours</span>
                      <span>Order: {module.module_order}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <Badge variant={new Date(assignment.due_date) > new Date() ? 'default' : 'secondary'}>
                        {new Date(assignment.due_date) > new Date() ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                        <p>Type: {assignment.assignment_type}</p>
                      </div>
                      {enrollment && (
                        <Link to={`/assignment/${assignment.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Assignment
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {quiz.total_questions} questions
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Time Limit: {quiz.time_limit} minutes</p>
                        <p>Max Attempts: {quiz.max_attempts}</p>
                      </div>
                      {enrollment && (
                        <Link to={`/quiz/${quiz.id}`}>
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Take Quiz
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Resources</CardTitle>
                <CardDescription>Additional materials and references for this course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Course Syllabus</h4>
                      <p className="text-sm text-gray-600">Complete course outline and schedule</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Reading List</h4>
                      <p className="text-sm text-gray-600">Recommended books and articles</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Discussion Forum</h4>
                      <p className="text-sm text-gray-600">Connect with fellow students</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Join Discussion
                    </Button>
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

export default CourseDetails;