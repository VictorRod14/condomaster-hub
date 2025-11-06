import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Category {
  slug: string;
  name: string;
  url: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  rating: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const savedCart = localStorage.getItem('marketplace_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-categories`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '30');
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-products?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data?.products || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    let newCart: CartItem[];
    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    
    setCart(newCart);
    localStorage.setItem('marketplace_cart', JSON.stringify(newCart));
    toast.success('Produto adicionado ao carrinho!');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categoryEmoji: Record<string, string> = {
    'groceries': '🥤',
    'beauty': '🧴',
    'home-decoration': '🏠',
    'fragrances': '💐',
    'furniture': '🛋️',
    'sports-accessories': '⚽'
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🛒 Mercadinho do Condomínio
            </h1>
            <p className="text-muted-foreground">
              Compre sem sair de casa! Entrega rápida na sua unidade.
            </p>
          </div>
          <Button
            onClick={() => navigate('/my-orders')}
            size="lg"
            className="relative"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrinho
            {cartItemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                {cartItemCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="🔍 Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer whitespace-nowrap"
          onClick={() => setSelectedCategory('all')}
        >
          Todas
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category.slug}
            variant={selectedCategory === category.slug ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedCategory(category.slug)}
          >
            {categoryEmoji[category.slug] || '📦'} {category.name}
          </Badge>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Mobile: Layout Horizontal | Desktop: Layout Vertical */}
              <div className="flex md:flex-col gap-3 p-3">
                {/* Image Section */}
                <div className="relative bg-muted rounded flex-shrink-0 flex items-center justify-center w-28 h-28 md:w-full md:h-56">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-contain p-2"
                  />
                  <Badge className="absolute top-2 right-2 text-xs">
                    {product.category}
                  </Badge>
                </div>
                
                {/* Content Section */}
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="font-medium text-sm md:text-base mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({product.stock} un.)
                    </span>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      R$ {product.price.toFixed(2)}
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      size="sm"
                      className="w-full h-9"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Cart Summary */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 right-6 bg-card border shadow-lg rounded-lg p-4 min-w-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">🛒 Carrinho</span>
            <Badge>{cartItemCount} itens</Badge>
          </div>
          <div className="text-2xl font-bold text-primary mb-3">
            R$ {cartTotal.toFixed(2)}
          </div>
          <Button onClick={() => navigate('/my-orders')} className="w-full">
            Finalizar Pedido
          </Button>
        </div>
      )}
    </div>
  );
}
