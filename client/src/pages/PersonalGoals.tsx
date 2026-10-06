import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Target, CheckCircle2, RotateCcw, Loader2, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-goals";
import { useTranslation } from "@/i18n/LanguageContext";

type Goal = {
  id: number;
  title: string;
  description?: string | null;
  focusArea: string;
  target?: number | null;
  unit?: string | null;
  currentProgress?: number;
  status: string;
  deadline?: string | null;
  completedAt?: string | null;
};

const FOCUS_AREAS = [
  { key: "Sleep", labelKey: "focusSleep" },
  { key: "Mood", labelKey: "focusMood" },
  { key: "Stress", labelKey: "focusStress" },
  { key: "Hydration", labelKey: "focusHydration" },
  { key: "Habits", labelKey: "focusHabits" },
  { key: "Activity", labelKey: "focusActivity" },
  { key: "Reflection", labelKey: "focusReflection" },
  { key: "General wellness", labelKey: "focusGeneral" },
] as const;

const EMPTY_FORM = {
  title: "",
  description: "",
  focusArea: "",
  target: "",
  unit: "",
  currentProgress: "",
  deadline: "",
};

export default function PersonalGoals() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: goals, isLoading } = useGoals() as { data?: Goal[]; isLoading: boolean };
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      description: goal.description || "",
      focusArea: goal.focusArea,
      target: goal.target != null ? String(goal.target) : "",
      unit: goal.unit || "",
      currentProgress: goal.currentProgress != null ? String(goal.currentProgress) : "",
      deadline: goal.deadline ? String(goal.deadline).slice(0, 10) : "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.focusArea) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      focusArea: form.focusArea,
      target: form.target ? Number(form.target) : null,
      unit: form.unit.trim() || null,
      currentProgress: form.currentProgress ? Number(form.currentProgress) : 0,
      deadline: form.deadline || null,
    };
    const onSuccess = () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setOpen(false);
      setEditingId(null);
    };
    if (editingId != null) {
      updateGoal.mutate({ id: editingId, ...payload }, { onSuccess });
    } else {
      createGoal.mutate(payload, { onSuccess });
    }
  };

  const toggleStatus = (goal: Goal) => {
    if (goal.status === "completed") {
      updateGoal.mutate({ id: goal.id, status: "active", completedAt: null });
    } else {
      updateGoal.mutate({ id: goal.id, status: "completed", completedAt: new Date().toISOString() });
    }
  };

  const handleDelete = (goal: Goal) => {
    if (!window.confirm(t("deleteGoalConfirm"))) return;
    deleteGoal.mutate(goal.id);
  };

  const progressPct = (goal: Goal) => {
    if (goal.target && goal.target > 0) {
      return Math.max(0, Math.min(100, Math.round(((goal.currentProgress || 0) / goal.target) * 100)));
    }
    return goal.status === "completed" ? 100 : 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t("backToDashboard")}
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t("goalsTitle")}</h1>
          <p className="text-muted-foreground">{t("goalsSubtitle")}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("createGoal")}</Button>
      </div>

      {saved && <p className="text-sm text-green-600">{t("goalSaved")}</p>}

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId != null ? t("editGoal") : t("createGoal")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium">{t("goalTitleLabel")}</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium">{t("goalDescriptionLabel")}</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("focusAreaLabel")}</label>
                <Select value={form.focusArea} onValueChange={v => setForm(f => ({ ...f, focusArea: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("selectFocusArea")} /></SelectTrigger>
                  <SelectContent>
                    {FOCUS_AREAS.map(a => (
                      <SelectItem key={a.key} value={a.key}>{t(a.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("goalUnitLabel")}</label>
                <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("targetLabel")}</label>
                <Input type="number" step="any" min="0" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("goalCurrentLabel")}</label>
                <Input type="number" step="any" min="0" value={form.currentProgress} onChange={e => setForm(f => ({ ...f, currentProgress: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("goalDeadlineLabel")}</label>
                <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                  <Save className="h-4 w-4 mr-2" /> {t("save")}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}>
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
      ) : !goals || goals.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-2">
            <Target className="h-10 w-10 mx-auto text-teal-500" />
            <p className="text-lg font-semibold">{t("goalNoGoals")}</p>
            <p className="text-sm text-muted-foreground">{t("goalNoGoalsHint")}</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("createGoal")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const pct = progressPct(goal);
            const done = goal.status === "completed";
            return (
              <Card key={goal.id} className={done ? "opacity-80" : ""}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg truncate">{goal.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t(FOCUS_AREAS.find(a => a.key === goal.focusArea)?.labelKey ?? "focusGeneral")}
                        {goal.deadline ? ` · ${t("goalDeadlineLabel")}: ${String(goal.deadline).slice(0, 10)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(goal)} title={done ? t("reopenGoal") : t("markComplete")}>
                        {done ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(goal)} title={t("editGoal")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(goal)} title={t("delete")}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("progressLabel")}</span>
                      <span>
                        {goal.currentProgress ?? 0}{goal.unit ? ` ${goal.unit}` : ""}
                        {goal.target ? ` / ${goal.target}${goal.unit ? ` ${goal.unit}` : ""}` : ""} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${done ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {done ? t("statusCompleted") : goal.status === "paused" ? t("statusPaused") : t("statusActive")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
