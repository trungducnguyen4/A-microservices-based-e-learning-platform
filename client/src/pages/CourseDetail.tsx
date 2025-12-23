import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { api, homeworkService } from "@/lib/api";
import { ensureAbsoluteUrl, isImageUrl, isYouTubeUrl, youtubeEmbedUrl, displayFriendlyUrl } from "@/lib/url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, BookOpen, Clock, Calendar, Plus, Eye, Edit, Trash2, Loader2, Copy, CalendarPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/Seo";
import { syncScheduleToGoogleCalendar } from "@/lib/googleCalendar";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [courseAnnouncements, setCourseAnnouncements] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [scheduleView, setScheduleView] = useState<'list'|'week'>('week');
  const [weekCursor, setWeekCursor] = useState<Date>(new Date());
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [announcementPage, setAnnouncementPage] = useState(1);
  const ANNOUNCEMENTS_PER_PAGE = 5;
  const { toast } = useToast();

  // Helper: try to normalize an API response into an array of items
  const normalizeList = (resp: any): any[] => {
    if (!resp) return [];
    // resp might be already an array
    if (Array.isArray(resp)) return resp;

    // common wrappers
    if (Array.isArray(resp.result)) return resp.result;
    if (Array.isArray(resp.result?.content)) return resp.result.content;
    if (Array.isArray(resp.content)) return resp.content;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.homeworks)) return resp.homeworks;
    if (Array.isArray(resp.submissions)) return resp.submissions;

    // try nested places
    if (Array.isArray(resp.result?.data)) return resp.result.data;
    if (Array.isArray(resp.payload)) return resp.payload;

    return [];
  };

  // Minimal RRULE parser for WEEKLY recurrence: e.g. "FREQ=WEEKLY;BYDAY=MO,TU,WE"
  const parseWeeklyRRule = (rule?: string) => {
    if (!rule) return { freq: '', byDays: [] as number[] };
    const parts = String(rule).split(';').map(p => p.trim());
    let freq = '';
    let byDays: number[] = [];
    for (const p of parts) {
      const [k, v] = p.split('=');
      if (k.toUpperCase() === 'FREQ') freq = v?.toUpperCase() || '';
      if (k.toUpperCase() === 'BYDAY') {
        const map: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        byDays = (v || '')
          .split(',')
          .map(s => s.trim().toUpperCase())
          .map(s => map[s])
          .filter(d => d !== undefined);
      }
    }
    return { freq, byDays };
  };

  // Compute upcoming sessions (next 8) from startTime/endTime and weekly BYDAY rule
  const computeUpcomingSessions = (startISO?: string, endISO?: string, rule?: string) => {
    if (!startISO) return [] as any[];
    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;
    const { freq, byDays } = parseWeeklyRRule(rule);
    const sessions: any[] = [];
    const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (freq !== 'WEEKLY' || byDays.length === 0) {
      // Fallback: single session using start time
      sessions.push({ date: start.toLocaleDateString(), time: timeStr, dt: new Date(start) });
      return sessions;
    }

    // Generate next 8 occurrences based on BYDAY
    const occurrencesNeeded = 8;
    let cursor = new Date();
    // Align cursor to start if future sessions start in the future
    if (cursor < start) cursor = new Date(start);

    while (sessions.length < occurrencesNeeded) {
      // For the week of cursor, find the dates matching byDays
      const weekStart = new Date(cursor);
      // Move to beginning of week (Sunday)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      for (const d of byDays) {
        const dt = new Date(weekStart);
        dt.setDate(weekStart.getDate() + d);
        // Use the time-of-day from start
        dt.setHours(start.getHours(), start.getMinutes(), 0, 0);
        if (dt >= cursor && dt >= start && (!end || dt <= end)) {
          sessions.push({ date: dt.toLocaleDateString(), time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), dt });
          if (sessions.length >= occurrencesNeeded) break;
        }
      }
      // advance a week
      cursor.setDate(cursor.getDate() + 7);
      // stop if end reached
      if (end && cursor > end) break;
    }
    return sessions;
  };

  // Helpers for week calculations and Google Calendar links
  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const endOfWeek = (date: Date) => {
    const s = startOfWeek(date);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  };

  const computeOccurrencesInRange = (startISO?: string, endISO?: string, rule?: string, from?: Date, to?: Date) => {
    if (!startISO || !from || !to) return [] as any[];
    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;
    const { freq, byDays } = parseWeeklyRRule(rule);
    const sessions: any[] = [];

    if (freq !== 'WEEKLY' || byDays.length === 0) {
      // Single fallback if in range
      if (start >= from && start <= to) {
        sessions.push({ date: start.toLocaleDateString(), time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), dt: new Date(start) });
      }
      return sessions;
    }

    // Iterate weeks across range
    let cursor = new Date(from);
    while (cursor <= to) {
      const weekStart = startOfWeek(cursor);
      for (const d of byDays) {
        const dt = new Date(weekStart);
        dt.setDate(weekStart.getDate() + d);
        dt.setHours(start.getHours(), start.getMinutes(), 0, 0);
        if (dt >= start && (!end || dt <= end) && dt >= from && dt <= to) {
          sessions.push({ date: dt.toLocaleDateString(), time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), dt });
        }
      }
      cursor.setDate(cursor.getDate() + 7);
      if (end && cursor > end) break;
    }
    return sessions.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  };

  const formatGoogleDate = (dt: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = dt.getUTCFullYear();
    const m = pad(dt.getUTCMonth() + 1);
    const d = pad(dt.getUTCDate());
    const hh = pad(dt.getUTCHours());
    const mm = pad(dt.getUTCMinutes());
    const ss = pad(dt.getUTCSeconds());
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
  };

  const googleCalendarUrl = (title: string, start: Date, end: Date, details?: string, location?: string) => {
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;
    const params = [
      `text=${encodeURIComponent(title)}`,
      `dates=${dates}`,
      details ? `details=${encodeURIComponent(details)}` : '',
      location ? `location=${encodeURIComponent(location)}` : '',
      'sf=true',
      'output=xml'
    ].filter(Boolean).join('&');
    return `${base}&${params}`;
  };

  

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
        const hwListRaw = normalizeList(hwResp);

        const mapped = hwListRaw.map((h: any) => ({
          id: h.id,
          title: h.title || h.name || 'Untitled',
          dueDate: h.dueDate || h.due_date || h.due || '—',
          submitted: h.submittedCount || h.submitted || 0,
          total: h.totalStudents || h.total || 0,
          status: h.status || 'active'
        }));

        // Set assignments strictly from DB response; do not fall back to token-derived student lists
        setAssignments(mapped);
      } catch (e: any) {
        console.error('Failed to load assignments for course', e);
        setAssignments([]);
      }

      // Try to load enrolled students / participants from schedule service if available
      try {
        const partsResp = await api.get(`/schedules/${courseId}/participants`);
        const partsList = normalizeList(partsResp.data || partsResp);

        // Map participants to student records; do not invent missing fields
        const baseStudents = partsList.map((p: any) => ({
          id: p.userId || p.studentId || p.user_id || p.id,
          email: p.email || p.contact || '',
          progress: p.progress || 0,
          lastActive: p.lastActive || p.updatedAt || ''
        })).filter(s => s.id);

        // Fetch profiles for these student ids to display full names
        const profilePromises = baseStudents.map(async (s) => {
          try {
            const profResp = await api.get(`/users/public/${s.id}`);
            const prof = profResp.data?.result || profResp.data || {};
            return { id: s.id, name: prof.fullName || prof.name || prof.username || '' };
          } catch (err) {
            return { id: s.id, name: '' };
          }
        });

        const profiles = await Promise.all(profilePromises);

        const nameMap: Record<string,string> = Object.fromEntries(profiles.map((p: any) => [p.id, p.name]));

        setStudents(baseStudents.map((s) => ({
          id: s.id,
          name: nameMap[s.id] || (s.email ? String(s.email).split('@')[0] : `User ${String(s.id).slice(0,8)}`),
          email: s.email,
          progress: s.progress,
          lastActive: s.lastActive
        })));
      } catch (e) {
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

  // Helper: fallback to token-less user id retrieval if needed
  const authContextFallbackUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = decodeJWT(token);
      return payload?.userId || payload?.user_id || payload?.sub || payload?.username || null;
    } catch (err) {
      return null;
    }
  };

  // Handlers for assignment buttons (use named functions for easier logging/debugging)
  const handleViewAssignmentClick = (assignment: any) => {
    // Debug log to help trace why navigation may not happen
    // eslint-disable-next-line no-console
    console.log('handleViewAssignmentClick', { assignment, user });
    const id = assignment?.id;
    if (!id) {
      // eslint-disable-next-line no-console
      console.warn('Assignment id missing, cannot navigate');
      return;
    }
    // Determine role robustly (role may be a string or an array)
    const roleField = user?.role || user?.roles || '';
    let isStudent = false;
    if (Array.isArray(roleField)) {
      isStudent = roleField.map(r => String(r).toLowerCase()).includes('student');
    } else if (typeof roleField === 'string') {
      isStudent = String(roleField).toLowerCase().includes('student');
    }

    if (isStudent) {
      navigate(`/student/assignment/${encodeURIComponent(id)}`);
    } else {
      // Navigate teacher to grading view
      navigate(`/teacher/grading?homeworkId=${encodeURIComponent(id)}`);
    }
  };

  const handleEditAssignmentClick = (assignment: any) => {
    // eslint-disable-next-line no-console
    console.log('handleEditAssignmentClick', { assignment, user });
    const id = assignment?.id;
    if (!id) {
      // eslint-disable-next-line no-console
      console.warn('Assignment id missing, cannot navigate to edit');
      return;
    }
    navigate(`/teacher/create-assignment?id=${encodeURIComponent(id)}`);
  };

  useEffect(() => {
    if (courseId) {
      loadCourseDetail();
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadAnnouncementsForCourse(String(courseId));
      loadSchedule(String(courseId));
    } else {
      setCourseAnnouncements([]);
      setSchedule([]);
    }
  }, [courseId]);

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
        body: a.content || a.body || a.message || '',
        attachments: a.attachments || a.attachmentUrls || [],
        createdAt: a.createdAt || a.created_at || a.publishedAt || a.created || ''
      }));

      mapped.sort((x: any, y: any) => {
        const dx = x.createdAt ? new Date(x.createdAt).getTime() : 0;
        const dy = y.createdAt ? new Date(y.createdAt).getTime() : 0;
        return dy - dx;
      });

      setCourseAnnouncements(mapped);
    } catch (err) {
      console.info('Announcements load failed', err?.message || err);
      setCourseAnnouncements([]);
    }
  };

  const loadSchedule = async (courseId: string) => {
    try {
      const resp = await api.get(`/schedules/${courseId}`);
      const data = resp.data?.result || resp.data || resp;

      const startISO = data.startTime || data.start_time || data.start;
      const endISO = data.endTime || data.end_time || data.end;
      const rule = data.recurrenceRule || data.rrule || data.recurrence;

      // Try to resolve instructor display name
      let instructor = '';
      try {
        const prof = await api.get(`/users/public/${data.userId || data.teacherId || data.ownerId}`);
        const info = prof.data?.result || prof.data || {};
        instructor = info.fullName || info.username || '';
      } catch { /* ignore */ }

      // Build a horizon of occurrences for the next 12 weeks
      const from = startOfWeek(new Date());
      const to = new Date(from);
      to.setDate(to.getDate() + 7 * 12);
      const occurrences = computeOccurrencesInRange(startISO, endISO, rule, from, to);

      const mapped = occurrences.map((u, idx) => ({
        id: `${data.id || courseId}-occ-${idx}`,
        date: u.date,
        time: u.time,
        dt: u.dt,
        room: data.room || data.location || '',
        topic: data.title || 'Buổi học',
        instructor
      }));

      setSchedule(mapped);
      // Initialize week cursor to the earliest occurrence or current week
      const first = mapped[0]?.dt ? new Date(mapped[0].dt) : new Date();
      setWeekCursor(startOfWeek(first));
    } catch (err) {
      console.info('Schedule load failed', err?.message || err);
      setSchedule([]);
    }
  };;

  const handleSyncToGoogleCalendar = async () => {
    if (schedule.length === 0) {
      toast({ title: 'Không có lịch', description: 'Chưa có lịch dạy/học để đồng bộ.', variant: 'destructive' });
      return;
    }

    setSyncing(true);
    setSyncProgress({ current: 0, total: schedule.length });

    try {
      const result = await syncScheduleToGoogleCalendar(
        schedule.map(s => ({
          topic: s.topic,
          dt: new Date(s.dt),
          instructor: s.instructor,
          room: s.room,
          duration: 90
        })),
        (current, total) => {
          setSyncProgress({ current, total });
        }
      );

      if (result.success > 0) {
        toast({
          title: 'Đồng bộ thành công!',
          description: `Đã thêm ${result.success} buổi học vào Google Calendar. ${result.failed > 0 ? `Thất bại: ${result.failed}` : ''}`,
        });
      } else {
        toast({
          title: 'Đồng bộ thất bại',
          description: 'Không thể thêm lịch vào Google Calendar. Vui lòng thử lại.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      const msg = error?.message || 'Lỗi không xác định';
      toast({
        title: 'Lỗi đồng bộ',
        description: msg.includes('Client ID') ? 'Chưa cấu hình Google Calendar API. Vui lòng liên hệ quản trị viên.' : msg,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  // Render text body replacing URLs with anchors that show friendly text
  const renderTextWithLinks = (text?: string) => {
    if (!text) return null;
    // split on http(s) URLs
    const parts = String(text).split(/(https?:\/\/[^\ -\s]+)/g);
    return parts.map((part, i) => {
      if (/^https?:\/\//i.test(part)) {
        const href = ensureAbsoluteUrl(part);
        const label = displayFriendlyUrl(part);
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
            {label}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  

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
      {/* SEO meta for Course Detail */}
      {(() => {
        const seoTitle = `${course.title || "Chi tiết khóa học"} | E-Learning Platform`;
        const seoDesc = course.description || "Xem thông tin khóa học, lịch dạy và thông báo.";
        const canonical = typeof window !== "undefined" ? window.location.href : undefined;
        const courseLd = {
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.description,
          provider: { "@type": "Organization", name: "E-Learning Platform" },
          courseCode: course.joinCode || undefined,
        };
        const breadcrumbLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: ensureAbsoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Khóa học", item: ensureAbsoluteUrl("/teacher") },
            { "@type": "ListItem", position: 3, name: course.title, item: canonical },
          ],
        };
        return (
          <Seo
            title={seoTitle}
            description={seoDesc}
            canonical={canonical}
            openGraph={{ title: seoTitle, description: seoDesc, url: canonical, type: "website", siteName: "E-Learning Platform" }}
            twitter={{ cardType: "summary_large_image", title: seoTitle, description: seoDesc }}
            jsonLd={[courseLd, breadcrumbLd]}
          />
        );
      })()}
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
                    <p className="text-2xl font-bold">{students.length}</p>
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

      {/* Course Schedule */}
      <div className="mb-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Lịch dạy</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncToGoogleCalendar}
                disabled={syncing || schedule.length === 0}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang đồng bộ {syncProgress.current}/{syncProgress.total}
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Đồng bộ Google Calendar
                  </>
                )}
              </Button>
              <Button variant={scheduleView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setScheduleView('list')}>Danh sách</Button>
              <Button variant={scheduleView === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setScheduleView('week')}>Theo tuần</Button>
            </div>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có lịch dạy nào cho khóa học này.</p>
            ) : (
              <>
                {scheduleView === 'list' ? (
                  <div className="space-y-3">
                    {schedule.slice(0, 8).map((s) => {
                      const end = new Date(s.dt);
                      end.setMinutes(end.getMinutes() + 90);
                      const gcal = googleCalendarUrl(s.topic || 'Buổi học', new Date(s.dt), end, `Giảng viên: ${s.instructor || ''}`, s.room || '');
                      return (
                        <div key={s.id} className="p-3 border rounded bg-gray-50 dark:bg-gray-900">
                          <div className="space-y-1">
                            {s.date && (<p className="text-sm font-medium">📅 Ngày: {s.date}</p>)}
                            {s.time && (<p className="text-sm">⏰ Giờ: {s.time}</p>)}
                            {s.topic && (<p className="text-sm">📖 Nội dung: {s.topic}</p>)}
                            {s.room && (<p className="text-sm">📍 Phòng học: {s.room}</p>)}
                            {s.instructor && (<p className="text-sm">👨‍🏫 Giảng viên: {s.instructor}</p>)}
                          </div>
                          <div className="pt-2">
                            <a href={gcal} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Thêm vào Google Calendar</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Week navigation */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { const p = new Date(weekCursor); p.setDate(p.getDate() - 7); setWeekCursor(p); }}>Tuần trước</Button>
                        <Button variant="outline" size="sm" onClick={() => { const n = new Date(weekCursor); n.setDate(n.getDate() + 7); setWeekCursor(n); }}>Tuần sau</Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const ws = startOfWeek(weekCursor);
                          const we = endOfWeek(weekCursor);
                          return `Tuần ${ws.toLocaleDateString()} - ${we.toLocaleDateString()}`;
                        })()}
                      </div>
                    </div>
                    {/* Week grid */}
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const ws = startOfWeek(weekCursor);
                        const dayDate = new Date(ws);
                        dayDate.setDate(ws.getDate() + dayIdx);
                        const daySessions = schedule.filter(s => {
                          const dt = new Date(s.dt);
                          return dt.getFullYear() === dayDate.getFullYear() && dt.getMonth() === dayDate.getMonth() && dt.getDate() === dayDate.getDate();
                        });
                        const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(dayDate);
                        return (
                          <div key={dayIdx} className="p-3 border rounded">
                            <div className="font-medium mb-2">{dayLabel}<span className="ml-2 text-xs text-muted-foreground">{dayDate.toLocaleDateString()}</span></div>
                            {daySessions.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Không có buổi học</p>
                            ) : (
                              <div className="space-y-2">
                                {daySessions.map((s) => {
                                  const end = new Date(s.dt);
                                  end.setMinutes(end.getMinutes() + 90);
                                  const gcal = googleCalendarUrl(s.topic || 'Buổi học', new Date(s.dt), end, `Giảng viên: ${s.instructor || ''}`, s.room || '');
                                  return (
                                    <div key={s.id} className="text-sm">
                                      <div>⏰ {s.time} — {s.topic}</div>
                                      {s.room && (<div className="text-xs text-muted-foreground">📍 {s.room}</div>)}
                                      {s.instructor && (<div className="text-xs text-muted-foreground">👨‍🏫 {s.instructor}</div>)}
                                      <a href={gcal} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Thêm vào Google Calendar</a>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Announcements */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông báo khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            {courseAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có thông báo nào cho khóa học này.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {courseAnnouncements
                    .slice((announcementPage - 1) * ANNOUNCEMENTS_PER_PAGE, announcementPage * ANNOUNCEMENTS_PER_PAGE)
                    .map((a) => (
                  <div key={a.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{a.title}</h3>
                        <p className="text-xs text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    {a.body && <p className="text-sm text-muted-foreground mt-2">{renderTextWithLinks(a.body)}</p>}
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {a.attachments.map((att: string, idx: number) => (
                          <div key={idx} className="overflow-hidden rounded">
                            {isImageUrl(att) ? (
                              <img src={ensureAbsoluteUrl(att)} alt={`attachment-${idx}`} className="w-full h-40 object-cover rounded" />
                            ) : isYouTubeUrl(att) ? (
                              (() => {
                                const embed = youtubeEmbedUrl(att);
                                if (embed) {
                                  return (
                                    <div className="aspect-video">
                                      <iframe src={embed} title={`video-${idx}`} className="w-full h-full" frameBorder={0} allowFullScreen />
                                    </div>
                                  );
                                }
                                return <a href={ensureAbsoluteUrl(att)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{displayFriendlyUrl(att)}</a>;
                              })()
                            ) : (
                              <a href={ensureAbsoluteUrl(att)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{displayFriendlyUrl(att)}</a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                </div>
                {/* Pagination Controls */}
                {Math.ceil(courseAnnouncements.length / ANNOUNCEMENTS_PER_PAGE) > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnnouncementPage(p => Math.max(1, p - 1))}
                      disabled={announcementPage === 1}
                    >
                      Trước
                    </Button>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {Array.from({ length: Math.ceil(courseAnnouncements.length / ANNOUNCEMENTS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={announcementPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setAnnouncementPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnnouncementPage(p => Math.min(Math.ceil(courseAnnouncements.length / ANNOUNCEMENTS_PER_PAGE), p + 1))}
                      disabled={announcementPage === Math.ceil(courseAnnouncements.length / ANNOUNCEMENTS_PER_PAGE)}
                    >
                      Sau
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">
                      Trang {announcementPage} / {Math.ceil(courseAnnouncements.length / ANNOUNCEMENTS_PER_PAGE)}
                    </span>
                  </div>
                )}
              </>
            )}
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
              {user?.role === 'teacher' && (
                <Button onClick={() => navigate("/teacher/create-assignment")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Bài Tập Mới
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer" onClick={() => handleViewAssignmentClick(assignment)}>
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
                      {user && String(user.role).toLowerCase() === 'student' && (() => {
                        const isPublished = ['published', 'active'].includes(String(assignment.status || '').toLowerCase());
                        return (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-primary text-white hover:bg-primary/90"
                            onClick={() => handleViewAssignmentClick(assignment)}
                            disabled={!isPublished}
                          >
                            Nộp bài
                          </Button>
                        );
                      })()}
                      <Button type="button" size="sm" variant="outline" className="relative z-50" onClick={() => handleViewAssignmentClick(assignment)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="relative z-50" onClick={() => handleEditAssignmentClick(assignment)}>
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
              {user?.role === 'teacher' && (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}