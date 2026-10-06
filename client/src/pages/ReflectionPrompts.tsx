import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpenCheck, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReflectionPrompts, useReflectionResponses, useCreateReflectionResponse } from "@/hooks/use-reflections";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/LanguageContext";

export default function ReflectionPrompts() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: prompts = [], isLoading: pl } = useReflectionPrompts() as any;
  const { data: responses = [], isLoading: rl } = useReflectionResponses() as any;
  const create = useCreateReflectionResponse();
  const [active, setActive] = useState<any>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e:any) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    create.mutate(
      { promptId: active.id, response: text, date: today },
      {
        onSuccess: () => {
          setText("");
          setActive(null);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t("backToDashboard")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("reflectionsTitle")}</h1>
          <p className="text-muted-foreground">{t("reflectionsSubtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5" />{t("starterPrompts")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t("reflectionsStoredHint")}</p>
          {pl && <Skeleton className="h-16 w-full" />}
          {!pl && prompts.length === 0 && <p className="text-sm text-muted-foreground">{t("noPrompts")}</p>}
          <div className="space-y-2">
            {prompts.map((p:any) => (
              <div key={p.id} className="p-3 border rounded-xl flex justify-between items-center gap-3 hover:border-teal-300 transition-colors">
                <div className="text-sm">{p.prompt}</div>
                <Button size="sm" variant="ghost" onClick={() => { setActive(p); setText(""); }}>
                  {t("reflect")}
                </Button>
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
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t("writeReflectionPlaceholder")}
              />
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={create.isPending || !text.trim()}>
                  <Send className="h-4 w-4 mr-2" />{t("saveReflection")}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setActive(null); setText(""); }}>
                  {t("cancel")}
                </Button>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                {saved && <span className="text-sm text-green-600">{t("reflectionSaved")}</span>}
                {create.isError && <span className="text-sm text-destructive">{t("failedToSave")}</span>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t("yourReflections")}</CardTitle></CardHeader>
        <CardContent>
          {rl && <Skeleton className="h-16 w-full" />}
          {!rl && responses.length === 0 && <p className="text-sm text-muted-foreground">{t("noReflections")}</p>}
          <div className="space-y-2">
            {responses.slice(0,10).map((r:any) => (
              <div key={r.id} className="p-3 border rounded-xl text-sm space-y-1">
                <p>{r.response}</p>
                <p className="text-xs text-muted-foreground">
                  {r.date ? new Date(r.date).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
