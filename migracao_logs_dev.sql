-- =====================================================================
-- Oficina do Smart - Migração: ABA "LOGS" (somente o DEV)
--   Quem cadastrou / editou / excluiu: peças do catálogo, fornecedores,
--   fechamentos técnicos, manetes, reparos em vidro e usuários.
-- (Pedidos, compras, entradas, saídas, transferências, devoluções e OS
--  já têm registro na tabela history; a aba Logs junta os dois.)
-- Rode INTEIRO no Supabase > SQL Editor, DEPOIS do migracao_dev_painel.sql
-- (precisa da função is_dev). Só ADICIONA coisas, não apaga dados e pode
-- ser rodado de novo. Não tem senhas.
-- =====================================================================

-- 1) TABELA ------------------------------------------------------------
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,                                  -- sem FK de propósito: o registro sobrevive à exclusão do usuário
  actor_name text not null default '',
  store_id smallint,                              -- loja do registro (ou a loja de quem fez, se for algo geral)
  entity text not null,                           -- catalog, supplier, user, closing, controller, glass
  action text not null check (action in ('create','update','delete')),
  target text not null default '',
  summary text not null default ''
);
create index if not exists activity_log_at_idx on public.activity_log (at desc, id desc);
create index if not exists activity_log_entity_idx on public.activity_log (entity);

-- 2) FORMATA UM VALOR PARA LEITURA -------------------------------------
create or replace function public._lg_val(k text, v jsonb) returns text
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare t text;
begin
  if v is null or jsonb_typeof(v) = 'null' then return '—'; end if;
  t := v #>> '{}';
  if k = 'store_id' then return left(coalesce((select name from public.stores where id = t::smallint), t), 200);
  elsif k = 'supplier_id' then return left(coalesce((select name from public.suppliers where id = t::bigint), t), 200);
  elsif k in ('unit_price','charged','part_cost') then return 'R$ ' || replace(to_char(t::numeric, 'FM999999990.00'), '.', ',');
  elsif jsonb_typeof(v) = 'boolean' then return case when t = 'true' then 'sim' else 'não' end;
  end if;
  return case when t = '' then '—' else left(t, 200) end;
end $$;

-- 3) GATILHO GENÉRICO --------------------------------------------------
create or replace function public._activity_trg() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid(); an text; ast smallint;
  jn jsonb; jo jsonb; ent text; tgt text; sid smallint; act text;
  flds text[]; labs text[]; i int; k text; parts text[] := '{}'; sm text;
begin
  if uid is not null then select name, store_id into an, ast from public.profiles where id = uid; end if;
  jn := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  jo := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  act := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;

  if tg_table_name = 'catalog' then
    -- exclusão do catálogo já fica na history (catalog_delete / stock_part_delete), então não duplica aqui
    if tg_op = 'DELETE' then return old; end if;
    ent := 'catalog'; tgt := (jn->>'name') || ' ' || (jn->>'model');
    flds := array['name','model','supplier_id','unit_price']; labs := array['Peça','Modelo','Fornecedor','Valor'];
  elsif tg_table_name = 'suppliers' then
    ent := 'supplier'; tgt := jn->>'name';
    flds := array['name','company','phone','email','notes']; labs := array['Nome','Empresa','Telefone','E-mail','Observações'];
  elsif tg_table_name = 'tech_closings' then
    ent := 'closing'; tgt := 'OS ' || (jn->>'os_number'); sid := (jn->>'store_id')::smallint;
    flds := array['os_number','customer','service','part_cost','charged','supplier']; labs := array['OS','Cliente','Serviço','Valor da peça','Valor cobrado','Fornecedor'];
  elsif tg_table_name = 'controller_repairs' then
    ent := 'controller'; tgt := 'OS ' || (jn->>'os_number'); sid := (jn->>'store_id')::smallint;
    flds := array['os_number','store_id','status']; labs := array['OS','Loja','Status'];
  elsif tg_table_name = 'glass_repairs' then
    ent := 'glass'; tgt := 'OS ' || (jn->>'os_number'); sid := (jn->>'store_id')::smallint;
    flds := array['os_number','store_id','device','status','note']; labs := array['OS','Loja','Aparelho','Status','Observação'];
  elsif tg_table_name = 'profiles' then
    ent := 'user'; tgt := jn->>'name'; sid := (jn->>'store_id')::smallint;
    flds := array['email','name','store_id','is_admin','is_technician','is_dev','is_glass_editor','active'];
    labs := array['E-mail','Nome','Loja','Administrador','Técnico','Dev','Edita vidro','Ativo'];
  else
    return coalesce(new, old);
  end if;

  for i in 1 .. array_length(flds, 1) loop
    k := flds[i];
    if tg_op = 'UPDATE' then
      if jo->k is distinct from jn->k then
        parts := parts || (labs[i] || ': ' || public._lg_val(k, jo->k) || ' → ' || public._lg_val(k, jn->k));
      end if;
    elsif jn->k is not null and jsonb_typeof(jn->k) <> 'null' and (jn->>k) not in ('', 'false') then
      parts := parts || (labs[i] || ': ' || public._lg_val(k, jn->k));
    end if;
  end loop;

  if tg_op = 'UPDATE' and array_length(parts, 1) is null then return new; end if;  -- nada relevante mudou
  sm := left(array_to_string(parts, ' · '), 1000);

  insert into public.activity_log(actor_id, actor_name, store_id, entity, action, target, summary)
  values (uid,
          coalesce(an, case when uid is null then 'Banco de dados (SQL)' else 'Usuário removido' end),
          coalesce(sid, ast), ent, act, left(coalesce(tgt, ''), 200), coalesce(sm, ''));
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- 4) LIGA O GATILHO NAS TABELAS (as que ainda não existem são puladas) --
do $$
declare t text;
begin
  foreach t in array array['catalog','suppliers','tech_closings','controller_repairs','glass_repairs','profiles'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists activity_log_trg on public.%I', t);
      execute format('create trigger activity_log_trg after insert or update or delete on public.%I
                      for each row execute function public._activity_trg()', t);
    else
      raise notice 'Tabela % não existe ainda: rode a migração dela e depois rode este arquivo de novo.', t;
    end if;
  end loop;
end $$;

-- 5) SEGURANÇA: só o DEV lê; ninguém escreve direto --------------------
alter table public.activity_log enable row level security;

drop policy if exists activity_log_dev_select on public.activity_log;
create policy activity_log_dev_select on public.activity_log for select to authenticated using (public.is_dev());

revoke all on public.activity_log from anon;
revoke insert, update, delete, truncate on public.activity_log from authenticated;
grant select on public.activity_log to authenticated;

revoke all on function public._lg_val(text, jsonb), public._activity_trg() from public, anon, authenticated;

notify pgrst, 'reload schema';
