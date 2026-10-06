import { useLocation } from "wouter";
import { ArrowLeft, Compass, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useJournals } from "@/hooks/use-journals";
import { useAuth } from "@/hooks/use-auth";

export default function WellnessJourney() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: moods=[] } = useMoods() as any;
  const { data: journals=[] } = useJournals() as any;
  const milestones = [];
  if (moods.length>=5) milestones.push({label:"Mood tracking milestone", desc:"Logged 5+ moods"});
  if (journals.length>=3) milestones.push({label:"Reflection practice", desc:"3+ journal entries"});
  const insufficient = milestones.length===0;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Wellness Journey</h1><p className="text-muted-foreground">Milestones based on your activity</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5"/>Journey Milestones</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">Continue tracking to unlock milestones.</p>}
          <div className="space-y-2">
            {milestones.map((m,i)=>(
              <div key={i} className="p-2 border rounded"><div className="text-sm font-medium">{m.label}</div><div className="text-xs text-muted-foreground">{m.desc}</div></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
