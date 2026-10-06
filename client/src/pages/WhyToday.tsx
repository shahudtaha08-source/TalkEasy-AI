import { useLocation } from "wouter";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WhyToday() {
  const [, setLocation] = useLocation();
  const suggestions = [
    "Take a moment to acknowledge one thing that went well today.",
    "Check your hydration and take a short break.",
    "Note one small action you can take for your wellbeing.",
    "Pause for 1 minute of slow breathing."
  ];
  const s = suggestions[new Date().getDay() % suggestions.length];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Why Today</h1><p className="text-muted-foreground">Gentle, deterministic prompt</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5"/>Today's Prompt</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm">{s}</p>
          <p className="text-xs text-muted-foreground mt-2">No judgment or diagnosis - just a gentle nudge.</p>
        </CardContent>
      </Card>
    </div>
  );
}
