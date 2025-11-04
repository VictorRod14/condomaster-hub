import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Comments } from "@/components/Comments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Occurrence {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const Occurrences = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOccurrences();
  }, []);

  const fetchOccurrences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("occurrences")
      .select("*")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setOccurrences(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category) {
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
      .from("occurrences")
      .insert({
        reporter_id: user.id,
        condominium_id: profile.condominium_id,
        unit_id: profile.unit_id,
        title,
        description,
        category,
        status: "aberta"
      });

    if (error) {
      toast.error("Erro ao criar ocorrência");
    } else {
      toast.success("Ocorrência registrada com sucesso!");
      fetchOccurrences();
      setTitle("");
      setDescription("");
      setCategory("");
      setOpen(false);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aberta":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "em_andamento":
        return <Clock className="h-5 w-5 text-primary" />;
      case "resolvida":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "cancelada":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberta":
        return "Aberta";
      case "em_andamento":
        return "Em Andamento";
      case "resolvida":
        return "Resolvida";
      case "cancelada":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ocorrências</h1>
          <p className="text-muted-foreground">Registre e acompanhe problemas do condomínio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Ocorrência</DialogTitle>
              <DialogDescription>
                Descreva o problema ou situação encontrada
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resumo do problema"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Barulho">Barulho</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o problema"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Registrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {occurrences.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ocorrência registrada</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          occurrences.map((occurrence) => (
            <Card key={occurrence.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(occurrence.status)}
                      {occurrence.title}
                    </CardTitle>
                    <CardDescription>
                      Categoria: {occurrence.category}
                    </CardDescription>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    occurrence.status === 'resolvida' ? 'bg-success/20 text-success' :
                    occurrence.status === 'em_andamento' ? 'bg-primary/20 text-primary' :
                    occurrence.status === 'aberta' ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {getStatusLabel(occurrence.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {occurrence.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span>
                    Criado em: {format(new Date(occurrence.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                  {occurrence.resolved_at && (
                    <span>
                      Resolvido em: {format(new Date(occurrence.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
                
                {/* Seção de Comentários */}
                <Comments itemId={occurrence.id} itemType="occurrence" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Occurrences;
