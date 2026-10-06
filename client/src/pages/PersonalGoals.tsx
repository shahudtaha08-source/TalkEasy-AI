import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
export default function PersonalGoals() {
  const [, setLocation]=useLocation();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={()=>setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2"/>Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Personal Goals</h1>
          <p className="text-muted-foreground">Extended from TalkEasy</p>
        </div>
      </div>
      <Card><CardContent className="p-8 text-center text-muted-foreground">Feature scaffold ready.</CardContent></Card>
    </div>
  );
}
