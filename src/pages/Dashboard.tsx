import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Megaphone, DollarSign, Calendar, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    announcements: 0,
    pendingPayments: 0,
    reservations: 0,
    occurrences: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*, condominiums(*)")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("condominium_id, unit_id")
      .eq("id", user.id)
      .single();

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!profile || !userRoles || userRoles.length === 0) return;

    // Priority: admin > sindico > morador
    const roles = userRoles.map(r => r.role);
    const userRole = roles.includes('admin') ? 'admin' : 
                     roles.includes('sindico') ? 'sindico' : 
                     'morador';

    // Fetch announcements count
    const { count: announcementsCount } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .eq("condominium_id", profile.condominium_id);

    // Fetch pending payments
    let paymentsQuery = supabase
      .from("financial_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    if (userRole === "morador") {
      paymentsQuery = paymentsQuery.eq("unit_id", profile.unit_id);
    } else {
      paymentsQuery = paymentsQuery.eq("condominium_id", profile.condominium_id);
    }

    const { count: paymentsCount } = await paymentsQuery;

    // Fetch reservations
    let reservationsQuery = supabase
      .from("reservations")
      .select("*", { count: "exact", head: true });

    if (userRole === "morador") {
      reservationsQuery = reservationsQuery.eq("user_id", user.id);
    } else {
      reservationsQuery = reservationsQuery.eq("condominium_id", profile.condominium_id);
    }

    const { count: reservationsCount } = await reservationsQuery;

    // Fetch occurrences
    let occurrencesQuery = supabase
      .from("occurrences")
      .select("*", { count: "exact", head: true })
      .eq("status", "aberta");

    if (userRole === "morador") {
      occurrencesQuery = occurrencesQuery.eq("reporter_id", user.id);
    } else {
      occurrencesQuery = occurrencesQuery.eq("condominium_id", profile.condominium_id);
    }

    const { count: occurrencesCount } = await occurrencesQuery;

    setStats({
      announcements: announcementsCount || 0,
      pendingPayments: paymentsCount || 0,
      reservations: reservationsCount || 0,
      occurrences: occurrencesCount || 0,
    });
  };

  const statsCards = [
    {
      title: "Avisos",
      value: stats.announcements,
      icon: Megaphone,
      description: "Comunicados ativos",
      color: "text-primary",
    },
    {
      title: "Pagamentos",
      value: stats.pendingPayments,
      icon: DollarSign,
      description: "Pendentes",
      color: "text-warning",
    },
    {
      title: "Reservas",
      value: stats.reservations,
      icon: Calendar,
      description: "Reservas ativas",
      color: "text-success",
    },
    {
      title: "Ocorrências",
      value: stats.occurrences,
      icon: AlertCircle,
      description: "Em aberto",
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.full_name || "Usuário"}
        </p>
      </div>

      {profile?.condominiums && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Seu Condomínio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{profile.condominiums.name}</p>
              <p className="text-sm text-muted-foreground">{profile.condominiums.address}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>
            Visão geral das atividades recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use o menu lateral para acessar todas as funcionalidades do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
