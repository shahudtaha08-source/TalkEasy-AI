import { useLocation } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";

export default function ThenVsNow() {
  const [, setLocation] = useLocation();
  const { data: moods = [] } = useMoods() as any;
  const sorted = [...moods].sort((a:any,b:any)=>a.date.localeCompare(b.date));
  const first = sorted[0], last = sorted[sorted.length-1];
  const insufficient = sorted.length < 2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Then vs Now</h1><p className="text-muted-foreground">Compare first vs latest mood entry</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Comparison</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">Need at least 2 mood entries.</p>}
          {!insufficient && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">Then ({first.date})</div><div className="text-sm">Mood: {first.mood}</div></div>
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">Now ({last.date})</div><div className="text-sm">Mood: {last.mood}</div></div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Observation only - no causation implied.</p>
        </CardContent>
      </Card>
    </div>
  );
}
