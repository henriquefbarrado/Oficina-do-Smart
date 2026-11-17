-- ---------------------------------------------------------------------
-- 11) REPARO EM VIDRO
--     Todos os usuários ativos VEEM. Só quem tem a marca is_glass_editor
--     (a Paola) cadastra, edita, atualiza o status e exclui.
--     Status: Pronto, Em manutenção, Display danificado.
--     Pode rodar de novo sem perder dados (também converte status antigos).
-- ---------------------------------------------------------------------

-- 11.1) Marca "edita Reparo em Vidro" no perfil
alter table public.profiles add column if not exists is_glass_editor boolean not null default false;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create or replace function public.admin_set_glass_editor(p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_admin, 'Somente o administrador define quem edita o Reparo em Vidro.');
  perform public._need(exists(select 1 from public.profiles where id = p_user), 'Usuário não encontrado.');
  update public.profiles set is_glass_editor = coalesce(p_on, false) where id = p_user;
end $$;

-- 11.2) Tabela
create table if not exists public.glass_repairs (
  id bigint generated always as identity primary key,
  os_number text not null,
  store_id smallint not null references public.stores(id),
  device text not null default '',
  status text not null default 'Em manutenção',
  note text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_by_name text not null default '',
  updated_at timestamptz not null default now()
);
create index if not exists glass_repairs_created_idx on public.glass_repairs(created_at desc, id desc);

-- 11.3) Status novos: remove qualquer regra antiga de status, converte os registros e cria a regra nova
do $$ declare r record; begin
  for r in select conname from pg_constraint
           where conrelid = 'public.glass_repairs'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%status%' loop
    execute format('alter table public.glass_repairs drop constraint %I', r.conname);
  end loop;
end $$;

update public.glass_repairs set status = case status
  when 'Aguardando peças' then 'Em manutenção'
  when 'Em reparo'        then 'Em manutenção'
  when 'Sem reparo'       then 'Display danificado'
  when 'Entregue'         then 'Pronto'
  else status end
where status not in ('Pronto','Em manutenção','Display danificado');

alter table public.glass_repairs alter column status set default 'Em manutenção';
alter table public.glass_repairs add constraint glass_repairs_status_check
  check (status in ('Pronto','Em manutenção','Display danificado'));

-- 11.4) Funções de escrita (remove versões antigas para não duplicar)
do $$ declare r record; begin
  for r in select p.oid::regprocedure as f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('glass_new','glass_update','glass_set_status','glass_delete') loop
    execute 'drop function ' || r.f;
  end loop;
end $$;

create function public.glass_new(p_os text, p_store smallint, p_device text, p_status text, p_note text default '')
returns bigint language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor(); nid bigint;
begin
  perform public._need(a.is_glass_editor, 'Somente a Paola pode alterar os reparos em vidro.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione a loja.');
  perform public._need(length(trim(coalesce(p_device,''))) > 0, 'Informe o modelo do aparelho.');
  perform public._need(p_status in ('Pronto','Em manutenção','Display danificado'), 'Status inválido.');
  perform public._need(not exists(select 1 from public.glass_repairs where store_id = p_store and os_number = trim(p_os)),
    'Já existe um reparo com a OS '||trim(p_os)||' nesta loja.');
  insert into public.glass_repairs(os_number,store_id,device,status,note,created_by,created_by_name,updated_by_name)
  values (trim(p_os),p_store,trim(p_device),p_status,trim(coalesce(p_note,'')),a.id,a.name,a.name)
  returning id into nid;
  return nid;
end $$;

create function public.glass_update(p_id bigint, p_os text, p_store smallint, p_device text, p_status text, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_glass_editor, 'Somente a Paola pode alterar os reparos em vidro.');
  perform public._need(exists(select 1 from public.glass_repairs where id = p_id), 'Reparo não encontrado.');
  perform public._need(length(trim(coalesce(p_os,''))) > 0, 'Informe o número da OS.');
  perform public._need(exists(select 1 from public.stores where id = p_store and kind = 'loja'), 'Selecione a loja.');
  perform public._need(length(trim(coalesce(p_device,''))) > 0, 'Informe o modelo do aparelho.');
  perform public._need(p_status in ('Pronto','Em manutenção','Display danificado'), 'Status inválido.');
  perform public._need(not exists(select 1 from public.glass_repairs where store_id = p_store and os_number = trim(p_os) and id <> p_id),
    'Já existe um reparo com a OS '||trim(p_os)||' nesta loja.');
  update public.glass_repairs set os_number = trim(p_os), store_id = p_store, device = trim(p_device), status = p_status,
    note = trim(coalesce(p_note,'')), updated_by_name = a.name, updated_at = now() where id = p_id;
end $$;

create function public.glass_set_status(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_glass_editor, 'Somente a Paola pode alterar os reparos em vidro.');
  perform public._need(p_status in ('Pronto','Em manutenção','Display danificado'), 'Status inválido.');
  perform public._need(exists(select 1 from public.glass_repairs where id = p_id), 'Reparo não encontrado.');
  update public.glass_repairs set status = p_status, updated_by_name = a.name, updated_at = now() where id = p_id;
end $$;

create function public.glass_delete(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
begin
  perform public._need(a.is_glass_editor, 'Somente a Paola pode alterar os reparos em vidro.');
  perform public._need(exists(select 1 from public.glass_repairs where id = p_id), 'Reparo não encontrado.');
  delete from public.glass_repairs where id = p_id;
end $$;

-- 11.5) Segurança: todos os usuários ativos leem; escrita só pelas funções acima
alter table public.glass_repairs enable row level security;
drop policy if exists glass_repairs_select on public.glass_repairs;
create policy glass_repairs_select on public.glass_repairs for select to authenticated using (public.is_active_user());

revoke all on public.glass_repairs from anon;
revoke insert, update, delete, truncate on public.glass_repairs from authenticated;
grant select on public.glass_repairs to authenticated;

revoke all on function public.admin_set_glass_editor(uuid, boolean),
  public.glass_new(text, smallint, text, text, text), public.glass_update(bigint, text, smallint, text, text, text),
  public.glass_set_status(bigint, text), public.glass_delete(bigint) from public, anon;
grant execute on function public.admin_set_glass_editor(uuid, boolean),
  public.glass_new(text, smallint, text, text, text), public.glass_update(bigint, text, smallint, text, text, text),
  public.glass_set_status(bigint, text), public.glass_delete(bigint) to authenticated;

notify pgrst, 'reload schema';

-- 11.6) DAR A MARCA À PAOLA (rode UMA vez, trocando o e-mail pelo dela).
--       Também dá para fazer pela tela: Usuários > Editar > "Dar acesso ao Reparo em Vidro".
-- update public.profiles set is_glass_editor = true where email = 'EMAIL-DA-PAOLA@exemplo.com';
