-- =====================================================================
-- Oficina do Smart - Migração: PAINEL DO DESENVOLVEDOR
--   Auditoria · Diagnóstico do sistema · Backup e dados · Erros do sistema
-- Rode INTEIRO no Supabase > SQL Editor. Só ADICIONA coisas novas, não
-- apaga dados e pode ser rodado de novo. Não tem senhas.
-- Não mexe em nenhuma função admin_* que já existe: a auditoria é feita
-- por gatilhos (triggers), então vale também para o admin_set_dev que
-- você criou direto no banco.
-- =====================================================================

-- 0) Base: coluna is_dev e função is_dev() ------------------------------
alter table public.profiles add column if not exists is_dev boolean not null default false;

create or replace function public.is_dev() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select is_dev from public.profiles where id = auth.uid() and active), false)
$$;

-- 1) AUDITORIA -----------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,                                   -- sem FK de propósito: o registro sobrevive à exclusão do usuário
  actor_name text not null default '',
  action text not null,
  target_id uuid,
  target_name text not null default '',
  details jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc, id desc);
create index if not exists audit_log_action_idx on public.audit_log (action);

-- Grava 1 linha. Quem fez = quem está logado; se não houver login (SQL Editor), vira "Banco de dados (SQL)".
create or replace function public._audit(p_action text, p_target uuid, p_target_name text, p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); an text;
begin
  if uid is not null then select name into an from public.profiles where id = uid; end if;
  insert into public.audit_log(actor_id, actor_name, action, target_id, target_name, details)
  values (uid,
          coalesce(an, case when uid is null then 'Banco de dados (SQL)' else 'Usuário removido' end),
          p_action, p_target, coalesce(p_target_name, ''), coalesce(p_details, '{}'::jsonb));
end $$;

-- Gatilho em profiles: pega promoção/rebaixamento de admin, dev e técnico, ativar/desativar, troca de loja, criar e excluir.
create or replace function public._audit_profiles() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare s_old text; s_new text;
begin
  if tg_op = 'INSERT' then
    perform public._audit('user_create', new.id, new.name,
      jsonb_build_object('email', new.email, 'loja', (select name from public.stores where id = new.store_id)));
    return new;
  elsif tg_op = 'DELETE' then
    perform public._audit('user_delete', old.id, old.name, jsonb_build_object('email', old.email));
    return old;
  end if;

  if new.is_admin is distinct from old.is_admin then
    perform public._audit(case when new.is_admin then 'admin_on' else 'admin_off' end, new.id, new.name, jsonb_build_object('email', new.email));
  end if;
  if new.is_dev is distinct from old.is_dev then
    perform public._audit(case when new.is_dev then 'dev_on' else 'dev_off' end, new.id, new.name, jsonb_build_object('email', new.email));
  end if;
  if new.is_technician is distinct from old.is_technician then
    perform public._audit(case when new.is_technician then 'tech_on' else 'tech_off' end, new.id, new.name, jsonb_build_object('email', new.email));
  end if;
  if new.active is distinct from old.active then
    perform public._audit(case when new.active then 'user_on' else 'user_off' end, new.id, new.name, jsonb_build_object('email', new.email));
  end if;
  -- troca de loja entre lojas (promover/rebaixar admin mexe no store_id e já aparece como admin_on/admin_off)
  if new.store_id is distinct from old.store_id and new.store_id is not null and old.store_id is not null then
    select name into s_old from public.stores where id = old.store_id;
    select name into s_new from public.stores where id = new.store_id;
    perform public._audit('store_change', new.id, new.name, jsonb_build_object('de', s_old, 'para', s_new));
  end if;
  return new;
end $$;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public._audit_profiles();

-- Gatilho em auth.users: senha redefinida por alguém logado (o admin_set_password). Trocas feitas pelo próprio
-- Supabase Auth (sem login no banco) não entram.
create or replace function public._audit_password() returns trigger
language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password and auth.uid() is not null then
    perform public._audit('password_reset', new.id,
      coalesce((select name from public.profiles where id = new.id), new.email), jsonb_build_object('email', new.email));
  end if;
  return new;
end $$;

do $$
begin
  drop trigger if exists audit_auth_password on auth.users;
  create trigger audit_auth_password after update of encrypted_password on auth.users
    for each row execute function public._audit_password();
exception when insufficient_privilege then
  raise notice 'Sem permissão para criar o gatilho em auth.users: redefinições de senha não serão auditadas.';
end $$;

-- Registro extra feito pelo site (somente dev): hoje só "backup_export".
create or replace function public.dev_audit_note(p_action text, p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._need(public.is_dev(), 'Somente o desenvolvedor registra esta ação.');
  perform public._need(p_action in ('backup_export'), 'Ação inválida.');
  perform public._audit(p_action, null, '', p_details);
end $$;

-- 2) ERROS DO SISTEMA ----------------------------------------------------
create table if not exists public.error_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  user_name text not null default '',
  store_id smallint,
  level text not null default 'erro' check (level in ('erro','aviso')),   -- aviso = regra de negócio (ex.: "Informe a OS")
  source text not null default 'js',                                       -- rpc, js ...
  fn text not null default '',                                             -- função do banco que falhou
  code text not null default '',
  message text not null,
  page text not null default '',
  extra jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_by text,
  resolved_at timestamptz
);
create index if not exists error_log_at_idx on public.error_log (at desc, id desc);

-- Qualquer usuário ativo registra o próprio erro. Com trava contra enxurrada e repetição.
create or replace function public.log_client_error(p_level text, p_source text, p_fn text, p_code text, p_message text,
  p_page text default '', p_extra jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.profiles; msg text := left(trim(coalesce(p_message, '')), 1000); f text := left(coalesce(p_fn, ''), 80);
begin
  select * into a from public.profiles where id = auth.uid() and active;
  if a.id is null or msg = '' then return; end if;
  if (select count(*) from public.error_log where user_id = a.id and at > now() - interval '10 minutes') >= 50 then return; end if;
  if exists (select 1 from public.error_log where user_id = a.id and fn = f and message = msg and at > now() - interval '1 minute') then return; end if;
  insert into public.error_log(user_id, user_name, store_id, level, source, fn, code, message, page, extra)
  values (a.id, a.name, a.store_id, case when p_level = 'aviso' then 'aviso' else 'erro' end,
          left(coalesce(nullif(p_source, ''), 'js'), 20), f, left(coalesce(p_code, ''), 20), msg, left(coalesce(p_page, ''), 40),
          case when length(coalesce(p_extra, '{}'::jsonb)::text) > 4000 then '{}'::jsonb else coalesce(p_extra, '{}'::jsonb) end);
end $$;

create or replace function public.dev_error_resolve(p_id bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.profiles := public._actor();
begin
  perform public._need(public.is_dev(), 'Somente o desenvolvedor mexe nos erros do sistema.');
  update public.error_log set resolved = coalesce(p_on, true),
    resolved_by = case when coalesce(p_on, true) then a.name end,
    resolved_at = case when coalesce(p_on, true) then now() end
  where id = p_id;
end $$;

create or replace function public.dev_error_clear(p_days int default 0)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare n int;
begin
  perform public._need(public.is_dev(), 'Somente o desenvolvedor limpa os erros do sistema.');
  delete from public.error_log where resolved and coalesce(resolved_at, at) < now() - make_interval(days => greatest(coalesce(p_days, 0), 0));
  get diagnostics n = row_count;
  if n > 0 then perform public._audit('errors_clear', null, '', jsonb_build_object('n', n)); end if;
  return n;
end $$;

-- 3) DIAGNÓSTICO ---------------------------------------------------------
create or replace function public.dev_diagnostics() returns jsonb
language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare ck jsonb := '[]'::jsonb; rw jsonb := '{}'::jsonb; r record; cnt bigint; ok boolean; nums jsonb;
begin
  perform public._need(public.is_dev(), 'Somente o desenvolvedor acessa o diagnóstico.');

  -- funções esperadas pelo site (e em qual arquivo cada uma nasce)
  for r in select * from (values
    ('_actor','supabase.sql'),('_need','supabase.sql'),('is_admin','supabase.sql'),('my_store','supabase.sql'),
    ('order_new','supabase.sql'),('order_decide','supabase.sql'),('order_buy','supabase.sql'),('order_receive','supabase.sql'),
    ('order_deliver','supabase.sql'),('order_delete','supabase.sql'),('stock_entry','supabase.sql'),('stock_exit','supabase.sql'),
    ('unit_action','supabase.sql'),('unit_set_status','supabase.sql'),
    ('transfer_new','supabase.sql'),('transfer_ok','supabase.sql'),('transfer_reject','supabase.sql'),('transfer_approve','supabase.sql'),
    ('maintenance_new','supabase.sql'),('maintenance_update','supabase.sql'),('maintenance_delete','supabase.sql'),('maintenance_totals','supabase.sql'),
    ('admin_create_user','supabase.sql'),('admin_set_password','supabase.sql'),('admin_set_active','supabase.sql'),('admin_set_store','supabase.sql'),
    ('catalog_delete','supabase.sql'),
    ('admin_set_admin','migracao_usuarios_estoque.sql'),
    ('central_units','migracao_estoque_central.sql'),
    ('my_store_id','migracao_visibilidade.sql'),
    ('admin_delete_user','migracao_excluir_usuario.sql'),
    ('stock_part_delete','migracao_excluir_peca.sql'),
    ('is_active_user','migracao_tecnico.sql'),('is_technician','migracao_tecnico.sql'),('admin_set_technician','migracao_tecnico.sql'),
    ('closing_new','migracao_tecnico.sql'),('controller_new','migracao_tecnico.sql'),('controller_set_status','migracao_tecnico.sql'),
    ('controller_update','migracao_tecnico.sql'),('controller_delete','migracao_tecnico.sql'),
    ('part_register','migracao_peca_tecnico.sql'),('glass_new','migracao_reparo_vidro.sql'),('glass_update','migracao_reparo_vidro.sql'),('glass_set_status','migracao_reparo_vidro.sql'),('glass_delete','migracao_reparo_vidro.sql'),
    ('admin_set_dev','SQL do cargo de dev (não está no repositório)'),
    ('is_dev','migracao_dev_painel.sql'),('dev_diagnostics','migracao_dev_painel.sql'),('log_client_error','migracao_dev_painel.sql'),
    ('dev_error_resolve','migracao_dev_painel.sql'),('dev_error_clear','migracao_dev_painel.sql'),('dev_audit_note','migracao_dev_painel.sql')
  ) as v(n, f) loop
    ok := exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = r.n);
    ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Função', 'name', r.n || '()', 'ok', ok, 'fix', r.f));
  end loop;

  -- tabelas, segurança (RLS) e contagem de linhas
  for r in select * from (values
    ('stores','supabase.sql'),('profiles','supabase.sql'),('suppliers','supabase.sql'),('catalog','supabase.sql'),('orders','supabase.sql'),
    ('units','supabase.sql'),('unit_trail','supabase.sql'),('history','supabase.sql'),('transfers','supabase.sql'),('maintenances','supabase.sql'),
    ('tech_closings','migracao_tecnico.sql'),('controller_repairs','migracao_tecnico.sql'),('glass_repairs','migracao_reparo_vidro.sql'),
    ('audit_log','migracao_dev_painel.sql'),('error_log','migracao_dev_painel.sql')
  ) as v(n, f) loop
    ok := to_regclass('public.' || r.n) is not null;
    ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Tabela', 'name', r.n, 'ok', ok, 'fix', r.f));
    if ok then
      ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Segurança (RLS)', 'name', r.n,
        'ok', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.' || r.n)), false),
        'fix', 'Rodar: alter table public.' || r.n || ' enable row level security;'));
      execute format('select count(*) from public.%I', r.n) into cnt;
      rw := rw || jsonb_build_object(r.n, cnt);
    end if;
  end loop;

  -- views, colunas, regra e gatilhos
  for r in select * from (values ('catalog_view','supabase.sql'),('suppliers_view','supabase.sql')) as v(n, f) loop
    ck := ck || jsonb_build_array(jsonb_build_object('grp', 'View', 'name', r.n, 'ok', to_regclass('public.' || r.n) is not null, 'fix', r.f));
  end loop;
  for r in select * from (values ('is_technician','migracao_tecnico.sql'),('is_dev','migracao_dev_painel.sql'),('is_glass_editor','migracao_reparo_vidro.sql')) as v(n, f) loop
    ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Coluna', 'name', 'profiles.' || r.n, 'ok',
      exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = r.n), 'fix', r.f));
  end loop;
  ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Regra', 'name', 'tecnico_nao_admin', 'ok',
    exists (select 1 from pg_constraint where conname = 'tecnico_nao_admin'), 'fix', 'migracao_tecnico.sql'));
  ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Gatilho', 'name', 'audit_profiles (profiles)', 'ok',
    exists (select 1 from pg_trigger where tgname = 'audit_profiles' and tgrelid = 'public.profiles'::regclass and not tgisinternal), 'fix', 'migracao_dev_painel.sql'));
  ck := ck || jsonb_build_array(jsonb_build_object('grp', 'Gatilho', 'name', 'audit_auth_password (auth.users)', 'ok',
    exists (select 1 from pg_trigger where tgname = 'audit_auth_password' and tgrelid = 'auth.users'::regclass and not tgisinternal),
    'fix', 'migracao_dev_painel.sql (precisa de permissão em auth.users)'));

  -- números sobre os usuários
  nums := jsonb_build_object(
    'devs',           (select count(*) from public.profiles where is_dev and active),
    'admins',         (select count(*) from public.profiles where is_admin and active),
    'active',         (select count(*) from public.profiles where active),
    'inactive',       (select count(*) from public.profiles where not active),
    'no_store',       (select count(*) from public.profiles where active and not is_admin and store_id is null),
    'tech_admin',     (select count(*) from public.profiles where is_technician and is_admin),
    'dev_not_admin',  (select count(*) from public.profiles where is_dev and not is_admin),
    'auth_no_profile',(select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)),
    'errors_24h',     (select count(*) from public.error_log where level = 'erro' and not resolved and at > now() - interval '24 hours')
  );

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_glass_editor') then
    execute 'select count(*) from public.profiles where is_glass_editor and active' into cnt;
    nums := nums || jsonb_build_object('glass_editors', cnt);
  end if;

  return jsonb_build_object('checks', ck, 'numbers', nums, 'rows', rw, 'at', now());
end $$;

-- 4) SEGURANÇA: só o dev lê as tabelas novas; ninguém escreve direto ----
alter table public.audit_log enable row level security;
alter table public.error_log enable row level security;

drop policy if exists audit_log_dev_select on public.audit_log;
create policy audit_log_dev_select on public.audit_log for select to authenticated using (public.is_dev());
drop policy if exists error_log_dev_select on public.error_log;
create policy error_log_dev_select on public.error_log for select to authenticated using (public.is_dev());

revoke all on public.audit_log, public.error_log from anon;
revoke insert, update, delete, truncate on public.audit_log, public.error_log from authenticated;
grant select on public.audit_log, public.error_log to authenticated;

revoke all on function public._audit(text, uuid, text, jsonb), public._audit_profiles(), public._audit_password() from public, anon, authenticated;
revoke all on function public.is_dev(), public.dev_audit_note(text, jsonb), public.dev_diagnostics(),
  public.dev_error_resolve(bigint, boolean), public.dev_error_clear(int),
  public.log_client_error(text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.is_dev(), public.dev_audit_note(text, jsonb), public.dev_diagnostics(),
  public.dev_error_resolve(bigint, boolean), public.dev_error_clear(int),
  public.log_client_error(text, text, text, text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
