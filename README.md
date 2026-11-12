# GestPeças

Demonstração de um sistema de gestão de peças, estoque e rastreabilidade para uma rede de 5 lojas de celulares e manutenção. Tudo roda no navegador, sem servidor e sem instalação.

## Como usar

1. Abra `gestpecas.html` no navegador (computador ou celular).
2. Escolha a unidade (ou "Administrador"), confirme o nome e digite a senha `demo`.

Os arquivos separados (`index.html`, `style.css`, `script.js`) têm o mesmo conteúdo, caso prefira editar o código por partes.

## Perfis

- **Administrador:** vê todas as lojas, aprova pedidos, registra compras, recebimentos e entregas, e acessa Fornecedores, Estoques, Relatórios e Configurações.
- **Loja:** vê apenas seus próprios pedidos, peças e movimentações, e pode solicitar peças, utilizar, devolver, transferir e enviar para manutenção.

## Fluxo de um pedido

Solicitação → Aprovação → Compra → Recebimento → Entrega à loja.

Ao registrar a compra, o sistema cria uma peça individual para cada unidade (ex.: `PED-0001-01`). Cada peça guarda seu rastro completo: quem mudou o status, quando e por quê. Clique no código da peça para ver.

## Cadastro automático, entradas e saídas (administrador)

- **Catálogo de Peças:** cadastre a peça uma vez (nome, modelo, fornecedor padrão e valor). A solicitação da loja, a compra e a entrada de estoque preenchem fornecedor e valor sozinhos. Ao registrar uma compra, o catálogo se atualiza.
- **Estoques → Entrada de peças:** registra peças que entram no estoque central, com fornecedor e valor.
- **Estoques → Saída para loja:** envia peças do central para uma loja (bloqueia quantidade maior que o saldo).
- **Somas:** valor total em pedidos, nas peças, por estoque e por item do catálogo.
- **Ver unidade:** no menu lateral, o administrador escolhe uma loja (ex.: Savassi) e vê pedidos, peças e histórico daquela unidade. Volte para "Todas as unidades" para a visão geral.

## Acessos, transferências e limites por loja

- **Usuários (admin):** o administrador cria funcionários (nome, loja e senha), redefine senhas e ativa/desativa. Usuários criados nunca são administradores. Só o Patrick é admin.
- **Limite por loja:** funcionário só vê e movimenta peças da própria loja (a regra é aplicada no núcleo do sistema, não só nos botões). O administrador não tem essa limitação.
- **Transferência entre lojas:** a loja que recebe solicita → **somente a loja de origem** dá o OK → o administrador aprova → as peças são movidas, com registro no Histórico das duas lojas.
- Senhas de demonstração: `demo` para todos os usuários iniciais.

## Status das peças

Solicitada, Recebida, Em estoque da unidade, Disponível, Utilizada, Devolvida, Aguardando manutenção, Em manutenção e Descartada.

## Regras de integridade

- Não é possível utilizar uma peça que não esteja em estoque na unidade, nem usar a mesma peça duas vezes.
- Não é possível devolver ou transferir uma peça que não esteja disponível na unidade (sem saldo negativo).
- O histórico só recebe novos registros; nada é apagado ou sobrescrito.
- Os indicadores são recalculados a cada ação.

## Cenário de teste (já carregado)

O pedido `PED-0001` reproduz o exemplo do briefing: a loja Buritis pede 5 telas de iPhone 11, compradas do fornecedor Henrique a R$ 200,00 cada (R$ 1.000,00). 2 são devolvidas e 3 são utilizadas. Confira em **Histórico** e em **Controle de Peças**.

## Dados e persistência

- Os dados ficam no LocalStorage do navegador onde o arquivo foi aberto. Outro navegador ou aparelho começa com os dados de demonstração.
- Limpar os dados do navegador apaga as alterações. O administrador pode usar **Restaurar demo** para voltar ao estado inicial.
- Os nomes das lojas são editáveis em **Configurações** (perfil Administrador).

## Relatórios

Em **Relatórios** é possível exportar em CSV (abre no Excel): pedidos, compras, peças, utilizadas, devolvidas, em manutenção e histórico. O Histórico também exporta o resultado dos filtros aplicados.

## Limitações da demonstração

- A senha é única (`demo`) e o login é simulado no JavaScript; não há segurança real.
- Devoluções, utilização e manutenção são feitas peça a peça, não por quantidade.
- Os gráficos são barras simples em CSS.
- Não há sincronização entre aparelhos: cada navegador tem seus próprios dados.
