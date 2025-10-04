import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetchUserRole();
    fetchAnnouncements();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
      }
    }
  };

  const fetchAnnouncements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("condominium_id")
      .eq("id", user.id)
      .single();

    if (!profile?.condominium_id) return;

    const { data, error } = await supabase
      .from("announcements")
      .select("*, profiles(full_name)")
      .eq("condominium_id", profile.condominium_id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "destructive";
      case "media":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Avisos e Comunicados</h1>
          <p className="text-muted-foreground">Fique por dentro das novidades</p>
        </div>
        {(userRole === "sindico" || userRole === "admin") && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aviso
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum aviso publicado</p>
            <p className="text-sm text-muted-foreground">
              {userRole === "sindico" || userRole === "admin"
                ? "Publique o primeiro aviso para seus moradores"
                : "Aguarde novos comunicados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Por {announcement.profiles?.full_name || "Administração"} •{" "}
                      {format(new Date(announcement.created_at), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={getPriorityColor(announcement.priority)}>
                    {announcement.priority || "normal"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
