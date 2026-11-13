-- =====================================================================
--  GestPeças — banco de dados (Supabase)
--  Rode este arquivo INTEIRO no SQL Editor. Pode rodar de novo sem medo:
--  ele não apaga dados.
--  ATENÇÃO: este arquivo contém a senha inicial do Patrick. Não suba
--  para um repositório público; troque a senha em Usuários depois do 1º login.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1) TABELAS
-- ---------------------------------------------------------------------
create table if not exists public.stores (
  id smallint primary key,
  name text not null unique,
  kind text not null check (kind in ('central','loja'))
);
insert into public.stores (id,name,kind) values
  (0,'Estoque Central','central'),
  (1,'Buritis','loja'),(2,'Savassi','loja'),(3,'Centro','loja'),
  (4,'Belvedere','loja'),(5,'Castelo','loja')
on conflict (id) do nothing;

-- Perfil de cada login. Só 1 administrador pode existir (índice abaixo).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  store_id smallint references public.stores(id),
  is_admin boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_sem_loja check ((is_admin and store_id is null) or (not is_admin and store_id is not null))
);
create unique index if not exists profiles_um_admin on public.profiles (is_admin) where is_admin;

create table if not exists public.suppliers (
  id bigint generated always as identity primary key,
  name text not null unique,
  company text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Catálogo: cadastra a peça uma vez (fornecedor padrão + valor)
create table if not exists public.catalog (
  id bigint generated always as identity primary key,
  name text not null,
  model text not null,
  supplier_id bigint references public.suppliers(id) on delete set null,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  unique (name, model)
);

create sequence if not exists public.order_seq;
create sequence if not exists public.transfer_seq;

create table if not exists public.orders (
  id text primary key default ('PED-' || lpad(nextval('public.order_seq')::text, 4, '0')),
  store_id smallint not null references public.stores(id),
  part_name text not null,
  model text not null,
  qty int not null check (qty > 0),
  supplier_id bigint references public.suppliers(id) on delete set null,
  supplier_name text not null default '',
  price numeric(12,2) not null default 0,
  est numeric(12,2) not null default 0,
  note text not null default '',
  status text not null default 'Aguardando atendimento',
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  buy_at timestamptz,
  buyer_name text
);

-- Cada peça física tem código próprio (PED-0001-01)
create table if not exists public.units (
  id text primary key,
  order_id text not null references public.orders(id),
  part_name text not null,
  model text not null,
  status text not null,
  loc_store_id smallint not null references public.stores(id),
  origin_store_id smallint not null references public.stores(id),
  cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.unit_trail (
  id bigint generated always as identity primary key,
  unit_id text not null references public.units(id) on delete cascade,
  at timestamptz not null default now(),
  by_name text not null,
  from_status text,
  to_status text,
  note text not null default ''
);

-- Histórico: só recebe inclusão
create table if not exists public.history (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  user_name text not null,
  store_id smallint references public.stores(id),
  related_store_id smallint references public.stores(id),
  part text not null,
  qty int not null default 1,
  kind text not null,
  from_status text,
  to_status text,
  ref text,
  supplier text
);

create table if not exists public.transfers (
  id text primary key default ('TRF-' || lpad(nextval('public.transfer_seq')::text, 4, '0')),
  from_store smallint not null references public.stores(id),
  to_store smallint not null references public.stores(id),
  part_label text not null,
  qty int not null check (qty > 0),
  status text not null default 'Aguardando OK da loja de origem',
  note text not null default '',
  requested_by uuid,
  requested_by_name text not null default '',
  ok_by_name text,
  ok_at timestamptz,
  admin_by_name text,
  created_at timestamptz not null default now(),
  check (from_store <> to_store)
);

-- Manutenções / ordens de serviço (OS) feitas nas lojas
create table if not exists public.maintenances (
  id bigint generated always as identity primary key,
  store_id smallint not null references public.stores(id),
  os_number text not null,
  customer text not null,
  service text not null,
  unit_id text references public.units(id) on delete set null,
  part_used text not null default '',
  charged numeric(12,2) not null default 0 check (charged >= 0),
  part_cost numeric(12,2) not null default 0 check (part_cost >= 0),
  technician text not null,
  profit numeric(12,2) generated always as (charged - part_cost) stored,
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  unique (store_id, os_number)
);
create index if not exists maint_store_idx on public.maintenances(store_id, created_at desc);

create index if not exists units_order_idx on public.units(order_id);
create index if not exists units_loc_idx on public.units(loc_store_id, status);
create index if not exists orders_store_idx on public.orders(store_id);
create index if not exists history_at_idx on public.history(at desc);
create index if not exists history_store_idx on public.history(store_id, related_store_id);
create index if not exists trail_unit_idx on public.unit_trail(unit_id);

-- ---------------------------------------------------------------------
-- 2) FUNÇÕES DE APOIO (usadas pelas regras de acesso)
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.my_store() returns smallint
language sql stable security definer set search_path = public as $$
  select store_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public._need(c boolean, m text) returns void
language plpgsql as $$ begin if not coalesce(c, false) then raise exception '%', m; end if; end $$;

create or replace function public._actor() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid() and active;
  if p.id is null then raise exception 'Sessão inválida ou usuário desativado.'; end if;
  return p;
end $$;

create or replace function public._log(a public.profiles, p_kind text, p_store smallint, p_part text, p_qty int,
  p_from text, p_to text, p_ref text, p_sup text, p_related smallint) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.history(user_id,user_name,store_id,related_store_id,part,qty,kind,from_status,to_status,ref,supplier)
  values (a.id,a.name,p_store,p_related,p_part,p_qty,p_kind,p_from,p_to,p_ref,p_sup);
end $$;

-- Move 1 peça: valida a loja do usuário, grava rastro e histórico
create or replace function public._unit_set(p_id text, p_to text, p_note text, p_loc smallint, p_kind text,
  p_quiet boolean, a public.profiles) returns void
language plpgsql security definer set search_path = public as $$
declare u public.units; old text;
begin
  select * into u from public.units where id = p_id for update;
  if u.id is null then raise exception 'Peça não encontrada.'; end if;
  if not a.is_admin and u.loc_store_id is distinct from a.store_id then
    raise exception 'Sem permissão: esta peça pertence a outra unidade.';
  end if;
  if p_to = 'Utilizada' and u.status <> 'Em estoque da unidade' then
    raise exception 'Peça indisponível nesta unidade ou já utilizada.';
  end if;
  old := u.status;
  insert into public.unit_trail(unit_id,by_name,from_status,to_status,note) values (u.id,a.name,old,p_to,coalesce(p_note,''));
  update public.units set status = p_to, loc_store_id = coalesce(p_loc, loc_store_id) where id = u.id returning * into u;
  if not p_quiet then
    perform public._log(a, p_kind, u.loc_store_id, u.part_name||' '||u.model, 1, old, p_to,
      u.id || case when coalesce(p_note,'') <> '' then ' · '||p_note else '' end, null, u.origin_store_id);
  end if;
end $$;

create or replace function public._tr_avail(p_store smallint, p_label text) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.units
  where loc_store_id = p_store and status = 'Em estoque da unidade' and part_name||' '||model = p_label
$$;

-- ---------------------------------------------------------------------
-- 3) PEDIDOS, COMPRAS E ESTOQUE
-- ---------------------------------------------------------------------
-- (assinaturas antigas removidas para não haver duas versões da mesma função)
drop function if exists public._order_insert(public.profiles, smallint, text, text, int, text);
drop function if exists public.order_new(smallint, text, text, int, text);

create or replace function public._order_insert(a public.profiles, p_store smallint, p_part text, p_model text,
  p_qty int, p_note text, p_supplier_id bigint default null, p_price numeric default null) returns public.orders
language plpgsql security definer set search_path = public as $$
declare c public.catalog%rowtype; sname text; sid bigint; o public.orders;
begin
  perform public._need(p_qty > 0, 'Quantidade inválida');
  perform public._need(coalesce(trim(p_part),'') <> '' and coalesce(trim(p_model),'') <> '', 'Informe peça e modelo.');
  perform public._need(exists(select 1 from public.stores where id = p_store), 'Unidade inválida.');
  perform public._need(a.is_admin or a.store_id = p_store, 'Sem permissão para esta unidade.');
  perform public._need(p_price is null or p_price >= 0, 'Valor da peça inválido.');
  perform public._need(p_supplier_id is null or exists(select 1 from public.suppliers where id = p_supplier_id), 'Fornecedor inválido.');
  select * into c from public.catalog where name = trim(p_part) and model = trim(p_model);
  if c.id is null then
    insert into public.catalog(name, model) values (trim(p_part), trim(p_model))
    on conflict (name, model) do nothing;
    select * into c from public.catalog where name = trim(p_part) and model = trim(p_model);
  end if;
  -- o que a loja escolheu vale para este pedido; o catálogo só preenche o que ficou em branco
  sid := coalesce(p_supplier_id, c.supplier_id);
  select name into sname from public.suppliers where id = sid;
  insert into public.orders(store_id,part_name,model,qty,supplier_id,supplier_name,est,note,created_by,created_by_name)
  values (p_store, trim(p_part), trim(p_model), p_qty, sid, coalesce(sname,''), coalesce(nullif(p_price,0), c.unit_price), coalesce(p_note,''), a.id, a.name)
  returning * into o;
  perform public._log(a,'Solicitação',p_store,o.part_name||' '||o.model,o.qty,'—',o.status,o.id,o.supplier_name,null);
  return o;
end $$;

-- Nova solicitação: fornecedor e valor da peça são opcionais.
-- Quem pede NÃO precisa de aprovação do admin: o pedido já nasce 'Aprovado'.
create or replace function public.order_new(p_store smallint, p_part text, p_model text, p_qty int, p_note text default '',
  p_supplier_id bigint default null, p_price numeric default null)
returns text language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); s smallint; o public.orders;
begin
  s := case when a.is_admin then p_store else a.store_id end;
  perform public._need(exists(select 1 from public.stores where id = s and kind = 'loja'), 'Selecione uma loja.');
  o := public._order_insert(a, s, p_part, p_model, p_qty, p_note, p_supplier_id, p_price);
  update public.orders set status = 'Aprovado' where id = o.id;
  perform public._log(a,'Aprovação',s,o.part_name||' '||o.model,o.qty,'Aguardando atendimento','Aprovado',o.id||' · aprovação automática',null,null);
  return o.id;
end $$;

create or replace function public.order_decide(p_id text, p_ok boolean, p_qty int default null)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); o public.orders;
begin
  perform public._need(a.is_admin, 'Somente o administrador pode aprovar pedidos.');
  select * into o from public.orders where id = p_id for update;
  perform public._need(o.id is not null, 'Pedido não encontrado.');
  perform public._need(o.status = 'Aguardando atendimento', 'Este pedido já foi decidido.');
  if p_ok then
    perform public._need(coalesce(p_qty,0) > 0, 'Quantidade inválida');
    update public.orders set qty = p_qty, status = 'Aprovado' where id = p_id;
  else
    update public.orders set status = 'Rejeitado' where id = p_id;
  end if;
  select * into o from public.orders where id = p_id;
  perform public._log(a,'Aprovação',o.store_id,o.part_name||' '||o.model,o.qty,'Aguardando atendimento',o.status,o.id,null,null);
end $$;

create or replace function public.order_buy(p_id text, p_supplier_id bigint, p_price numeric)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); o public.orders; s public.suppliers; i int; uid text;
begin
  perform public._need(a.is_admin, 'Somente o administrador registra compras.');
  select * into o from public.orders where id = p_id for update;
  perform public._need(o.id is not null, 'Pedido não encontrado.');
  perform public._need(o.status = 'Aprovado', 'Aprove o pedido antes de comprar.');
  perform public._need(coalesce(p_price,0) > 0, 'Valor unitário inválido');
  select * into s from public.suppliers where id = p_supplier_id;
  perform public._need(s.id is not null, 'Fornecedor inválido.');
  update public.orders set supplier_id = s.id, supplier_name = s.name, price = p_price,
         buy_at = now(), buyer_name = a.name, status = 'Comprado' where id = p_id;
  for i in 1..o.qty loop
    uid := o.id || '-' || lpad(i::text, 2, '0');
    insert into public.units(id,order_id,part_name,model,status,loc_store_id,origin_store_id,cost)
    values (uid,o.id,o.part_name,o.model,'Solicitada',0,o.store_id,p_price);
    insert into public.unit_trail(unit_id,by_name,from_status,to_status,note) values (uid,a.name,'—','Solicitada','Compra registrada');
  end loop;
  insert into public.catalog(name,model,supplier_id,unit_price) values (o.part_name,o.model,s.id,p_price)
  on conflict (name,model) do update set supplier_id = excluded.supplier_id, unit_price = excluded.unit_price;
  perform public._log(a,'Compra',o.store_id,o.part_name||' '||o.model,o.qty,'Aprovado','Comprado',
    o.id||' · R$ '||replace(to_char(o.qty*p_price,'FM999999990.00'),'.',','),s.name,null);
end $$;

create or replace function public.order_receive(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); o public.orders; r record;
begin
  perform public._need(a.is_admin, 'Somente o administrador registra recebimentos.');
  select * into o from public.orders where id = p_id for update;
  perform public._need(o.id is not null, 'Pedido não encontrado.');
  perform public._need(o.status = 'Comprado', 'Registre a compra antes do recebimento.');
  for r in select id from public.units where order_id = p_id order by id loop
    perform public._unit_set(r.id,'Recebida','Recebido do fornecedor',0::smallint,'',true,a);
  end loop;
  update public.orders set status = 'Recebido' where id = p_id;
  perform public._log(a,'Recebimento',0::smallint,o.part_name||' '||o.model,o.qty,'Solicitada','Recebida',o.id,o.supplier_name,o.store_id);
end $$;

create or replace function public.order_deliver(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); o public.orders; r record;
begin
  perform public._need(a.is_admin, 'Somente o administrador entrega peças.');
  select * into o from public.orders where id = p_id for update;
  perform public._need(o.id is not null, 'Pedido não encontrado.');
  perform public._need(o.store_id <> 0, 'Entrada do estoque central não é entregue a loja.');
  perform public._need(o.status = 'Recebido', 'Registre o recebimento antes da entrega.');
  for r in select id from public.units where order_id = p_id and status = 'Recebida' order by id loop
    perform public._unit_set(r.id,'Em estoque da unidade','Entrega à loja',o.store_id,'',true,a);
  end loop;
  update public.orders set status = 'Entregue' where id = p_id;
  perform public._log(a,'Transferência',o.store_id,o.part_name||' '||o.model,o.qty,'Recebida','Em estoque da unidade',o.id,null,null);
end $$;

-- EXCLUIR pedido (poder total do admin, em qualquer status).
-- Apaga também as peças físicas do pedido e o rastro delas; o histórico fica registrado.
create or replace function public.order_delete(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); o public.orders;
begin
  perform public._need(a.is_admin, 'Somente o administrador exclui pedidos.');
  select * into o from public.orders where id = p_id for update;
  perform public._need(o.id is not null, 'Pedido não encontrado.');
  delete from public.units where order_id = p_id;
  delete from public.orders where id = p_id;
  perform public._log(a,'Exclusão',o.store_id,o.part_name||' '||o.model,o.qty,o.status,'Excluído',o.id,o.supplier_name,null);
end $$;

-- ENTRADA de peças no estoque central (fornecedor + valor)
create or replace function public.stock_entry(p_catalog_id bigint, p_qty int, p_supplier_id bigint, p_price numeric)
returns text language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); c public.catalog; o public.orders;
begin
  perform public._need(a.is_admin, 'Somente o administrador registra entradas.');
  select * into c from public.catalog where id = p_catalog_id;
  perform public._need(c.id is not null, 'Peça não encontrada no catálogo.');
  o := public._order_insert(a, 0::smallint, c.name, c.model, p_qty, 'Entrada avulsa');
  perform public.order_decide(o.id, true, p_qty);
  perform public.order_buy(o.id, p_supplier_id, p_price);
  perform public.order_receive(o.id);
  return o.id;
end $$;

-- SAÍDA do estoque central para uma loja
create or replace function public.stock_exit(p_catalog_id bigint, p_qty int, p_dest smallint, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); c public.catalog; n int; r record;
begin
  perform public._need(a.is_admin, 'Somente o administrador registra saídas do estoque central.');
  perform public._need(exists(select 1 from public.stores where id = p_dest and kind = 'loja'), 'Selecione a loja de destino.');
  select * into c from public.catalog where id = p_catalog_id;
  perform public._need(c.id is not null, 'Peça não encontrada no catálogo.');
  select count(*) into n from public.units
   where loc_store_id = 0 and status in ('Recebida','Devolvida','Disponível') and part_name = c.name and model = c.model;
  perform public._need(p_qty > 0 and p_qty <= n, 'Saída maior que o estoque central disponível ('||n||').');
  for r in select id from public.units
            where loc_store_id = 0 and status in ('Recebida','Devolvida','Disponível') and part_name = c.name and model = c.model
            order by id limit p_qty loop
    perform public._unit_set(r.id,'Em estoque da unidade',coalesce(nullif(p_note,''),'Saída do estoque central'),p_dest,'Transferência',false,a);
  end loop;
end $$;

-- Utilizar, devolver, manutenção, descarte (cada loja só mexe nas peças dela)
create or replace function public.unit_action(p_id text, p_action text, p_note text default '', p_extra text default '', p_dest smallint default null)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); u public.units; cav boolean; inm boolean; ins boolean;
begin
  select * into u from public.units where id = p_id;
  perform public._need(u.id is not null, 'Peça não encontrada.');
  ins := u.status = 'Em estoque da unidade';
  cav := u.loc_store_id = 0 and u.status in ('Recebida','Devolvida','Disponível');
  inm := u.status in ('Aguardando manutenção','Em manutenção');
  if p_action = 'use' then
    perform public._need(ins, 'Só é possível utilizar peça disponível no estoque da unidade.');
    perform public._unit_set(p_id,'Utilizada',p_note,null,'Utilização',false,a);
  elsif p_action = 'ret' then
    perform public._need(ins, 'Só é possível devolver peça que está no estoque da unidade.');
    perform public._unit_set(p_id,'Devolvida',p_note||' ('||coalesce(p_extra,'')||')',0::smallint,'Devolução',false,a);
  elsif p_action = 'tr' then
    perform public._need(cav, 'Entre lojas: use o menu Transferências.');
    perform public._need(exists(select 1 from public.stores where id = p_dest and kind = 'loja'), 'Selecione a loja de destino.');
    perform public._unit_set(p_id,'Em estoque da unidade','De Estoque Central · '||coalesce(p_note,''),p_dest,'Transferência',false,a);
  elsif p_action = 'mnt' then
    perform public._need(ins or cav, 'Operação não permitida para o status atual da peça.');
    perform public._unit_set(p_id,'Aguardando manutenção','Téc.: '||coalesce(p_extra,'')||' · '||coalesce(p_note,''),null,'Manutenção',false,a);
  elsif p_action = 'mn2' then
    perform public._need(inm, 'Operação não permitida para o status atual da peça.');
    if p_extra = 'em' then perform public._unit_set(p_id,'Em manutenção',p_note,null,'Manutenção',false,a);
    elsif p_extra = 'c' then perform public._unit_set(p_id,'Disponível',p_note,0::smallint,'Manutenção',false,a);
    elsif p_extra = 'l' then
      perform public._need(u.loc_store_id <> 0, 'Peça sem loja de origem: use estoque central.');
      perform public._unit_set(p_id,'Em estoque da unidade',p_note,null,'Manutenção',false,a);
    elsif p_extra = 'x' then perform public._unit_set(p_id,'Descartada',p_note,null,'Descarte',false,a);
    else raise exception 'Resultado inválido.'; end if;
  elsif p_action = 'ds' then
    perform public._need(cav or inm, 'Operação não permitida para o status atual da peça.');
    perform public._unit_set(p_id,'Descartada',p_note,null,'Descarte',false,a);
  else
    raise exception 'Ação inválida.';
  end if;
end $$;

-- Editar o status de uma peça (ex.: tela iPhone 11 -> Utilizada)
--  * admin: qualquer status, em qualquer peça (e pode informar a loja ao colocar em estoque da unidade)
--  * loja: só alterna 'Em estoque da unidade' <-> 'Utilizada' nas peças da própria loja
create or replace function public.unit_set_status(p_id text, p_status text, p_note text default '', p_store smallint default null)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); u public.units; loc smallint;
begin
  perform public._need(p_status in ('Solicitada','Recebida','Em estoque da unidade','Utilizada','Devolvida','Disponível',
    'Aguardando manutenção','Em manutenção','Descartada'), 'Status inválido.');
  select * into u from public.units where id = p_id for update;
  perform public._need(u.id is not null, 'Peça não encontrada.');
  perform public._need(a.is_admin or (u.loc_store_id = a.store_id
    and p_status in ('Em estoque da unidade','Utilizada') and u.status in ('Em estoque da unidade','Utilizada')),
    'Sem permissão para alterar o status desta peça.');
  perform public._need(u.status <> p_status, 'A peça já está com esse status.');
  loc := u.loc_store_id;
  if p_status in ('Solicitada','Recebida','Devolvida','Disponível') then
    loc := 0;
  elsif p_status = 'Em estoque da unidade' then
    if a.is_admin and p_store is not null then
      perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione uma loja válida.');
      loc := p_store;
    end if;
    perform public._need(loc <> 0, 'Informe a loja em que a peça ficará.');
  end if;
  insert into public.unit_trail(unit_id,by_name,from_status,to_status,note)
  values (u.id, a.name, u.status, p_status, 'Status editado' || case when coalesce(p_note,'') <> '' then ' · '||p_note else '' end);
  update public.units set status = p_status, loc_store_id = loc where id = u.id;
  perform public._log(a,'Edição de status',loc,u.part_name||' '||u.model,1,u.status,p_status,
    u.id || case when coalesce(p_note,'') <> '' then ' · '||p_note else '' end,null,u.origin_store_id);
end $$;

-- ---------------------------------------------------------------------
-- 4) TRANSFERÊNCIA ENTRE LOJAS
--    loja destino solicita -> SOMENTE a loja de origem dá o OK -> admin aprova
-- ---------------------------------------------------------------------
create or replace function public.transfer_new(p_from smallint, p_part text, p_qty int, p_to smallint default null, p_note text default '')
returns text language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); dest smallint; t public.transfers; n int;
begin
  dest := case when a.is_admin then p_to else a.store_id end;
  perform public._need(dest is not null and p_from is not null, 'Informe origem e destino.');
  perform public._need(p_from <> dest, 'Origem e destino devem ser diferentes.');
  perform public._need((select count(*) from public.stores where id in (p_from,dest) and kind = 'loja') = 2, 'Selecione lojas válidas.');
  perform public._need(coalesce(p_qty,0) > 0, 'Quantidade inválida');
  n := public._tr_avail(p_from, p_part);
  perform public._need(n >= p_qty, 'A loja de origem só tem '||n||' disponível.');
  insert into public.transfers(from_store,to_store,part_label,qty,note,requested_by,requested_by_name)
  values (p_from,dest,p_part,p_qty,coalesce(p_note,''),a.id,a.name) returning * into t;
  perform public._log(a,'Transferência',dest,t.part_label,t.qty,'—',t.status,t.id,null,p_from);
  return t.id;
end $$;

create or replace function public.transfer_ok(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); t public.transfers;
begin
  select * into t from public.transfers where id = p_id for update;
  perform public._need(t.id is not null, 'Transferência não encontrada.');
  perform public._need(t.status = 'Aguardando OK da loja de origem' and not a.is_admin and a.store_id = t.from_store,
    'Somente a loja de origem ('||(select name from public.stores where id = t.from_store)||') pode dar o OK.');
  perform public._need(public._tr_avail(t.from_store, t.part_label) >= t.qty, 'Saldo insuficiente na origem.');
  update public.transfers set ok_by_name = a.name, ok_at = now(), status = 'Aguardando aprovação do admin' where id = p_id;
  perform public._log(a,'Transferência',t.from_store,t.part_label,t.qty,t.status,'Aguardando aprovação do admin',t.id,null,t.to_store);
end $$;

create or replace function public.transfer_reject(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); t public.transfers;
begin
  select * into t from public.transfers where id = p_id for update;
  perform public._need(t.id is not null, 'Transferência não encontrada.');
  perform public._need((t.status = 'Aguardando OK da loja de origem' and not a.is_admin and a.store_id = t.from_store)
    or (t.status = 'Aguardando aprovação do admin' and a.is_admin), 'Sem permissão para rejeitar.');
  update public.transfers set status = 'Rejeitada' where id = p_id;
  perform public._log(a,'Transferência',
    case when t.status = 'Aguardando OK da loja de origem' then t.from_store else t.to_store end,
    t.part_label,t.qty,t.status,'Rejeitada',t.id,null,
    case when t.status = 'Aguardando OK da loja de origem' then t.to_store else t.from_store end);
end $$;

create or replace function public.transfer_approve(p_id text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); t public.transfers; r record;
begin
  select * into t from public.transfers where id = p_id for update;
  perform public._need(t.id is not null, 'Transferência não encontrada.');
  perform public._need(a.is_admin and t.status = 'Aguardando aprovação do admin', 'Somente o administrador aprova (após o OK da origem).');
  perform public._need(public._tr_avail(t.from_store, t.part_label) >= t.qty, 'Saldo insuficiente na origem.');
  for r in select id from public.units
            where loc_store_id = t.from_store and status = 'Em estoque da unidade' and part_name||' '||model = t.part_label
            order by id limit t.qty loop
    perform public._unit_set(r.id,'Em estoque da unidade','Transferência '||t.id,t.to_store,'',true,a);
  end loop;
  update public.transfers set status = 'Concluída', admin_by_name = a.name where id = p_id;
  perform public._log(a,'Transferência',t.from_store,t.part_label,t.qty,'Em estoque da unidade','Saída para '||(select name from public.stores where id = t.to_store),t.id,null,t.to_store);
  perform public._log(a,'Transferência',t.to_store,t.part_label,t.qty,'Saída de '||(select name from public.stores where id = t.from_store),'Em estoque da unidade',t.id,null,t.from_store);
end $$;

-- ---------------------------------------------------------------------
-- 4B) MANUTENÇÕES (OS): cadastro, edição, exclusão e totais
--     lucro = valor cobrado - valor pago na peça
-- ---------------------------------------------------------------------
create or replace function public.maintenance_new(p_os text, p_customer text, p_service text, p_charged numeric,
  p_technician text, p_store smallint default null, p_unit_id text default null, p_part text default '', p_part_cost numeric default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); s smallint; u public.units; lbl text; cost numeric; mid bigint;
begin
  s := case when a.is_admin then p_store else a.store_id end;
  perform public._need(exists(select 1 from public.stores where id = s and kind = 'loja'), 'Selecione a loja.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(length(trim(coalesce(p_customer,''))) > 0, 'Informe o cliente.');
  perform public._need(length(trim(coalesce(p_service,''))) > 0, 'Informe o serviço realizado.');
  perform public._need(length(trim(coalesce(p_technician,''))) > 0, 'Informe o técnico.');
  perform public._need(coalesce(p_charged,-1) >= 0, 'Valor cobrado inválido.');
  perform public._need(p_part_cost is null or p_part_cost >= 0, 'Valor pago na peça inválido.');
  perform public._need(not exists(select 1 from public.maintenances where store_id = s and os_number = trim(p_os)),
    'Já existe uma manutenção com a OS '||trim(p_os)||' nesta loja.');
  if p_unit_id is not null then
    -- peça do estoque da loja: sai do estoque como 'Utilizada' e o custo vem da compra (se não informado)
    select * into u from public.units where id = p_unit_id for update;
    perform public._need(u.id is not null, 'Peça não encontrada.');
    perform public._need(u.loc_store_id = s, 'Esta peça não está no estoque desta loja.');
    perform public._need(u.status in ('Em estoque da unidade','Utilizada'), 'Peça indisponível para uso.');
    if u.status = 'Em estoque da unidade' then
      perform public._unit_set(u.id,'Utilizada','OS '||trim(p_os),null,'Utilização',false,a);
    end if;
    lbl := u.part_name||' '||u.model;
    cost := coalesce(p_part_cost, u.cost);
  else
    lbl := trim(coalesce(p_part,''));
    cost := coalesce(p_part_cost, 0);
  end if;
  insert into public.maintenances(store_id,os_number,customer,service,unit_id,part_used,charged,part_cost,technician,created_by,created_by_name)
  values (s,trim(p_os),trim(p_customer),trim(p_service),p_unit_id,lbl,p_charged,cost,trim(p_technician),a.id,a.name)
  returning id into mid;
  perform public._log(a,'Manutenção',s,coalesce(nullif(lbl,''),'Serviço sem peça'),1,null,'OS registrada','OS '||trim(p_os),null,null);
  return mid;
end $$;

create or replace function public.maintenance_update(p_id bigint, p_os text, p_customer text, p_service text, p_charged numeric,
  p_technician text, p_part text default null, p_part_cost numeric default null)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); m public.maintenances;
begin
  select * into m from public.maintenances where id = p_id for update;
  perform public._need(m.id is not null, 'Manutenção não encontrada.');
  perform public._need(a.is_admin or m.store_id = a.store_id, 'Sem permissão para esta manutenção.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(length(trim(coalesce(p_customer,''))) > 0, 'Informe o cliente.');
  perform public._need(length(trim(coalesce(p_service,''))) > 0, 'Informe o serviço realizado.');
  perform public._need(length(trim(coalesce(p_technician,''))) > 0, 'Informe o técnico.');
  perform public._need(coalesce(p_charged,-1) >= 0, 'Valor cobrado inválido.');
  perform public._need(p_part_cost is null or p_part_cost >= 0, 'Valor pago na peça inválido.');
  perform public._need(not exists(select 1 from public.maintenances where store_id = m.store_id and os_number = trim(p_os) and id <> p_id),
    'Já existe uma manutenção com a OS '||trim(p_os)||' nesta loja.');
  update public.maintenances set os_number = trim(p_os), customer = trim(p_customer), service = trim(p_service),
    charged = p_charged, technician = trim(p_technician),
    part_used = coalesce(trim(p_part), part_used), part_cost = coalesce(p_part_cost, part_cost)
  where id = p_id;
  perform public._log(a,'Manutenção',m.store_id,coalesce(nullif(m.part_used,''),'Serviço sem peça'),1,null,'OS editada','OS '||trim(p_os),null,null);
end $$;

create or replace function public.maintenance_delete(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); m public.maintenances;
begin
  perform public._need(a.is_admin, 'Somente o administrador exclui manutenções.');
  select * into m from public.maintenances where id = p_id for update;
  perform public._need(m.id is not null, 'Manutenção não encontrada.');
  delete from public.maintenances where id = p_id;
  perform public._log(a,'Manutenção',m.store_id,coalesce(nullif(m.part_used,''),'Serviço sem peça'),1,'OS registrada','OS excluída','OS '||m.os_number,null,null);
end $$;

-- Totais do rodapé: total cobrado, valor gasto (peças) e lucro.
-- Admin: todas as lojas (ou uma, via p_store). Loja: sempre só a própria.
create or replace function public.maintenance_totals(p_store smallint default null, p_from date default null, p_to date default null)
returns table(qty bigint, total_charged numeric, total_spent numeric, total_profit numeric)
language plpgsql stable security definer set search_path = public as $$
declare a public.profiles := public._actor(); s smallint;
begin
  s := case when a.is_admin then p_store else a.store_id end;
  return query
    select count(*), coalesce(sum(m.charged),0), coalesce(sum(m.part_cost),0), coalesce(sum(m.profit),0)
    from public.maintenances m
    where (s is null or m.store_id = s)
      and (p_from is null or m.created_at >= p_from)
      and (p_to is null or m.created_at < p_to + 1);
end $$;

-- ---------------------------------------------------------------------
-- 5) USUÁRIOS (somente o admin cria acessos; ninguém criado vira admin)
-- ---------------------------------------------------------------------
create or replace function public.admin_create_user(p_email text, p_password text, p_name text, p_store smallint)
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare a public.profiles := public._actor(); uid uuid := gen_random_uuid(); em text := lower(trim(coalesce(p_email,'')));
begin
  perform public._need(a.is_admin, 'Somente o administrador cria usuários.');
  perform public._need(em ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$', 'E-mail inválido.');
  perform public._need(length(coalesce(p_password,'')) >= 6, 'Senha muito curta (mínimo 6 caracteres).');
  perform public._need(length(trim(coalesce(p_name,''))) > 0, 'Informe o nome.');
  perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione uma loja válida.');
  perform public._need(not exists(select 1 from auth.users where lower(email) = em), 'Já existe um usuário com esse e-mail.');
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
    raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
  values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',em,
    extensions.crypt(p_password, extensions.gen_salt('bf')),now(),
    '{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',em,'email_verified',true),'email',now(),now(),now());
  insert into public.profiles(id,name,email,store_id,is_admin) values (uid,trim(p_name),em,p_store,false);
  return uid;
end $$;

create or replace function public.admin_set_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_admin, 'Somente o administrador redefine senhas.');
  perform public._need(length(coalesce(p_password,'')) >= 6, 'Senha muito curta (mínimo 6 caracteres).');
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

create or replace function public.admin_set_active(p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_admin, 'Somente o administrador ativa/desativa usuários.');
  perform public._need(not exists(select 1 from public.profiles where id = p_user and is_admin), 'O administrador não pode ser desativado.');
  update public.profiles set active = p_on where id = p_user;
  update auth.users set banned_until = case when p_on then null else 'infinity'::timestamptz end where id = p_user;
end $$;

create or replace function public.admin_set_store(p_user uuid, p_store smallint)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_admin, 'Somente o administrador troca a loja de um usuário.');
  perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione uma loja válida.');
  perform public._need(not exists(select 1 from public.profiles where id = p_user and is_admin), 'O administrador não pertence a uma loja.');
  update public.profiles set store_id = p_store where id = p_user;
end $$;

-- ---------------------------------------------------------------------
-- 6) VIEW DO CATÁLOGO (loja enxerga peça + nome do fornecedor, sem contatos)
-- ---------------------------------------------------------------------
create or replace view public.catalog_view as
  select c.id, c.name, c.model, c.supplier_id, s.name as supplier_name, c.unit_price
  from public.catalog c left join public.suppliers s on s.id = c.supplier_id;

-- Lista de fornecedores para a aba "Fornecedor" da Nova solicitação (só id e nome, sem contatos)
create or replace view public.suppliers_view as
  select id, name from public.suppliers;

-- ---------------------------------------------------------------------
-- 7) SEGURANÇA (RLS): leitura filtrada por loja; escrita só pelas funções
-- ---------------------------------------------------------------------
alter table public.stores     enable row level security;
alter table public.profiles   enable row level security;
alter table public.suppliers  enable row level security;
alter table public.catalog    enable row level security;
alter table public.orders     enable row level security;
alter table public.units      enable row level security;
alter table public.unit_trail enable row level security;
alter table public.history    enable row level security;
alter table public.transfers  enable row level security;
alter table public.maintenances enable row level security;

drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores for select to authenticated using (true);

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (public.is_admin() or id = auth.uid());

drop policy if exists suppliers_admin on public.suppliers;
create policy suppliers_admin on public.suppliers for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists catalog_admin on public.catalog;
create policy catalog_admin on public.catalog for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated using (public.is_admin() or store_id = public.my_store());

drop policy if exists units_select on public.units;
create policy units_select on public.units for select to authenticated
  using (public.is_admin() or loc_store_id = public.my_store() or origin_store_id = public.my_store());

drop policy if exists trail_select on public.unit_trail;
create policy trail_select on public.unit_trail for select to authenticated
  using (exists (select 1 from public.units u where u.id = unit_id));

drop policy if exists history_select on public.history;
create policy history_select on public.history for select to authenticated
  using (public.is_admin() or store_id = public.my_store() or related_store_id = public.my_store());

drop policy if exists transfers_select on public.transfers;
create policy transfers_select on public.transfers for select to authenticated
  using (public.is_admin() or from_store = public.my_store() or to_store = public.my_store());

drop policy if exists maint_select on public.maintenances;
create policy maint_select on public.maintenances for select to authenticated
  using (public.is_admin() or store_id = public.my_store());

-- Permissões: anônimo não acessa nada; logado só lê (e admin escreve fornecedores/catálogo)
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke insert, update, delete, truncate on public.stores, public.profiles, public.orders, public.units,
  public.unit_trail, public.history, public.transfers, public.maintenances from authenticated;
revoke all on public.catalog_view from anon;
grant select on public.catalog_view to authenticated;
revoke all on public.suppliers_view from anon;
grant select on public.suppliers_view to authenticated;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proowner = (select oid from pg_roles where rolname = current_user)
  loop
    if f.proname like '\_%' then
      execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    else
      execute format('revoke all on function %s from public, anon', f.sig);
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8) ADMINISTRADOR: Patrick (login criado direto no banco)
-- ---------------------------------------------------------------------
do $$
declare uid uuid; em constant text := 'patrickcotrin@gmail.com'; pw constant text := 'oficinadosmart10';
begin
  select id into uid from auth.users where lower(email) = em;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',em,
      extensions.crypt(pw, extensions.gen_salt('bf')),now(),
      '{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
  else
    update auth.users set encrypted_password = extensions.crypt(pw, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()), banned_until = null, updated_at = now() where id = uid;
  end if;
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  select gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',em,'email_verified',true),'email',now(),now(),now()
  where not exists (select 1 from auth.identities where user_id = uid and provider = 'email');
  insert into public.profiles(id,name,email,store_id,is_admin,active) values (uid,'Patrick',em,null,true,true)
  on conflict (id) do update set name = 'Patrick', email = em, store_id = null, is_admin = true, active = true;
end $$;

notify pgrst, 'reload schema';
-- ---------------------------------------------------------------------
-- 9) EXCLUSÃO SEGURA DE PEÇAS DO CATÁLOGO (somente administrador)
--     Preserva pedidos e histórico; bloqueia exclusão enquanto houver
--     unidades em estoque ou em fluxo operacional.
-- ---------------------------------------------------------------------
create or replace function public.catalog_delete(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.profiles := public._actor();
  c public.catalog%rowtype;
begin
  perform public._need(a.is_admin, 'Somente o administrador exclui peças do catálogo.');

  select * into c from public.catalog where id = p_id for update;
  perform public._need(c.id is not null, 'Peça não encontrada no catálogo.');

  perform public._need(not exists (
    select 1 from public.units u
    where u.part_name = c.name
      and u.model = c.model
      and u.status in (
        'Solicitada', 'Recebida', 'Em estoque da unidade', 'Devolvida',
        'Disponível', 'Aguardando manutenção', 'Em manutenção'
      )
  ), 'Não é possível excluir: esta peça ainda possui unidades em estoque ou em movimentação. Resolva essas unidades primeiro.');

  delete from public.catalog where id = p_id;

  perform public._log(
    a, 'Exclusão do catálogo', null,
    c.name || ' ' || c.model, 1,
    'Cadastrada', 'Excluída',
    'Catálogo #' || c.id, null, null
  );
end;
$$;

revoke all on function public.catalog_delete(bigint) from public, anon;
grant execute on function public.catalog_delete(bigint) to authenticated;

notify pgrst, 'reload schema';
