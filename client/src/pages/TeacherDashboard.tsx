import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api, homeworkService, submissionService, fileService } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureAbsoluteUrl, isImageUrl, isYouTubeUrl, youtubeEmbedUrl, displayFriendlyUrl } from "@/lib/url";
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
  Search,
} from "lucide-react";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [annTitle, setAnnTitle] = useState<string>("");
  const [annBody, setAnnBody] = useState<string>("");
  const [annPinned, setAnnPinned] = useState<boolean>(false);
  const [annDialogOpen, setAnnDialogOpen] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Array<{ url: string; name?: string; type?: string }>>([]);
  const [linkInput, setLinkInput] = useState<string>("");
  const [schedule, setSchedule] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [classesToday, setClassesToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState("");
  const [addStudentIds, setAddStudentIds] = useState("");
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [addStudentLoading, setAddStudentLoading] = useState(false);

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

      const userId = payload.userId || payload.sub || payload.id || "";
      setTeacherId(userId);

      // Call API to get teacher's owned schedules (backend resolves current user from headers)
      const response = await api.get(`/schedules/my-owned`);

      const teacherCourses = response.data.result.map((course: any) => ({
        // support response shapes: { id, courseId }
        id: course.id || course.courseId,
        name: course.title || course.name,
        students: course.enrolledStudents || course.maxParticipants || 0,
        status: course.status || "Active",
        color: getRandomColor(),
        description: course.description || ''
      }));

      console.info(`MyCourses: user=${userId} enrolledCount=${teacherCourses.length}`, teacherCourses);

      // Use only API-provided courses
      setCourses(teacherCourses);
      // compute aggregated stats from API-provided courses
      const total = teacherCourses.reduce((acc: number, c: any) => acc + (c.students || 0), 0);
      setTotalStudents(total);
      // compute classes today from the schedules returned by /schedules/my-owned
      try {
        const rawSchedules = response.data.result || response.data || [];
        const arr = Array.isArray(rawSchedules) ? rawSchedules : (Array.isArray(rawSchedules.result) ? rawSchedules.result : []);
        // filter schedules whose startTime is today (local date)
        const today = new Date();
        const isSameLocalDate = (iso: string | null | undefined) => {
          if (!iso) return false;
          const d = new Date(iso);
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
        };

        const todays = arr.filter((s: any) => isSameLocalDate(s.startTime));
        setSchedule(todays.map((s: any) => ({
          id: s.id || s.courseId,
          title: s.title || s.name || s.courseName || 'Class',
          time: s.startTime ? new Date(s.startTime).toLocaleTimeString() : '',
          date: s.startTime ? new Date(s.startTime).toLocaleDateString() : '',
          type: s.type || 'lecture'
        })));
        setClassesToday(todays.length || 0);
      } catch (err) {
        setClassesToday(0);
      }
      if (teacherCourses.length > 0) setSelectedCourse(teacherCourses[0].id);

    } catch (err: any) {
      console.error("Error loading courses:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Could not load course list");
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

  // Load participants (students) and assignments when selectedCourse changes
  const loadCourseParticipants = async (courseId: string) => {
    try {
      const resp = await api.get(`/schedules/${courseId}/participants`);
      const parts = resp.data?.result || resp.data || [];
      const mapped = (Array.isArray(parts) ? parts : []).map((p: any) => ({
        id: p.userId || p.studentId || p.id,
        name: p.fullName || p.name || p.username || (p.email ? String(p.email).split('@')[0] : `User ${String(p.userId || p.studentId || p.id).slice(0,8)}`),
        email: p.email || '',
        progress: p.progress || 0,
        lastActive: p.lastActive || p.updatedAt || ''
      }));
      setStudents(mapped);
    } catch (err) {
      console.info('Participants load failed', err?.message || err);
      setStudents([]);
    }
  };

  const loadAssignmentsForCourse = async (courseId: string) => {
    try {
      const resp = await homeworkService.getHomeworksByCourse(String(courseId), 0, 100);
      // normalize
      let list: any[] = [];
      if (Array.isArray(resp)) list = resp;
      else if (Array.isArray(resp?.result)) list = resp.result;
      else if (Array.isArray(resp?.result?.content)) list = resp.result.content;
      else if (Array.isArray(resp?.data)) list = resp.data;
      else if (Array.isArray(resp?.content)) list = resp.content;

      const mapped = list.map((h: any) => ({
        id: h.id,
        title: h.title || h.name || 'Untitled',
        dueDate: h.dueDate || h.due_date || h.due || '—',
        // may be filled below by counting unique student submissions
        submissions: h.submittedCount || h.submitted || 0,
        total: h.totalStudents || h.total || 0,
        status: h.status || 'Draft'
      }));
      setAssignments(mapped);

      // Enrich assignments with accurate submission counts by fetching submissions per homework
      try {
        const counts = await Promise.all(mapped.map(async (a) => {
          try {
            const sresp = await submissionService.getSubmissionsByHomework(String(a.id));
            const raw = sresp?.result || sresp;
            let subs: any[] = [];
            if (Array.isArray(raw)) subs = raw;
            else if (Array.isArray(raw?.content)) subs = raw.content;
            else if (Array.isArray(raw?.result)) subs = raw.result;
            else if (Array.isArray(raw?.submissions)) subs = raw.submissions;
            else subs = [];

            const unique = new Set(subs.map((s: any) => (s.studentId || s.student?.id || s.userId || s.student_id))).size;
            return unique || 0;
          } catch (err) {
            return a.submissions || 0;
          }
        }));

        const enriched = mapped.map((a, idx) => ({ ...a, submissions: counts[idx] }));
        setAssignments(enriched);
      } catch (err) {
        // if per-assignment counts fail, keep whatever the homework record provided
        console.info('Failed to fetch per-assignment submission counts', err?.message || err);
      }
    } catch (err) {
      console.info('Assignments load failed', err?.message || err);
      setAssignments([]);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      // load announcements, courses, participants and assignments for the selected course
      loadAnnouncementsForCourse(selectedCourse);
      loadCourseParticipants(selectedCourse);
      loadAssignmentsForCourse(selectedCourse);
      // optionally load schedule; leave empty if not available
      setSchedule([]);
    } else {
      setAnnouncements([]);
      setStudents([]);
      setAssignments([]);
      setSchedule([]);
    }
  }, [selectedCourse]);

  const loadAnnouncementsForCourse = async (courseId: string) => {
    try {
      const resp = await api.get(`/announcements/course/${courseId}`);
      const raw = resp.data?.result || resp.data || resp;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.result)) list = raw.result;
      else if (Array.isArray(raw?.content)) list = raw.content;
      else list = [];

      const mapped = list.map((a: any) => ({
        id: a.id,
        title: a.title || a.subject || 'Announcement',
        body: a.body || a.message || a.content || '',
        attachments: a.attachments || a.attachmentUrls || [],
        createdAt: a.createdAt || a.created_at || a.publishedAt || a.created || ''
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.info('Announcements load failed', err?.message || err);
      setAnnouncements([]);
    }
  };

  // Add student handler
  const handleAddStudent = async () => {
    setAddStudentError(null);
    setAddStudentLoading(true);
    try {
      // Find joinCode of selected course
      const course = courses.find(c => c.id === selectedCourse);
      const joinCode = course?.joinCode || course?.code || course?.join_code || course?.joincode;
      if (!addStudentId || !joinCode) {
        setAddStudentError("Missing student ID or join code");
        setAddStudentLoading(false);
        return;
      }
      await api.post("/schedules/join", { userId: addStudentId, joinCode });
      setAddStudentOpen(false);
      setAddStudentId("");
      // Reload students
      await loadCourseParticipants(selectedCourse);
    } catch (err: any) {
      setAddStudentError(err?.response?.data?.message || "Failed to add student");
    } finally {
      setAddStudentLoading(false);
    }
  };

  // Add multiple students handler
  const handleAddStudents = async () => {
    setAddStudentError(null);
    setAddStudentLoading(true);
    try {
      const course = courses.find(c => c.id === selectedCourse);
      const joinCode = course?.joinCode || course?.code || course?.join_code || course?.joincode;
      if (!addStudentIds || !joinCode) {
        setAddStudentError("Missing student IDs or join code");
        setAddStudentLoading(false);
        return;
      }
      // Split by semicolon, comma, or newline
      const ids = addStudentIds.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        setAddStudentError("No valid student IDs");
        setAddStudentLoading(false);
        return;
      }
      await Promise.all(ids.map(userId => api.post("/schedules/join", { userId, joinCode })));
      setAddStudentOpen(false);
      setAddStudentIds("");
      await loadCourseParticipants(selectedCourse);
    } catch (err: any) {
      setAddStudentError(err?.response?.data?.message || "Failed to add students");
    } finally {
      setAddStudentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-2">Manage your courses, students, and assignments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button className="bg-primary hover:bg-primary/90 h-9 sm:h-10 text-sm sm:text-base w-full sm:w-auto" onClick={() => window.location.href = "/teacher/create-assignment"}>
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              New Assignment
            </Button>
            
            <Button variant="outline" className="h-9 sm:h-10 text-sm sm:text-base w-full sm:w-auto" onClick={() => window.location.href = "/teacher/create-course"}>
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Create New Course
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{totalStudents}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Courses</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{courses.length}</p>
                </div>
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Classes Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{classesToday}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="announcements" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
                <TabsTrigger value="announcements" className="text-xs sm:text-sm">Announcements</TabsTrigger>
                <TabsTrigger value="courses" className="text-xs sm:text-sm">Courses</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="announcements" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Announcements</h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10 text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Dialog open={annDialogOpen} onOpenChange={setAnnDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 h-9 sm:h-10 text-sm sm:text-base w-full sm:w-auto" onClick={() => {
                          // open create dialog (clear state)
                          setEditingAnnouncement(null);
                          setAnnTitle("");
                          setAnnBody("");
                          setAnnPinned(false);
                          setAttachments([]);
                          setAnnDialogOpen(true);
                        }}>
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          New Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
                          <DialogDescription>{editingAnnouncement ? 'Update the announcement and save.' : 'Post a new announcement to the selected course.'}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="annTitle">Title</Label>
                            <Input id="annTitle" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" />
                          </div>
                          <div>
                            <Label htmlFor="annBody">Content</Label>
                            <Textarea id="annBody" value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Write something..." />
                          </div>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" id="annPinned" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} />
                            <Label htmlFor="annPinned">Pin announcement</Label>
                          </div>
                          <div className="space-y-2">
                            <Label>Attachments</Label>
                            <div className="flex items-center gap-2">
                              <input type="text" placeholder="Paste link (image/video/file)" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} className="border rounded px-2 py-1 flex-1" />
                              <Button onClick={() => {
                                if (!linkInput) return;
                                const normalized = ensureAbsoluteUrl(linkInput);
                                setAttachments(prev => [{ url: normalized, name: linkInput.split('/').pop() || linkInput }, ...prev]);
                                setLinkInput("");
                              }}>Add Link</Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input id="ann-file" type="file" className="hidden" onChange={async (e) => {
                                const f = e.target.files && e.target.files[0];
                                if (!f) return;
                                try {
                                  const uploaded = await fileService.uploadFile(f);
                                  const url = uploaded?.url || uploaded?.path || uploaded?.id;
                                  if (url) setAttachments(prev => [{ url, name: uploaded.originalName || f.name, type: f.type }, ...prev]);
                                } catch (err) {
                                  console.error('File upload failed', err);
                                  alert('File upload failed');
                                } finally {
                                  // reset input
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }} />
                              <label htmlFor="ann-file" className="btn inline-flex items-center px-3 py-1 border rounded cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" /> Upload File
                              </label>
                            </div>
                            <div className="flex flex-col gap-1">
                              {attachments.map((a, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    {a.type?.startsWith('image') ? (
                                      <img src={ensureAbsoluteUrl(a.url)} alt={a.name} className="w-12 h-8 object-cover rounded" />
                                    ) : (
                                      <FileText className="w-5 h-5" />
                                    )}
                                    <div className="text-sm">{a.name}</div>
                                  </div>
                                  <div>
                                    <Button variant="ghost" size="sm" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                                  </div>
                                </div>
                              ))}

                            </div>
                          </div>
                            <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setAnnDialogOpen(false)}>Cancel</Button>
                            <Button onClick={async () => {
                              if (!selectedCourse) {
                                alert('Please select a course first');
                                return;
                              }
                              try {
                                const payload = { title: annTitle || 'Announcement', content: annBody || '', courseId: selectedCourse, pinned: annPinned, attachments: attachments.map(a => a.url) };
                                // create new announcement
                                await api.post('/announcements', payload);
                                // if editing, delete old announcement to simulate update (backend has no PUT)
                                if (editingAnnouncement?.id) {
                                  try {
                                    await api.delete(`/announcements/${editingAnnouncement.id}`);
                                  } catch (e) {
                                    console.info('Failed to delete old announcement after update', e);
                                  }
                                }
                                // refresh
                                await loadAnnouncementsForCourse(selectedCourse);
                                // close dialog and clear edit state
                                setAnnDialogOpen(false);
                                setEditingAnnouncement(null);
                                setAnnTitle("");
                                setAnnBody("");
                                setAnnPinned(false);
                              } catch (err) {
                                console.error('Create announcement failed', err);
                                alert('Failed to create announcement');
                              }
                            }}>Post</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No announcements for this course.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    announcements.map((a) => (
                      <Card key={a.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{a.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{(a.body || a.content || '').substring(0, 180)}</p>
                              {a.attachments && a.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {a.attachments.map((url: string, i: number) => (
                                    <div key={i}>
                                      {isImageUrl(url) ? (
                                        <img src={ensureAbsoluteUrl(url)} alt={`attachment-${i}`} className="w-full max-h-48 object-cover rounded" />
                                      ) : isYouTubeUrl(url) ? (
                                        (() => {
                                          const embed = youtubeEmbedUrl(url);
                                          if (embed) {
                                            return (
                                              <div className="w-full aspect-video">
                                                <iframe src={embed} title={`video-${i}`} className="w-full h-48" />
                                              </div>
                                            );
                                          }
                                          // not embeddable (no id) - render as external link showing friendly text
                                          return <a href={ensureAbsoluteUrl(url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{displayFriendlyUrl(url)}</a>;
                                        })()
                                      ) : (
                                        <a href={ensureAbsoluteUrl(url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{displayFriendlyUrl(url)}</a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
                            </div>
                            <div className="flex flex-col items-end ml-4 space-y-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                // open edit dialog prefilled
                                setEditingAnnouncement(a);
                                setAnnTitle(a.title || '');
                                setAnnBody(a.body || a.content || '');
                                setAnnPinned(Boolean(a.pinned));
                                setAttachments(a.attachments?.map((u: string) => ({ url: u, name: u.split('/').pop() })) || []);
                                setAnnDialogOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={async () => {
                                if (!confirm('Delete this announcement?')) return;
                                try {
                                  await api.delete(`/announcements/${a.id}`);
                                  await loadAnnouncementsForCourse(selectedCourse);
                                } catch (err) {
                                  console.error('Delete failed', err);
                                  alert('Failed to delete announcement');
                                }
                              }}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">My Courses</h3>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = "/teacher/create-course"}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search courses by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Loading courses...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredCourses.length === 0 ? (
                      <Card className="p-6 sm:p-8 text-center">
                        <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                        <h4 className="text-base sm:text-lg font-semibold mb-2">No courses yet</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">You haven't created any courses yet. Create your first course!</p>
                        <Button className="h-9 sm:h-10 text-sm sm:text-base" onClick={() => window.location.href = "/teacher/create-course"}>
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Create New Course
                        </Button>
                      </Card>
                    ) : (
                      filteredCourses.map((course) => (
                        <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCourseClick(course.id)}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${course.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm sm:text-base font-semibold text-foreground truncate">{course.name}</h4>
                                  <p className="text-xs sm:text-sm text-muted-foreground">{course.students} students enrolled</p>
                                  {course.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{course.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                <Badge variant={course.status === "Active" ? "default" : "secondary"} className="text-xs">
                                  {course.status}
                                </Badge>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleCourseClick(course.id)}>
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    // Try to find scheduleId for this course
                                    const scheduleId = course.scheduleId || course.id;
                                    navigate(`/teacher/edit-schedule/${scheduleId}`);
                                  }}
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
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