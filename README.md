# Oficina do Smart (Supabase)

Sistema de peças, estoque, fornecedores e transferências das lojas **Buritis, Savassi, Centro, Belvedere e Castelo** (+ Estoque Central).

## Como colocar no ar

1. **Supabase → SQL Editor:** cole o `supabase.sql` inteiro e rode (cria todas as tabelas, regras de acesso, funções e o login do Patrick). Pode rodar de novo sem perder dados.
2. **Supabase → Authentication → Providers → Email:** desative "Allow new users to sign up" (só o admin cria acessos, pela tela Usuários).
3. **Supabase → Project Settings → API:** copie a *Project URL* e a chave *anon/publishable* para o `config.js`.
4. Abra o `index.html` (ou suba a pasta na Vercel). Login do admin: `patrickcotrin@gmail.com`.
5. Entre e troque a senha em **Usuários → Redefinir senha** (a senha inicial está escrita no `supabase.sql`; não suba esse arquivo para repositório público).

## Regras (todas aplicadas no banco, não só nos botões)

- **Admin (Patrick):** único admin do sistema. Vê e movimenta qualquer unidade; usa **👁 Ver unidade** para olhar tudo o que aconteceu na Savassi, etc.
- **Funcionário:** só entra na própria loja e só enxerga/movimenta peças dela. Nunca vira admin.
- **Transferência entre lojas:** loja destino solicita → **somente a loja de origem** dá o OK → admin aprova → peças se movem (histórico nas duas lojas).
- **Usuários:** o admin cria login (nome, e-mail, loja, senha), redefine senha, troca a loja e ativa/desativa. Usuário desativado perde o acesso na hora.
- **Cadastro automático:** Catálogo de Peças (peça + fornecedor padrão + valor). Ao pedir, comprar ou dar entrada, fornecedor e valor entram sozinhos; a compra atualiza o catálogo.
- **Entradas e saídas:** Estoques → *Entrada de peças* (fornecedor + valor) e *Saída para loja* (bloqueia acima do saldo).
- **Somas:** valor total em pedidos, peças, por estoque/loja e por item do catálogo.

## Arquivos

`supabase.sql` (banco) · `config.js` (URL e chave) · `index.html`, `style.css`, `script.js` (tela).
O antigo `gestpecas.html` (demo com LocalStorage e senha `demo`) foi removido.
