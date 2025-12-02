import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GraduationCap, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { homeworkService, submissionService, fileService, api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HomeworkData {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionType: "TEXT" | "FILE" | "BOTH";
  status: string;
  classroomId: string;
}

interface SubmissionData {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName?: string;
  content?: string;
  status: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  attemptNumber: number;
  isLate: boolean;
  files?: any[];
}



export default function TeacherGrading() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  const [assignments, setAssignments] = useState<HomeworkData[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Grading form state
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  
  // Get teacher ID from authentication
  const { user } = useAuth();
  const teacherId = user?.id || "teacher-123";

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions();
    }
  }, [selectedAssignment]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await homeworkService.getHomeworksByTeacher(teacherId);
      const raw = response?.result || response;

      // Normalize various possible response shapes to an array
      let hwList: any[] = [];
      if (Array.isArray(raw)) hwList = raw;
      else if (Array.isArray(raw?.result)) hwList = raw.result;
      else if (Array.isArray(raw?.content)) hwList = raw.content;
      else if (Array.isArray(raw?.homeworks)) hwList = raw.homeworks;
      else hwList = [];

      setAssignments(hwList);

      // If a homeworkId query param exists, select it; otherwise pick first
      const params = new URLSearchParams(location.search);
      const qId = params.get('homeworkId');
      if (qId && hwList.find((h: any) => String(h.id) === String(qId))) {
        setSelectedAssignment(String(qId));
      } else if (hwList.length > 0 && !selectedAssignment) {
        setSelectedAssignment(hwList[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load assignments",
        description: error.response?.data?.message || "Could not load assignments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!selectedAssignment) return;
    
    try {
      setIsLoading(true);
      const response = await submissionService.getSubmissionsByHomework(selectedAssignment);
      const raw = response?.result || response;

      // Normalize submissions to array
      let subsList: any[] = [];
      if (Array.isArray(raw)) subsList = raw;
      else if (Array.isArray(raw?.content)) subsList = raw.content;
      else if (Array.isArray(raw?.result)) subsList = raw.result;
      else if (Array.isArray(raw?.submissions)) subsList = raw.submissions;
      else subsList = [];

      // Group submissions by studentId and keep the latest submission per student
      const groupedByStudent: Record<string, any[]> = {};
      subsList.forEach((s: any) => {
        const sid = s.studentId || s.student?.id || s.userId || s.student_id;
        if (!sid) return;
        if (!groupedByStudent[sid]) groupedByStudent[sid] = [];
        groupedByStudent[sid].push(s);
      });

      const latestPerStudent = Object.values(groupedByStudent).map(list => {
        return list.reduce((a, b) => {
          const an = a.attemptNumber || 0;
          const bn = b.attemptNumber || 0;
          if (an === bn) {
            const at = new Date(a.submittedAt || a.createdAt || 0).getTime();
            const bt = new Date(b.submittedAt || b.createdAt || 0).getTime();
            return bt > at ? b : a;
          }
          return bn > an ? b : a;
        });
      });

      // Resolve full names for the latest submission per student using public profiles
      const studentIds = latestPerStudent
        .map((s: any) => s.studentId || s.student?.id || s.userId || s.student_id)
        .filter((id: any) => !!id);

      const uniqueIds = Array.from(new Set(studentIds));

      const profilePromises = uniqueIds.map(async (id) => {
        // Try public profile endpoint first, then fallback to user endpoint
        try {
          const profResp = await api.get(`/users/public/${id}`);
          const prof = profResp.data?.result || profResp.data || {};
          const name = prof.fullName || prof.name || prof.username || '';
          if (name) return { id, name };
        } catch (err) {
          // continue to fallback
        }

        try {
          const profResp2 = await api.get(`/users/${id}`);
          const prof2 = profResp2.data?.result || profResp2.data || {};
          const name2 = prof2.fullName || prof2.name || prof2.username || prof2.displayName || '';
          if (name2) return { id, name: name2 };
        } catch (err) {
          // final fallback, return empty name
        }

        return { id, name: '' };
      });

      const profiles = await Promise.all(profilePromises);
      const nameMap: Record<string,string> = Object.fromEntries(profiles.map((p: any) => [p.id, p.name]));

      const submissionsWithNames = latestPerStudent.map((s: any) => {
        const sid = s.studentId || s.student?.id || s.userId || s.student_id;

        // Attempt to derive name from submission payload first
        const embeddedName = s.studentName || s.student?.fullName || s.student?.full_name || s.student?.name || s.user?.fullName || s.user?.name || s.user?.username || s.student?.profile?.fullName || '';

        // Fallback order: embeddedName -> nameMap -> email local part -> id short
        let finalName = embeddedName && String(embeddedName).trim() ? embeddedName : (nameMap[sid] || '');
        if (!finalName && (s.student?.email || s.email)) {
          const em = s.student?.email || s.email;
          finalName = String(em).split('@')[0];
        }
        if (!finalName && sid) finalName = `User ${String(sid).slice(0,8)}`;

        // Log if name still appears generic for debugging
        if (finalName.startsWith('User ')) {
          console.info('TeacherGrading: could not resolve full name for student id', sid);
        }

        return {
          ...s,
          studentId: sid,
          studentName: finalName
        } as SubmissionData;
      });

      // Use latestPerStudent (with resolved names) for teacher grading so teacher sees final submission only
      setSubmissions(submissionsWithNames);
    } catch (error: any) {
      toast({
        title: "Failed to load submissions",
        description: error.response?.data?.message || "Could not load submissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionSelect = (submission: SubmissionData) => {
    setSelectedSubmission(submission);
    setScore(submission.score || 0);
    setFeedback(submission.feedback || "");
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      setIsGrading(true);
      
      // Determine submission id from common fields (id or submissionId)
      const submissionId = selectedSubmission.id || selectedSubmission.submissionId || selectedSubmission.submission_id;
      if (!submissionId) {
        throw new Error('Submission id missing for selected submission');
      }

      const gradingData = {
        submissionId,
        score,
        feedback,
        gradedBy: teacherId,
      };

      await submissionService.gradeSubmission(submissionId, gradingData);
      
      toast({
        title: "Grading saved",
        description: "The submission has been graded successfully.",
      });
      
      // Reload submissions to reflect changes
      await loadSubmissions();
      
      // Update selected submission
      setSelectedSubmission(prev => prev ? {
        ...prev,
        score,
        feedback,
        status: "GRADED"
      } : null);
    } catch (error: any) {
      toast({
        title: "Failed to save grade",
        description: error.response?.data?.message || "Could not save the grade.",
        variant: "destructive",
      });
    } finally {
      setIsGrading(false);
    }
  };

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await fileService.downloadFile(fileId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download file.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (submission: SubmissionData) => {
    switch (submission.status) {
      case "GRADED":
        return <Badge className="bg-green-500">Graded</Badge>;
      case "SUBMITTED":
        return <Badge variant="secondary">Submitted</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getAssignmentStats = () => {
    const total = submissions.length;
    const graded = submissions.filter(s => s.status === "GRADED").length;
    const pending = total - graded;
    const lateSubmissions = submissions.filter(s => s.isLate).length;
    const averageScore = graded > 0 
      ? submissions.filter(s => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / graded 
      : 0;
    
    return { total, graded, pending, lateSubmissions, averageScore };
  };

  const filteredSubmissions = submissions.filter(submission => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!submission.studentName?.toLowerCase().includes(query) &&
          !submission.studentId.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter !== submission.status.toLowerCase()) {
        return false;
      }
    }
    
    return true;
  });

  const selectedHomework = assignments.find(hw => hw.id === selectedAssignment);
  const stats = getAssignmentStats();

  if (isLoading && assignments.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Grade Assignments
          </h1>
          <p className="text-muted-foreground">Review and grade student submissions</p>
        </div>
        <Button onClick={() => navigate("/teacher")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any assignments to grade yet.
            </p>
            <Button onClick={() => navigate("/teacher/create-assignment")}>
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Selection & Submissions List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assignment to grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.title} ({format(new Date(assignment.dueDate), "MMM d")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedHomework && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">{selectedHomework.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{selectedHomework.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Due: {format(new Date(selectedHomework.dueDate), "PPP")}</span>
                      <span>Max Score: {selectedHomework.maxScore}</span>
                      <Badge variant="outline">{selectedHomework.submissionType}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedAssignment && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
                      <div className="text-sm text-muted-foreground">Graded</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.lateSubmissions}</div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Avg Score</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="graded">Graded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Submissions List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Submissions ({filteredSubmissions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredSubmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No submissions found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredSubmissions.map((submission) => (
                          <div
                            key={submission.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedSubmission?.id === submission.id ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => handleSubmissionSelect(submission)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{submission.studentName || `Student ${submission.studentId}`}</h4>
                                  {getStatusBadge(submission)}
                                  {submission.isLate && (
                                    <Badge variant="destructive" className="text-xs">Late</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
                                  </span>
                                  {submission.score !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      {submission.score}/{selectedHomework?.maxScore}
                                    </span>
                                  )}
                                  {submission.files && submission.files.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      {submission.files.length} file(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {submission.status === "GRADED" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Grading Panel */}
          <div className="space-y-6">
            {selectedSubmission ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Grade Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Student</h4>
                    <p>{selectedSubmission.studentName || `Student ${selectedSubmission.studentId}`}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {format(new Date(selectedSubmission.submittedAt), "PPP 'at' p")}
                    </p>
                    {selectedSubmission.isLate && (
                      <Badge variant="destructive" className="mt-1">Late Submission</Badge>
                    )}
                  </div>

                  {selectedSubmission.content && (
                    <div>
                      <h4 className="font-semibold mb-2">Written Response</h4>
                      <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                        <p className="whitespace-pre-wrap text-sm">{selectedSubmission.content}</p>
                      </div>
                    </div>
                  )}

                  {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Submitted Files</h4>
                      <div className="space-y-2">
                        {selectedSubmission.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{file.filename}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(file.id, file.filename)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="score">Score (out of {selectedHomework?.maxScore})</Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max={selectedHomework?.maxScore}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback to the student..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleGradeSubmission}
                    disabled={isGrading}
                    className="w-full"
                  >
                    {isGrading ? "Saving Grade..." : "Save Grade"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a Submission</h3>
                  <p className="text-muted-foreground">
                    Choose a submission from the list to start grading.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}