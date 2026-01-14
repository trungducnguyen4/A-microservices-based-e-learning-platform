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
  const [startDate, setStartDate] = useState(""); // date only
  const [startTime, setStartTime] = useState("09:00"); // time only
  const [endDate, setEndDate] = useState(""); // date only
  const [endTime, setEndTime] = useState("11:00"); // time only
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
      // Combine date and time into ISO string
      const toIso = (dateVal: string, timeVal: string) => {
        if (!dateVal) return undefined;
        const dt = new Date(`${dateVal}T${timeVal || '00:00'}`);
        return dt.toISOString();
      };
      // build final recurrenceRule
      const builtRRule = recurrenceType === 'none' ? undefined : (recurrenceType === 'custom' ? (customRule || undefined) : buildRRulePreview(recurrenceType, interval, weeklyDays));
      setRecurrenceRule(builtRRule || "");
      
      // Generate a unique room code for this course
      const generateRoomCode = () => {
        return `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      };
      const roomCode = generateRoomCode();
      
      const payload: any = {
        title,
        collaborators: collaborators
          ? collaborators.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        startTime: toIso(startDate, startTime),
        endTime: toIso(endDate, endTime),
        recurrenceRule: builtRRule || undefined,
        roomCode: roomCode  // Add room code to schedule
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
              <Label className="text-sm sm:text-base font-semibold">Recurrence Pattern</Label>
              <div className="mt-3 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <select 
                    value={recurrenceType} 
                    onChange={(e) => setRecurrenceType(e.target.value as any)} 
                    className="border rounded-md px-3 py-2 text-sm sm:text-base h-10 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom (RRULE)</option>
                  </select>
                  {recurrenceType !== 'none' && recurrenceType !== 'custom' && (
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-md">
                      <Label className="text-xs sm:text-sm whitespace-nowrap">Repeat every</Label>
                      <Input 
                        type="number" 
                        min="1"
                        value={interval} 
                        onChange={(e) => setInterval(Number(e.target.value || 1))} 
                        className="w-16 sm:w-20 h-8 text-sm sm:text-base text-center" 
                      />
                      <span className="text-xs sm:text-sm whitespace-nowrap">
                        {recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)'}
                      </span>
                    </div>
                  )}
                </div>

                {recurrenceType === 'weekly' && (
                  <div className="bg-muted/20 p-4 rounded-lg border">
                    <Label className="text-sm font-medium mb-3 block">Repeat on</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        ['MO','M'], ['TU','T'], ['WE','W'], ['TH','T'], ['FR','F'], ['SA','S'], ['SU','S']
                      ].map(([code,label]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setWeeklyDays(prev => ({ ...prev, [code as string]: !prev[code as string] }))}
                          className={`flex items-center justify-center h-10 w-full text-sm font-medium border-2 rounded-full transition-all ${
                            weeklyDays[code as string] 
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                              : 'bg-background border-muted-foreground/20 hover:border-primary/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}  

                {recurrenceType === 'custom' && (
                  <div className="bg-muted/20 p-4 rounded-lg border">
                    <Label className="text-sm font-medium mb-2 block">Custom RRULE</Label>
                    <Textarea 
                      className="text-sm font-mono min-h-[80px]" 
                      value={customRule} 
                      onChange={(e) => setCustomRule(e.target.value)} 
                      placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter a valid iCalendar RRULE string
                    </p>
                  </div>
                )}

                {recurrenceType !== 'none' && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">RRULE Preview</div>
                        <div className="text-xs font-mono text-blue-800 dark:text-blue-200 bg-white/50 dark:bg-black/20 p-2 rounded break-all">
                          {recurrenceType === 'custom' ? (customRule || 'Enter RRULE above') : buildRRulePreview(recurrenceType, interval, weeklyDays)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Keep recurrenceRule state in sync with builder */}
              <input type="hidden" value={recurrenceRule} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold">Start Date & Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
                    <Input 
                      className="h-10 text-sm" 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Time</Label>
                    <Input 
                      className="h-10 text-sm" 
                      type="time" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-semibold">End Date & Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
                    <Input 
                      className="h-10 text-sm" 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Time</Label>
                    <Input 
                      className="h-10 text-sm" 
                      type="time" 
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)} 
                    />
                  </div>
                </div>
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