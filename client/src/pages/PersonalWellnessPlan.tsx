import { useLocation } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useSleep } from "@/hooks/use-sleep";
import { useHabits } from "@/hooks/use-habits";
import { useWater } from "@/hooks/use-water";

export default function PersonalWellnessPlan() {
  const [, setLocation] = useLocation();
  const { data: moods=[] } = useMoods() as any;
  const { data: sleep=[] } = useSleep() as any;
  const { data: habits=[] } = useHabits() as any;
  const { data: water=[] } = useWater() as any;
  const insufficient = moods.length<2 && sleep.length<2 && habits.length<2 && water.length<2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Personal Wellness Plan</h1><p className="text-muted-foreground">Deterministic plan based on available data</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Plan</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">Add more data for a personalized plan.</p>}
          {!insufficient && (
            <ul className="text-sm space-y-2">
              <li>• Continue tracking mood - consistency supports awareness.</li>
              <li>• Maintain hydration and sleep hygiene where patterns allow.</li>
              <li>• Focus on small, sustainable habit changes.</li>
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-2">Suggestions are rule-based; no diagnosis or medical advice.</p>
        </CardContent>
      </Card>
    </div>
  );
}
