-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id INTEGER UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  imagem_url TEXT,
  estoque INTEGER DEFAULT 100,
  avaliacao DECIMAL(2,1) DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'separacao', 'entrega', 'entregue', 'cancelado')),
  total DECIMAL(10,2) NOT NULL,
  observacoes TEXT,
  forma_pagamento TEXT NOT NULL,
  horario_entrega TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE IF NOT EXISTS public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de comentários em ocorrências
CREATE TABLE IF NOT EXISTS public.comentarios_ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocorrencia_id UUID NOT NULL REFERENCES public.occurrences(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de comentários em avisos
CREATE TABLE IF NOT EXISTS public.comentarios_avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aviso_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_avisos ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos (todos podem ver)
CREATE POLICY "Todos podem ver produtos"
ON public.produtos FOR SELECT
USING (true);

CREATE POLICY "Admins podem gerenciar produtos"
ON public.produtos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para pedidos
CREATE POLICY "Moradores podem ver seus pedidos"
ON public.pedidos FOR SELECT
USING (morador_id = auth.uid() OR has_role(auth.uid(), 'sindico'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moradores podem criar pedidos"
ON public.pedidos FOR INSERT
WITH CHECK (morador_id = auth.uid());

CREATE POLICY "Síndicos podem atualizar pedidos do condomínio"
ON public.pedidos FOR UPDATE
USING (
  condominio_id IN (
    SELECT condominium_id FROM public.profiles WHERE id = auth.uid()
  ) AND (has_role(auth.uid(), 'sindico'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Políticas para itens do pedido
CREATE POLICY "Ver itens dos próprios pedidos"
ON public.itens_pedido FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE morador_id = auth.uid()
  ) OR has_role(auth.uid(), 'sindico'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Inserir itens nos próprios pedidos"
ON public.itens_pedido FOR INSERT
WITH CHECK (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE morador_id = auth.uid()
  )
);

-- Políticas para comentários em ocorrências
CREATE POLICY "Ver comentários de ocorrências do condomínio"
ON public.comentarios_ocorrencias FOR SELECT
USING (
  ocorrencia_id IN (
    SELECT id FROM public.occurrences WHERE condominium_id IN (
      SELECT condominium_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Criar comentários em ocorrências"
ON public.comentarios_ocorrencias FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- Políticas para comentários em avisos
CREATE POLICY "Ver comentários de avisos do condomínio"
ON public.comentarios_avisos FOR SELECT
USING (
  aviso_id IN (
    SELECT id FROM public.announcements WHERE condominium_id IN (
      SELECT condominium_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Criar comentários em avisos"
ON public.comentarios_avisos FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();