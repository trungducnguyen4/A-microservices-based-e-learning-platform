import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  FileText, 
  Search, 
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  Timer,
  BookOpen
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { homeworkService, submissionService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HomeworkData {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionType: "TEXT" | "FILE" | "BOTH";
  allowLateSubmissions: boolean;
  resubmissionAllowed: boolean;
  maxAttempts: number;
  estimatedDurationMinutes?: number;
  status: string;
  classroomId: string;
  classroomName?: string;
}

interface SubmissionStatus {
  homeworkId: string;
  hasSubmission: boolean;
  isGraded: boolean;
  score?: number;
  isLate: boolean;
  attemptNumber: number;
  status: string;
}

type FilterStatus = "all" | "pending" | "submitted" | "graded" | "overdue";
type SortBy = "dueDate" | "title" | "created" | "score";

export default function StudentAssignments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assignments, setAssignments] = useState<HomeworkData[]>([]);
  const [submissions, setSubmissions] = useState<{ [key: string]: SubmissionStatus }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("dueDate");
  const [showFilters, setShowFilters] = useState(false);
  
  // Get student ID from authentication
  const { user } = useAuth();
  const studentId = user?.id || "student-123";

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      
      // Load all published assignments
      const response = await homeworkService.getActiveHomeworksForStudent(studentId);
      const publishedAssignments = response.result || response;
      setAssignments(publishedAssignments);
      
      // Load submission status for each assignment
      const submissionStatuses: { [key: string]: SubmissionStatus } = {};
      await Promise.all(
        publishedAssignments.map(async (homework) => {
          try {
            const submissionResponse = await submissionService.getLatestSubmission(homework.id, studentId);
            const submission = submissionResponse.result;
            
            submissionStatuses[homework.id] = {
              homeworkId: homework.id,
              hasSubmission: !!submission,
              isGraded: submission?.status === "GRADED",
              score: submission?.score,
              isLate: submission?.isLate || false,
              attemptNumber: submission?.attemptNumber || 0,
              status: submission?.status || "NOT_SUBMITTED"
            };
          } catch (error) {
            // No submission found
            submissionStatuses[homework.id] = {
              homeworkId: homework.id,
              hasSubmission: false,
              isGraded: false,
              isLate: false,
              attemptNumber: 0,
              status: "NOT_SUBMITTED"
            };
          }
        })
      );
      
      setSubmissions(submissionStatuses);
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

  const getAssignmentStatus = (homework: HomeworkData) => {
    const submission = submissions[homework.id];
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const isOverdue = isAfter(now, dueDate);
    
    if (submission?.isGraded) return "graded";
    if (submission?.hasSubmission) return "submitted";
    if (isOverdue && !homework.allowLateSubmissions) return "overdue";
    if (isOverdue) return "late";
    return "pending";
  };

  const getStatusBadge = (homework: HomeworkData) => {
    const status = getAssignmentStatus(homework);
    const submission = submissions[homework.id];
    
    switch (status) {
      case "graded":
        return <Badge className="bg-green-500">{submission?.score}/{homework.maxScore}</Badge>;
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "late":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Late Allowed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getUrgencyLevel = (homework: HomeworkData) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return "overdue";
    if (hoursUntilDue < 24) return "urgent";
    if (hoursUntilDue < 72) return "soon";
    return "normal";
  };

  const filteredAndSortedAssignments = assignments
    .filter(homework => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!homework.title.toLowerCase().includes(query) &&
            !homework.description.toLowerCase().includes(query) &&
            !homework.classroomName?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (filterStatus !== "all") {
        const status = getAssignmentStatus(homework);
        if (filterStatus !== status) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "score":
          const scoreA = submissions[a.id]?.score || 0;
          const scoreB = submissions[b.id]?.score || 0;
          return scoreB - scoreA;
        default:
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
    });

  const getStats = () => {
    const total = assignments.length;
    const pending = assignments.filter(hw => getAssignmentStatus(hw) === "pending").length;
    const submitted = assignments.filter(hw => submissions[hw.id]?.hasSubmission).length;
    const graded = assignments.filter(hw => submissions[hw.id]?.isGraded).length;
    const overdue = assignments.filter(hw => getAssignmentStatus(hw) === "overdue").length;
    
    return { total, pending, submitted, graded, overdue };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Assignments</h1>
          <p className="text-muted-foreground">Track your homework and submissions</p>
        </div>
        <Button onClick={() => navigate("/student")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
            <div className="text-sm text-muted-foreground">Submitted</div>
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
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {filteredAndSortedAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all" 
                ? "Try adjusting your filters or search terms."
                : "You don't have any assignments yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedAssignments.map((homework) => {
            const urgency = getUrgencyLevel(homework);
            const submission = submissions[homework.id];
            const status = getAssignmentStatus(homework);
            
            return (
              <Card 
                key={homework.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  urgency === "urgent" ? "border-red-200 bg-red-50/50" : 
                  urgency === "soon" ? "border-orange-200 bg-orange-50/50" : ""
                }`}
                onClick={() => navigate(`/student/assignment/${homework.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-primary truncate pr-2">
                          {homework.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(homework)}
                          {urgency === "urgent" && (
                            <Badge variant="destructive" className="animate-pulse">
                              <Timer className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {homework.description}
                      </p>
                      
                      {homework.classroomName && (
                        <div className="flex items-center gap-1 mb-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{homework.classroomName}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {format(new Date(homework.dueDate), "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{homework.maxScore} points</span>
                        </div>
                        
                        {homework.estimatedDurationMinutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{homework.estimatedDurationMinutes}min</span>
                          </div>
                        )}
                        
                        <Badge variant="outline" className="text-xs">
                          {homework.submissionType}
                        </Badge>
                        
                        {homework.resubmissionAllowed && homework.maxAttempts > 1 && (
                          <span className="text-xs">
                            {submission?.attemptNumber || 0}/{homework.maxAttempts} attempts
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex flex-col items-end gap-2 min-w-0 lg:min-w-[120px]">
                      {submission?.hasSubmission && (
                        <div className="flex items-center gap-1 text-sm">
                          {submission.isGraded ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-muted-foreground">
                            {submission.isGraded ? 'Graded' : 'Submitted'}
                          </span>
                        </div>
                      )}
                      
                      {status === "overdue" && (
                        <div className="text-xs text-red-600 font-medium">
                          Overdue
                        </div>
                      )}
                      
                      {urgency === "urgent" && status === "pending" && (
                        <div className="text-xs text-red-600 font-medium">
                          Due Today!
                        </div>
                      )}
                      
                      {urgency === "soon" && status === "pending" && (
                        <div className="text-xs text-orange-600 font-medium">
                          Due Soon
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}