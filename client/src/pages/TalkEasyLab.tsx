import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FlaskConical, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useExperiments, useCreateExperiment, useUpdateExperiment } from "@/hooks/use-experiments";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/LanguageContext";

export default function TalkEasyLab() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: experiments = [], isLoading } = useExperiments() as any;
  const create = useCreateExperiment();
  const update = useUpdateExperiment();
  const [form, setForm] = useState({ type: "habit", title: "", objective: "", durationDays: "7", target: "" });

  const handleCreate = (e:any) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    create.mutate({
      type: form.type,
      title: form.title,
      objective: form.objective || undefined,
      durationDays: form.durationDays ? Number(form.durationDays) : 7,
      target: form.target ? Number(form.target) : undefined
    }, { onSuccess: () => setForm({ type: "habit", title: "", objective: "", durationDays: "7", target: "" }) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("labTitle")}</h1><p className="text-muted-foreground">{t("labSubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5"/>{t("createExperiment")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
            <Input placeholder={t("titleLabel")} value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} required />
            <Input placeholder="Type (habit/sleep/hydration/reflection)" value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value}))} />
            <Input placeholder={t("durationDaysLabel")} type="number" value={form.durationDays} onChange={e => setForm(f => ({...f,durationDays:e.target.value}))} />
            <Input placeholder={t("targetLabel")} type="number" value={form.target} onChange={e => setForm(f => ({...f,target:e.target.value}))} />
            <div className="md:col-span-2"><Textarea placeholder={t("objectiveLabel")} value={form.objective} onChange={e => setForm(f => ({...f,objective:e.target.value}))} /></div>
            <Button type="submit" disabled={create.isPending} className="md:col-span-2"><Plus className="h-4 w-4 mr-2"/>{t("create")}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("yourExperiments")}</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-16 w-full"/>}
          {!isLoading && experiments.length===0 && <p className="text-sm text-muted-foreground">{t("noExperiments")}</p>}
          <div className="space-y-2">
            {experiments.map((e:any)=>(
              <div key={e.id} className="p-3 border rounded flex justify-between items-center">
                <div><div className="font-medium">{e.title}</div><div className="text-xs text-muted-foreground">{e.type} � {e.durationDays} days � {t("experimentStatus")}: {e.status}</div></div>
                {e.status==='draft' && <Button size="sm" variant="outline" onClick={() => update.mutate({id:e.id,status:'active'})} disabled={update.isPending}>{t("startExperiment")}</Button>}
                {e.status==='active' && <Button size="sm" variant="outline" onClick={() => update.mutate({id:e.id,status:'completed'})} disabled={update.isPending}>{t("completeExperiment")}</Button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
