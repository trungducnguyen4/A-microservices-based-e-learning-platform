import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Plus, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertCircle,
  Video,
  MessageCircle,
  Upload,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search
} from "lucide-react";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState("math-101");
  const [courses, setCourses] = useState([
    // Keep one sample data
    { id: "math-101", name: "Mathematics 101", students: 45, status: "Active", color: "bg-blue-500", description: "Basic mathematics course" }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Decode JWT để lấy teacher ID
  const decodeJWT = (token: string) => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // Load teacher's courses
  const loadTeacherCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const payload = decodeJWT(token);
      if (!payload) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setTeacherId(payload.sub);

      // Call API to get teacher's courses
      const response = await api.get(`/schedules/${payload.sub}`);

      const teacherCourses = response.data.result.map((course: any) => ({
        id: course.id,
        name: course.title || course.name,
        students: course.enrolledStudents || 0,
        status: course.status || "Active",
        color: getRandomColor(),
        description: course.description
      }));

      // Combine with sample data
      setCourses([
        { id: "math-101", name: "Mathematics 101", students: 45, status: "Active", color: "bg-blue-500", description: "Basic mathematics course" },
        ...teacherCourses
      ]);

    } catch (err: any) {
      console.error("Error loading courses:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Không thể tải danh sách khóa học");
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate random color for course cards
  const getRandomColor = () => {
    const colors = [
      "bg-green-500", "bg-purple-500", "bg-red-500", "bg-yellow-500", 
      "bg-indigo-500", "bg-pink-500", "bg-teal-500", "bg-orange-500"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle course click to navigate to course detail
  const handleCourseClick = (courseId: string) => {
    window.location.href = `/course/${courseId}`;
  };

  // Load data on mount
  useEffect(() => {
    loadTeacherCourses();
  }, []);

  const students = [
    { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@email.com", progress: 85, lastActive: "2 hours ago", avatar: "" },
    { id: 2, name: "Trần Thị Bảo", email: "bao.tran@email.com", progress: 92, lastActive: "1 day ago", avatar: "" },
    { id: 3, name: "Lê Minh Cường", email: "cuong.le@email.com", progress: 78, lastActive: "3 hours ago", avatar: "" },
    { id: 4, name: "Phạm Thu Dung", email: "dung.pham@email.com", progress: 95, lastActive: "30 minutes ago", avatar: "" },
  ];

  const assignments = [
    { id: 1, title: "Linear Algebra Quiz", dueDate: "2024-01-15", submissions: 38, total: 45, status: "Open" },
    { id: 2, title: "Calculus Problem Set", dueDate: "2024-01-20", submissions: 22, total: 45, status: "Open" },
    { id: 3, title: "Final Project", dueDate: "2024-01-30", submissions: 0, total: 45, status: "Draft" },
  ];

  const schedule = [
    { id: 1, title: "Math 101 - Lecture 5", time: "9:00 AM", date: "Today", type: "lecture" },
    { id: 2, title: "Physics 201 - Lab Session", time: "2:00 PM", date: "Today", type: "lab" },
    { id: 3, title: "Office Hours", time: "4:00 PM", date: "Today", type: "office" },
    { id: 4, title: "Math 101 - Quiz Review", time: "10:00 AM", date: "Tomorrow", type: "review" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your courses, students, and assignments</p>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = "/teacher/create-assignment"}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>Add a new assignment for your students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Assignment Title</Label>
                    <Input id="title" placeholder="Enter assignment title" />
                  </div>
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Assignment description" />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="datetime-local" />
                  </div>
                  <Button className="w-full">Create Assignment</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={() => window.location.href = "/teacher/create-course"}>
              <Calendar className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-foreground">105</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
                <BookOpen className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
                  <p className="text-2xl font-bold text-foreground">7</p>
                </div>
                <FileText className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Classes Today</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
                <Calendar className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">My Courses</h3>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = "/teacher/create-course"}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Course
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm khóa học theo tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm">{error}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={loadTeacherCourses}>
                      Thử lại
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-sm text-muted-foreground">Đang tải khóa học...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredCourses.length === 0 ? (
                      searchQuery ? (
                        <Card className="p-8 text-center">
                          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h4 className="font-semibold mb-2">Không tìm thấy khóa học</h4>
                          <p className="text-muted-foreground mb-4">Không có khóa học nào phù hợp với từ khóa "{searchQuery}"</p>
                          <Button variant="outline" onClick={() => setSearchQuery("")}>
                            Xóa bộ lọc
                          </Button>
                        </Card>
                      ) : (
                        <Card className="p-8 text-center">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h4 className="font-semibold mb-2">Chưa có khóa học nào</h4>
                          <p className="text-muted-foreground mb-4">Bạn chưa tạo khóa học nào. Hãy tạo khóa học đầu tiên!</p>
                          <Button onClick={() => window.location.href = "/teacher/create-course"}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo khóa học mới
                          </Button>
                        </Card>
                      )
                    ) : (
                      filteredCourses.map((course) => (
                        <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCourseClick(course.id)}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 ${course.color} rounded-lg flex items-center justify-center`}>
                                  <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{course.name}</h4>
                                  <p className="text-sm text-muted-foreground">{course.students} students enrolled</p>
                                  {course.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{course.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                <Badge variant={course.status === "Active" ? "default" : "secondary"}>
                                  {course.status}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => handleCourseClick(course.id)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Students</h3>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  {students.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{student.progress}% Progress</p>
                              <p className="text-xs text-muted-foreground">Last active: {student.lastActive}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Assignments</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Assignment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Assignment title" />
                        <Textarea placeholder="Description" />
                        <Input type="datetime-local" />
                        <Button className="w-full">Create</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">
                                {assignment.submissions}/{assignment.total} Submitted
                              </p>
                              <Badge variant={assignment.status === "Open" ? "default" : "secondary"}>
                                {assignment.status}
                              </Badge>
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Course Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{course.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${Math.random() * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(Math.random() * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Student Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Average Attendance</span>
                          <span className="text-sm font-medium text-foreground">87%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Assignment Completion</span>
                          <span className="text-sm font-medium text-foreground">92%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Class Participation</span>
                          <span className="text-sm font-medium text-foreground">78%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
                <CardDescription>Your upcoming classes and meetings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedule.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      {item.type === "lecture" && <Video className="w-5 h-5 text-primary" />}
                      {item.type === "lab" && <Users className="w-5 h-5 text-accent" />}
                      {item.type === "office" && <Clock className="w-5 h-5 text-warning" />}
                      {item.type === "review" && <BookOpen className="w-5 h-5 text-success" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time} - {item.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Video className="w-4 h-4 mr-2" />
                  Start Live Class
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Materials
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Announcement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-foreground">Assignment graded</span>
                  </div>
                  <p className="text-muted-foreground text-xs ml-6">Math 101 - Linear Algebra Quiz</p>
                </div>
                <div className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    <span className="text-foreground">New submission</span>
                  </div>
                  <p className="text-muted-foreground text-xs ml-6">Physics 201 - Lab Report #3</p>
                </div>
                <div className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-foreground">Student enrolled</span>
                  </div>
                  <p className="text-muted-foreground text-xs ml-6">Chemistry 150 - New student</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;