import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { submissionService, fileService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentSubmissions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const studentId = user?.id || "student-123";

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async (page = 0, size = 50) => {
    try {
      setIsLoading(true);
      const res = await submissionService.getSubmissionsByStudent(studentId, page, size);
      const result = res.result || res;
      // result may be a page object
      const items = Array.isArray(result.content) ? result.content : (result || []);
      setSubmissions(items);
    } catch (error: any) {
      toast({ title: "Failed to load submissions", description: error?.response?.data?.message || "Could not load submissions", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const resp = await fileService.downloadFile(fileId);
      const blob = new Blob([resp.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Download failed", description: "Could not download file", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Submissions</h1>
          <p className="text-muted-foreground">Your submitted assignments and feedback</p>
        </div>
        <div>
          <Button variant="outline" onClick={() => navigate('/student/assignments')}>Back to Assignments</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">You haven't submitted any assignments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((s: any) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">{s.homeworkTitle || s.homework?.title || s.homeworkId}</div>
                      <div className="text-xs text-muted-foreground">Submitted: {format(new Date(s.submittedAt || s.createdAt || Date.now()), 'PPP p')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'GRADED' ? (
                      <Badge className="bg-green-500">{s.score}/{s.homeworkMaxScore || '-'}</Badge>
                    ) : s.status === 'SUBMITTED' ? (
                      <Badge variant="secondary">Submitted</Badge>
                    ) : (
                      <Badge variant="outline">{s.status}</Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/student/assignment/${s.homeworkId}`)}>View</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {s.content && (
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Your Response</div>
                    <div className="bg-muted p-3 rounded whitespace-pre-wrap text-sm">{s.content}</div>
                  </div>
                )}

                {s.files && s.files.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Attached Files</div>
                    <div className="space-y-2">
                      {s.files.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div className="text-sm">{f.filename || f.originalName || f.name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => downloadFile(f.id, f.filename || f.originalName || 'file')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.feedback && (
                  <div className="mt-3 bg-green-50 p-3 rounded">
                    <div className="text-sm font-medium">Feedback</div>
                    <div className="text-sm whitespace-pre-wrap">{s.feedback}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
