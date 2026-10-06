import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ firstName: "", lastName: "", city: "", emergencyContact: "" });
  const update = useMutation({
    mutationFn: (data:any) => apiRequest("PATCH", "/api/user", data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/auth/user"] })
  });
  useEffect(() => {
    if (user) setForm({ firstName: user.firstName||"", lastName: user.lastName||"", city: user.city||"", emergencyContact: user.emergencyContact||"" });
  }, [user]);
  const save = (e:any) => { e.preventDefault(); update.mutate(form); };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <div><h1 className="text-3xl font-bold">Profile</h1><p className="text-muted-foreground">Update profile info</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
            <Input placeholder="First name" value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))} />
            <Input placeholder="Last name" value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))} />
            <Input placeholder="City" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} />
            <Input placeholder="Emergency contact" value={form.emergencyContact} onChange={e=>setForm(f=>({...f,emergencyContact:e.target.value}))} />
            <Button type="submit" disabled={update.isPending} className="md:col-span-2">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
