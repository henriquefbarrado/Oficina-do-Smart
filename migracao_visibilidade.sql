-- =====================================================================
-- Oficina do Smart - Migração: todo usuário novo enxerga os dados da própria loja
-- (histórico, peças, pedidos, transferências, manutenções) e o histórico do
-- Estoque Central. Rode inteiro no Supabase > SQL Editor. Não apaga dados,
-- pode ser rodado mais de uma vez e não tem senhas.
-- As regras são por LOJA (e não por usuário), então qualquer login criado no
-- futuro já nasce enxergando tudo da loja dele. Só leitura.
-- =====================================================================
create or replace function public.is_active_user()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$ select exists (select 1 from public.profiles where id = auth.uid() and active) $$;

create or replace function public.my_store_id()
returns bigint language sql stable security definer
set search_path = public, pg_temp
as $$ select store_id::bigint from public.profiles where id = auth.uid() and active $$;

revoke all on function public.is_active_user() from public, anon;
revoke all on function public.my_store_id() from public, anon;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.my_store_id() to authenticated;

do $$
declare t record;
begin
  for t in select * from (values
    ('orders',       'store_id = public.my_store_id()'),
    ('units',        'loc_store_id = public.my_store_id() or origin_store_id = public.my_store_id() or loc_store_id = 0'),
    ('history',      'store_id = 0 or store_id = public.my_store_id() or related_store_id = public.my_store_id()'),
    ('transfers',    'from_store = public.my_store_id() or to_store = public.my_store_id()'),
    ('maintenances', 'store_id = public.my_store_id()'),
    ('stores',       'true')
  ) as v(tbl, cond)
  loop
    begin
      if to_regclass('public.' || t.tbl) is not null then
        execute format('drop policy if exists %I on public.%I', 'visibilidade_loja_' || t.tbl, t.tbl);
        execute format(
          'create policy %I on public.%I for select to authenticated using (public.is_active_user() and (%s))',
          'visibilidade_loja_' || t.tbl, t.tbl, t.cond);
      end if;
    exception when others then
      raise notice 'Tabela % ignorada: %', t.tbl, sqlerrm;
    end;
  end loop;
end $$;

-- Diagnóstico (só mostra informações; nada é alterado) ------------------
-- Se algum usuário novo AINDA não enxergar algo, copie os dois resultados abaixo.
select tablename, policyname, cmd, permissive, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('orders','units','history','transfers','maintenances','stores')
order by tablename, policyname;

select id, email, store_id, is_admin, is_technician, active from public.profiles order by email;
