-- =====================================================================
-- rls.sql  |  ORDEM DE EXECUÇÃO: 5 de 7
-- Row Level Security em TODAS as tabelas + privilégios mínimos.
--
-- Regras de ouro:
--  * A identidade vem de auth.uid() + tabela profiles (funções private.*),
--    nunca de dados enviados pelo frontend.
--  * Quem NÃO está ativo em profiles não enxerga nada.
--  * Escrita em estoque, movimentações, solicitações, transferências,
--    devoluções e logs: SOMENTE pelas funções do functions.sql (RPC).
--    O usuário logado não tem INSERT/UPDATE/DELETE nessas tabelas.
-- =====================================================================

alter table public.stores               enable row level security;
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.stock_balances       enable row level security;
alter table public.stock_movements      enable row level security;
alter table public.stock_requests       enable row level security;
alter table public.stock_request_items  enable row level security;
alter table public.stock_transfers      enable row level security;
alter table public.stock_transfer_items enable row level security;
alter table public.stock_returns        enable row level security;
alter table public.activity_logs        enable row level security;

-- ---------------------------------------------------------------------
-- Privilégios (a RLS filtra linhas; o GRANT define o que sequer é tentado)
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon;

grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.stores, public.categories, public.products to authenticated;
grant update on public.profiles to authenticated;   -- o trigger guard_profile limita o que cada um pode mudar

-- ---------------------------------------------------------------------
-- stores: admin e responsável do central veem todas (precisam dos nomes nas
-- solicitações e transferências); os demais veem a própria unidade + o estoque central
-- ---------------------------------------------------------------------
create policy stores_select on public.stores for select to authenticated
  using ((select private.is_admin())
         or (select private.is_stock_manager())
         or ((select private.is_active_user())
             and (id = (select private.user_store_id()) or kind = 'central')));
create policy stores_insert on public.stores for insert to authenticated
  with check ((select private.is_admin()));
create policy stores_update on public.stores for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy stores_delete on public.stores for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- profiles: cada um vê o próprio; admin e responsável do central veem todos;
-- colegas da mesma unidade se veem (para mostrar "quem fez" no histórico).
-- Sem INSERT/DELETE: perfis nascem no cadastro do Auth (trigger) e são removidos junto com o usuário.
-- ---------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid())
         or (select private.is_admin())
         or (select private.is_stock_manager())
         or (store_id is not null and store_id = (select private.user_store_id())));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- ---------------------------------------------------------------------
-- categories / products: leitura para qualquer usuário ativo; escrita só admin
-- ---------------------------------------------------------------------
create policy categories_select on public.categories for select to authenticated
  using ((select private.is_active_user()));
create policy categories_insert on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy categories_update on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_delete on public.categories for delete to authenticated
  using ((select private.is_admin()));

create policy products_select on public.products for select to authenticated
  using ((select private.is_active_user()));
create policy products_insert on public.products for insert to authenticated
  with check ((select private.is_admin()));
create policy products_update on public.products for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy products_delete on public.products for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- stock_balances / stock_movements: somente leitura; admin vê tudo,
-- os demais só a unidade à qual estão vinculados (o responsável do central = Estoque Central)
-- ---------------------------------------------------------------------
create policy stock_balances_select on public.stock_balances for select to authenticated
  using ((select private.is_admin()) or store_id = (select private.user_store_id()));

create policy stock_movements_select on public.stock_movements for select to authenticated
  using ((select private.is_admin()) or store_id = (select private.user_store_id()));

-- ---------------------------------------------------------------------
-- Solicitações: admin e responsável do central veem todas; a loja vê as suas
-- ---------------------------------------------------------------------
create policy stock_requests_select on public.stock_requests for select to authenticated
  using ((select private.is_admin())
         or (select private.is_stock_manager())
         or requesting_store_id = (select private.user_store_id()));

create policy stock_request_items_select on public.stock_request_items for select to authenticated
  using (exists (select 1 from public.stock_requests r where r.id = request_id));

-- ---------------------------------------------------------------------
-- Transferências: admin e responsável do central veem todas; as unidades envolvidas veem as suas
-- ---------------------------------------------------------------------
create policy stock_transfers_select on public.stock_transfers for select to authenticated
  using ((select private.is_admin())
         or (select private.is_stock_manager())
         or origin_store_id = (select private.user_store_id())
         or destination_store_id = (select private.user_store_id()));

create policy stock_transfer_items_select on public.stock_transfer_items for select to authenticated
  using (exists (select 1 from public.stock_transfers t where t.id = transfer_id));

-- ---------------------------------------------------------------------
-- Devoluções
-- ---------------------------------------------------------------------
create policy stock_returns_select on public.stock_returns for select to authenticated
  using ((select private.is_admin())
         or (select private.is_stock_manager())
         or store_id = (select private.user_store_id()));

-- ---------------------------------------------------------------------
-- Auditoria: somente admin lê; ninguém escreve pela API (só os triggers)
-- ---------------------------------------------------------------------
create policy activity_logs_select on public.activity_logs for select to authenticated
  using ((select private.is_admin()));
