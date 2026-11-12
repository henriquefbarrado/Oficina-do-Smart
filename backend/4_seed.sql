-- =====================================================================
-- seed.sql  |  ORDEM DE EXECUÇÃO: 4 de 7
-- Cadastro inicial: as 6 unidades e as categorias de partida.
-- Pode ser executado mais de uma vez sem duplicar nada.
-- =====================================================================

insert into public.stores (name, kind) values
  ('Estoque Central', 'central'),
  ('Buritis',         'branch'),
  ('Centro',          'branch'),
  ('Savassi',         'branch'),
  ('Pampulha',        'branch'),
  ('Barreiro',        'branch')
on conflict do nothing;

insert into public.categories (name) values
  ('Telas'), ('Baterias'), ('Carregadores'), ('Películas'), ('Acessórios')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- PRIMEIRO ADMINISTRADOR (faça manualmente, uma única vez)
--  1) Supabase > Authentication > Users > Add user > Create new user
--     (informe e-mail e senha forte e marque "Auto Confirm User").
--  2) Rode o comando abaixo trocando o e-mail pelo que você criou.
--     (No SQL Editor auth.uid() é nulo = operação de sistema, por isso a
--      proteção do perfil permite esta promoção.)
--
-- update public.profiles
--    set role = 'admin', active = true, store_id = null, full_name = 'Seu Nome'
--  where lower(email) = lower('seu-email@empresa.com');
--
-- Os demais usuários são criados pelo admin dentro do sistema, pela Edge
-- Function admin-create-user (veja o README).
-- ---------------------------------------------------------------------
