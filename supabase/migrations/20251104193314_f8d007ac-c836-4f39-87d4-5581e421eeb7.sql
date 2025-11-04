-- Alterar itens_pedido para usar external_id em vez de UUID
ALTER TABLE public.itens_pedido DROP CONSTRAINT itens_pedido_produto_id_fkey;
ALTER TABLE public.itens_pedido ADD COLUMN produto_external_id INTEGER;
ALTER TABLE public.itens_pedido ADD COLUMN produto_nome TEXT;
ALTER TABLE public.itens_pedido ADD COLUMN produto_imagem TEXT;

-- Atualizar constraint
ALTER TABLE public.itens_pedido ALTER COLUMN produto_id DROP NOT NULL;