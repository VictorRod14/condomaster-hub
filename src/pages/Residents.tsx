import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { toast } from "sonner";

const Residents = () => {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCondominiumId, setUserCondominiumId] = useState<string | null>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's condominium
      const { data: profile } = await supabase
        .from("profiles")
        .select("condominium_id")
        .eq("id", user.id)
        .single();

      if (!profile?.condominium_id) {
        toast.error("Você não está associado a nenhum condomínio");
        setLoading(false);
        return;
      }

      setUserCondominiumId(profile.condominium_id);

      // Fetch residents from the same condominium
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          units(number, block, floor)
        `)
        .eq("condominium_id", profile.condominium_id);

      if (error) throw error;

      setResidents(profiles || []);
    } catch (error: any) {
      toast.error("Erro ao carregar moradores");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moradores</h1>
        <p className="text-muted-foreground">
          Lista de moradores do condomínio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Moradores Cadastrados
          </CardTitle>
          <CardDescription>
            Todos os moradores do seu condomínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : residents.length === 0 ? (
            <p className="text-muted-foreground">Nenhum morador encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Andar</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">{resident.full_name}</TableCell>
                    <TableCell>{resident.units?.number || "-"}</TableCell>
                    <TableCell>{resident.units?.block || "-"}</TableCell>
                    <TableCell>{resident.units?.floor || "-"}</TableCell>
                    <TableCell>{resident.phone || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Residents;
