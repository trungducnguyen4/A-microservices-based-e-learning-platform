import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const AddStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [studentIds, setStudentIds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Split by comma, semicolon, or newline
      const ids = studentIds.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        setError("No valid student IDs");
        setLoading(false);
        return;
      }
      // Get joinCode from course detail API
      const courseRes = await api.get(`/schedules/${courseId}`);
      const joinCode = courseRes.data?.result?.joinCode || courseRes.data?.joinCode || courseRes.data?.result?.code;
      if (!joinCode) {
        setError("Course join code not found");
        setLoading(false);
        return;
      }
      await Promise.all(ids.map(userId => api.post("/schedules/join", { userId, joinCode })));
      navigate(`/course/${courseId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add students");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Students to Course</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Student IDs (comma, semicolon, or newline separated)</label>
              <Input value={studentIds} onChange={e => setStudentIds(e.target.value)} placeholder="e.g. 123,456,789" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Students"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStudents;
