import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Megaphone, DollarSign, Calendar, AlertCircle, Cloud, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    announcements: 0,
    pendingPayments: 0,
    reservations: 0,
    occurrences: 0,
  });
  const [weather, setWeather] = useState<any>(null);
  const [cepInput, setCepInput] = useState("");
  const [cepData, setCepData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchWeather();
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

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      // Tentar obter localização do usuário
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Usar coordenadas para buscar clima
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: latitude, lon: longitude })
              }
            );

            if (response.ok) {
              const data = await response.json();
              setWeather(data);
            }
          },
          async (error) => {
            console.log("Erro de geolocalização, usando cidade do perfil:", error);
            // Fallback: usar cidade do perfil
            const { data: profileData } = await supabase
              .from("profiles")
              .select("condominiums(*)")
              .eq("id", (await supabase.auth.getUser()).data.user?.id)
              .single();

            const city = profileData?.condominiums?.city || "São Paulo";

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city })
              }
            );

            if (response.ok) {
              const data = await response.json();
              setWeather(data);
            }
          }
        );
      } else {
        // Navegador não suporta geolocalização
        const { data: profileData } = await supabase
          .from("profiles")
          .select("condominiums(*)")
          .eq("id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        const city = profileData?.condominiums?.city || "São Paulo";

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city })
          }
        );

        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar clima:", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const searchCep = async () => {
    if (!cepInput) {
      toast.error("Digite um CEP");
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-cep`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cep: cepInput })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCepData(data);
        toast.success("CEP encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Widget de Clima */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Clima Atual
            </CardTitle>
            <CardDescription>
              Informações meteorológicas da sua cidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWeather ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : weather ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{weather.city}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {weather.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{weather.temperature}°C</p>
                    <p className="text-xs text-muted-foreground">
                      Sensação: {weather.feels_like}°C
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Umidade</p>
                    <p className="text-sm font-semibold">{weather.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vento</p>
                    <p className="text-sm font-semibold">{weather.wind_speed} m/s</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pressão</p>
                    <p className="text-sm font-semibold">{weather.pressure} hPa</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar o clima
              </p>
            )}
          </CardContent>
        </Card>

        {/* Widget de CEP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-success" />
              Consulta de CEP
            </CardTitle>
            <CardDescription>
              Busque informações de endereço por CEP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="00000-000"
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  maxLength={9}
                />
                <Button onClick={searchCep} disabled={loadingCep}>
                  {loadingCep ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {cepData && (
                <div className="space-y-2 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Logradouro</p>
                    <p className="text-sm font-semibold">{cepData.logradouro}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Bairro</p>
                      <p className="text-sm font-semibold">{cepData.bairro}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cidade</p>
                      <p className="text-sm font-semibold">{cepData.localidade}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="text-sm font-semibold">{cepData.uf}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
