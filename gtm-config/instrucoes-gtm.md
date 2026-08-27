# Instruções — Configurar rastreamento de clique WhatsApp no GTM

Pré-requisito: o snippet do GTM já foi instalado em `solucoes/index.html` com o
ID placeholder `GTM-PENDENTE` (ver `solucoes/index.html`, linhas 5–11 do
`<head>` e logo após `<body>`). **Antes de publicar qualquer coisa no GTM,
troque `GTM-PENDENTE` pelo ID real** (formato `GTM-XXXXXXX`) nos dois lugares
do HTML — o contêiner não vai carregar com o placeholder.

## 1. Trigger — "Clique WhatsApp"

No GTM: **Acionadores → Novo**

- Nome: `Clique WhatsApp`
- Tipo de acionador: **Clique em links** (Link Click)
- Ativar este acionador em: **Alguns cliques em links**
- Condição: `Click URL` **contém** `wa.me`
- Em "Esse acionador dispara em": marque **Aguardar tags** e **Verificar
  validação de links** (recomendado, evita perder o evento quando o clique
  navega antes do GTM disparar).

## 2. Variável — Click URL (se ainda não existir)

No GTM: **Variáveis → Variáveis internas → Configurar** → marque `Click URL`
(geralmente já vem ativada por padrão; confirme antes de criar o trigger).

## 3. Tag GA4 — evento `clique_whatsapp`

No GTM: **Tags → Nova**

- Nome: `GA4 - Clique WhatsApp`
- Tipo de tag: **Google Analytics: Evento do GA4**
- ID de medição / Tag de configuração: selecione a tag de configuração GA4
  já existente no contêiner (ou crie uma apontando para o ID de medição
  `G-XXXXXXXXXX` da propriedade GA4 da Somar.IA, se ainda não existir).
- Nome do evento: `clique_whatsapp`
- Parâmetros do evento:

| Nome do parâmetro | Valor |
|---|---|
| `page_location` | `{{Page URL}}` |
| `page_title` | `{{Page Title}}` |
| `link_url` | `{{Click URL}}` |

  (`{{Page URL}}` e `{{Page Title}}` são variáveis internas do GTM — ative-as
  em Variáveis → Variáveis internas se ainda não estiverem marcadas.)

- Acionamento: selecione o trigger **Clique WhatsApp** criado no passo 1.

## 4. Testar antes de publicar

1. Clique em **Preview** no GTM, abra `solucoes/index.html` (ou a URL de
   staging equivalente) com o modo de depuração conectado.
2. Clique em qualquer link `wa.me` da página (menu de serviços, CTA final,
   botão flutuante, cards do rodapé).
3. No painel do Tag Assistant, confirme que `Clique WhatsApp` disparou e que
   `GA4 - Clique WhatsApp` foi enviada, com os 3 parâmetros preenchidos.
4. Confirme no **GA4 → Relatórios em tempo real → Eventos** que
   `clique_whatsapp` aparece.

Só depois de validar isso, **publicar o contêiner** (Enviar → Publicar).

## 5. Importar como conversão no Google Ads

1. No GA4: **Admin → Eventos** → localize `clique_whatsapp` → marque como
   **Conversão-chave** (toggle "Marcar como conversão").
   - Se o evento não aparecer na lista ainda, é preciso ele ter disparado
     pelo menos uma vez em produção primeiro (pode levar até 24h para
     aparecer na lista de eventos do GA4).
2. No GA4: **Admin → Links de produto → Google Ads** → confirme que a conta
   de Ads (415-123-3280) está vinculada. Se não estiver, vincule antes de
   seguir.
3. No Google Ads: **Ferramentas e configurações → Conversões → Google
   Analytics (GA4)** → clique em **+** → selecione a propriedade GA4 correta
   → marque o evento `clique_whatsapp` → **Importar**.
4. Na tela de importação, configure:
   - Categoria: `Contato` (ou `Envio de formulário de lead`, conforme
     preferir classificar).
   - Contagem: **Uma** por clique (evita contar múltiplos cliques do mesmo
     usuário na mesma sessão como várias conversões).
   - Janela de conversão: 30 dias (padrão razoável para o ciclo de venda
     B2B da Somar.IA).
5. Aguarde a importação ficar com status **Registrando conversões** — pode
   levar algumas horas após a primeira ocorrência real do evento.

## Observação importante

O site já tem um bloco de tracking nativo via `gtag.js` direto no HTML (ver
`solucoes/index.html`, script antes de `</body>`, que já captura clique em
`wa.me`/`api.whatsapp.com` e envia conversão para o label
`QxcbCPe3jLQcEMLtr6RD`). **Se esse bloco continuar ativo ao mesmo tempo que a
tag GA4 via GTM**, cliques em WhatsApp serão contados duas vezes nos
relatórios do Google Ads — uma vez pela conversão de importação/click direto
existente, outra pelo evento GA4 importado.

Antes de publicar o contêiner GTM em produção, decida com quem gerencia a
conta de Ads qual das duas fontes deve continuar ativa, e desative a outra
(ou mantenha as duas mas exclua uma delas das conversões primárias usadas
para lances automáticos, para não duplicar o sinal de otimização).
