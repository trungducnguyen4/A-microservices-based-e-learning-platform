import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { api } from "@/lib/api";
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Clock, 
  Star,
  Play,
  Download,
  FileText,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  Video,
  Plus,
  Users,
} from "lucide-react";

const StudentPortal = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    email?: string;
    id?: string | number;
  } | null>(null);
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [joinCourseCode, setJoinCourseCode] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Prefer using auth context user (fast). Fallback to introspect endpoint if not present.
    const fetchUserInfo = async () => {
      try {
        if (authUser) {
          setUserInfo({ username: authUser.name, email: authUser.email, id: authUser.id });
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await api.post(`/users/introspect`, { token });
        // response.data.result should include user info (id, username/email, etc.)
        setUserInfo(response.data.result || null);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [authUser]);

  // Fetch enrolled courses for current user
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        // Always request /schedules/my-schedule and let the backend resolve current user from headers/token.
        setCoursesLoading(true);
        const res = await api.get(`/schedules/my-schedule`);
        // Expect res.data.result to be an array of ScheduleCreationResponse
        const data = res.data?.result || [];

        // Map backend schedule structure to UI-friendly course object
        const mapped = data.map((s: any, idx: number) => ({
          id: s.courseId || s.courseId || idx,
          title: s.title || "Untitled Course",
          instructor: s.teacherId || "",
          progress: s.progress || 0,
          totalLessons: s.totalLessons || 0,
          completedLessons: s.completedLessons || 0,
          nextLesson: s.nextLesson || "",
          rating: s.rating || 0,
          duration: s.duration || "",
          level: s.level || "",
        }));

        setEnrolledCourses(mapped);
        // Log to browser console how many courses this user is enrolled in
        try {
          const who = userInfo?.username || userInfo?.id || authUser?.name || 'unknown';
          console.info(`MyCourses: user=${who} enrolledCount=${mapped.length}`);
        } catch (e) {
          console.info('MyCourses: enrolledCount=', mapped.length);
        }
      } catch (error) {
        console.error("Failed to load enrolled courses:", error);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchEnrollments();
  }, [userInfo]);

  const handleJoinCourse = async () => {
    if (!joinCourseCode.trim()) return;
    
    setIsJoining(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      if (!userInfo?.id) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }

      // Prepare payload. If frontend user id looks like a username (not UUID), omit userId
      // and let backend resolve from Authorization/header. This avoids storing usernames in DB.
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const payload: any = { joinCode: joinCourseCode.trim() };
      if (userInfo?.id && uuidRegex.test(String(userInfo.id))) {
        payload.userId = String(userInfo.id);
      }

      // Call API to join course
      const response = await api.post(`/schedules/join`, payload);

      if (response.data.code === 200 && response.data.result) {
        alert("Tham gia khóa học thành công!");
        setJoinCourseCode("");
        setJoinDialogOpen(false);
        // Log to console and reload so UI shows updated enrollments
        try {
          console.info('JoinCourse: success, refreshing enrolled courses');
        } catch (e) {}
        window.location.reload();
      } else {
        alert(response.data.message || "Không thể tham gia khóa học");
      }
    } catch (error: any) {
      console.error("Error joining course:", error);
      alert(error.response?.data?.message || "Mã khóa học không hợp lệ");
    } finally {
      setIsJoining(false);
    }
  };

  // Use fetched enrolled courses, fallback to empty array while loading
  // `enrolledCourses` state is populated by effect above

  const upcomingClasses = [
    {
      id: 1,
      course: "Advanced React Development",
      topic: "Advanced Hooks Patterns",
      instructor: "John Doe",
      time: "Today, 2:00 PM",
      duration: "90 min",
      type: "Live Session"
    },
    {
      id: 2,
      course: "Python for Data Science",
      topic: "Machine Learning Basics",
      instructor: "Jane Smith",
      time: "Tomorrow, 10:00 AM",
      duration: "120 min",
      type: "Workshop"
    },
    {
      id: 3,
      course: "UX/UI Design",
      topic: "Project Review",
      instructor: "Mike Johnson",
      time: "Friday, 4:00 PM",
      duration: "60 min",
      type: "Review Session"
    },
  ];

  const assignments = [
    {
      id: 1,
      title: "Build a Todo App with React",
      course: "Advanced React Development",
      dueDate: "Dec 28, 2024",
      status: "submitted",
      grade: "A",
      feedback: "Excellent work! Great use of custom hooks."
    },
    {
      id: 2,
      title: "Data Analysis Project",
      course: "Python for Data Science",
      dueDate: "Jan 5, 2025",
      status: "pending",
      grade: null,
      feedback: null
    },
    {
      id: 3,
      title: "Mobile App Wireframe",
      course: "UX/UI Design",
      dueDate: "Jan 10, 2025",
      status: "in-progress",
      grade: null,
      feedback: null
    },
  ];

  const achievements = [
    { id: 1, title: "First Course Completed", icon: Award, color: "text-yellow-500" },
    { id: 2, title: "Perfect Attendance", icon: Target, color: "text-green-500" },
    { id: 3, title: "Top Performer", icon: TrendingUp, color: "text-blue-500" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-500 text-white">Submitted</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      case "in-progress":
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Portal</h1>
          <p className="text-muted-foreground">Track your learning progress and upcoming classes</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Avatar className="w-10 h-10">
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{userInfo?.username || authUser?.name || "Alice Cooper"}</p>
            <p className="text-sm text-muted-foreground">Student ID: {userInfo?.id || authUser?.id || 'STU001'}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                <p className="text-2xl font-bold">{coursesLoading ? '...' : enrolledCourses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{enrolledCourses.length ? `${Math.round(enrolledCourses.reduce((s, c) => s + (c.progress || 0), 0) / enrolledCourses.length)}%` : '0%'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assignments Due</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Courses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                    My Courses
                  </CardTitle>
                  <CardDescription>Continue your learning journey</CardDescription>
                </div>
                <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Join Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Join Course
                      </DialogTitle>
                      <DialogDescription>
                        Enter the course code provided by your instructor to join a new course.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="courseCode">Course Code</Label>
                        <Input
                          id="courseCode"
                          placeholder="Enter course code (e.g., CS101-2024)"
                          value={joinCourseCode}
                          onChange={(e) => setJoinCourseCode(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleJoinCourse()}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setJoinDialogOpen(false);
                            setJoinCourseCode("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleJoinCourse}
                          disabled={!joinCourseCode.trim() || isJoining}
                        >
                          {isJoining ? "Joining..." : "Join Course"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {course.instructor} • {course.duration} • {course.level}
                      </p>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{course.rating}</span>
                        </div>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Progress value={course.progress} className="flex-1 max-w-[200px]" />
                        <span className="text-sm text-muted-foreground">
                          {course.completedLessons}/{course.totalLessons} lessons
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Next: {course.nextLesson}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button size="sm" onClick={() => course.id && navigate(`/course/${course.id}`)}>
                        <Play className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                      <Button size="sm" variant="outline">
                        <Video className="w-4 h-4 mr-2" />
                        Join Class
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assignments */}
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Assignments</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-yellow-500" />
                    Pending Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.filter(a => a.status !== 'submitted').map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">{assignment.course}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-1 text-yellow-500" />
                              Due: {assignment.dueDate}
                            </div>
                            {getStatusBadge(assignment.status)}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => navigate(`/student/assignment/${assignment.id}`)}>
                          <FileText className="w-4 h-4 mr-2" />
                          {assignment.status === 'pending' ? 'Start' : 'Continue'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Completed Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.filter(a => a.status === 'submitted').map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">{assignment.course}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            {getStatusBadge(assignment.status)}
                            {assignment.grade && (
                              <Badge className="bg-green-500 text-white">
                                Grade: {assignment.grade}
                              </Badge>
                            )}
                          </div>
                          {assignment.feedback && (
                            <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                              "{assignment.feedback}"
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Video className="w-4 h-4 mr-2 text-blue-500" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClasses.map((class_) => (
                <div key={class_.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{class_.course}</h4>
                  <p className="text-xs text-muted-foreground">{class_.topic}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-muted-foreground">
                      <p>{class_.time}</p>
                      <p>{class_.duration}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {class_.type}
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full mt-2" variant="outline">
                    <Video className="w-3 h-3 mr-1" />
                    Join
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Award className="w-4 h-4 mr-2 text-yellow-500" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${achievement.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{achievement.title}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
