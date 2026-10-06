import { useLocation } from "wouter";
import { ArrowLeft, Dna } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";

export default function WellnessDNA() {
  const [, setLocation] = useLocation();
  const { data: moods = [] } = useMoods() as any;
  const moodCount = moods.length;
  const traits = [];
  if (moodCount>=3) traits.push({k:"Emotional tracking", v:"Consistent"});
  if (moodCount>=1) traits.push({k:"Self-awareness", v:"Active"});
  const insufficient = moodCount < 2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div>
          <h1 className="text-3xl font-bold">Wellness DNA</h1>
          <p className="text-muted-foreground">Deterministic summary (no diagnosis)</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Dna className="h-5 w-5"/>Traits</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">Insufficient data. Log more moods.</p>}
          {!insufficient && traits.length===0 && <p className="text-sm text-muted-foreground">No traits derived.</p>}
          <div className="space-y-2">
            {traits.map((t,i)=>(
              <div key={i} className="flex justify-between p-2 border rounded"><span className="text-sm">{t.k}</span><span className="text-sm text-muted-foreground">{t.v}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
