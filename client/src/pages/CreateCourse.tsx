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
    if (!title.trim()) return setError("Course title is required");
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
      setError(err?.response?.data?.message || err.message || 'Error creating course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-3xl">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Create New Course</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="text-destructive text-xs sm:text-sm p-2 bg-destructive/10 rounded">{error}</div>
            )}

            <div>
              <Label className="text-sm sm:text-base">Title</Label>
              <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="React and TypeScript Basics" />
            </div>

            <div>
              <Label className="text-sm sm:text-base">Collaborators (comma separated)</Label>
              <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" value={collaborators} onChange={(e) => setCollaborators(e.target.value)} placeholder="user1,user2@example.com" />
            </div>

            <div>
              <Label className="text-sm sm:text-base">Recurrence</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
                <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as any)} className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base h-9 sm:h-10">
                  <option value="none">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom (RRULE)</option>
                </select>
                {recurrenceType !== 'custom' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs sm:text-sm">Every</Label>
                    <Input type="number" value={interval} onChange={(e) => setInterval(Number(e.target.value || 1))} className="w-16 sm:w-20 h-9 sm:h-10 text-sm sm:text-base" />
                    <span className="text-xs sm:text-sm">{recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)'}</span>
                  </div>
                )}
              </div>

              {recurrenceType === 'weekly' && (
                <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-2">
                  {[
                    ['MO','Mon'], ['TU','Tue'], ['WE','Wed'], ['TH','Thu'], ['FR','Fri'], ['SA','Sat'], ['SU','Sun']
                  ].map(([code,label]) => (
                    <label key={code} className={`flex flex-col items-center text-xs sm:text-sm border rounded p-1 sm:p-2 cursor-pointer transition-colors ${weeklyDays[code as string] ? 'bg-primary/10 border-primary' : ''}`}>
                      <input type="checkbox" checked={weeklyDays[code as string]} onChange={(e) => {
                        setWeeklyDays(prev => ({ ...prev, [code as string]: e.target.checked }));
                      }} className="mb-1" />
                      <span className="mt-0.5 sm:mt-1">{label}</span>
                    </label>
                  ))}
                </div>
              )}  

              {recurrenceType === 'custom' && (
                <div className="mt-3">
                  <Textarea className="text-xs sm:text-sm" value={customRule} onChange={(e) => setCustomRule(e.target.value)} placeholder="e.g: FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1" />
                </div>
              )}

              <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                <div className="font-medium">Preview RRULE:</div>
                <div className="mt-1.5 font-mono text-xs bg-muted/20 p-2 sm:p-3 rounded break-all">
                  {recurrenceType === 'none' ? '' : recurrenceType === 'custom' ? (customRule || '') : buildRRulePreview(recurrenceType, interval, weeklyDays)}
                </div>
              </div>
              {/* Keep recurrenceRule state in sync with builder */}
              <input type="hidden" value={recurrenceRule} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">Start Date</Label>
                <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm sm:text-base">End Date</Label>
                <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* No maxStudents/class code in current backend contract; keep form minimal */}

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
              <Button className="h-9 sm:h-10 text-sm sm:text-base" type="button" variant="ghost" onClick={() => navigate('/teacher')}>Cancel</Button>
              <Button className="h-9 sm:h-10 text-sm sm:text-base" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Course'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}