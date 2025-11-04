import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommentData {
  id: string;
  comentario: string;
  created_at: string;
  usuario_id: string;
  full_name: string;
  role: string;
}

interface CommentsProps {
  itemId: string;
  itemType: "occurrence" | "announcement";
  title?: string;
}

export const Comments = ({ itemId, itemType }: CommentsProps) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [itemId]);

  const fetchComments = async () => {
    const tableName = itemType === "occurrence" 
      ? "comentarios_ocorrencias" 
      : "comentarios_avisos";
    
    const idColumn = itemType === "occurrence" 
      ? "ocorrencia_id" 
      : "aviso_id";

    const { data: commentsData, error } = await supabase
      .from(tableName as any)
      .select("*")
      .eq(idColumn, itemId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      return;
    }

    // Buscar perfis e roles dos usuários
    const userIds = (commentsData as any[]).map((c: any) => c.usuario_id);
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Combinar os dados
    const enrichedComments = (commentsData as any[]).map((comment: any) => {
      const profile = profiles?.find(p => p.id === comment.usuario_id);
      const userRoles = roles?.filter((r: any) => r.user_id === comment.usuario_id) || [];
      const isAdmin = userRoles.some((r: any) => r.role === 'admin');
      const isSindico = userRoles.some((r: any) => r.role === 'sindico');
      const role = isAdmin ? 'admin' : isSindico ? 'sindico' : 'morador';

      return {
        id: comment.id,
        comentario: comment.comentario,
        created_at: comment.created_at,
        usuario_id: comment.usuario_id,
        full_name: profile?.full_name || 'Usuário',
        role
      };
    });

    setComments(enrichedComments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Digite um comentário!");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const tableName = itemType === "occurrence" 
      ? "comentarios_ocorrencias" 
      : "comentarios_avisos";
    
    const idColumn = itemType === "occurrence" 
      ? "ocorrencia_id" 
      : "aviso_id";

    const insertData: any = {
      [idColumn]: itemId,
      usuario_id: user.id,
      comentario: newComment.trim()
    };

    const { error } = await supabase
      .from(tableName as any)
      .insert([insertData]);

    if (error) {
      console.error("Error creating comment:", error);
      toast.error("Erro ao adicionar comentário");
    } else {
      toast.success("Comentário adicionado!");
      setNewComment("");
      fetchComments();
    }
    setLoading(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500">👑 Admin</Badge>;
      case "sindico":
        return <Badge className="bg-blue-500">🏢 Síndico</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">
          Comentários {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg ${
                comment.role === 'sindico' || comment.role === 'admin'
                  ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {comment.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {comment.full_name}
                    </span>
                    {getRoleBadge(comment.role)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.comentario}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Enviando..." : "Comentar"}
        </Button>
      </form>
    </Card>
  );
};
