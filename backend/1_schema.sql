-- =====================================================================
-- 1_schema.sql  |  ORDEM DE EXECUÇÃO: 1 de 7
-- Cria tipos, tabelas, restrições e índices.
-- Escrito para casar exatamente com 2_functions, 3_triggers, 5_rls e 6_views.
-- Rode em um projeto Supabase NOVO (ou limpo). Não rode duas vezes.
-- =====================================================================

create schema if not exists private;   -- funções internas (não expostas pela API)

-- ---------------------------------------------------------------------
-- TIPOS
-- ---------------------------------------------------------------------
create type public.user_role        as enum ('admin', 'stock_manager', 'employee');
create type public.store_kind       as enum ('central', 'branch');
create type public.movement_type    as enum (
  'entry', 'exit', 'consumption', 'adjustment',
  'transfer_out', 'transfer_in', 'return_out', 'return_in');
create type public.request_status   as enum (
  'pending', 'approved', 'partially_approved', 'rejected',
  'cancelled', 'preparing', 'shipped', 'received');
create type public.transfer_status  as enum ('preparing', 'in_transit', 'received', 'cancelled');
create type public.return_status    as enum ('requested', 'received', 'rejected');
create type public.return_condition as enum ('good', 'defective', 'damaged', 'needs_evaluation');

-- ---------------------------------------------------------------------
-- UNIDADES (1 central + N lojas) e CATEGORIAS
-- ---------------------------------------------------------------------
create table public.stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  kind        public.store_kind not null default 'branch',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index stores_name_uidx on public.stores (lower(name));
-- No máximo UM estoque central
create unique index stores_one_central_uidx on public.stores (kind) where kind = 'central';

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index categories_name_uidx on public.categories (lower(name));

-- ---------------------------------------------------------------------
-- PERFIS (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete restrict,
  full_name   text not null check (length(btrim(full_name)) > 0),
  email       text not null,
  role        public.user_role not null default 'employee',
  store_id    uuid references public.stores(id) on delete restrict,
  job_title   text,
  active      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- admin não precisa de unidade; os demais perfis ativos precisam
  constraint profiles_store_required_ck check (role = 'admin' or store_id is not null or not active)
);
create unique index profiles_email_uidx on public.profiles (lower(email));
create index profiles_store_idx on public.profiles (store_id);

-- ---------------------------------------------------------------------
-- PRODUTOS
-- ---------------------------------------------------------------------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  sku              text not null check (length(btrim(sku)) > 0),
  name             text not null check (length(btrim(name)) > 0),
  category_id      uuid references public.categories(id) on delete restrict,
  brand            text,
  compatible_model text,
  description      text,
  unit_of_measure  text not null default 'un',
  min_stock        integer not null default 0 check (min_stock >= 0),
  cost_price       numeric(12,2) not null default 0 check (cost_price >= 0),
  sale_price       numeric(12,2) not null default 0 check (sale_price >= 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index products_sku_uidx on public.products (lower(sku));
create index products_category_idx on public.products (category_id);

-- ---------------------------------------------------------------------
-- SALDOS (só as funções do banco alteram) e MOVIMENTAÇÕES (livro-razão imutável)
-- ---------------------------------------------------------------------
create table public.stock_balances (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete restrict,
  product_id   uuid not null references public.products(id) on delete restrict,
  quantity     integer not null default 0 check (quantity >= 0),   -- nunca negativo
  min_quantity integer check (min_quantity >= 0),                  -- null = usa o mínimo do produto
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (store_id, product_id)
);
create index stock_balances_product_idx on public.stock_balances (product_id);

create table public.stock_movements (
  id                    uuid primary key default gen_random_uuid(),
  seq                   bigint generated always as identity,       -- ordem global
  created_at            timestamptz not null default now(),
  store_id              uuid not null references public.stores(id) on delete restrict,
  counterpart_store_id  uuid references public.stores(id) on delete restrict,
  product_id            uuid not null references public.products(id) on delete restrict,
  movement_type         public.movement_type not null,
  quantity_delta        integer not null check (quantity_delta <> 0),
  balance_before        integer not null check (balance_before >= 0),
  balance_after         integer not null check (balance_after >= 0),
  reason                text,
  reference_type        text,
  reference_id          uuid,
  performed_by          uuid not null references public.profiles(id) on delete restrict,
  idempotency_key       uuid,
  constraint stock_movements_math_ck check (balance_after = balance_before + quantity_delta)
);
create unique index stock_movements_seq_uidx on public.stock_movements (seq);
create index stock_movements_store_prod_idx on public.stock_movements (store_id, product_id, seq desc);
create index stock_movements_created_idx on public.stock_movements (created_at desc);
create index stock_movements_ref_idx on public.stock_movements (reference_type, reference_id);
-- Proteção contra movimentação duplicada (duplo clique / retry)
create unique index stock_movements_idem_uidx on public.stock_movements (performed_by, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------
-- SOLICITAÇÕES (loja -> central)
-- ---------------------------------------------------------------------
create table public.stock_requests (
  id                   uuid primary key default gen_random_uuid(),
  request_number       bigint generated always as identity,
  requesting_store_id  uuid not null references public.stores(id) on delete restrict,
  requested_by         uuid not null references public.profiles(id) on delete restrict,
  status               public.request_status not null default 'pending',
  notes                text check (length(notes) <= 500),
  decided_by           uuid references public.profiles(id) on delete restrict,
  decided_at           timestamptz,
  decision_notes       text,
  idempotency_key      uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create unique index stock_requests_number_uidx on public.stock_requests (request_number);
create unique index stock_requests_idem_uidx on public.stock_requests (requested_by, idempotency_key)
  where idempotency_key is not null;
create index stock_requests_store_status_idx on public.stock_requests (requesting_store_id, status);

create table public.stock_request_items (
  id                  uuid primary key default gen_random_uuid(),
  request_id          uuid not null references public.stock_requests(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete restrict,
  quantity_requested  integer not null check (quantity_requested > 0),
  quantity_approved   integer check (quantity_approved >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (request_id, product_id),
  constraint request_items_approved_ck check (quantity_approved is null or quantity_approved <= quantity_requested)
);
create index stock_request_items_product_idx on public.stock_request_items (product_id);

-- ---------------------------------------------------------------------
-- TRANSFERÊNCIAS (central->loja, loja->loja). Envio e recebimento separados.
-- ---------------------------------------------------------------------
create table public.stock_transfers (
  id                    uuid primary key default gen_random_uuid(),
  transfer_number       bigint generated always as identity,
  request_id            uuid references public.stock_requests(id) on delete restrict,
  origin_store_id       uuid not null references public.stores(id) on delete restrict,
  destination_store_id  uuid not null references public.stores(id) on delete restrict,
  status                public.transfer_status not null default 'preparing',
  notes                 text,
  created_by            uuid not null references public.profiles(id) on delete restrict,
  shipped_by            uuid references public.profiles(id) on delete restrict,
  shipped_at            timestamptz,
  received_by           uuid references public.profiles(id) on delete restrict,
  received_at           timestamptz,
  idempotency_key       uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint stock_transfers_diff_ck check (origin_store_id <> destination_store_id)
);
create unique index stock_transfers_number_uidx on public.stock_transfers (transfer_number);
-- Um pedido só pode ter UMA transferência ativa (não processa duas vezes)
create unique index stock_transfers_request_uidx on public.stock_transfers (request_id)
  where request_id is not null and status <> 'cancelled';
create unique index stock_transfers_idem_uidx on public.stock_transfers (created_by, idempotency_key)
  where idempotency_key is not null;
create index stock_transfers_dest_idx on public.stock_transfers (destination_store_id, status);
create index stock_transfers_origin_idx on public.stock_transfers (origin_store_id, status);

create table public.stock_transfer_items (
  id           uuid primary key default gen_random_uuid(),
  transfer_id  uuid not null references public.stock_transfers(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete restrict,
  quantity     integer not null check (quantity > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (transfer_id, product_id)
);

-- ---------------------------------------------------------------------
-- DEVOLUÇÕES (loja -> central)
-- ---------------------------------------------------------------------
create table public.stock_returns (
  id               uuid primary key default gen_random_uuid(),
  return_number    bigint generated always as identity,
  store_id         uuid not null references public.stores(id) on delete restrict,
  product_id       uuid not null references public.products(id) on delete restrict,
  quantity         integer not null check (quantity > 0),
  reason           text not null check (length(btrim(reason)) > 0),
  condition        public.return_condition not null,
  status           public.return_status not null default 'requested',
  requested_by     uuid not null references public.profiles(id) on delete restrict,
  resolved_by      uuid references public.profiles(id) on delete restrict,
  resolved_at      timestamptz,
  resolution_notes text,
  idempotency_key  uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index stock_returns_number_uidx on public.stock_returns (return_number);
create unique index stock_returns_idem_uidx on public.stock_returns (requested_by, idempotency_key)
  where idempotency_key is not null;
create index stock_returns_store_status_idx on public.stock_returns (store_id, status);

-- ---------------------------------------------------------------------
-- AUDITORIA (imutável; sem FKs de propósito: o log nunca pode bloquear nem ser alterado)
-- ---------------------------------------------------------------------
create table public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  store_id    uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
create index activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);
create index activity_logs_table_idx on public.activity_logs (table_name, record_id);
