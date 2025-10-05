import { useState, useEffect } from "react";
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
    id?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinCourseCode, setJoinCourseCode] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.post(
          "http://localhost:8080/user/introspect",
          { token },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setUserInfo(response.data.result);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

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

      // Call API to join course
      const response = await axios.post(
        "http://localhost:3636/schedule/join",
        { 
          userId: userInfo.id.toString(),
          joinCode: joinCourseCode.trim() 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.code === 200 && response.data.result) {
        alert("Tham gia khóa học thành công!");
        setJoinCourseCode("");
        setJoinDialogOpen(false);
        // Reload page or update course list
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

  const enrolledCourses = [
    {
      id: 1,
      title: "Advanced React Development",
      instructor: "John Doe",
      progress: 75,
      totalLessons: 24,
      completedLessons: 18,
      nextLesson: "State Management with Redux",
      rating: 4.8,
      duration: "8 weeks",
      level: "Advanced"
    },
    {
      id: 2,
      title: "Python for Data Science",
      instructor: "Jane Smith",
      progress: 45,
      totalLessons: 32,
      completedLessons: 14,
      nextLesson: "Data Visualization with Matplotlib",
      rating: 4.6,
      duration: "10 weeks",
      level: "Intermediate"
    },
    {
      id: 3,
      title: "UX/UI Design Fundamentals",
      instructor: "Mike Johnson",
      progress: 90,
      totalLessons: 16,
      completedLessons: 15,
      nextLesson: "Final Project Presentation",
      rating: 4.9,
      duration: "6 weeks",
      level: "Beginner"
    },
  ];

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
            <p className="font-medium">{userInfo?.username || "Alice Cooper"}</p>
            <p className="text-sm text-muted-foreground">Student ID: STU001</p>
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
                <p className="text-2xl font-bold">3</p>
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
                <p className="text-2xl font-bold">70%</p>
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
                      <Button size="sm">
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
                        <Button size="sm">
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
