import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingBag, Package, Truck, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  observacoes: string;
  forma_pagamento: string;
  horario_entrega: string;
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [horarioEntrega, setHorarioEntrega] = useState("manha");
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('marketplace_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('morador_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    const newCart = cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(newCart);
    localStorage.setItem('marketplace_cart', JSON.stringify(newCart));
  };

  const removeItem = (id: number) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('marketplace_cart', JSON.stringify(newCart));
    toast.success('Produto removido');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio!');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('id', user.id)
        .single();

      if (!profile?.condominium_id) {
        toast.error('Perfil incompleto. Entre em contato com o síndico.');
        return;
      }

      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { data: order, error: orderError } = await supabase
        .from('pedidos')
        .insert({
          morador_id: user.id,
          condominio_id: profile.condominium_id,
          total,
          observacoes,
          forma_pagamento: formaPagamento,
          horario_entrega: horarioEntrega,
          status: 'recebido'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = cart.map(item => ({
        pedido_id: order.id,
        produto_id: String(item.id),
        quantidade: item.quantity,
        preco_unitario: item.price,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('itens_pedido')
        .insert(items);

      if (itemsError) throw itemsError;

      setCart([]);
      localStorage.removeItem('marketplace_cart');
      setShowCheckout(false);
      toast.success('Pedido realizado com sucesso!');
      fetchOrders();
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error('Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
    recebido: { icon: Package, label: 'Pedido Recebido', color: 'bg-yellow-500' },
    separacao: { icon: ShoppingBag, label: 'Em Separação', color: 'bg-blue-500' },
    entrega: { icon: Truck, label: 'Saiu para Entrega', color: 'bg-purple-500' },
    entregue: { icon: CheckCircle, label: 'Entregue', color: 'bg-green-500' },
    cancelado: { icon: XCircle, label: 'Cancelado', color: 'bg-red-500' }
  };

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/marketplace')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar ao Mercadinho
      </Button>

      <h1 className="text-3xl font-bold mb-6">🛒 Meu Carrinho e Pedidos</h1>

      {/* Cart Section */}
      {cart.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Carrinho de Compras</h2>
          <div className="space-y-4 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    R$ {item.price.toFixed(2)} cada
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    +
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>

            <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                  Finalizar Pedido
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar Pedido</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Horário de Entrega</Label>
                    <Select value={horarioEntrega} onValueChange={setHorarioEntrega}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha">Manhã (8h-12h)</SelectItem>
                        <SelectItem value="tarde">Tarde (12h-18h)</SelectItem>
                        <SelectItem value="noite">Noite (18h-22h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações sobre a entrega..."
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Total:</span>
                      <span className="text-xl font-bold">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processando...' : 'Confirmar Pedido'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Orders History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">📦 Meus Pedidos</h2>
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum pedido realizado ainda</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.status];
              const Icon = config.icon;
              return (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={config.color}>
                      <Icon className="mr-1 h-4 w-4" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">R$ {order.total.toFixed(2)}</p>
                    </div>
                    <Button variant="outline">Ver Detalhes</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
