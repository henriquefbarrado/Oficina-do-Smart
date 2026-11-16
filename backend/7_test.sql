-- =====================================================================
-- test.sql  |  ORDEM DE EXECUÇÃO: 7 de 7  (rode depois de tudo + seed.sql)
--
-- Testes de integridade, permissões e segurança. Roda dentro de UMA transação
-- e ao final lança um erro DE PROPÓSITO com o relatório, o que desfaz tudo:
-- nenhum usuário, produto ou movimentação de teste fica no banco.
--
--   >>> A mensagem vermelha "RESULTADO DOS TESTES: N aprovados, M reprovados"
--       É o relatório. Cada linha começa com OK ou FALHA.
--
-- Como funciona: cada teste simula um usuário real (JWT + role "authenticated"),
-- igual ao que o PostgREST faz quando o frontend chama a API.
-- Rode no SQL Editor do Supabase (usuário postgres) ou via psql.
-- O teste de concorrência real (várias requisições simultâneas) está em
-- tests/concurrency.test.mjs, porque exige conexões paralelas.
-- =====================================================================

begin;

create temp table _ctx (k text primary key, val uuid);
create temp table _t (id serial primary key, test text not null, passed boolean not null, detail text);

create function pg_temp.c(p_key text) returns uuid language sql as $$
  select val from _ctx where k = p_key
$$;

-- Executa p_sql como: 'postgres' (sistema), 'anon', ou o usuário de teste informado.
-- Os marcadores {chave} são trocados pelos UUIDs guardados em _ctx.
create function pg_temp.as_user(p_user text, p_sql text) returns text language plpgsql as $$
declare
  r     record;
  v     text;
  v_sub uuid;
begin
  for r in select c.k, c.val from _ctx c where c.val is not null loop
    p_sql := replace(p_sql, '{' || r.k || '}', r.val::text);
  end loop;
  if p_user = 'anon' then
    perform set_config('request.jwt.claims', '', true);
    execute 'set local role anon';
  elsif p_user <> 'postgres' then
    select c.val into v_sub from _ctx c where c.k = p_user;
    perform set_config('request.jwt.claims', json_build_object('sub', v_sub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end if;
  begin
    execute p_sql into v;
  exception when others then
    execute 'reset role';
    perform set_config('request.jwt.claims', '', true);
    return 'ERR[' || sqlstate || '] ' || sqlerrm;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return coalesce(v, '');
end $$;

create function pg_temp.expect_val(p_name text, p_user text, p_sql text, p_expected text) returns void
language plpgsql as $$
declare r text;
begin
  r := pg_temp.as_user(p_user, p_sql);
  insert into _t (test, passed, detail) values (p_name, r = p_expected, 'esperado=[' || p_expected || '] obtido=[' || r || ']');
end $$;

create function pg_temp.expect_err(p_name text, p_user text, p_sql text, p_pattern text) returns void
language plpgsql as $$
declare r text;
begin
  r := pg_temp.as_user(p_user, p_sql);
  insert into _t (test, passed, detail) values (p_name, r like 'ERR%' and r ilike '%' || p_pattern || '%', r);
end $$;

create function pg_temp.expect_ok(p_name text, p_user text, p_sql text) returns void
language plpgsql as $$
declare r text;
begin
  r := pg_temp.as_user(p_user, p_sql);
  insert into _t (test, passed, detail) values (p_name, r not like 'ERR%', r);
end $$;

-- Executa e guarda o UUID retornado em _ctx (para usar depois como {chave}).
create function pg_temp.save(p_key text, p_user text, p_sql text) returns void language plpgsql as $$
declare r text;
begin
  r := pg_temp.as_user(p_user, p_sql);
  if r ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    insert into _ctx (k, val) values (p_key, r::uuid) on conflict (k) do update set val = excluded.val;
  else
    insert into _t (test, passed, detail) values ('PREPARO ' || p_key, false, r);
  end if;
end $$;

-- Tentativas "de baixo nível" (precisam de várias instruções)
create function pg_temp.bump_balance() returns text language plpgsql as $$
begin
  update public.stock_balances set quantity = quantity + 5
   where store_id = pg_temp.c('central') and product_id = pg_temp.c('pA');
  set constraints all immediate;
  return 'alterou sem erro';
end $$;

create function pg_temp.try_truncate() returns text language plpgsql as $$
begin
  truncate public.stock_movements;
  return 'truncou sem erro';
end $$;

-- ---------------------------------------------------------------------
-- PREPARAÇÃO
-- ---------------------------------------------------------------------
do $$ begin
  if (select count(*) from public.stores) < 6 or not exists (select 1 from public.stores where kind = 'central') then
    raise exception 'Rode o seed.sql antes dos testes (as 6 unidades precisam existir).';
  end if;
end $$;

insert into _ctx (k, val) select 'central', id from public.stores where kind = 'central';
insert into _ctx (k, val) select 'buritis', id from public.stores where name = 'Buritis';
insert into _ctx (k, val) select 'centro',  id from public.stores where name = 'Centro';
insert into _ctx (k, val) values
  ('admin',       'aaaaaaaa-0000-4000-8000-000000000001'),
  ('manager',     'aaaaaaaa-0000-4000-8000-000000000002'),
  ('emp_buritis', 'aaaaaaaa-0000-4000-8000-000000000003'),
  ('emp_centro',  'aaaaaaaa-0000-4000-8000-000000000004');

insert into auth.users (id, email)
select val, k || '@teste.local' from _ctx where k in ('admin', 'manager', 'emp_buritis', 'emp_centro');

update public.profiles set role = 'admin', active = true, full_name = 'Teste Admin' where id = pg_temp.c('admin');
update public.profiles set role = 'stock_manager', active = true, full_name = 'Teste Responsavel',
       store_id = pg_temp.c('central') where id = pg_temp.c('manager');
update public.profiles set role = 'employee', active = true, full_name = 'Teste Func Buritis',
       store_id = pg_temp.c('buritis') where id = pg_temp.c('emp_buritis');
update public.profiles set role = 'employee', active = true, full_name = 'Teste Func Centro',
       store_id = pg_temp.c('centro') where id = pg_temp.c('emp_centro');

with p as (
  insert into public.products (sku, name, min_stock) values ('TST-A', 'Produto Teste A', 0), ('TST-B', 'Produto Teste B', 0)
  returning id, sku)
insert into _ctx (k, val) select case sku when 'TST-A' then 'pA' else 'pB' end, id from p;

-- 1. ESTRUTURA E CADASTROS ---------------------------------------------
select pg_temp.expect_val('T01 existe exatamente 1 estoque central', 'postgres',
  $q$ select count(*)::text from public.stores where kind = 'central' $q$, '1');
select pg_temp.expect_val('T02 todo produto novo ganha saldo (0) nas 6+ unidades', 'postgres',
  $q$ select (count(*) = (select count(*) from public.stores))::text from public.stock_balances where product_id = '{pA}' $q$, 'true');
select pg_temp.expect_err('T03 não permite um segundo estoque central', 'postgres',
  $q$ with i as (insert into public.stores (name, kind) values ('Outro Central', 'central') returning 1) select count(*)::text from i $q$, 'duplicate');
select pg_temp.expect_err('T04 funcionário de loja não pode ser vinculado ao estoque central', 'postgres',
  $q$ with u as (update public.profiles set store_id = '{central}' where id = '{emp_buritis}' returning 1) select count(*)::text from u $q$, 'estoque central');
select pg_temp.expect_err('T05 responsável do central não pode ser vinculado a uma loja', 'postgres',
  $q$ with u as (update public.profiles set store_id = '{buritis}' where id = '{manager}' returning 1) select count(*)::text from u $q$, 'estoque central');

-- 2. ENTRADAS (admin) -----------------------------------------------------
select pg_temp.expect_ok('T06 admin registra entrada no central', 'admin',
  $q$ select public.register_entry('{central}', '{pA}', 10, 'compra teste')::text $q$);
select pg_temp.expect_ok('T07 admin registra entrada na loja Centro', 'admin',
  $q$ select public.register_entry('{centro}', '{pA}', 7, 'carga inicial')::text $q$);
select pg_temp.expect_ok('T08 admin registra entrada na loja Buritis', 'admin',
  $q$ select public.register_entry('{buritis}', '{pA}', 3, 'carga inicial')::text $q$);
select pg_temp.expect_ok('T09 admin registra entrada do produto B no central', 'admin',
  $q$ select public.register_entry('{central}', '{pB}', 20, 'compra teste')::text $q$);

-- 3. ISOLAMENTO ENTRE UNIDADES -------------------------------------------
select pg_temp.expect_val('T10 func. de Buritis NÃO vê saldos da loja Centro', 'emp_buritis',
  $q$ select count(*)::text from public.stock_balances where store_id = '{centro}' $q$, '0');
select pg_temp.expect_val('T11 func. de Buritis vê os saldos da própria loja', 'emp_buritis',
  $q$ select (count(*) >= 2)::text from public.stock_balances where store_id = '{buritis}' $q$, 'true');
select pg_temp.expect_val('T12 func. de Buritis NÃO vê movimentações da loja Centro', 'emp_buritis',
  $q$ select count(*)::text from public.stock_movements where store_id = '{centro}' $q$, '0');
select pg_temp.expect_val('T13 func. de Buritis NÃO vê o estoque central', 'emp_buritis',
  $q$ select count(*)::text from public.stock_balances where store_id = '{central}' $q$, '0');
select pg_temp.expect_val('T14 func. de Buritis NÃO vê movimentações do central', 'emp_buritis',
  $q$ select count(*)::text from public.stock_movements where store_id = '{central}' $q$, '0');
select pg_temp.expect_err('T15 func. NÃO registra entrada no central', 'emp_buritis',
  $q$ select public.register_entry('{central}', '{pA}', 1, 'x')::text $q$, 'permissão');
select pg_temp.expect_err('T16 func. NÃO consome estoque de outra unidade (p_store_id forjado)', 'emp_buritis',
  $q$ select public.register_consumption('{pA}', 1, 'x', null, '{centro}')::text $q$, 'própria unidade');
select pg_temp.expect_err('T17 func. NÃO ajusta estoque', 'emp_buritis',
  $q$ select public.adjust_stock('{buritis}', '{pA}', 99, 'x')::text $q$, 'permissão');
select pg_temp.expect_val('T18 admin enxerga as 6+ unidades', 'admin',
  $q$ select (count(distinct store_id) = (select count(*) from public.stores))::text from public.stock_balances $q$, 'true');
select pg_temp.expect_val('T19 responsável do central enxerga só o central (privilégio mínimo)', 'manager',
  $q$ select count(distinct store_id)::text from public.stock_balances $q$, '1');
select pg_temp.expect_err('T20 responsável do central NÃO registra entrada em loja', 'manager',
  $q$ select public.register_entry('{buritis}', '{pA}', 1, 'x')::text $q$, 'própria unidade');
select pg_temp.expect_val('T21 func. de Buritis só enxerga 1 unidade em get_stock_balance()', 'emp_buritis',
  $q$ select count(distinct store_id)::text from public.get_stock_balance() $q$, '1');

-- 4. PERMISSÕES DO PERFIL ----------------------------------------------------
select pg_temp.expect_err('T22 func. NÃO altera a própria função', 'emp_buritis',
  $q$ with u as (update public.profiles set role = 'admin' where id = '{emp_buritis}' returning 1) select count(*)::text from u $q$, 'própria função');
select pg_temp.expect_err('T23 func. NÃO altera a própria unidade', 'emp_buritis',
  $q$ with u as (update public.profiles set store_id = '{centro}' where id = '{emp_buritis}' returning 1) select count(*)::text from u $q$, 'própria função');
select pg_temp.expect_err('T24 func. NÃO se reativa/desativa sozinho', 'emp_buritis',
  $q$ with u as (update public.profiles set active = false where id = '{emp_buritis}' returning 1) select count(*)::text from u $q$, 'própria função');
select pg_temp.expect_val('T25 a função continua "employee" depois das tentativas', 'postgres',
  $q$ select role::text from public.profiles where id = '{emp_buritis}' $q$, 'employee');
select pg_temp.expect_val('T26 func. NÃO altera perfil de outra pessoa (RLS esconde a linha)', 'emp_buritis',
  $q$ with u as (update public.profiles set full_name = 'Hackeado' where id = '{emp_centro}' returning 1) select count(*)::text from u $q$, '0');
select pg_temp.expect_val('T27 func. pode ajustar o próprio nome', 'emp_buritis',
  $q$ with u as (update public.profiles set full_name = 'Func Buritis Renomeado' where id = '{emp_buritis}' returning 1) select count(*)::text from u $q$, '1');
select pg_temp.expect_val('T28 admin altera função de outro usuário', 'admin',
  $q$ with u as (update public.profiles set full_name = 'Teste Func Centro' where id = '{emp_centro}' returning 1) select count(*)::text from u $q$, '1');
select pg_temp.expect_err('T29 admin NÃO altera a própria função (evita auto-bloqueio)', 'admin',
  $q$ with u as (update public.profiles set role = 'employee' where id = '{admin}' returning 1) select count(*)::text from u $q$, 'própria função');
select pg_temp.expect_err('T30 func. NÃO cadastra produto', 'emp_buritis',
  $q$ with i as (insert into public.products (sku, name) values ('HACK', 'Hack') returning 1) select count(*)::text from i $q$, 'row-level');
select pg_temp.expect_val('T31 func. NÃO altera produto (0 linhas)', 'emp_buritis',
  $q$ with u as (update public.products set name = 'Hack' where id = '{pA}' returning 1) select count(*)::text from u $q$, '0');
select pg_temp.save('pC', 'admin',
  $q$ with p as (insert into public.products (sku, name) values ('TST-C', 'Produto Teste C') returning id) select id::text from p $q$);
select pg_temp.expect_val('T32 admin cadastra produto e ele ganha saldo em todas as unidades', 'postgres',
  $q$ select (count(*) = (select count(*) from public.stores))::text from public.stock_balances where product_id = '{pC}' $q$, 'true');

-- 5. ESTOQUE NUNCA NEGATIVO -----------------------------------------------------
select pg_temp.expect_err('T33 saída maior que o saldo é recusada', 'admin',
  $q$ select public.register_exit('{central}', '{pA}', 11, 'teste')::text $q$, 'insuficiente');
select pg_temp.expect_val('T34 o saldo do central continua 10 após a recusa', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{central}' and product_id = '{pA}' $q$, '10');
select pg_temp.expect_err('T35 consumo maior que o saldo da loja é recusado', 'emp_buritis',
  $q$ select public.register_consumption('{pA}', 5, 'teste')::text $q$, 'insuficiente');
select pg_temp.expect_ok('T36 consumo dentro do saldo é aceito', 'emp_buritis',
  $q$ select public.register_consumption('{pA}', 1, 'uso em reparo')::text $q$);
select pg_temp.expect_val('T37 saldo de Buritis agora é 2', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}' $q$, '2');
select pg_temp.expect_err('T38 quantidade zero/negativa é recusada', 'admin',
  $q$ select public.register_entry('{central}', '{pA}', -5, 'x')::text $q$, 'inválida');

-- 6. IDEMPOTÊNCIA (duplo clique / reenvio) -------------------------------------
select pg_temp.expect_ok('T39 entrada com chave de idempotência (1ª vez)', 'admin',
  $q$ select public.register_entry('{central}', '{pB}', 5, 'idem', '11111111-1111-4111-8111-111111111111')::text $q$);
select pg_temp.expect_ok('T40 mesma chave (2ª vez) não gera nova movimentação', 'admin',
  $q$ select public.register_entry('{central}', '{pB}', 5, 'idem', '11111111-1111-4111-8111-111111111111')::text $q$);
select pg_temp.expect_val('T41 saldo de B no central = 25 (e não 30)', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{central}' and product_id = '{pB}' $q$, '25');

-- 7. TRANSFERÊNCIA: central -> loja, em trânsito, recebimento único ------------
select pg_temp.save('tr1', 'manager',
  $q$ select public.create_transfer('{central}', '{buritis}', '[{"product_id":"{pA}","quantity":4}]'::jsonb, 'teste')::text $q$);
select pg_temp.expect_val('T42 antes do envio nada muda no saldo do central', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{central}' and product_id = '{pA}' $q$, '10');
select pg_temp.expect_err('T43 func. de loja NÃO envia transferência', 'emp_buritis',
  $q$ select public.ship_transfer('{tr1}')::text $q$, 'não pode enviar');
select pg_temp.expect_ok('T44 responsável envia a transferência', 'manager',
  $q$ select 'ok' from (select public.ship_transfer('{tr1}')) s $q$);
select pg_temp.expect_val('T45 após o envio o central perdeu 4 (saldo 6)', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{central}' and product_id = '{pA}' $q$, '6');
select pg_temp.expect_val('T46 em trânsito: a loja de destino ainda NÃO recebeu (saldo 2)', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}' $q$, '2');
select pg_temp.expect_val('T47 a transferência aparece em v_transfers_in_transit', 'manager',
  $q$ select count(*)::text from public.v_transfers_in_transit where id = '{tr1}' $q$, '1');
select pg_temp.expect_err('T48 outra loja NÃO confirma o recebimento', 'emp_centro',
  $q$ select public.receive_transfer('{tr1}')::text $q$, 'destino');
select pg_temp.expect_ok('T49 a loja de destino confirma o recebimento', 'emp_buritis',
  $q$ select 'ok' from (select public.receive_transfer('{tr1}')) s $q$);
select pg_temp.expect_val('T50 após o recebimento Buritis tem 6', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}' $q$, '6');
select pg_temp.expect_err('T51 NÃO é possível receber a mesma transferência duas vezes', 'emp_buritis',
  $q$ select public.receive_transfer('{tr1}')::text $q$, 'já foi recebida');
select pg_temp.expect_err('T52 nem o admin consegue receber de novo', 'admin',
  $q$ select public.receive_transfer('{tr1}')::text $q$, 'já foi recebida');
select pg_temp.expect_val('T53 saldo de Buritis continua 6 (não duplicou)', 'postgres',
  $q$ select quantity::text from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}' $q$, '6');
select pg_temp.expect_err('T54 NÃO envia de novo uma transferência já enviada', 'manager',
  $q$ select public.ship_transfer('{tr1}')::text $q$, 'separação');
select pg_temp.expect_err('T55 transferência com origem = destino é recusada', 'admin',
  $q$ select public.create_transfer('{buritis}', '{buritis}', '[{"product_id":"{pA}","quantity":1}]'::jsonb)::text $q$, 'diferentes');
select pg_temp.expect_err('T56 responsável do central NÃO cria transferência saindo de loja', 'manager',
  $q$ select public.create_transfer('{buritis}', '{centro}', '[{"product_id":"{pA}","quantity":1}]'::jsonb)::text $q$, 'estoque central');
select pg_temp.save('tr3', 'admin',
  $q$ select public.create_transfer('{buritis}', '{centro}', '[{"product_id":"{pA}","quantity":2}]'::jsonb, 'entre lojas')::text $q$);
select pg_temp.expect_ok('T57 admin envia transferência entre lojas (Buritis -> Centro)', 'admin',
  $q$ select 'ok' from (select public.ship_transfer('{tr3}')) s $q$);
select pg_temp.expect_ok('T58 loja Centro recebe a transferência entre lojas', 'emp_centro',
  $q$ select 'ok' from (select public.receive_transfer('{tr3}')) s $q$);
select pg_temp.expect_val('T59 Buritis 4 e Centro 9 após a transferência entre lojas', 'postgres',
  $q$ select (select quantity from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}')::text
          || '/' || (select quantity from public.stock_balances where store_id = '{centro}' and product_id = '{pA}')::text $q$, '4/9');
select pg_temp.save('tr4', 'manager',
  $q$ select public.create_transfer('{central}', '{buritis}', '[{"product_id":"{pB}","quantity":1}]'::jsonb)::text $q$);
select pg_temp.expect_ok('T60 transferência ainda não enviada pode ser cancelada', 'manager',
  $q$ select 'ok' from (select public.cancel_transfer('{tr4}')) s $q$);

-- 8. FLUXO COMPLETO DE SOLICITAÇÃO ----------------------------------------------
select pg_temp.save('rq1', 'emp_buritis',
  $q$ select public.create_stock_request('[{"product_id":"{pA}","quantity":5},{"product_id":"{pB}","quantity":2}]'::jsonb,
        'preciso para a semana', '22222222-2222-4222-8222-222222222222')::text $q$);
select pg_temp.save('rq1b', 'emp_buritis',
  $q$ select public.create_stock_request('[{"product_id":"{pA}","quantity":5},{"product_id":"{pB}","quantity":2}]'::jsonb,
        'preciso para a semana', '22222222-2222-4222-8222-222222222222')::text $q$);
insert into _t (test, passed, detail)
select 'T61 reenvio com a mesma chave devolve a MESMA solicitação', pg_temp.c('rq1') = pg_temp.c('rq1b'), pg_temp.c('rq1')::text;
select pg_temp.expect_val('T62 existe só 1 solicitação com essa chave', 'postgres',
  $q$ select count(*)::text from public.stock_requests where requested_by = '{emp_buritis}' and idempotency_key = '22222222-2222-4222-8222-222222222222' $q$, '1');
select pg_temp.expect_val('T63 loja Centro NÃO vê a solicitação de Buritis', 'emp_centro',
  $q$ select count(*)::text from public.stock_requests where id = '{rq1}' $q$, '0');
select pg_temp.expect_val('T64 responsável do central vê a solicitação', 'manager',
  $q$ select count(*)::text from public.stock_requests where id = '{rq1}' $q$, '1');
select pg_temp.expect_val('T65 e vê os itens dela', 'manager',
  $q$ select count(*)::text from public.stock_request_items where request_id = '{rq1}' $q$, '2');
select pg_temp.expect_val('T66 loja Centro NÃO vê os itens da solicitação de Buritis', 'emp_centro',
  $q$ select count(*)::text from public.stock_request_items where request_id = '{rq1}' $q$, '0');
select pg_temp.expect_err('T67 func. NÃO aprova solicitação', 'emp_buritis',
  $q$ select public.approve_stock_request('{rq1}')::text $q$, 'permissão');
select pg_temp.expect_err('T68 aprovação parcial acima do solicitado é recusada', 'manager',
  $q$ select public.partially_approve_stock_request('{rq1}', '[{"product_id":"{pA}","quantity_approved":6}]'::jsonb)::text $q$, 'maior que a solicitada');
select pg_temp.expect_err('T69 aprovação parcial sem nenhum item é recusada', 'manager',
  $q$ select public.partially_approve_stock_request('{rq1}', '[{"product_id":"{pA}","quantity_approved":0}]'::jsonb)::text $q$, 'Nenhum item');
select pg_temp.expect_ok('T70 aprovação parcial (3 de A, 0 de B)', 'manager',
  $q$ select 'ok' from (select public.partially_approve_stock_request('{rq1}', '[{"product_id":"{pA}","quantity_approved":3}]'::jsonb, 'só temos 3')) s $q$);
select pg_temp.expect_val('T71 status da solicitação = partially_approved', 'postgres',
  $q$ select status::text from public.stock_requests where id = '{rq1}' $q$, 'partially_approved');
select pg_temp.expect_err('T72 não decide a mesma solicitação duas vezes', 'manager',
  $q$ select public.approve_stock_request('{rq1}')::text $q$, 'não está pendente');
select pg_temp.save('tr2', 'manager', $q$ select public.prepare_request_shipment('{rq1}')::text $q$);
select pg_temp.expect_val('T73 separação cria transferência só com o item aprovado (1 item)', 'postgres',
  $q$ select count(*)::text from public.stock_transfer_items where transfer_id = '{tr2}' $q$, '1');
select pg_temp.expect_val('T74 status da solicitação = preparing', 'postgres',
  $q$ select status::text from public.stock_requests where id = '{rq1}' $q$, 'preparing');
select pg_temp.expect_err('T75 não separa duas vezes a mesma solicitação', 'manager',
  $q$ select public.prepare_request_shipment('{rq1}')::text $q$, 'aprovada');
select pg_temp.expect_ok('T76 envio da solicitação', 'manager',
  $q$ select 'ok' from (select public.ship_transfer('{tr2}')) s $q$);
select pg_temp.expect_val('T77 status da solicitação = shipped e central A = 3', 'postgres',
  $q$ select (select status::text from public.stock_requests where id = '{rq1}') || '/'
          || (select quantity from public.stock_balances where store_id = '{central}' and product_id = '{pA}')::text $q$, 'shipped/3');
select pg_temp.expect_ok('T78 loja confirma o recebimento', 'emp_buritis',
  $q$ select 'ok' from (select public.receive_transfer('{tr2}')) s $q$);
select pg_temp.expect_val('T79 status = received e Buritis A = 7', 'postgres',
  $q$ select (select status::text from public.stock_requests where id = '{rq1}') || '/'
          || (select quantity from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}')::text $q$, 'received/7');
select pg_temp.expect_val('T80 a transferência gerou 2 movimentações (saída + entrada) referenciadas', 'postgres',
  $q$ select count(*)::text from public.stock_movements where reference_type = 'stock_transfer' and reference_id = '{tr2}' $q$, '2');

select pg_temp.save('rq2', 'emp_buritis',
  $q$ select public.create_stock_request('[{"product_id":"{pB}","quantity":1}]'::jsonb)::text $q$);
select pg_temp.expect_err('T81 recusa exige motivo', 'manager',
  $q$ select public.reject_stock_request('{rq2}', '')::text $q$, 'motivo');
select pg_temp.expect_ok('T82 responsável recusa com motivo', 'manager',
  $q$ select 'ok' from (select public.reject_stock_request('{rq2}', 'sem previsão de reposição')) s $q$);
select pg_temp.expect_val('T83 status = rejected', 'postgres',
  $q$ select status::text from public.stock_requests where id = '{rq2}' $q$, 'rejected');
select pg_temp.save('rq3', 'emp_buritis',
  $q$ select public.create_stock_request('[{"product_id":"{pB}","quantity":1}]'::jsonb)::text $q$);
select pg_temp.expect_err('T84 outra loja NÃO cancela solicitação alheia', 'emp_centro',
  $q$ select public.cancel_stock_request('{rq3}')::text $q$, 'feitas por você');
select pg_temp.expect_ok('T85 quem criou cancela a própria solicitação pendente', 'emp_buritis',
  $q$ select 'ok' from (select public.cancel_stock_request('{rq3}')) s $q$);
select pg_temp.expect_err('T86 solicitação com produto repetido é recusada', 'emp_buritis',
  $q$ select public.create_stock_request('[{"product_id":"{pA}","quantity":1},{"product_id":"{pA}","quantity":2}]'::jsonb)::text $q$, 'repetido');
select pg_temp.expect_err('T87 solicitação sem itens é recusada', 'emp_buritis',
  $q$ select public.create_stock_request('[]'::jsonb)::text $q$, 'ao menos um item');
select pg_temp.expect_err('T88 responsável do central NÃO cria solicitação (só funcionário de loja)', 'manager',
  $q$ select public.create_stock_request('[{"product_id":"{pA}","quantity":1}]'::jsonb)::text $q$, 'permissão');

-- 9. AJUSTES E DEVOLUÇÕES -----------------------------------------------------------
select pg_temp.expect_err('T89 ajuste exige justificativa', 'admin',
  $q$ select public.adjust_stock('{central}', '{pB}', 10, '')::text $q$, 'justificativa');
select pg_temp.expect_ok('T90 admin ajusta o saldo do central para 10 (contagem física)', 'admin',
  $q$ select public.adjust_stock('{central}', '{pB}', 10, 'contagem física')::text $q$);
select pg_temp.expect_val('T91 o ajuste gerou movimentação do tipo adjustment (-15)', 'postgres',
  $q$ select movement_type::text || ':' || quantity_delta::text from public.stock_movements
       where store_id = '{central}' and product_id = '{pB}' order by seq desc limit 1 $q$, 'adjustment:-15');
select pg_temp.save('ret1', 'emp_buritis',
  $q$ select public.request_return('{pA}', 1, 'cliente desistiu', 'good')::text $q$);
select pg_temp.expect_err('T92 devolução maior que o saldo da loja é recusada', 'emp_buritis',
  $q$ select public.request_return('{pA}', 999, 'teste', 'good')::text $q$, 'apenas');
select pg_temp.expect_err('T93 func. NÃO recebe devolução', 'emp_buritis',
  $q$ select public.receive_return('{ret1}')::text $q$, 'permissão');
select pg_temp.expect_ok('T94 responsável recebe a devolução (peça boa volta ao central)', 'manager',
  $q$ select 'ok' from (select public.receive_return('{ret1}')) s $q$);
select pg_temp.expect_val('T95 Buritis A = 6 e central A = 4', 'postgres',
  $q$ select (select quantity from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}')::text
          || '/' || (select quantity from public.stock_balances where store_id = '{central}' and product_id = '{pA}')::text $q$, '6/4');
select pg_temp.expect_err('T96 não recebe a mesma devolução duas vezes', 'manager',
  $q$ select public.receive_return('{ret1}')::text $q$, 'já foi tratada');
select pg_temp.save('ret2', 'emp_buritis',
  $q$ select public.request_return('{pA}', 1, 'tela com defeito', 'defective')::text $q$);
select pg_temp.expect_ok('T97 devolução defeituosa é recebida', 'manager',
  $q$ select 'ok' from (select public.receive_return('{ret2}')) s $q$);
select pg_temp.expect_val('T98 peça defeituosa sai da loja (5) e NÃO entra no central (4)', 'postgres',
  $q$ select (select quantity from public.stock_balances where store_id = '{buritis}' and product_id = '{pA}')::text
          || '/' || (select quantity from public.stock_balances where store_id = '{central}' and product_id = '{pA}')::text $q$, '5/4');

-- 10. SALDO SÓ MUDA COM MOVIMENTAÇÃO; HISTÓRICO E LOGS IMUTÁVEIS ---------------------
select pg_temp.expect_err('T99 alterar saldo "no braço" (sem movimentação) é barrado', 'postgres',
  $q$ select pg_temp.bump_balance() $q$, 'diverge');
select pg_temp.expect_err('T100 func. NÃO altera saldo direto pela API', 'emp_buritis',
  $q$ with u as (update public.stock_balances set quantity = 999 returning 1) select count(*)::text from u $q$, 'permission denied');
select pg_temp.expect_err('T101 admin também NÃO altera saldo direto pela API', 'admin',
  $q$ with u as (update public.stock_balances set quantity = 999 returning 1) select count(*)::text from u $q$, 'permission denied');
select pg_temp.expect_err('T102 admin NÃO edita movimentação pela API', 'admin',
  $q$ with u as (update public.stock_movements set quantity_delta = 1 returning 1) select count(*)::text from u $q$, 'permission denied');
select pg_temp.expect_err('T103 admin NÃO apaga movimentação pela API', 'admin',
  $q$ with d as (delete from public.stock_movements returning 1) select count(*)::text from d $q$, 'permission denied');
select pg_temp.expect_err('T104 nem o sistema (postgres) edita movimentação', 'postgres',
  $q$ with u as (update public.stock_movements set quantity_delta = 1 returning 1) select count(*)::text from u $q$, 'imutáveis');
select pg_temp.expect_err('T105 nem o sistema (postgres) apaga movimentação', 'postgres',
  $q$ with d as (delete from public.stock_movements returning 1) select count(*)::text from d $q$, 'imutáveis');
select pg_temp.expect_err('T106 TRUNCATE do histórico é barrado', 'postgres',
  $q$ select pg_temp.try_truncate() $q$, 'imutáveis');
select pg_temp.expect_err('T107 func. NÃO insere movimentação direto pela API', 'emp_buritis',
  $q$ with i as (insert into public.stock_movements (store_id, product_id, movement_type, quantity_delta, balance_before, balance_after, performed_by)
          values ('{buritis}', '{pA}', 'entry', 50, 5, 55, '{emp_buritis}') returning 1) select count(*)::text from i $q$, 'permission denied');
select pg_temp.expect_val('T108 func. NÃO enxerga logs de auditoria', 'emp_buritis',
  $q$ select count(*)::text from public.activity_logs $q$, '0');
select pg_temp.expect_val('T109 admin enxerga logs de auditoria', 'admin',
  $q$ select (count(*) > 0)::text from public.activity_logs $q$, 'true');
select pg_temp.expect_err('T110 func. NÃO apaga logs', 'emp_buritis',
  $q$ with d as (delete from public.activity_logs returning 1) select count(*)::text from d $q$, 'permission denied');
select pg_temp.expect_err('T111 admin NÃO edita logs pela API', 'admin',
  $q$ with u as (update public.activity_logs set action = 'INSERT' returning 1) select count(*)::text from u $q$, 'permission denied');
select pg_temp.expect_err('T112 nem o sistema (postgres) edita logs', 'postgres',
  $q$ with u as (update public.activity_logs set action = 'INSERT' returning 1) select count(*)::text from u $q$, 'imutáveis');
select pg_temp.expect_val('T113 todo saldo = soma das movimentações (livro-razão consistente)', 'postgres',
  $q$ select count(*)::text from public.stock_balances b
      where b.quantity <> coalesce((select sum(m.quantity_delta) from public.stock_movements m
                                     where m.store_id = b.store_id and m.product_id = b.product_id), 0) $q$, '0');
select pg_temp.expect_val('T114 cadeia de saldos íntegra (balance_before = balance_after anterior)', 'postgres',
  $q$ select count(*)::text from (
        select m.balance_before, lag(m.balance_after) over (partition by m.store_id, m.product_id order by m.seq) as prev
          from public.stock_movements m) x
      where x.balance_before <> coalesce(x.prev, 0) $q$, '0');
select pg_temp.expect_val('T115 toda movimentação foi auditada (activity_logs)', 'postgres',
  $q$ select ((select count(*) from public.activity_logs where table_name = 'stock_movements' and action = 'INSERT')
             = (select count(*) from public.stock_movements))::text $q$, 'true');
select pg_temp.expect_val('T116 o log registra QUEM alterou (ator = func. de Buritis)', 'postgres',
  $q$ select (count(*) >= 1)::text from public.activity_logs
       where table_name = 'profiles' and actor_id = '{emp_buritis}' and action = 'UPDATE' $q$, 'true');
select pg_temp.expect_val('T117 o log guarda valores anteriores e posteriores', 'postgres',
  $q$ select (count(*) >= 1)::text from public.activity_logs
       where table_name = 'profiles' and record_id = '{emp_buritis}' and old_data is not null and new_data is not null
         and old_data ->> 'full_name' is distinct from new_data ->> 'full_name' $q$, 'true');

-- 11. ACESSO ANÔNIMO, USUÁRIO INATIVO E NOVOS CADASTROS ----------------------------------
select pg_temp.expect_err('T118 anônimo NÃO lê saldos', 'anon',
  $q$ select count(*)::text from public.stock_balances $q$, 'permission denied');
select pg_temp.expect_err('T119 anônimo NÃO chama RPCs', 'anon',
  $q$ select public.register_entry('{central}', '{pA}', 1, 'x')::text $q$, 'permission denied');
select pg_temp.expect_err('T120 anônimo NÃO lê produtos', 'anon',
  $q$ select count(*)::text from public.products $q$, 'permission denied');
update public.profiles set active = false where id = pg_temp.c('emp_centro');
select pg_temp.expect_val('T121 usuário INATIVO não enxerga saldos', 'emp_centro',
  $q$ select count(*)::text from public.stock_balances $q$, '0');
select pg_temp.expect_val('T122 usuário INATIVO não enxerga produtos', 'emp_centro',
  $q$ select count(*)::text from public.products $q$, '0');
select pg_temp.expect_err('T123 usuário INATIVO não executa operações', 'emp_centro',
  $q$ select public.register_consumption('{pA}', 1, 'x')::text $q$, 'inativo');
insert into _ctx (k, val) values ('newbie', 'aaaaaaaa-0000-4000-8000-000000000005');
insert into auth.users (id, email, raw_user_meta_data)
values (pg_temp.c('newbie'), 'newbie@teste.local', '{"full_name":"Novo Usuário","role":"admin"}'::jsonb);
select pg_temp.expect_val('T124 cadastro novo nasce como employee, INATIVO e sem unidade (ignora "role" do metadata)', 'postgres',
  $q$ select role::text || '/' || active::text || '/' || coalesce(store_id::text, 'sem-unidade') from public.profiles where id = '{newbie}' $q$,
  'employee/false/sem-unidade');
select pg_temp.expect_val('T125 cadastro novo não vê dados do sistema', 'newbie',
  $q$ select count(*)::text from public.products $q$, '0');
select pg_temp.expect_err('T126 cadastro novo NÃO se ativa sozinho', 'newbie',
  $q$ with u as (update public.profiles set active = true, role = 'admin' where id = '{newbie}' returning 1) select count(*)::text from u $q$, 'própria função');

-- 12. VIEWS E RELATÓRIOS ------------------------------------------------------------------------
update public.products set min_stock = 50 where id = pg_temp.c('pA');
select pg_temp.expect_val('T127 produto abaixo do mínimo aparece em v_low_stock (admin)', 'admin',
  $q$ select (count(*) >= 1)::text from public.v_low_stock where product_id = '{pA}' $q$, 'true');
select pg_temp.expect_val('T128 v_stock_by_store respeita a RLS (func. de Buritis vê 1 unidade)', 'emp_buritis',
  $q$ select count(distinct store_id)::text from public.v_stock_by_store $q$, '1');
select pg_temp.expect_val('T129 v_stock_consolidated soma as unidades (admin): A = 4+5+9+0... > 0', 'admin',
  $q$ select (total_quantity > 0)::text from public.v_stock_consolidated where product_id = '{pA}' $q$, 'true');
select pg_temp.expect_ok('T130 relatório de entradas/saídas por período', 'admin',
  $q$ select count(*)::text from public.report_movements_by_period(now() - interval '1 day', now() + interval '1 day') $q$);
select pg_temp.expect_val('T131 produtos mais utilizados: consumo de A = 1', 'admin',
  $q$ select units_used::text from public.report_top_used_products(null, null, null, 5) where product_id = '{pA}' $q$, '1');
select pg_temp.expect_ok('T132 movimentações por funcionário', 'admin',
  $q$ select count(*)::text from public.report_movements_by_employee() $q$);
select pg_temp.expect_ok('T133 histórico de movimentações (função)', 'emp_buritis',
  $q$ select count(*)::text from public.get_movement_history(p_limit => 5) $q$);
select pg_temp.expect_val('T134 histórico do func. só traz a própria unidade', 'emp_buritis',
  $q$ select count(distinct store_id)::text from public.get_movement_history(p_limit => 500) $q$, '1');
select pg_temp.expect_ok('T135 relatório de transferências', 'admin',
  $q$ select count(*)::text from public.report_transfers() $q$);

-- ---------------------------------------------------------------------
-- RELATÓRIO FINAL (erro proposital => ROLLBACK de tudo)
-- ---------------------------------------------------------------------
do $$
declare
  v_pass integer;
  v_fail integer;
  v_list text;
begin
  select count(*) filter (where passed), count(*) filter (where not passed) into v_pass, v_fail from _t;
  select string_agg((case when passed then 'OK    ' else 'FALHA ' end) || test
                    || case when passed then '' else '  -> ' || coalesce(detail, '') end, E'\n' order by id)
    into v_list from _t;
  raise exception E'RESULTADO DOS TESTES: % aprovados, % reprovados.\n%\n\n(Transação revertida de propósito: nenhum dado de teste ficou no banco.)',
    v_pass, v_fail, v_list;
end $$;
