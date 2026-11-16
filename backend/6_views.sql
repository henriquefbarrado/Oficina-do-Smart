-- =====================================================================
-- views.sql  |  ORDEM DE EXECUÇÃO: 6 de 7
-- Consultas e relatórios. Todas as views usam security_invoker = true:
-- a RLS de quem consulta continua valendo (funcionário só enxerga a própria
-- unidade; admin enxerga tudo). Datas dos relatórios no fuso America/Sao_Paulo.
-- =====================================================================

-- Estoque atual por unidade (estoque individual) -----------------------
create or replace view public.v_stock_by_store with (security_invoker = true) as
select b.store_id, s.name as store_name, s.kind as store_kind,
       b.product_id, p.sku, p.name as product_name, c.name as category_name, p.unit_of_measure,
       b.quantity,
       coalesce(b.min_quantity, p.min_stock) as min_quantity,
       b.quantity < coalesce(b.min_quantity, p.min_stock) as below_minimum,
       b.quantity = 0 as out_of_stock,
       b.updated_at
  from public.stock_balances b
  join public.stores s on s.id = b.store_id
  join public.products p on p.id = b.product_id
  left join public.categories c on c.id = p.category_id
 where p.active;

-- Estoque consolidado (soma das unidades que o usuário pode ver) --------
create or replace view public.v_stock_consolidated with (security_invoker = true) as
select p.id as product_id, p.sku, p.name as product_name, c.name as category_name,
       p.unit_of_measure, p.min_stock,
       coalesce(sum(b.quantity), 0)::integer as total_quantity,
       coalesce(sum(b.quantity) filter (where s.kind = 'central'), 0)::integer as central_quantity,
       coalesce(sum(b.quantity) filter (where s.kind = 'branch'), 0)::integer as branches_quantity
  from public.products p
  left join public.categories c on c.id = p.category_id
  left join public.stock_balances b on b.product_id = p.id
  left join public.stores s on s.id = b.store_id
 where p.active
 group by p.id, c.name;

-- Produtos abaixo do estoque mínimo -------------------------------------
create or replace view public.v_low_stock with (security_invoker = true) as
select * from public.v_stock_by_store where below_minimum;

-- Histórico detalhado de movimentações ----------------------------------
create or replace view public.v_movements_detailed with (security_invoker = true) as
select m.id, m.seq, m.created_at, m.store_id, s.name as store_name,
       m.counterpart_store_id, cs.name as counterpart_store_name,
       m.product_id, p.sku, p.name as product_name,
       m.movement_type, m.quantity_delta, m.balance_before, m.balance_after,
       m.reason, m.reference_type, m.reference_id,
       m.performed_by, u.full_name as performed_by_name
  from public.stock_movements m
  join public.stores s on s.id = m.store_id
  join public.products p on p.id = m.product_id
  left join public.stores cs on cs.id = m.counterpart_store_id
  left join public.profiles u on u.id = m.performed_by;

-- Solicitações pendentes -------------------------------------------------
create or replace view public.v_pending_requests with (security_invoker = true) as
select r.id, r.request_number, r.created_at, r.requesting_store_id, s.name as store_name,
       r.requested_by, u.full_name as requested_by_name, r.notes,
       count(i.id)::integer as items_count,
       coalesce(sum(i.quantity_requested), 0)::integer as units_requested
  from public.stock_requests r
  left join public.stores s on s.id = r.requesting_store_id
  left join public.profiles u on u.id = r.requested_by
  left join public.stock_request_items i on i.request_id = r.id
 where r.status = 'pending'
 group by r.id, s.name, u.full_name;

-- Transferências em trânsito ---------------------------------------------
create or replace view public.v_transfers_in_transit with (security_invoker = true) as
select t.id, t.transfer_number, t.request_id, t.shipped_at,
       t.origin_store_id, o.name as origin_name,
       t.destination_store_id, d.name as destination_name,
       count(i.id)::integer as items_count,
       coalesce(sum(i.quantity), 0)::integer as units
  from public.stock_transfers t
  left join public.stores o on o.id = t.origin_store_id
  left join public.stores d on d.id = t.destination_store_id
  left join public.stock_transfer_items i on i.transfer_id = t.id
 where t.status = 'in_transit'
 group by t.id, o.name, d.name;

-- Consultas com período (parâmetros) ---------------------------------------
-- Entradas e saídas por dia e unidade. p_to é exclusivo.
create or replace function public.report_movements_by_period(
  p_from timestamptz default null, p_to timestamptz default null, p_store_id uuid default null)
returns table (day date, store_id uuid, store_name text, entries integer, exits integer, net integer)
language sql stable set search_path = '' as $$
  select (m.created_at at time zone 'America/Sao_Paulo')::date, m.store_id, s.name,
         coalesce(sum(m.quantity_delta) filter (where m.quantity_delta > 0), 0)::integer,
         coalesce(-sum(m.quantity_delta) filter (where m.quantity_delta < 0), 0)::integer,
         sum(m.quantity_delta)::integer
    from public.stock_movements m
    join public.stores s on s.id = m.store_id
   where (p_store_id is null or m.store_id = p_store_id)
     and (p_from is null or m.created_at >= p_from)
     and (p_to is null or m.created_at < p_to)
   group by 1, 2, 3
   order by 1 desc, 3
$$;

-- Produtos mais utilizados (consumo registrado)
create or replace function public.report_top_used_products(
  p_from timestamptz default null, p_to timestamptz default null,
  p_store_id uuid default null, p_limit integer default 10)
returns table (product_id uuid, sku text, product_name text, units_used integer, usages integer)
language sql stable set search_path = '' as $$
  select m.product_id, p.sku, p.name, (-sum(m.quantity_delta))::integer, count(*)::integer
    from public.stock_movements m
    join public.products p on p.id = m.product_id
   where m.movement_type = 'consumption'
     and (p_store_id is null or m.store_id = p_store_id)
     and (p_from is null or m.created_at >= p_from)
     and (p_to is null or m.created_at < p_to)
   group by m.product_id, p.sku, p.name
   order by 4 desc, 3
   limit least(greatest(coalesce(p_limit, 10), 1), 200)
$$;

-- Movimentações por funcionário
create or replace function public.report_movements_by_employee(
  p_from timestamptz default null, p_to timestamptz default null, p_store_id uuid default null)
returns table (performed_by uuid, employee_name text, movements integer, units_in integer, units_out integer)
language sql stable set search_path = '' as $$
  select m.performed_by, coalesce(u.full_name, '(sem acesso ao nome)'), count(*)::integer,
         coalesce(sum(m.quantity_delta) filter (where m.quantity_delta > 0), 0)::integer,
         coalesce(-sum(m.quantity_delta) filter (where m.quantity_delta < 0), 0)::integer
    from public.stock_movements m
    left join public.profiles u on u.id = m.performed_by
   where (p_store_id is null or m.store_id = p_store_id)
     and (p_from is null or m.created_at >= p_from)
     and (p_to is null or m.created_at < p_to)
   group by m.performed_by, u.full_name
   order by 3 desc
$$;

-- Transferências entre unidades no período (qualquer status)
create or replace function public.report_transfers(
  p_from timestamptz default null, p_to timestamptz default null,
  p_status public.transfer_status default null)
returns table (id uuid, transfer_number bigint, status public.transfer_status, created_at timestamptz,
               shipped_at timestamptz, received_at timestamptz, origin_name text, destination_name text,
               items_count integer, units integer)
language sql stable set search_path = '' as $$
  select t.id, t.transfer_number, t.status, t.created_at, t.shipped_at, t.received_at, o.name, d.name,
         count(i.id)::integer, coalesce(sum(i.quantity), 0)::integer
    from public.stock_transfers t
    left join public.stores o on o.id = t.origin_store_id
    left join public.stores d on d.id = t.destination_store_id
    left join public.stock_transfer_items i on i.transfer_id = t.id
   where (p_status is null or t.status = p_status)
     and (p_from is null or t.created_at >= p_from)
     and (p_to is null or t.created_at < p_to)
   group by t.id, o.name, d.name
   order by t.created_at desc
$$;

-- Permissões ------------------------------------------------------------------
revoke all on public.v_stock_by_store, public.v_stock_consolidated, public.v_low_stock,
              public.v_movements_detailed, public.v_pending_requests, public.v_transfers_in_transit
  from public, anon;
grant select on public.v_stock_by_store, public.v_stock_consolidated, public.v_low_stock,
                public.v_movements_detailed, public.v_pending_requests, public.v_transfers_in_transit
  to authenticated;

revoke all on function public.report_movements_by_period(timestamptz, timestamptz, uuid),
                       public.report_top_used_products(timestamptz, timestamptz, uuid, integer),
                       public.report_movements_by_employee(timestamptz, timestamptz, uuid),
                       public.report_transfers(timestamptz, timestamptz, public.transfer_status)
  from public, anon;
grant execute on function public.report_movements_by_period(timestamptz, timestamptz, uuid),
                          public.report_top_used_products(timestamptz, timestamptz, uuid, integer),
                          public.report_movements_by_employee(timestamptz, timestamptz, uuid),
                          public.report_transfers(timestamptz, timestamptz, public.transfer_status)
  to authenticated;
