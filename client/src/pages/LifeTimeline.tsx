import { useLocation } from "wouter";
import { ArrowLeft, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJournals } from "@/hooks/use-journals";

export default function LifeTimeline() {
  const [, setLocation] = useLocation();
  const { data: journals = [] } = useJournals() as any;
  const items = [...journals].sort((a:any,b:any)=>b.date.localeCompare(a.date)).slice(0,20);
  const insufficient = journals.length < 2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Life Timeline</h1><p className="text-muted-foreground">Chronological entries (read-only view)</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>Timeline</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">Not enough entries for timeline.</p>}
          <div className="space-y-2">
            {items.map((j:any)=>(
              <div key={j.id} className="p-2 border rounded"><div className="text-xs text-muted-foreground">{j.date}</div><div className="text-sm font-medium">{j.title||'Journal'}</div><div className="text-xs line-clamp-2 text-muted-foreground">{j.content}</div></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
