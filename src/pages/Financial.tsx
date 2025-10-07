import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

const Financial = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("morador");

  useEffect(() => {
    fetchFinancialRecords();
  }, []);

  const fetchFinancialRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = roles?.map(r => r.role) || [];
      const role = userRoles.includes('admin') ? 'admin' : 
                   userRoles.includes('sindico') ? 'sindico' : 
                   'morador';
      setUserRole(role);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("unit_id, condominium_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      // Fetch financial records based on role
      let query = supabase
        .from("financial_records")
        .select(`
          *,
          units(number, block)
        `)
        .order("due_date", { ascending: false });

      if (role === "morador") {
        query = query.eq("unit_id", profile.unit_id);
      } else {
        query = query.eq("condominium_id", profile.condominium_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRecords(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar registros financeiros");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge variant="default">Pago</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">
          {userRole === "morador" ? "Seus boletos e pagamentos" : "Gestão financeira do condomínio"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registros Financeiros
          </CardTitle>
          <CardDescription>
            {userRole === "morador" ? "Histórico de seus pagamentos" : "Todos os registros financeiros"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : records.length === 0 ? (
            <p className="text-muted-foreground">Nenhum registro encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  {userRole !== "morador" && <TableHead>Unidade</TableHead>}
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.description}</TableCell>
                    {userRole !== "morador" && (
                      <TableCell>
                        {record.units ? `${record.units.number}${record.units.block ? ` - ${record.units.block}` : ''}` : "-"}
                      </TableCell>
                    )}
                    <TableCell>{formatCurrency(record.amount)}</TableCell>
                    <TableCell>{formatDate(record.due_date)}</TableCell>
                    <TableCell>{record.payment_date ? formatDate(record.payment_date) : "-"}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
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

export default Financial;
