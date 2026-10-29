# Instalação do painel administrativo PIBVL

**Importante:** estes arquivos já estão no repositório do site, mas isso não publica nem altera o projeto Google Apps Script automaticamente. O painel só deve ser usado depois de instalar e testar o código abaixo no Apps Script.

## 1. Faça uma cópia de segurança
1. Abra o projeto Google Apps Script que está ligado à planilha.
2. Faça uma cópia do código atual de `Code.gs` em um arquivo de texto local, para poder restaurar se necessário.
3. Não apague o código atual: ele mantém o cadastro público e a consulta de batismo funcionando.

## 2. Adicione os dois arquivos administrativos
No editor do Apps Script:
1. Clique no **+** ao lado de Arquivos e crie um arquivo de script chamado `AdminFunctions`.
2. Copie todo o conteúdo de [AdminFunctions.gs](AdminFunctions.gs) para ele.
3. Clique no **+** e crie um arquivo HTML chamado exatamente `Admin`.
4. Copie todo o conteúdo de [Admin.html](Admin.html) para ele.

## 3. Faça uma pequena alteração no doGet existente
No início da função `doGet(e)`, logo depois desta linha:

```javascript
const parametros = (e && e.parameter) || {};
```

adicione:

```javascript
if (parametros.painel === "1") {
  return HtmlService.createHtmlOutputFromFile("Admin")
    .setTitle("Painel Administrativo | PIB Vaz Lobo");
}
```

Não substitua o restante do `doGet`: a consulta de batismo do formulário público depende dele.

## 4. Confira o OAuth Client ID
O arquivo `Admin.html` usa este Client ID público do Google Identity Services:
`2825703529-k89sf13k5lt42mtq6g0bi8r3cmm4c3tn.apps.googleusercontent.com`

No Google Cloud Console, confira se o domínio de origem permitido inclui o endereço que realmente hospeda a tela de login. O painel é servido pelo Apps Script, então a autenticação pode exigir incluir a origem Google apropriada no cliente OAuth. **Nunca coloque o Client Secret no HTML ou no repositório.** Se o segredo apareceu em uma captura compartilhada, revogue-o/regenere-o no Console; este fluxo usa o Client ID, não o segredo.

## 5. Autorize e publique uma nova versão
1. Salve os arquivos.
2. Execute manualmente uma função que acesse a planilha, se o Apps Script pedir autorização, e conceda apenas as permissões necessárias.
3. Vá em **Implantar → Gerenciar implantações**, edite a implantação do tipo aplicativo da web e escolha **Nova versão**.
4. Mantenha o acesso da implantação compatível com o funcionamento atual do formulário público; não altere essa opção sem testar o formulário.
5. Abra a URL atual da implantação terminando em `/exec?painel=1`.

## 6. Teste antes de usar com dados reais
- Entre apenas com um dos três e-mails autorizados no código.
- Confirme que uma conta não autorizada é recusada.
- Confirme que a lista aparece, edite um registro de teste e confira a aba **Histórico administrativo**.
- Teste também o formulário público e a consulta de batismo.

## Limitações conhecidas desta primeira versão
- A tela permite consultar e editar os campos exibidos e registra o histórico; ainda não implementa um fluxo separado de pedidos de alteração enviados pelos membros.
- A edição de data de batismo grava o texto informado. Use o mesmo formato de data que a planilha já utiliza e valide com um registro de teste antes de alterar cadastros reais.
- O login é validado no servidor em cada operação, verificando assinatura/validade do token pelo endpoint oficial do Google, o público-alvo do Client ID, e-mail verificado e lista de autorização.
