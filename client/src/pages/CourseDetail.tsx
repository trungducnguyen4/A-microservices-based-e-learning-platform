import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, BookOpen, Clock, Calendar, Plus, Eye, Edit, Trash2 } from "lucide-react";

export default function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  // Mock course data
  const course = {
    id: 1,
    title: "React và TypeScript Cơ Bản",
    description: "Khóa học về React và TypeScript dành cho người mới bắt đầu",
    category: "Lập trình",
    duration: "12 tuần",
    maxStudents: 30,
    enrolledStudents: 25,
    progress: 65,
    startDate: "2024-01-15",
    status: "active"
  };

  const students = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@email.com", progress: 75, lastActive: "2024-01-20" },
    { id: 2, name: "Trần Thị B", email: "tranthib@email.com", progress: 60, lastActive: "2024-01-19" },
    { id: 3, name: "Lê Văn C", email: "levanc@email.com", progress: 90, lastActive: "2024-01-21" },
    { id: 4, name: "Phạm Thị D", email: "phamthid@email.com", progress: 45, lastActive: "2024-01-18" },
    { id: 5, name: "Hoàng Văn E", email: "hoangvane@email.com", progress: 80, lastActive: "2024-01-20" },
  ];

  const assignments = [
    { id: 1, title: "Bài tập 1: Component cơ bản", dueDate: "2024-01-25", submitted: 20, total: 25, status: "active" },
    { id: 2, title: "Bài tập 2: Props và State", dueDate: "2024-02-01", submitted: 15, total: 25, status: "active" },
    { id: 3, title: "Bài tập 3: Hooks", dueDate: "2024-02-08", submitted: 0, total: 25, status: "draft" },
  ];

  const lessons = [
    { id: 1, title: "Giới thiệu React", duration: "45 phút", completed: true },
    { id: 2, title: "JSX và Components", duration: "60 phút", completed: true },
    { id: 3, title: "Props và State", duration: "75 phút", completed: false },
    { id: 4, title: "Event Handling", duration: "50 phút", completed: false },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">{course.title}</h1>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
        <Badge variant={course.status === "active" ? "default" : "secondary"}>
          {course.status === "active" ? "Đang diễn ra" : "Nháp"}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{course.enrolledStudents}/{course.maxStudents}</p>
                <p className="text-sm text-muted-foreground">Học sinh</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Bài tập</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{course.duration}</p>
                <p className="text-sm text-muted-foreground">Thời lượng</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{course.progress}%</p>
                <p className="text-sm text-muted-foreground">Tiến độ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">Học Sinh</TabsTrigger>
          <TabsTrigger value="assignments">Bài Tập</TabsTrigger>
          <TabsTrigger value="lessons">Bài Học</TabsTrigger>
          <TabsTrigger value="settings">Cài Đặt</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh Sách Học Sinh ({students.length})</CardTitle>
              <Button onClick={() => navigate(`/course/${courseId}/add-students`)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Học Sinh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground">Hoạt động cuối: {student.lastActive}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.progress}%</p>
                        <Progress value={student.progress} className="w-24" />
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bài Tập và Đánh Giá</CardTitle>
              <Button onClick={() => navigate("/teacher/create-assignment")}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Bài Tập Mới
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">Hạn nộp: {assignment.dueDate}</p>
                      <p className="text-sm">
                        Đã nộp: {assignment.submitted}/{assignment.total} học sinh
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                        {assignment.status === "active" ? "Đang diễn ra" : "Nháp"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nội Dung Bài Học</CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Bài Học
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground">Thời lượng: {lesson.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lesson.completed ? "default" : "secondary"}>
                        {lesson.completed ? "Hoàn thành" : "Chưa hoàn thành"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Cài Đặt Khóa Học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Danh mục</p>
                  <p className="text-muted-foreground">{course.category}</p>
                </div>
                <div>
                  <p className="font-medium">Ngày bắt đầu</p>
                  <p className="text-muted-foreground">{course.startDate}</p>
                </div>
                <div>
                  <p className="font-medium">Thời lượng</p>
                  <p className="text-muted-foreground">{course.duration}</p>
                </div>
                <div>
                  <p className="font-medium">Số học sinh tối đa</p>
                  <p className="text-muted-foreground">{course.maxStudents}</p>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh Sửa
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Khóa Học
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}