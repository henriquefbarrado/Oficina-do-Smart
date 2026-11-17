-- ---------------------------------------------------------------------
-- 10) TÉCNICO, FECHAMENTO TÉCNICO E MANUTENÇÃO DE MANETES
--     Só ADICIONA coisas novas: não mexe em nenhuma tabela, função ou
--     regra que já existe. Pode rodar de novo sem perder dados.
-- ---------------------------------------------------------------------

-- 10.1) Perfil de técnico: continua sendo um usuário de loja (mesmas abas e
--       permissões do funcionário), só ganha uma marca a mais.
alter table public.profiles add column if not exists is_technician boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tecnico_nao_admin') then
    alter table public.profiles add constraint tecnico_nao_admin check (not (is_admin and is_technician));
  end if;
end $$;

create or replace function public.is_technician() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_technician from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create or replace function public.admin_set_technician(p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_admin, 'Somente o administrador define o perfil de técnico.');
  perform public._need(not exists(select 1 from public.profiles where id = p_user and is_admin), 'O administrador não pode ser técnico.');
  perform public._need(exists(select 1 from public.profiles where id = p_user), 'Usuário não encontrado.');
  update public.profiles set is_technician = coalesce(p_on, false) where id = p_user;
end $$;

-- 10.2) Fechamento Técnico: 1 registro por preenchimento, data automática
create table if not exists public.tech_closings (
  id bigint generated always as identity primary key,
  closing_date date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  store_id smallint references public.stores(id),
  os_number text not null,
  customer text not null,
  service text not null,
  part_cost numeric(12,2) not null default 0 check (part_cost >= 0),
  charged numeric(12,2) not null default 0 check (charged >= 0),
  supplier text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists tech_closings_date_idx on public.tech_closings(closing_date desc, id desc);

create or replace function public.closing_new(p_os text, p_customer text, p_service text,
  p_part_cost numeric, p_charged numeric, p_supplier text default '')
returns bigint language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); nid bigint;
begin
  perform public._need(a.is_technician, 'Somente o técnico preenche o Fechamento Técnico.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(length(trim(coalesce(p_customer,''))) > 0, 'Informe o cliente.');
  perform public._need(length(trim(coalesce(p_service,''))) > 0, 'Informe o serviço realizado.');
  perform public._need(coalesce(p_part_cost,-1) >= 0, 'Valor da peça inválido.');
  perform public._need(coalesce(p_charged,-1) >= 0, 'Valor cobrado inválido.');
  perform public._need(p_part_cost = 0 or length(trim(coalesce(p_supplier,''))) > 0, 'Informe o fornecedor da peça.');
  insert into public.tech_closings(store_id,os_number,customer,service,part_cost,charged,supplier,created_by,created_by_name)
  values (a.store_id,trim(p_os),trim(p_customer),trim(p_service),p_part_cost,p_charged,trim(coalesce(p_supplier,'')),a.id,a.name)
  returning id into nid;
  return nid;
end $$;

-- 10.3) Manutenção de Manetes: todos veem, só o técnico cria e atualiza
create table if not exists public.controller_repairs (
  id bigint generated always as identity primary key,
  os_number text not null,
  store_id smallint not null references public.stores(id),
  status text not null default 'Aguardando peças'
    check (status in ('Aguardando peças','Sem reparo','Pronta','Enviada para reparo em placa')),
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_by_name text not null default '',
  updated_at timestamptz not null default now(),
  unique (store_id, os_number)
);

create or replace function public.controller_new(p_os text, p_store smallint, p_status text default 'Aguardando peças')
returns bigint language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); nid bigint;
begin
  perform public._need(a.is_technician, 'Somente o técnico cadastra manetes.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione a loja de origem.');
  perform public._need(p_status in ('Aguardando peças','Sem reparo','Pronta','Enviada para reparo em placa'), 'Status inválido.');
  perform public._need(not exists(select 1 from public.controller_repairs where store_id = p_store and os_number = trim(p_os)),
    'Já existe uma manete com a OS '||trim(p_os)||' nesta loja.');
  insert into public.controller_repairs(os_number,store_id,status,created_by,created_by_name,updated_by_name)
  values (trim(p_os),p_store,p_status,a.id,a.name,a.name) returning id into nid;
  return nid;
end $$;

create or replace function public.controller_set_status(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_technician, 'Somente o técnico atualiza o status dos manetes.');
  perform public._need(p_status in ('Aguardando peças','Sem reparo','Pronta','Enviada para reparo em placa'), 'Status inválido.');
  perform public._need(exists(select 1 from public.controller_repairs where id = p_id), 'Manete não encontrada.');
  update public.controller_repairs set status = p_status, updated_by_name = a.name, updated_at = now() where id = p_id;
end $$;

-- 10.4) Segurança: todos os usuários ativos leem; escrita só pelas funções acima
alter table public.tech_closings enable row level security;
alter table public.controller_repairs enable row level security;

drop policy if exists tech_closings_select on public.tech_closings;
create policy tech_closings_select on public.tech_closings for select to authenticated using (public.is_active_user());
drop policy if exists controller_repairs_select on public.controller_repairs;
create policy controller_repairs_select on public.controller_repairs for select to authenticated using (public.is_active_user());

revoke all on public.tech_closings, public.controller_repairs from anon;
revoke insert, update, delete, truncate on public.tech_closings, public.controller_repairs from authenticated;
grant select on public.tech_closings, public.controller_repairs to authenticated;

revoke all on function public.is_technician(), public.is_active_user(), public.admin_set_technician(uuid, boolean),
  public.closing_new(text, text, text, numeric, numeric, text),
  public.controller_new(text, smallint, text), public.controller_set_status(bigint, text) from public, anon;
grant execute on function public.is_technician(), public.is_active_user(), public.admin_set_technician(uuid, boolean),
  public.closing_new(text, text, text, numeric, numeric, text),
  public.controller_new(text, smallint, text), public.controller_set_status(bigint, text) to authenticated;

notify pgrst, 'reload schema';

-- 10.5) Manetes: editar (OS, loja, status) e excluir. Somente o técnico.
create or replace function public.controller_update(p_id bigint, p_os text, p_store smallint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_technician, 'Somente o técnico edita manetes.');
  perform public._need(exists(select 1 from public.controller_repairs where id = p_id), 'Manete não encontrada.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione a loja de origem.');
  perform public._need(p_status in ('Aguardando peças','Sem reparo','Pronta','Enviada para reparo em placa'), 'Status inválido.');
  perform public._need(not exists(select 1 from public.controller_repairs where store_id = p_store and os_number = trim(p_os) and id <> p_id),
    'Já existe uma manete com a OS '||trim(p_os)||' nesta loja.');
  update public.controller_repairs set os_number = trim(p_os), store_id = p_store, status = p_status,
    updated_by_name = a.name, updated_at = now() where id = p_id;
end $$;

create or replace function public.controller_delete(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_technician, 'Somente o técnico exclui manetes.');
  perform public._need(exists(select 1 from public.controller_repairs where id = p_id), 'Manete não encontrada.');
  delete from public.controller_repairs where id = p_id;
end $$;

revoke all on function public.controller_update(bigint, text, smallint, text), public.controller_delete(bigint) from public, anon;
grant execute on function public.controller_update(bigint, text, smallint, text), public.controller_delete(bigint) to authenticated;

notify pgrst, 'reload schema';
