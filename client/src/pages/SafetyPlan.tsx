import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSafetyPlan, useSaveSafetyPlan } from "@/hooks/use-safety-plan";

export default function SafetyPlan() {
  const [, setLocation] = useLocation();
  const { data: plan, isLoading } = useSafetyPlan() as any;
  const save = useSaveSafetyPlan();
  const [form, setForm] = useState({
    trustedContacts: "",
    safePlaces: "",
    copingStrategies: "",
    groundingTechniques: "",
    reasonsToKeepGoing: "",
    professionalSupport: "",
    emergencyResources: "",
    notes: ""
  });

  useEffect(() => {
    if (plan) {
      setForm({
        trustedContacts: plan.trustedContacts || "",
        safePlaces: plan.safePlaces || "",
        copingStrategies: plan.copingStrategies || "",
        groundingTechniques: plan.groundingTechniques || "",
        reasonsToKeepGoing: plan.reasonsToKeepGoing || "",
        professionalSupport: plan.professionalSupport || "",
        emergencyResources: plan.emergencyResources || "",
        notes: plan.notes || ""
      });
    }
  }, [plan]);

  const handleSave = (e: any) => {
    e.preventDefault();
    save.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Safety Plan</h1>
          <p className="text-muted-foreground">Personal safety plan</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Your Safety Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-3">
            {Object.entries(form).map(([k,v]) => (
              <div key={k}>
                <label className="text-sm font-medium capitalize">{k.replace(/([A-Z])/g, ' ').trim()}</label>
                <Textarea value={v} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <Button type="submit" disabled={save.isPending}><Save className="h-4 w-4 mr-2" />Save Safety Plan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
