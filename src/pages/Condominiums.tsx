import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

const Condominiums = () => {
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  const fetchCondominiums = async () => {
    try {
      const { data, error } = await supabase
        .from("condominiums")
        .select("*")
        .order("name");

      if (error) throw error;

      setCondominiums(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar condomínios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Condomínios</h1>
        <p className="text-muted-foreground">
          Gerencie todos os condomínios do sistema
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : condominiums.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Nenhum condomínio cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {condominiums.map((condo) => (
            <Card key={condo.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {condo.name}
                </CardTitle>
                <CardDescription>
                  {condo.city}, {condo.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{condo.address}</p>
                  {condo.zip_code && (
                    <p className="text-muted-foreground">CEP: {condo.zip_code}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Condominiums;
