-- ---------------------------------------------------------------------
-- 12) TÉCNICO CADASTRA PEÇA
--     O técnico cadastra peça direto no ESTOQUE DA PRÓPRIA LOJA (nome,
--     modelo, quantidade, fornecedor e valor). A peça nasce "Em estoque da
--     unidade", com código próprio, rastro e Histórico, igual às demais.
--     Não dá acesso a mais nada: não mexe no Estoque Central, em outras
--     lojas, nem altera fornecedor/valor padrão de peça que já existe no
--     catálogo. Só ADICIONA uma função e pode rodar de novo.
--     Precisa do migracao_tecnico.sql já rodado (is_technician).
-- ---------------------------------------------------------------------
create or replace function public.part_register(p_name text, p_model text, p_qty int, p_supplier_id bigint, p_price numeric)
returns text language plpgsql security definer set search_path = public as $$
declare a public.profiles := public._actor();
        n text := trim(coalesce(p_name,'')); m text := trim(coalesce(p_model,''));
        s public.suppliers; c public.catalog; o public.orders; i int; uid text;
begin
  perform public._need(a.is_technician, 'Somente o técnico cadastra peças por aqui.');
  perform public._need(exists(select 1 from public.stores where id = a.store_id and kind = 'loja'), 'Seu usuário não está em uma loja.');
  perform public._need(n <> '' and m <> '', 'Informe a peça e o modelo.');
  perform public._need(coalesce(p_qty,0) between 1 and 200, 'Quantidade inválida (de 1 a 200).');
  perform public._need(coalesce(p_price,0) > 0, 'Informe o valor unitário.');
  select * into s from public.suppliers where id = p_supplier_id;
  perform public._need(s.id is not null, 'Fornecedor inválido.');

  -- catálogo: reaproveita a grafia que já existe (evita "tela" e "Tela" como peças diferentes);
  -- se não existe, cria. Peça que já existe NÃO tem fornecedor nem valor padrão alterados.
  select * into c from public.catalog where lower(name) = lower(n) and lower(model) = lower(m) limit 1;
  if c.id is null then
    insert into public.catalog(name, model, supplier_id, unit_price) values (n, m, s.id, p_price);
  else
    n := c.name; m := c.model;
  end if;

  insert into public.orders(store_id,part_name,model,qty,supplier_id,supplier_name,price,est,note,status,created_by,created_by_name,buy_at,buyer_name)
  values (a.store_id,n,m,p_qty,s.id,s.name,p_price,p_price,'Cadastro de peça pelo técnico','Entregue',a.id,a.name,now(),a.name)
  returning * into o;

  for i in 1..p_qty loop
    uid := o.id || '-' || lpad(i::text, 2, '0');
    insert into public.units(id,order_id,part_name,model,status,loc_store_id,origin_store_id,cost)
    values (uid,o.id,n,m,'Em estoque da unidade',a.store_id,a.store_id,p_price);
    insert into public.unit_trail(unit_id,by_name,from_status,to_status,note)
    values (uid,a.name,'—','Em estoque da unidade','Cadastro de peça pelo técnico');
  end loop;

  perform public._log(a,'Compra',a.store_id,n||' '||m,p_qty,'—','Em estoque da unidade',
    o.id||' · cadastro pelo técnico · R$ '||replace(to_char(p_qty*p_price,'FM999999990.00'),'.',','),s.name,null);
  return o.id;
end $$;

revoke all on function public.part_register(text, text, int, bigint, numeric) from public, anon;
grant execute on function public.part_register(text, text, int, bigint, numeric) to authenticated;

notify pgrst, 'reload schema';
