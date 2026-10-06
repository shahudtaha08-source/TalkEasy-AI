import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FocusMode() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Focus Mode</h1><p className="text-muted-foreground">Calm, distraction-reducing space</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/>Focus Mode</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use existing app features at your pace. This mode preserves all safety behavior.</p>
        </CardContent>
      </Card>
    </div>
  );
}
