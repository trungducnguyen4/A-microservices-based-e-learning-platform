import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// no icon imports needed

export default function CreateCourse() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [startDate, setStartDate] = useState(""); // datetime-local
  const [endDate, setEndDate] = useState(""); // datetime-local
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"none"|"daily"|"weekly"|"monthly"|"custom">("none");
  const [interval, setInterval] = useState<number>(1);
  const [weeklyDays, setWeeklyDays] = useState<Record<string, boolean>>({ MO: false, TU: false, WE: false, TH: false, FR: false, SA: false, SU: false });
  const [customRule, setCustomRule] = useState("");

  function buildRRulePreview(type: "daily"|"weekly"|"monthly"|"none", intervalVal: number, days: Record<string, boolean>) {
    if (type === 'none') return '';
    const parts: string[] = [];
    parts.push(`FREQ=${type === 'daily' ? 'DAILY' : type === 'weekly' ? 'WEEKLY' : 'MONTHLY'}`);
    if (intervalVal && intervalVal > 1) parts.push(`INTERVAL=${intervalVal}`);
    if (type === 'weekly') {
      const byday = Object.keys(days).filter(d => days[d]).join(',');
      if (byday) parts.push(`BYDAY=${byday}`);
    }
    return parts.join(';');
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Tiêu đề khóa học là bắt buộc");
    setLoading(true);
    try {
      // Convert datetime-local (which is local time) to ISO string
      const toIso = (v: string) => v ? new Date(v).toISOString() : undefined;
      // build final recurrenceRule
      const builtRRule = recurrenceType === 'none' ? undefined : (recurrenceType === 'custom' ? (customRule || undefined) : buildRRulePreview(recurrenceType, interval, weeklyDays));
      setRecurrenceRule(builtRRule || "");
      const payload: any = {
        title,
        collaborators: collaborators
          ? collaborators.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        startTime: toIso(startDate),
        endTime: toIso(endDate),
        recurrenceRule: builtRRule || undefined
      };

      // Attach userId (teacher id) from local storage user or token so backend receives canonical id
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id) payload.userId = String(parsed.id);
        } else {
          const token = localStorage.getItem('token');
          if (token) {
            const payloadPart = token.split('.')[1];
            const decoded = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
            payload.userId = decoded.userId || decoded.sub || decoded.id || undefined;
          }
        }
      } catch (err) {
        // fallback: do not block creation if we can't read user id
        console.warn('Could not attach userId to create payload', err);
      }

      const res = await api.post('/schedules/create', payload);
      console.info('Create course response', res.data);
      const created = res.data?.result;
      if (created && created.id) {
        navigate(`/course/${created.id}`);
      } else {
        navigate('/teacher');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Lỗi khi tạo khóa học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Tạo Khóa Học Mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <div>
              <Label>Tiêu đề</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="React và TypeScript Cơ Bản" />
            </div>

            <div>
              <Label>Collaborators (comma separated)</Label>
              <Input value={collaborators} onChange={(e) => setCollaborators(e.target.value)} placeholder="user1,user2@example.com" />
            </div>

            <div>
              <Label>Recurrence (Lặp)</Label>
              <div className="flex gap-2 mt-2">
                <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as any)} className="border rounded px-2 py-1">
                  <option value="none">Không lặp</option>
                  <option value="daily">Hằng ngày</option>
                  <option value="weekly">Hằng tuần</option>
                  <option value="monthly">Hằng tháng</option>
                  <option value="custom">Tùy chỉnh (RRULE)</option>
                </select>
                {recurrenceType !== 'custom' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Mỗi</Label>
                    <Input type="number" value={interval} onChange={(e) => setInterval(Number(e.target.value || 1))} className="w-20" />
                    <span className="text-sm">{recurrenceType === 'daily' ? 'ngày' : recurrenceType === 'weekly' ? 'tuần' : 'tháng'}</span>
                  </div>
                )}
              </div>

              {recurrenceType === 'weekly' && (
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {[
                    ['MO','T2'], ['TU','T3'], ['WE','T4'], ['TH','T5'], ['FR','T6'], ['SA','T7'], ['SU','CN']
                  ].map(([code,label]) => (
                    <label key={code} className={`flex flex-col items-center text-sm border rounded p-2 ${weeklyDays[code as string] ? 'bg-primary/10' : ''}`}>
                      <input type="checkbox" checked={weeklyDays[code as string]} onChange={(e) => {
                        setWeeklyDays(prev => ({ ...prev, [code as string]: e.target.checked }));
                      }} />
                      <span className="mt-1">{label}</span>
                    </label>
                  ))}
                </div>
              )}

              {recurrenceType === 'custom' && (
                <div className="mt-3">
                  <Textarea value={customRule} onChange={(e) => setCustomRule(e.target.value)} placeholder="VD: FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1" />
                </div>
              )}

              <div className="mt-3 text-sm text-muted-foreground">
                <div>Preview RRULE:</div>
                <div className="mt-1 font-mono text-xs bg-muted/20 p-2 rounded">
                  {recurrenceType === 'none' ? '' : recurrenceType === 'custom' ? (customRule || '') : buildRRulePreview(recurrenceType, interval, weeklyDays)}
                </div>
              </div>
              {/* Keep recurrenceRule state in sync with builder */}
              <input type="hidden" value={recurrenceRule} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngày bắt đầu</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* No maxStudents/class code in current backend contract; keep form minimal */}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/teacher')}>Hủy</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo Khóa Học'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}