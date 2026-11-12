-- =====================================================================
-- triggers.sql  |  ORDEM DE EXECUÇÃO: 3 de 7
-- Gatilhos: updated_at, perfil automático no cadastro, proteção do perfil,
-- linhas de saldo automáticas, saldo x histórico, imutabilidade e auditoria.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. updated_at automático
-- ---------------------------------------------------------------------
create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['stores', 'profiles', 'categories', 'products', 'stock_balances',
                           'stock_requests', 'stock_request_items', 'stock_transfers',
                           'stock_transfer_items', 'stock_returns']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2. Novo usuário no Supabase Auth -> perfil INATIVO e sem unidade.
--    Função, unidade e status NUNCA vêm do cadastro: só um admin define.
-- ---------------------------------------------------------------------
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role, store_id, active)
  values (new.id,
          coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), new.email),
          new.email, 'employee', null, false);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Proteção do perfil
--    * coerência função x unidade (vale para todos)
--    * usuário logado não altera a própria função/unidade/status
--    * só admin altera função, unidade, status e e-mail de alguém
--    * auth.uid() nulo = SQL Editor / service role (operação de sistema, confiável)
-- ---------------------------------------------------------------------
create or replace function private.guard_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean;
  v_store public.stores;
begin
  if new.store_id is not null then
    select * into v_store from public.stores s where s.id = new.store_id;
    if new.role = 'stock_manager' and v_store.kind <> 'central' then
      raise exception 'O responsável pelo estoque central deve ficar vinculado ao Estoque Central.'
        using errcode = '23514', hint = 'invalid_role_store';
    end if;
    if new.role = 'employee' and v_store.kind <> 'branch' then
      raise exception 'Funcionário de loja deve ficar vinculado a uma loja, não ao Estoque Central.'
        using errcode = '23514', hint = 'invalid_role_store';
    end if;
    if new.active and not v_store.active then
      raise exception 'A unidade vinculada está inativa.' using errcode = '23514', hint = 'invalid_role_store';
    end if;
  end if;

  if v_uid is null then
    return new;
  end if;
  v_admin := private.is_admin();

  if tg_op = 'INSERT' then
    if not v_admin then
      raise exception 'Perfis são criados automaticamente no cadastro do usuário.'
        using errcode = '42501', hint = 'forbidden';
    end if;
    return new;
  end if;

  if new.id <> old.id then
    raise exception 'O identificador do perfil não pode ser alterado.' using errcode = '42501', hint = 'forbidden';
  end if;
  if (new.role, new.store_id, new.active) is distinct from (old.role, old.store_id, old.active) then
    if v_uid = new.id then
      raise exception 'Você não pode alterar sua própria função, unidade ou status de acesso.'
        using errcode = '42501', hint = 'forbidden';
    end if;
    if not v_admin then
      raise exception 'Somente administradores alteram função, unidade ou status de acesso.'
        using errcode = '42501', hint = 'forbidden';
    end if;
  end if;
  if new.email is distinct from old.email and not v_admin then
    raise exception 'Somente administradores alteram o e-mail do perfil.' using errcode = '42501', hint = 'forbidden';
  end if;
  if new.full_name is distinct from old.full_name and not (v_admin or v_uid = new.id) then
    raise exception 'Você não pode alterar o nome de outro usuário.' using errcode = '42501', hint = 'forbidden';
  end if;
  return new;
end $$;

create trigger guard_profile
  before insert or update on public.profiles
  for each row execute function private.guard_profile();

-- ---------------------------------------------------------------------
-- 4. Linhas de saldo automáticas: todo produto existe em todas as unidades (saldo 0)
-- ---------------------------------------------------------------------
create or replace function private.create_balances_for_product() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.stock_balances (store_id, product_id)
  select s.id, new.id from public.stores s
  on conflict (store_id, product_id) do nothing;
  return null;
end $$;

create or replace function private.create_balances_for_store() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.stock_balances (store_id, product_id)
  select new.id, p.id from public.products p
  on conflict (store_id, product_id) do nothing;
  return null;
end $$;

create trigger products_create_balances after insert on public.products
  for each row execute function private.create_balances_for_product();
create trigger stores_create_balances after insert on public.stores
  for each row execute function private.create_balances_for_store();

-- ---------------------------------------------------------------------
-- 5. Saldo só muda com movimentação correspondente
--    Ao final da transação, o saldo DEVE ser igual ao balance_after da última
--    movimentação daquela unidade+produto (ou 0, se nunca houve movimentação).
-- ---------------------------------------------------------------------
create or replace function private.check_balance_matches_ledger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_current integer;
  v_last    integer;
begin
  select b.quantity into v_current from public.stock_balances b where b.id = new.id;
  if not found then
    return null;
  end if;
  select m.balance_after into v_last from public.stock_movements m
   where m.store_id = new.store_id and m.product_id = new.product_id
   order by m.seq desc limit 1;
  if v_current is distinct from coalesce(v_last, 0) then
    raise exception 'Integridade violada: saldo (%) diverge do histórico (%) - unidade % / produto %.',
      v_current, coalesce(v_last, 0), new.store_id, new.product_id
      using errcode = '23514', hint = 'ledger_mismatch';
  end if;
  return null;
end $$;

create constraint trigger stock_balances_ledger_check
  after insert or update on public.stock_balances
  deferrable initially deferred
  for each row execute function private.check_balance_matches_ledger();

-- ---------------------------------------------------------------------
-- 6. Imutabilidade: histórico e auditoria não aceitam UPDATE, DELETE nem TRUNCATE
-- ---------------------------------------------------------------------
create or replace function private.forbid_modification() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Registros de % são imutáveis (% não permitido). Corrija com uma nova movimentação de ajuste.',
    tg_table_name, tg_op using errcode = '42501', hint = 'immutable';
end $$;

create trigger stock_movements_immutable_row before update or delete on public.stock_movements
  for each row execute function private.forbid_modification();
create trigger stock_movements_immutable_truncate before truncate on public.stock_movements
  for each statement execute function private.forbid_modification();
create trigger activity_logs_immutable_row before update or delete on public.activity_logs
  for each row execute function private.forbid_modification();
create trigger activity_logs_immutable_truncate before truncate on public.activity_logs
  for each statement execute function private.forbid_modification();

-- ---------------------------------------------------------------------
-- 7. Auditoria: quem, o quê, quando, qual unidade, valores antes e depois
-- ---------------------------------------------------------------------
create or replace function private.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old   jsonb;
  v_new   jsonb;
  v_row   jsonb;
  v_store uuid;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_row := v_new;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_row := v_new;
    if (v_old - 'updated_at') = (v_new - 'updated_at') then
      return null;   -- nada mudou de fato
    end if;
  else
    v_old := to_jsonb(old);
    v_row := v_old;
  end if;

  v_store := coalesce(nullif(v_row ->> 'store_id', '')::uuid,
                      nullif(v_row ->> 'requesting_store_id', '')::uuid,
                      nullif(v_row ->> 'origin_store_id', '')::uuid);
  if tg_table_name = 'stores' then
    v_store := (v_row ->> 'id')::uuid;
  end if;

  insert into public.activity_logs (actor_id, action, table_name, record_id, store_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, (v_row ->> 'id')::uuid, v_store, v_old, v_new);
  return null;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['stores', 'profiles', 'categories', 'products', 'stock_requests',
                           'stock_request_items', 'stock_transfers', 'stock_transfer_items', 'stock_returns']
  loop
    execute format('create trigger audit_log after insert or update or delete on public.%I
                    for each row execute function private.log_activity()', t);
  end loop;
end $$;

-- Movimentações: só INSERT (já são imutáveis); o saldo é consequência delas.
create trigger audit_log after insert on public.stock_movements
  for each row execute function private.log_activity();
