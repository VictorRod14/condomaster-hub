import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    full_name: string;
  };
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    getCurrentUser();

    // Set up realtime subscription
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("condominium_id")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("condominium_id", profile.condominium_id)
      .order("created_at", { ascending: true });

    if (!messagesData) return;

    // Fetch sender profiles
    const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
    const { data: sendersData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", senderIds);

    if (!sendersData) return;

    // Map messages with sender data
    const messagesWithSenders = messagesData.map(msg => ({
      ...msg,
      sender: sendersData.find(s => s.id === msg.sender_id) || { full_name: "Usuário Desconhecido" }
    }));

    setMessages(messagesWithSenders);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("condominium_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      toast.error("Perfil não encontrado");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        condominium_id: profile.condominium_id,
        content: newMessage.trim(),
        read: false
      });

    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setNewMessage("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat</h1>
        <p className="text-muted-foreground">Converse com os moradores do condomínio</p>
      </div>

      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100%-5rem)]">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUserId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === currentUserId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="font-semibold text-sm mb-1">
                        {message.sender.full_name}
                      </p>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
