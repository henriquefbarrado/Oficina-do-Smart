<div align="center">

<img src="assets/hero.svg" alt="Oficina do Smart" width="100%">

<br>

![Front-end](https://img.shields.io/badge/Front--end-HTML%20·%20CSS%20·%20JS-F5C518?style=for-the-badge&labelColor=0a0a0a)
![Supabase](https://img.shields.io/badge/Banco-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=0a0a0a)
![Cloudflare](https://img.shields.io/badge/Hospedagem-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white&labelColor=0a0a0a)

**[Funcionalidades](#-funcionalidades)** · **[Fluxo da peça](#-fluxo-da-peça)** · **[Regras de acesso](#-regras-de-acesso)** · **[Como colocar no ar](#-como-colocar-no-ar)** · **[Segurança](#-segurança-do-repositório)**

</div>

<br>

Sistema web que acompanha cada peça **do pedido até o uso no balcão** nas lojas Buritis, Savassi, Centro, Belvedere e Castelo, mais o Estoque Central. Cada peça física tem **código próprio** (ex.: `PED-0001-01`) e um **rastro completo** de tudo o que aconteceu com ela: quem mexeu, quando e por quê.

<br>

## 🔄 Fluxo da peça

<img src="assets/flow.svg" alt="Solicitada, comprada, recebida, na loja, utilizada" width="100%">

<br>

## ✨ Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

### 📦 Pedidos
A loja solicita escolhendo o **fornecedor** e o **valor da peça**. O pedido já nasce **aprovado**, sem esperar o administrador. O admin registra compra, recebimento e entrega, e tem **poder total para excluir** qualquer pedido.

### 🧩 Controle de Peças
Todas as peças com código, local, status e valor. Utilizar, devolver, enviar para manutenção, descartar e **editar o status** (ex.: *tela iPhone 11 → Utilizada*). Clique no código para ver o rastro.

### 🔧 Manutenção (OS)
Cadastro de ordens de serviço com **número da OS, cliente, serviço realizado, peça utilizada, valor cobrado, valor pago na peça e técnico**. No rodapé, a soma de **valor cobrado**, **valor gasto** e **lucro**.

### 🧾 Fechamento Técnico
Registro diário dos serviços feitos pelos técnicos: **OS, cliente, serviço realizado, valor da peça, valor cobrado e fornecedor**. Cada preenchimento vira um **registro individual** com a **data salva automaticamente**. Todos os usuários consultam os fechamentos anteriores (busca, filtro por período e totais); o técnico preenche e pode filtrar **só os seus**.

### 🎮 Manutenção de Manetes
Controle das manetes em reparo: **número da OS, loja de origem e status** (*Aguardando peças*, *Sem reparo*, *Pronta* ou *Enviada para reparo em placa*). **Todos veem** os status; **só o técnico** cadastra, atualiza o status, edita e exclui.

</td>
<td width="50%" valign="top">

### 📚 Catálogo e Fornecedores
As peças são cadastradas na aba de estoque. O catálogo guarda o fornecedor padrão e o valor, que você ajusta aqui, e nos pedidos tudo entra sozinho. O histórico de compras fica por fornecedor.

### 🏬 Estoques e Transferências
Quantidade e valor das peças disponíveis por local, **cadastro de peça direto no estoque** (um único formulário: nome, modelo, quantidade, **loja**, fornecedor e valor; a peça é criada e já entra na loja escolhida (Estoque Central, Buritis, Belvedere etc.), e se já existir só soma a quantidade), entrada em lote de peças já cadastradas, saída para lojas, **exclusão de peça** (botão Excluir em cada linha; o histórico é mantido) **exportar o estoque em planilha** (.xlsx) e **importar planilha** (.xlsx ou .csv) para dar entrada de peças no Estoque Central ou direto numa loja, com prévia e validação antes de lançar. Entre lojas, a transferência passa por **OK da loja de origem → aprovação do admin**.

### 📊 Dashboard, Histórico e Relatórios
Pedidos por unidade, peças mais usadas e devolvidas, movimentação mensal. Histórico permanente com busca e filtros, e exportação em **CSV** (abre no Excel).

### 🏭 Estoque Central
Aba aberta a **todos os usuários**: quantidade disponível por peça, valor unitário e valor total em estoque, com busca. Funcionários e técnicos só consultam; entrada e saída continuam com o administrador.

### 👥 Usuários
O admin cria acessos de qualquer perfil (**funcionário**, **técnico** ou **administrador**), promove ou remove administradores, redefine senhas, troca a loja, ativa, desativa e **exclui** pessoas. Tudo isso fica dentro de um único botão **Editar** em cada usuário.

</td>
</tr>
</table>

### Transferência entre lojas

<img src="assets/transfer.svg" alt="A loja destino solicita, a loja de origem dá o OK e o administrador aprova" width="100%">

<br>

## 🔐 Regras de acesso

As regras valem **dentro do banco de dados** (Row Level Security e funções do Postgres), e não só nos botões da tela.

| Quem | O que pode |
|---|---|
| 👑 **Administrador** | Pode haver mais de um. Vê e movimenta todas as unidades, compra, recebe, entrega, exclui pedidos, manutenções e peças do catálogo, e gerencia usuários. |
| 🧑‍🔧 **Funcionário** | Entra só na própria loja. Faz pedidos (sem aprovação), usa e devolve peças, cadastra manutenções e pede transferências, e **consulta o Estoque Central**. Só vira administrador se outro administrador promover. |
| 🔧 **Técnico** | Tem as mesmas abas e permissões do funcionário (só a própria loja) e, além disso, preenche o **Fechamento Técnico** e cadastra, atualiza, edita e exclui **manetes**. O admin define quem é técnico em **Usuários → Tornar técnico**. |
| 🚫 **Usuário desativado** | Perde o acesso na hora. |

O cadastro público fica desligado: **só o administrador cria acessos**.

> O **Fechamento Técnico** e a **Manutenção de Manetes** são visíveis para **todos os usuários ativos, de todas as lojas**. Quem escreve é só o técnico, e isso também é verificado no banco.

<br>

## 🧱 Como é feito

| | |
|---|---|
| **Front-end** | HTML, CSS e JavaScript puros, sem etapa de build |
| **Login e banco** | [Supabase](https://supabase.com): Auth + Postgres + RLS |
| **Hospedagem** | [Cloudflare](https://www.cloudflare.com), com deploy automático a cada `git push` |

```
index.html        estrutura da página
script.js         telas e chamadas ao banco
style.css         visual (tema preto e amarelo)
config.js         URL e chave pública do Supabase
supabase.sql      banco de dados completo (rodar no Supabase; não vai para o GitHub)
migracao_tecnico.sql  perfil de técnico, Fechamento Técnico e Manetes (para bancos já existentes)
migracao_usuarios_estoque.sql  vários administradores e Estoque Central visível a todos (para bancos já existentes)
backend/edge-function/logar-como.ts  função do Supabase para o admin entrar na conta de outro usuário (ver passo abaixo)
migracao_visibilidade.sql  garante que todo usuário novo enxergue os dados da própria loja e o histórico do Estoque Central (para bancos já existentes)
migracao_estoque_central.sql  função que garante o Estoque Central visível a técnicos e funcionários (para bancos já existentes)
migracao_excluir_usuario.sql  função para o administrador excluir usuários (para bancos já existentes)
migracao_excluir_peca_e_loja.sql  função para excluir peça do estoque (para bancos já existentes)
wrangler.jsonc    configuração da hospedagem
assets/           imagens animadas deste README
```

> `gestpecas.html`, `app.js` e as pastas `web/` e `backend/` são de versões antigas e não são usados pelo site.

<br>

## 🚀 Como colocar no ar

<details>
<summary><b>1 · Banco de dados (Supabase)</b></summary>

<br>

1. Crie um projeto no [Supabase](https://supabase.com).
2. Abra o **SQL Editor**, cole o `supabase.sql` **inteiro** e execute. Pode rodar de novo sem perder dados, mas **ele volta a senha do administrador para a inicial**.
   - **Banco que já está em uso?** Rode **somente** o `migracao_tecnico.sql`. Ele só acrescenta o perfil de técnico, o Fechamento Técnico e as Manetes, não mexe em nada que já existe e pode ser rodado mais de uma vez.
3. Em **Authentication → Providers → Email**, desative **Allow new users to sign up**.
4. Em **Authentication → URL Configuration**, coloque o endereço do seu site em **Site URL**.

</details>

<details>
<summary><b>2 · Configuração do site</b></summary>

<br>

Em **Project Settings → API**, copie a *Project URL* e a chave **publishable/anon** para o `config.js`:

```js
const SB_URL = 'https://SEU-PROJETO.supabase.co';  // só o endereço, sem nada na frente
const SB_KEY = 'sb_publishable_...';               // chave pública
```

> ⚠️ Use sempre a chave **publishable/anon**. Nunca coloque a `service_role` no site.

</details>

<details>
<summary><b>3 · Publicação (Cloudflare)</b></summary>

<br>

1. Suba o projeto para o GitHub.
2. Na Cloudflare, em **Workers & Pages**, conecte o repositório. Deixe o *build command* vazio e use `npx wrangler deploy` como comando de deploy.
3. Ative o endereço `workers.dev` em **Settings → Domains & Routes**, ou use um domínio próprio.

Cada `git push` na branch `main` publica a nova versão sozinho.

</details>

<details>
<summary><b>Botão "Logar como" (opcional)</b></summary>

<br>

O administrador pode entrar na conta de funcionários e técnicos sem a senha, pelo botão **Logar como** em **Usuários**. Para isso é preciso publicar uma função no Supabase:

1. No Supabase, abra **Edge Functions → Deploy a new function → Via Editor**.
2. Cole o conteúdo de `backend/edge-function/logar-como.ts`. O Supabase pode gerar um nome automático (ex.: `smooth-service`). O nome usado pelo site está em `script.js`, na linha com `sb.functions.invoke(`; ele precisa ser igual ao da função publicada (hoje: `smooth-service`).
3. Nas configurações da função, **desligue "Verify JWT"** (a própria função confere se quem chamou é administrador) e publique.

Só administradores ativos conseguem usar. Não funciona para outro administrador nem para usuário desativado. Enquanto estiver na conta de outra pessoa, aparece uma faixa no topo com o botão **Voltar para minha conta**. Atenção: o que for feito ali fica registrado no nome dessa pessoa.

</details>

<details>
<summary><b>4 · Primeiro acesso</b></summary>

<br>

O `supabase.sql` cria o login do administrador. **Entre e troque a senha imediatamente** em **Usuários → Redefinir senha**.

Depois de rodar o `migracao_usuarios_estoque.sql`, o administrador também pode criar **outros administradores** (perfil *Administrador* em **+ Novo usuário**, ou **Tornar admin** na lista).

Para criar um técnico, use **Usuários → + Novo usuário** e escolha o perfil **Técnico**, ou clique em **Tornar técnico** em um usuário já existente.

</details>

<br>

## 🛡️ Segurança do repositório

- O `migracao_tecnico.sql` não tem senhas e pode ficar no repositório. Ele é rodado à mão no SQL Editor; a Cloudflare não o publica por causa do `.assetsignore`.
- **Não deixe o `supabase.sql` em repositório público.** Ele contém a senha inicial do administrador. Guarde-o fora do GitHub ou remova a senha antes de publicar.
- Mantenha um `.assetsignore` para a Cloudflare **não publicar** arquivos que o site não usa (`*.sql`, `backend/`, `web/` etc.).
- Nunca versione tokens de API, a chave `service_role` ou senhas.

<br>

<img src="assets/footer.svg" alt="Oficina do Smart" width="100%">
