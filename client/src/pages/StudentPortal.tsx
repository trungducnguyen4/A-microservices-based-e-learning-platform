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
import { api, homeworkService } from "@/lib/api";
import { ensureAbsoluteUrl, isImageUrl, isYouTubeUrl, youtubeEmbedUrl, displayFriendlyUrl } from "@/lib/url";
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
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    email?: string;
    id?: string | number;
  } | null>(null);
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [studentSchedule, setStudentSchedule] = useState<any[]>([]);
  const [studentOccurrences, setStudentOccurrences] = useState<any[]>([]);
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

        // Try to resolve instructor names via public profile endpoint
        const instructorIds = Array.from(new Set(mapped.map((m: any) => m.instructor).filter(Boolean)));
        if (instructorIds.length > 0) {
          try {
            const profPromises = instructorIds.map((id: string) => api.get(`/users/public/${id}`).then(r => ({ id, data: r.data?.result || r.data || {} })).catch(() => ({ id, data: {} })));
            const profResults = await Promise.all(profPromises);
            const profMap: Record<string, any> = {};
            profResults.forEach((p: any) => {
              profMap[String(p.id)] = p.data;
            });

            const mappedWithNames = mapped.map((c: any) => ({
              ...c,
              instructorName: (profMap[String(c.instructor)]?.fullName || profMap[String(c.instructor)]?.username || c.instructor || 'Unknown')
            }));
            setEnrolledCourses(mappedWithNames);
          } catch (e) {
            setEnrolledCourses(mapped);
          }
        } else {
          setEnrolledCourses(mapped);
        }
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

  // Load upcoming classes for the student from backend schedules
  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        const resp = await api.get(`/schedules/my-schedule`);
        const raw = resp.data?.result || resp.data || [];
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.result) ? raw.result : []);

        const now = new Date().getTime();
        const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");
        const computeDuration = (start?: string, end?: string) => {
          if (!start || !end) return "";
          const mins = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
          return mins ? `${mins} min` : "";
        };

        // keep full schedule for hover preview
        const full = list.map((s: any) => ({
          id: s.id || s.scheduleId || s.courseId,
          courseId: s.courseId,
          course: s.courseName || s.title || "Class",
          topic: s.topic || s.title || "",
          instructor: s.teacherName || s.teacherId || "",
          startTime: s.startTime,
          endTime: s.endTime,
          recurrenceRule: s.recurrenceRule || s.rrule || s.recurrence,
          type: s.type || "Live Session",
        }));

        setStudentSchedule(full);

        // Helpers copied from CourseDetail to compute weekly occurrences
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
                .filter((d): d is number => d !== undefined);
            }
          }
          return { freq, byDays };
        };

        const startOfWeek = (date: Date) => { const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d; };
        const endOfWeek = (date: Date) => { const s = startOfWeek(date); const e = new Date(s); e.setDate(e.getDate()+6); e.setHours(23,59,59,999); return e; };
        const computeOccurrencesInRange = (startISO?: string, endISO?: string, rule?: string, from?: Date, to?: Date) => {
          if (!startISO || !from || !to) return [] as any[];
          const start = new Date(startISO);
          const end = endISO ? new Date(endISO) : null;
          const { freq, byDays } = parseWeeklyRRule(rule);
          const sessions: any[] = [];
          if (freq !== 'WEEKLY' || byDays.length === 0) {
            if (start >= from && start <= to) {
              sessions.push({ dt: new Date(start) });
            }
            return sessions;
          }
          let cursor = new Date(from);
          while (cursor <= to) {
            const weekStart = startOfWeek(cursor);
            for (const d of byDays) {
              const dt = new Date(weekStart);
              dt.setDate(weekStart.getDate()+d);
              dt.setHours(start.getHours(), start.getMinutes(), 0, 0);
              if (dt >= start && (!end || dt <= end) && dt >= from && dt <= to) {
                sessions.push({ dt });
              }
            }
            cursor.setDate(cursor.getDate()+7);
            if (end && cursor > end) break;
          }
          return sessions.sort((a,b)=>a.dt.getTime()-b.dt.getTime());
        };

        // Build occurrences horizon for next 12 weeks, then pick next 5 overall
        const from = startOfWeek(new Date());
        const to = new Date(from); to.setDate(to.getDate()+7*12);
        const allOccurrences: any[] = [];
        for (const s of full) {
          const occs = computeOccurrencesInRange(s.startTime, s.endTime, s.recurrenceRule, from, to).map((o:any)=>({
            id: `${s.id}-occ-${o.dt.getTime()}`,
            courseId: s.courseId,
            course: s.course,
            topic: s.topic,
            instructor: s.instructor,
            startTime: o.dt.toISOString(),
            endTime: s.endTime,
            duration: computeDuration(s.startTime, s.endTime),
            type: s.type,
          }));
          allOccurrences.push(...occs);
        }

        // store for calendar preview
        setStudentOccurrences(allOccurrences);

        const upcoming = allOccurrences
          .filter((o:any)=> new Date(o.startTime).getTime() >= now)
          .sort((a:any,b:any)=> new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0,5)
          .map((o:any)=>({
            id: o.id,
            courseId: o.courseId,
            course: o.course,
            topic: o.topic,
            instructor: o.instructor,
            time: fmtTime(o.startTime),
            duration: o.duration,
            type: o.type,
          }));

        setUpcomingClasses(upcoming);
      } catch (err) {
        console.info("Upcoming classes load failed", (err as any)?.message || err);
        setUpcomingClasses([]);
      }
    };

    loadUpcoming();
  }, [userInfo]);

  // Load announcements for enrolled courses
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        if (!enrolledCourses || enrolledCourses.length === 0) {
          setAnnouncements([]);
          return;
        }

        const promises = enrolledCourses.map((c: any) => api.get(`/announcements/course/${c.id}`).then(r => r.data?.result || r.data || []).catch(() => []));
        const results = await Promise.all(promises);
        // build a quick lookup of enrolled course titles by id
        const courseMap: Record<string, string> = {};
        enrolledCourses.forEach((c: any) => {
          if (c.id) courseMap[String(c.id)] = c.title || c.name || c.title || '';
        });

        // flatten and normalize, also include courseTitle resolved from enrolled courses when possible
        const flat = results.flat().map((a: any) => {
          const courseId = a.courseId || a.course || a.courseId || null;
          const courseTitle = courseId ? (courseMap[String(courseId)] || a.courseName || a.title || '') : '';
          return {
            id: a.id,
            courseId,
            courseTitle,
            title: a.title || a.subject || 'Announcement',
            body: a.content || a.body || a.message || '',
            attachments: a.attachments || a.attachmentUrls || [],
            createdAt: a.createdAt || a.created_at || a.publishedAt || a.created || null
          };
        });
        // sort by createdAt desc
        flat.sort((x: any, y: any) => {
          const dx = x.createdAt ? new Date(x.createdAt).getTime() : 0;
          const dy = y.createdAt ? new Date(y.createdAt).getTime() : 0;
          return dy - dx;
        });
        setAnnouncements(flat);
      } catch (err) {
        console.error('Failed to load announcements for student', err);
        setAnnouncements([]);
      }
    };

    loadAnnouncements();
  }, [enrolledCourses]);

  // Load student assignments from HomeworkService
  useEffect(() => {
    const loadStudentAssignments = async () => {
      try {
        if (!userInfo?.id && !authUser?.id) return;
        const sid = String(userInfo?.id || authUser?.id);
        const resp = await homeworkService.getStudentHomework(sid);
        const raw = resp?.result || resp?.data || resp || [];
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);

        const mapped = list.map((h: any) => ({
          id: h.id,
          title: h.title || h.name || 'Untitled',
          course: h.courseTitle || h.courseName || h.course || '',
          dueDate: h.dueDate || h.due_date || h.due || '',
          status: (h.status || h.submissionStatus || 'pending').toString().toLowerCase(),
          grade: h.grade || h.score || null,
          feedback: h.feedback || h.comment || null,
        }));

        setAssignments(mapped);
      } catch (err) {
        console.info('Failed to load student assignments', (err as any)?.message || err);
        setAssignments([]);
      }
    };

    loadStudentAssignments();
  }, [userInfo, authUser]);

  const handleJoinCourse = async () => {
    if (!joinCourseCode.trim()) return;
    
    setIsJoining(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please sign in again");
        return;
      }

      if (!userInfo?.id) {
        alert("Unable to get user information");
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
        alert("Course joined successfully!");
        setJoinCourseCode("");
        setJoinDialogOpen(false);
        // Log to console and reload so UI shows updated enrollments
        try {
          console.info('JoinCourse: success, refreshing enrolled courses');
        } catch (e) {}
        window.location.reload();
      } else {
        alert(response.data.message || "Unable to join course");
      }
    } catch (error: any) {
      console.error("Error joining course:", error);
      alert(error.response?.data?.message || "Invalid course code");
    } finally {
      setIsJoining(false);
    }
  };

  // Use fetched enrolled courses, fallback to empty array while loading
  // `enrolledCourses` state is populated by effect above

  // upcomingClasses now loaded from backend above

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
                <p className="text-2xl font-bold">{assignments.filter(a => a.status !== 'submitted').length}</p>
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
                        By {course.instructorName || course.instructor} • {course.duration} • {course.level}
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

          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="w-5 h-5 mr-2 text-primary" />
                Announcements
              </CardTitle>
              <CardDescription>Latest announcements from your courses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-muted-foreground">No recent announcements.</div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="border rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{a.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{(a.body || '').substring(0, 240)}</p>
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
                                    return <a href={ensureAbsoluteUrl(url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{displayFriendlyUrl(url)}</a>;
                                  })()
                                ) : (
                                  <a href={ensureAbsoluteUrl(url)} target="_blank" rel="noreferrer" className="text-sm text-primary underline">{displayFriendlyUrl(url)}</a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {a.courseTitle && (
                          <div className="text-xs text-muted-foreground mt-2">From: <strong>{a.courseTitle}</strong></div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Assignments */}
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending</TabsTrigger>
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
                            {getStatusBadge(assignment.status)}
                            {assignment.dueDate && (
                              <Badge variant="outline">Due: {new Date(assignment.dueDate).toLocaleDateString()}</Badge>
                            )}
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
                onSelect={(d) => { setDate(d); setHoveredDate(d || undefined); }}
                onDayMouseEnter={(day: Date) => setHoveredDate(day)}
                onDayMouseLeave={() => setHoveredDate(undefined)}
                className="rounded-md border"
              />
              {hoveredDate && (
                <div className="mt-3 text-xs border rounded p-2 bg-muted/30">
                  {(() => {
                    const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
                    const keyOfIso = (iso?: string) => {
                      if (!iso) return '';
                      const d = new Date(iso);
                      return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
                    };
                    const targetKey = keyOf(hoveredDate);
                    const items = studentOccurrences.filter((o: any) => o.startTime && keyOfIso(o.startTime) === targetKey).map((o:any)=>({ course: o.course, startTime: o.startTime, endTime: o.endTime }));
                    if (!items.length) return <div className="text-muted-foreground">No classes</div>;
                    const fmtRange = (s: any) => {
                      const st = s.startTime ? new Date(s.startTime).toLocaleTimeString() : "";
                      const et = s.endTime ? new Date(s.endTime).toLocaleTimeString() : "";
                      return [st, et].filter(Boolean).join(" - ");
                    };
                    return (
                      <div className="space-y-1">
                        {items.map((s: any) => (
                          <div key={`${s.id}-${s.startTime}`} className="flex justify-between">
                            <span className="font-medium">{s.course}</span>
                            <span className="text-muted-foreground">{fmtRange(s)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
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
                  <Button size="sm" className="w-full mt-2" variant="outline" onClick={() => class_.courseId && navigate(`/course/${class_.courseId}`)}>
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
