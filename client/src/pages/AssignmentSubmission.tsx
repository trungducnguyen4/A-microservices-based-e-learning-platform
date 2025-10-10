import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X
} from "lucide-react";
import { format } from "date-fns";
import { homeworkService, submissionService, fileService, type SubmissionCreationRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HomeworkData {
  id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  submissionType: "TEXT" | "FILE" | "BOTH";
  allowLateSubmissions: boolean;
  resubmissionAllowed: boolean;
  maxAttempts: number;
  estimatedDurationMinutes?: number;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  attachments?: any[];
  status: string;
}

interface SubmissionData {
  id: string;
  content?: string;
  status: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  attemptNumber: number;
  isLate: boolean;
  files?: any[];
}

export default function AssignmentSubmission() {
  const { homeworkId } = useParams<{ homeworkId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [homework, setHomework] = useState<HomeworkData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  
  // Get student ID from authentication
  const { user } = useAuth();
  const studentId = user?.id || "student-123";

  useEffect(() => {
    loadHomeworkData();
  }, [homeworkId]);

  const loadHomeworkData = async () => {
    if (!homeworkId) return;
    
    try {
      setIsLoading(true);
      
      // Load homework details
      const homeworkResponse = await homeworkService.getHomework(homeworkId);
      setHomework(homeworkResponse.result);
      
      // Load existing submission if any
      try {
        const submissionResponse = await submissionService.getLatestSubmission(homeworkId, studentId);
        if (submissionResponse.result) {
          setSubmission(submissionResponse.result);
          setSubmissionText(submissionResponse.result.content || "");
        }
      } catch (error) {
        // No existing submission - this is fine
      }
    } catch (error: any) {
      toast({
        title: "Failed to load assignment",
        description: error.response?.data?.message || "Could not load assignment details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !homework) return;

    setIsSubmitting(true);
    try {
      // Check file types if restricted
      if (homework.allowedFileTypes && homework.allowedFileTypes.length > 0) {
        for (let file of Array.from(files)) {
          if (!homework.allowedFileTypes.includes(file.type)) {
            toast({
              title: "Invalid file type",
              description: `File ${file.name} is not allowed. Please check allowed file types.`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Check file size
      const maxSize = (homework.maxFileSizeMB || 10) * 1024 * 1024;
      for (let file of Array.from(files)) {
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `File ${file.name} exceeds the maximum size limit.`,
            variant: "destructive",
          });
          return;
        }
      }

      const uploadedFiles = await Promise.all(
        Array.from(files).map(file => 
          fileService.uploadFile(file, { 
            type: 'submission-attachment',
            homeworkId: homeworkId,
            studentId: studentId
          })
        )
      );
      
      setSubmissionFiles(prev => [...prev, ...uploadedFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFiles.length} file(s) uploaded`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (fileId: string) => {
    setSubmissionFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!homework || !homeworkId) return;

    // Validate submission based on type
    if (homework.submissionType === "TEXT" && !submissionText) {
      toast({
        title: "Missing content",
        description: "Please enter your submission text.",
        variant: "destructive",
      });
      return;
    }

    if (homework.submissionType === "FILE" && submissionFiles.length === 0) {
      toast({
        title: "Missing files",
        description: "Please upload at least one file.",
        variant: "destructive",
      });
      return;
    }

    if (homework.submissionType === "BOTH" && !submissionText && submissionFiles.length === 0) {
      toast({
        title: "Missing content",
        description: "Please provide either text content or file attachments.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData: SubmissionCreationRequest = {
        homeworkId,
        studentId,
        content: submissionText || undefined,
        attachmentIds: submissionFiles.map(file => file.id),
      };

      await submissionService.createSubmission(submissionData);
      
      toast({
        title: "Submission successful",
        description: "Your assignment has been submitted successfully.",
      });

      // Reload data to show updated submission
      await loadHomeworkData();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.response?.data?.message || "Failed to submit assignment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading assignment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Assignment Not Found</h1>
          <p className="text-muted-foreground mt-2">The assignment you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/student")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(homework.dueDate);
  const canSubmit = homework.status === "PUBLISHED" && 
    (homework.allowLateSubmissions || !isOverdue) &&
    (!submission || (homework.resubmissionAllowed && (submission.attemptNumber < homework.maxAttempts)));

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">{homework.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{homework.description}</p>
              </div>
              
              {homework.instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{homework.instructions}</p>
                  </div>
                </div>
              )}

              {homework.attachments && homework.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Assignment Materials</h3>
                  <div className="space-y-2">
                    {homework.attachments.map((file) => (
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
            </CardContent>
          </Card>

          {/* Submission Area */}
          {canSubmit ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Your Submission
                  {submission && (
                    <Badge variant="secondary">
                      Attempt {submission.attemptNumber + 1}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(homework.submissionType === "TEXT" || homework.submissionType === "BOTH") && (
                  <div>
                    <Label htmlFor="submission-text">Written Response</Label>
                    <Textarea
                      id="submission-text"
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Enter your response here..."
                      rows={8}
                      className="mt-2"
                    />
                  </div>
                )}

                {(homework.submissionType === "FILE" || homework.submissionType === "BOTH") && (
                  <div>
                    <Label>File Attachments</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center mt-2">
                      <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">Drop files here or</p>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => document.getElementById('submission-upload')?.click()}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Uploading...' : 'Choose Files'}
                      </Button>
                      <input
                        id="submission-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                      
                      {homework.allowedFileTypes && homework.allowedFileTypes.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Allowed types: {homework.allowedFileTypes.map(type => {
                            const ext = type.split('/')[1];
                            return ext.toUpperCase();
                          }).join(', ')}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Max size: {homework.maxFileSizeMB || 10} MB per file
                      </p>
                    </div>
                    
                    {submissionFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {submissionFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{file.originalName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Separator />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-32"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            submission && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Your Submission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant={submission.status === "GRADED" ? "default" : "secondary"}>
                        {submission.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Submitted: {format(new Date(submission.submittedAt), "PPP")}
                      </span>
                      {submission.isLate && (
                        <Badge variant="destructive">Late</Badge>
                      )}
                    </div>

                    {submission.content && (
                      <div>
                        <h4 className="font-semibold mb-2">Your Response</h4>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{submission.content}</p>
                        </div>
                      </div>
                    )}

                    {submission.files && submission.files.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Submitted Files</h4>
                        <div className="space-y-2">
                          {submission.files.map((file) => (
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

                    {submission.status === "GRADED" && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <h4 className="font-semibold text-green-700">Graded</h4>
                        </div>
                        <p className="text-green-700">
                          Score: {submission.score} / {homework.maxScore}
                        </p>
                        {submission.feedback && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-green-700">Feedback:</p>
                            <p className="text-green-600 whitespace-pre-wrap">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(homework.dueDate), "PPP")}
                  </p>
                  {isOverdue && (
                    <Badge variant="destructive" className="mt-1">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Score</p>
                  <p className="text-sm text-muted-foreground">{homework.maxScore} points</p>
                </div>
              </div>

              {homework.estimatedDurationMinutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Estimated Time</p>
                    <p className="text-sm text-muted-foreground">{homework.estimatedDurationMinutes} minutes</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Submission Type</p>
                  <p className="text-sm text-muted-foreground">{homework.submissionType}</p>
                </div>
              </div>

              {homework.maxAttempts > 1 && (
                <div>
                  <p className="text-sm font-medium">Attempts</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress 
                      value={submission ? (submission.attemptNumber / homework.maxAttempts) * 100 : 0} 
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {submission ? submission.attemptNumber : 0} / {homework.maxAttempts}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Alert */}
          {!canSubmit && !submission && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    {isOverdue ? "Assignment Overdue" : "Cannot Submit"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOverdue && !homework.allowLateSubmissions
                    ? "Late submissions are not allowed for this assignment."
                    : "This assignment is not available for submission."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}