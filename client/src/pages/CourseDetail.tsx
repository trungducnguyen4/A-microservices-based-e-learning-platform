import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api, homeworkService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, BookOpen, Clock, Calendar, Plus, Eye, Edit, Trash2, Loader2, Copy } from "lucide-react";

export default function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  // Decode JWT để lấy token
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

  // Load course detail from API
  const loadCourseDetail = async () => {
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

      // Call API to get course detail
      console.log(`Loading course detail for ID: ${courseId}`);
      const response = await api.get(`/schedules/${courseId}`);

      console.log("API Response:", response.data);
      const courseData = response.data.result;
      
      // Validate required fields from API
      if (!courseData.title && !courseData.name) {
        throw new Error("Khóa học không có tiêu đề");
      }

      setCourse({
        id: courseData.id || courseId,
        title: courseData.title || courseData.name,
        description: courseData.description || "Chưa có mô tả cho khóa học này",
        category: courseData.category || "Chưa phân loại",
        duration: courseData.duration || "Chưa xác định",
        maxStudents: courseData.maxStudents || 0,
        enrolledStudents: courseData.enrolledStudents || 0,
        progress: courseData.progress || 0,
        startDate: courseData.startDate || courseData.createdAt || "Chưa xác định",
        joinCode: courseData.joinCode || courseData.code || "",
        status: courseData.status || "active"
      });

      // Load assignments for this course from HomeworkService
      try {
        const hwResp = await homeworkService.getHomeworksByCourse(String(courseId), 0, 100);

        // homework API may return different shapes depending on backend (Page<T> or List<T>)
        // Normalize to an array `hwList` safely before mapping
        let hwList: any[] = [];
        if (Array.isArray(hwResp)) {
          hwList = hwResp;
        } else if (Array.isArray(hwResp?.result)) {
          hwList = hwResp.result;
        } else if (Array.isArray(hwResp?.result?.content)) {
          hwList = hwResp.result.content;
        } else if (Array.isArray(hwResp?.content)) {
          hwList = hwResp.content;
        } else if (Array.isArray(hwResp?.data)) {
          hwList = hwResp.data;
        } else {
          // Fallback: try to use result when it's a single item (not ideal)
          hwList = [];
        }

        setAssignments(hwList.map((h: any) => ({
          id: h.id,
          title: h.title || h.name || 'Untitled',
          dueDate: h.dueDate || h.due_date || h.due || '—',
          submitted: h.submittedCount || h.submitted || 0,
          total: h.totalStudents || h.total || courseData.enrolledStudents || 0,
          status: h.status || 'active'
        })));
      } catch (e: any) {
        // ignore assignment load failure but log
        console.error('Failed to load assignments for course', e);
      }

      // Try to load enrolled students / participants from schedule service if available
      try {
        const partsResp = await api.get(`/schedules/${courseId}/participants`);
        const parts = partsResp.data?.result || partsResp.data || [];
        setStudents(parts.map((p: any) => ({
          id: p.id || p.userId || p.studentId,
          name: p.name || p.username || p.displayName || p.fullName || 'Unknown',
          email: p.email || p.contact || '',
          progress: p.progress || 0,
          lastActive: p.lastActive || p.updatedAt || ''
        })));
      } catch (e) {
        // If participants endpoint not present, fall back to empty list
        console.info('Participants endpoint not available or failed', e?.message || e);
        setStudents([]);
      }

    } catch (err: any) {
      console.error("Error loading course detail:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else if (err.response?.status === 404) {
        setError("Không tìm thấy khóa học này");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(err.response?.data?.message || "Không thể tải thông tin khóa học từ server");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourseDetail();
    }
  }, [courseId]);

  

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Đang tải khóa học...</h3>
                <p className="text-sm text-muted-foreground">Vui lòng đợi</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Lỗi tải khóa học</h3>
                <p className="text-sm text-muted-foreground mb-4">{error || "Không tìm thấy khóa học"}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate("/teacher")}>
                    Quay lại
                  </Button>
                  <Button onClick={loadCourseDetail}>Thử lại</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          {course.joinCode && (
            <div className="mt-2 flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Mã tham gia:</div>
              <div className="font-mono text-sm bg-muted/10 px-2 py-1 rounded">{course.joinCode}</div>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(course.joinCode);
                  // small UX feedback
                  // eslint-disable-next-line no-alert
                  alert('Join code copied to clipboard');
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error('Copy failed', e);
                }
              }}>
                <Copy className="w-4 h-4 mr-2" />
                Sao chép
              </Button>
            </div>
          )}
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
                    <p className="text-2xl font-bold">{students.length}/{course.maxStudents}</p>
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
                <div>
                  <p className="font-medium">Mã tham gia (joinCode)</p>
                  <p className="text-muted-foreground">{course.joinCode || 'Chưa có'}</p>
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