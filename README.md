<div align="center">

# 📱 Oficina do Smart

**Gestão de peças, estoque, manutenções e transferências para a rede de lojas.**

![HTML](https://img.shields.io/badge/HTML-CSS-JS-F5C518?style=flat-square&labelColor=0a0a0a)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20RLS-3ECF8E?style=flat-square&labelColor=0a0a0a)
![Cloudflare](https://img.shields.io/badge/Hospedagem-Cloudflare-F38020?style=flat-square&labelColor=0a0a0a)

</div>

Sistema web que controla o caminho de cada peça, do pedido ao uso no balcão, nas lojas **Buritis, Savassi, Centro, Belvedere e Castelo**, mais o **Estoque Central**. Cada peça física tem código próprio (ex.: `PED-0001-01`) e um rastro completo de tudo o que aconteceu com ela.

---

## ✨ O que o sistema faz

| Área | O que você consegue fazer |
|---|---|
| **Dashboard** | Pedidos por unidade, peças mais pedidas/usadas/devolvidas, valor comprado e movimentação recente. |
| **Pedidos** | A loja solicita a peça escolhendo **fornecedor** e **valor da peça**. O pedido já nasce **aprovado**, sem depender do administrador. O admin registra compra, recebimento e entrega, e pode **excluir** qualquer pedido. |
| **Controle de Peças** | Lista de todas as peças com código, local, status e valor. Utilizar, devolver, enviar para manutenção, descartar e **editar o status** (ex.: tela iPhone 11 → *Utilizada*). Clique no código para ver o rastro completo. |
| **Manutenção (OS)** | Cadastro de ordens de serviço: número da OS, cliente, serviço realizado, peça utilizada, valor cobrado, valor pago na peça e técnico. No fim, a soma de **valor cobrado**, **valor gasto** e **lucro**. |
| **Catálogo de Peças** | Cadastre a peça uma vez (fornecedor padrão + valor). Nos pedidos, fornecedor e valor entram sozinhos. |
| **Fornecedores** | Cadastro de fornecedores e histórico de compras por fornecedor. |
| **Estoques** | Saldo e valor por local, entrada de peças no Estoque Central e saída para lojas. |
| **Transferências** | Entre lojas: a loja destino solicita → a loja de origem dá o OK → o admin aprova. |
| **Histórico** | Registro permanente de cada movimentação, com busca e filtro por loja e data. |
| **Relatórios** | Exportação em CSV (abre no Excel). |
| **Usuários** | O admin cria acessos, redefine senhas, troca a loja e ativa/desativa pessoas. |

---

## 🔐 Regras de acesso

As regras valem **no banco de dados** (Row Level Security e funções do Postgres), e não só nos botões da tela.

- **Administrador:** único do sistema. Vê e movimenta qualquer unidade e tem poder total sobre pedidos, manutenções e catálogo. Pode usar **👁 Ver unidade** para olhar uma loja específica.
- **Funcionário:** entra só na própria loja e só enxerga e movimenta as peças dela. Nunca vira administrador.
- **Quem cria acessos:** apenas o administrador. O cadastro público fica desligado.
- **Usuário desativado** perde o acesso na hora.

---

## 🧱 Como é feito

- **Front-end:** HTML, CSS e JavaScript puros, sem etapa de build.
- **Banco e login:** [Supabase](https://supabase.com) (Auth + Postgres + RLS).
- **Hospedagem:** [Cloudflare](https://cloudflare.com), com deploy automático a cada `git push`.

```
index.html     estrutura da página
script.js      telas e chamadas ao banco
style.css      visual (tema preto e amarelo)
config.js      URL e chave pública do Supabase
supabase.sql   banco de dados completo (rodar no Supabase)
wrangler.jsonc configuração da hospedagem na Cloudflare
```

> Os arquivos `gestpecas.html`, `app.js` e as pastas `web/` e `backend/` são de versões antigas e não são usados pelo site.

---

## 🚀 Como colocar no ar

### 1. Banco de dados (Supabase)

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**, cole o conteúdo do `supabase.sql` **inteiro** e execute. Pode rodar de novo sem perder dados.
3. Em **Authentication → Providers → Email**, desative **Allow new users to sign up**.
4. Em **Authentication → URL Configuration**, coloque o endereço do seu site em **Site URL**.

### 2. Configuração do site

Em **Project Settings → API**, copie a *Project URL* e a chave **anon/publishable** para o `config.js`:

```js
const SB_URL = 'https://SEU-PROJETO.supabase.co';   // só o endereço, sem nada na frente
const SB_KEY = 'sb_publishable_...';                // chave pública
```

> ⚠️ Use sempre a chave **publishable/anon**. Nunca coloque a `service_role` no site.

### 3. Publicação (Cloudflare)

1. Suba o projeto para o GitHub.
2. Na Cloudflare, em **Workers & Pages**, conecte o repositório. Deixe o *build command* vazio e use `npx wrangler deploy` como comando de deploy.
3. Ative o endereço `workers.dev` em **Settings → Domains & Routes** (ou use um domínio próprio).

Cada `git push` na branch `main` publica a nova versão sozinho.

### 4. Primeiro acesso

O `supabase.sql` cria o login do administrador. **Entre e troque a senha imediatamente** em **Usuários → Redefinir senha**.

---

## 🛡️ Segurança do repositório

- **Não deixe o `supabase.sql` em repositório público.** Ele contém a senha inicial do administrador. Guarde esse arquivo fora do GitHub, ou remova a senha dele antes de publicar.
- Mantenha um `.assetsignore` para a Cloudflare **não publicar** arquivos que o site não usa (`*.sql`, `backend/`, `web/` etc.).
- Nunca versionar tokens de API, a chave `service_role` ou senhas.

---

## 🔄 Fluxo de uma peça

```
Solicitada → Comprada → Recebida (Estoque Central) → Em estoque da loja → Utilizada
                                                          ↘ Devolvida · Em manutenção · Descartada
```

Cada mudança de status grava quem fez, quando e o motivo, no rastro da peça e no histórico geral.

---

<div align="center">

Feito para a rotina das lojas da **Oficina do Smart**.

</div>
