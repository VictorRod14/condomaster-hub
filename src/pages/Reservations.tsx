import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommonArea {
  id: string;
  name: string;
  description: string;
  max_hours: number;
}

interface Reservation {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
  common_areas: { name: string };
}

const Reservations = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [commonAreas, setCommonAreas] = useState<CommonArea[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommonAreas();
    fetchReservations();
  }, []);

  const fetchCommonAreas = async () => {
    const { data } = await supabase
      .from("common_areas")
      .select("*")
      .eq("active", true);
    if (data) setCommonAreas(data);
  };

  const fetchReservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reservations")
      .select("*, common_areas(name)")
      .eq("user_id", user.id)
      .order("reservation_date", { ascending: false });
    
    if (data) setReservations(data);
  };

  const handleReservation = async () => {
    if (!date || !selectedArea || !startTime || !endTime) {
      toast.error("Preencha todos os campos!");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("condominium_id, unit_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      toast.error("Perfil não encontrado");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        condominium_id: profile.condominium_id,
        unit_id: profile.unit_id,
        common_area_id: selectedArea,
        reservation_date: format(date, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        status: "pendente"
      });

    if (error) {
      toast.error("Erro ao criar reserva");
    } else {
      toast.success("Reserva criada com sucesso!");
      fetchReservations();
      setSelectedArea("");
      setStartTime("");
      setEndTime("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservas</h1>
        <p className="text-muted-foreground">Gerencie suas reservas de áreas comuns</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Nova Reserva
            </CardTitle>
            <CardDescription>Selecione data e área para reservar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                className="rounded-md border pointer-events-auto"
              />
            </div>

            <div className="space-y-2">
              <Label>Área Comum</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  {commonAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleReservation}
              disabled={loading}
            >
              Reservar
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Reservas</CardTitle>
              <CardDescription>Histórico de reservas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma reserva encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {reservation.common_areas.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reservation.status === 'aprovada' ? 'bg-success/20 text-success' :
                          reservation.status === 'pendente' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {reservation.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(reservation.reservation_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {reservation.start_time} - {reservation.end_time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
