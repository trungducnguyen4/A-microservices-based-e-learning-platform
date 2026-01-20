import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EditSchedulePage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    recurrenceRule: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    api.get(`/schedules/${scheduleId}`)
      .then(res => {
        const s = res.data.result || res.data;
        setForm({
          title: s.title || "",
          startTime: s.startTime ? s.startTime.slice(0, 16) : "",
          endTime: s.endTime ? s.endTime.slice(0, 16) : "",
          recurrenceRule: s.recurrenceRule || "",
        });
      })
      .catch(() => setError("Could not load schedule info"))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.put(`/schedules/${scheduleId}`, {
        ...form,
        startTime: form.startTime,
        endTime: form.endTime,
        recurrenceRule: form.recurrenceRule,
      });
      navigate("/teacher");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Title</label>
              <Input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">Start Time</label>
              <Input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">End Time</label>
              <Input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">Recurrence Rule</label>
              <Input name="recurrenceRule" value={form.recurrenceRule} onChange={handleChange} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSchedulePage;
