import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Users, UserX } from "lucide-react";
import { toast } from "sonner";

interface Resident {
  id: string;
  full_name: string;
  phone: string;
  unit_id: string;
  units: {
    number: string;
    block: string;
  };
}

export default function ResidentsManagement() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [block, setBlock] = useState("");

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('id', user.id)
        .single();

      if (!profile?.condominium_id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          unit_id,
          units (
            number,
            block
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .not('unit_id', 'is', null);

      if (error) throw error;
      setResidents(data || []);
    } catch (error: any) {
      console.error('Error fetching residents:', error);
      toast.error('Erro ao carregar moradores');
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(resident =>
    resident.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.phone?.includes(searchQuery)
  );

  const activeResidents = residents.length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">👥 Gestão de Moradores</h1>
        <p className="text-muted-foreground">
          Gerencie os moradores do seu condomínio
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Moradores Ativos</p>
              <p className="text-2xl font-bold">{activeResidents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UserX className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Moradores Inativos</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Moradores</p>
              <p className="text-2xl font-bold">{activeResidents}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="🔍 Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-md"
          />
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Morador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Morador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome Completo *</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João da Silva"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bloco</Label>
                    <Input
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      placeholder="A"
                    />
                  </div>
                  <div>
                    <Label>Número da Unidade *</Label>
                    <Input
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="101"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
                  Cadastrar Morador
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Residents Table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Carregando moradores...</p>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum morador encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResidents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {resident.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{resident.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{resident.units?.number || '-'}</TableCell>
                  <TableCell>{resident.units?.block || '-'}</TableCell>
                  <TableCell>{resident.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">Ativo</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
