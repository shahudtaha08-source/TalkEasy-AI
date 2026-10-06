import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpenCheck, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReflectionPrompts, useReflectionResponses, useCreateReflectionResponse } from "@/hooks/use-reflections";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReflectionPrompts() {
  const [, setLocation] = useLocation();
  const { data: prompts = [], isLoading: pl } = useReflectionPrompts() as any;
  const { data: responses = [], isLoading: rl } = useReflectionResponses() as any;
  const create = useCreateReflectionResponse();
  const [active, setActive] = useState<any>(null);
  const [text, setText] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e:any) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    create.mutate({ promptId: active.id, response: text, date: today }, { onSuccess: () => setText("") });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Reflection Prompts</h1>
          <p className="text-muted-foreground">Write reflections - stored securely</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5" />Prompts</CardTitle></CardHeader>
        <CardContent>
          {(pl || rl) && <Skeleton className="h-16 w-full" />}
          {!pl && prompts.length === 0 && <p className="text-sm text-muted-foreground">No prompts available.</p>}
          <div className="space-y-2">
            {prompts.map((p:any) => (
              <div key={p.id} className="p-2 border rounded flex justify-between items-center">
                <div className="text-sm">{p.prompt}</div>
                <Button size="sm" variant="ghost" onClick={() => setActive(p)}>Reflect</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {active && (
        <Card>
          <CardHeader><CardTitle>{active.prompt}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-2">
              <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your reflection..." />
              <Button type="submit" disabled={create.isPending}><Send className="h-4 w-4 mr-2" />Save</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Your Reflections</CardTitle></CardHeader>
        <CardContent>
          {!rl && responses.length === 0 && <p className="text-sm text-muted-foreground">No reflections yet.</p>}
          <div className="space-y-2">
            {responses.slice(0,10).map((r:any) => (
              <div key={r.id} className="p-2 border rounded text-sm">{r.response}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
