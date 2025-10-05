import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, BookOpen, Clock, Calendar, Plus, Eye, Edit, Trash2, Copy, MessageSquare, FileText, AlertCircle, CheckCircle } from "lucide-react";

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

  const announcements = [
    { 
      id: 1, 
      author: "Giáo viên Nguyễn Văn A",
      content: "Thông báo nội dung nào đó cho lớp học của bạn",
      date: "2024-01-20",
      avatar: "GV"
    },
    { 
      id: 2, 
      author: "Giáo viên Nguyễn Văn A",
      content: "Chào mừng các bạn đến với khóa học React và TypeScript! Hãy chuẩn bị sẵn sàng cho một hành trình học tập thú vị.",
      date: "2024-01-15",
      avatar: "GV"
    }
  ];

  const [newAnnouncement, setNewAnnouncement] = useState("");

  const upcomingDeadlines = assignments.filter(a => a.status === "active").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-48 bg-gradient-to-r from-primary via-primary/80 to-accent overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute right-0 top-0 w-1/2 h-full">
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-32 w-32 text-white/30" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-6 relative">
          <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-6 right-6">
          <h1 className="text-4xl font-bold text-white mb-1">{course.title}</h1>
          <p className="text-white/90">{course.category}</p>
        </div>
        <Button 
          variant="outline" 
          className="absolute bottom-4 right-6 bg-white text-primary hover:bg-white/90"
          onClick={() => {}}
        >
          <Edit className="h-4 w-4 mr-2" />
          Tùy chỉnh
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="stream" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0 rounded-none">
              <TabsTrigger 
                value="stream" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                Bảng tin
              </TabsTrigger>
              <TabsTrigger 
                value="classwork"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                Bài tập trên lớp
              </TabsTrigger>
              <TabsTrigger 
                value="people"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                Mọi người
              </TabsTrigger>
              <TabsTrigger 
                value="grades"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                Điểm
              </TabsTrigger>
            </TabsList>

            {/* Bảng tin Tab */}
            <TabsContent value="stream" className="mt-0 pt-6 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Create Announcement */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar>
                          <AvatarFallback>GV</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Thông báo nội dung nào đó cho lớp học của bạn"
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" size="sm">Hủy</Button>
                            <Button size="sm">Đăng</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Announcements Feed */}
                  {announcements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Avatar>
                            <AvatarFallback>{announcement.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{announcement.author}</p>
                                <p className="text-sm text-muted-foreground">{announcement.date}</p>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="mt-3 text-foreground">{announcement.content}</p>
                            <div className="flex gap-4 mt-4 pt-4 border-t">
                              <Button variant="ghost" size="sm" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Bình luận
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Class Code */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mã lớp</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <code className="text-2xl font-bold text-primary tracking-wider">bzyvamc</code>
                        <Button size="icon" variant="ghost">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Deadlines */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sắp đến hạn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingDeadlines.length > 0 ? (
                        <div className="space-y-3">
                          {upcomingDeadlines.map((assignment) => (
                            <div key={assignment.id} className="flex items-start gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                              <FileText className="h-5 w-5 text-primary mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{assignment.title}</p>
                                <p className="text-xs text-muted-foreground">Hạn: {assignment.dueDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Không có hạn chót nào sắp tới</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Bài tập trên lớp Tab */}
            <TabsContent value="classwork" className="mt-0 pt-6 pb-12">
              <div className="max-w-4xl">
                <div className="flex justify-end mb-6">
                  <Button onClick={() => navigate("/teacher/create-assignment")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài tập
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Hạn nộp: {assignment.dueDate}
                                </span>
                                <span className="flex items-center gap-1">
                                  {assignment.submitted === assignment.total ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  )}
                                  {assignment.submitted}/{assignment.total} đã nộp
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                              {assignment.status === "active" ? "Hoạt động" : "Nháp"}
                            </Badge>
                            <Button size="icon" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Mọi người Tab */}
            <TabsContent value="people" className="mt-0 pt-6 pb-12">
              <div className="max-w-4xl space-y-8">
                {/* Teachers Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary">Giáo viên</h2>
                  </div>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>GV</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Nguyễn Văn A</p>
                          <p className="text-sm text-muted-foreground">giangvien@email.com</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Students Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary">Học sinh</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{students.length} học sinh</span>
                      <Button size="sm" onClick={() => navigate(`/course/${courseId}/add-students`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {students.map((student) => (
                      <Card key={student.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Điểm Tab */}
            <TabsContent value="grades" className="mt-0 pt-6 pb-12">
              <div className="max-w-6xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Bảng điểm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-semibold">Học sinh</th>
                            {assignments.slice(0, 3).map((assignment) => (
                              <th key={assignment.id} className="text-center p-4 font-semibold min-w-[150px]">
                                {assignment.title}
                              </th>
                            ))}
                            <th className="text-center p-4 font-semibold">Tiến độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.id} className="border-b hover:bg-muted/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{student.name}</span>
                                </div>
                              </td>
                              {assignments.slice(0, 3).map((assignment) => (
                                <td key={assignment.id} className="text-center p-4">
                                  <span className="text-muted-foreground">-</span>
                                </td>
                              ))}
                              <td className="text-center p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Progress value={student.progress} className="w-20" />
                                  <span className="text-sm font-medium">{student.progress}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}