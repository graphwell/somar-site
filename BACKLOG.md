# Backlog / Investigações

## 2026-07-28 — Investigação: tag de conversão "Lead WhatsApp" supostamente fora do ar

**Reportado:** tag de conversão do Google Ads (AW-18061457090) não estaria ativa em
`somar.ia.br/app-ia/`, fazendo cliques pagos não gerarem conversão.

**Investigação:**
- `/app-ia/` **não existe** neste repositório nem no site ao vivo (Netlify retorna 404).
  Não há nenhuma rota, redirect ou referência real a "app-ia" — os únicos "hits" de busca
  por esse termo são coincidência de substring dentro de "whats**app-ia**" (a página
  `automacao-whatsapp-ia/index.html`).
- A URL final configurada nos anúncios ativos (Google Ads, ad group `WhatsApp_IA`,
  ad id `810414763916`) é `https://somar.ia.br/automacao-whatsapp-ia/` (display path
  `whatsapp-ia/fortaleza`). Não há campanha, ad group ou sitelink apontando para `/app-ia/`.
- Verifiquei o HTML **ao vivo** dessa página real via `curl` direto (não via ferramenta
  que converte HTML→Markdown) e a tag **está presente e correta**:
  - `gtag.js` carregado com `AW-18061457090` (linha 444)
  - `gtagConversion()` conecta aos 4 CTAs de WhatsApp (hero, 2 CTAs intermediários, botão flutuante)
  - `send_to: 'AW-18061457090/QxcbCPe3jLQcEMLtr6RD'` — bate com a conversion action
    "Lead WhatsApp" cadastrada na conta Google Ads.
  - Página local (`automacao-whatsapp-ia/index.html`, 475 linhas) é byte-a-byte idêntica
    à página ao vivo nesse trecho.

**Causa da falsa alarme anterior:** um diagnóstico anterior (nesta sessão e em sessão de
2026-07-28 registrada em memória) usou uma ferramenta de fetch que converte HTML para
Markdown antes de analisar o conteúdo — essa conversão **descarta tags `<script>` por
completo**, então qualquer verificação de `gtag`/`gtagConversion` por esse método sempre
retorna "ausente", independente do estado real da página. Conclusão anterior de "tag fora
do ar" estava errada — era limitação do método de verificação, não um bug real.

**Resultado:** nenhuma mudança de código foi necessária. Nenhum deploy foi feito.

**Em aberto:** confirmar com o Francisco o que ele quis dizer com `/app-ia/` — não
corresponde a nenhuma URL usada em Google Ads nem a nenhuma rota do site.

---

## 2026-07-28 — Vazamento de conversão: links soltos no rodapé da própria landing page [CONCLUÍDO]

**Achado:** ao auditar todo o site em busca de qualquer ocorrência do número
(85) 99255-6672 / `wa.me/5585992556672` sem tracking, confirmei (via `curl` bruto em
cada rota, nunca fetch com conversão HTML→Markdown) que esse número aparece em ~18
lugares no site, nenhum com `onclick="gtagConversion()"`. Isso é esperado nas páginas
institucionais (só a landing page de anúncio precisa de tracking) — mas o mesmo padrão
`sem tracking` também estava presente **dentro da própria `/automacao-whatsapp-ia/`**,
no rodapé:

```html
<!-- ANTES -->
<a href="https://wa.me/5585992556672" target="_blank" style="color:#00ff88;text-decoration:none;">Nordeste: (85) 99255-6672</a>
<a href="https://wa.me/5511925203237" target="_blank" style="color:#00ff88;text-decoration:none;">(11) 92520-3237</a>
```

Como essa é a **única página que recebe tráfego pago** do Google Ads (final URL do ad
group `WhatsApp_IA`), qualquer visitante pago que rolasse até o rodapé e clicasse em um
desses 2 links (em vez dos 4 CTAs principais, que já tinham tracking) gerava um lead real
sem que a conversão "Lead WhatsApp" (AW-18061457090/QxcbCPe3jLQcEMLtr6RD) fosse contada.

**Correção aplicada (commit `038ef8d`):** adicionado `onclick="gtagConversion()"` aos 2
links do rodapé, **somente** em `automacao-whatsapp-ia/index.html` — nenhuma outra página
do site foi tocada (o padrão sem tracking nas demais páginas é intencional).

**Deploy:** push para `origin/master` bloqueado inicialmente por permissão do GitHub
(conta `somarsolucoessuporte-netizen` sem acesso de escrita a `graphwell/somar-site`,
resolvido reautenticando o Git Credential Manager). Deploy publicado no Netlify e
confirmado.

**Verificação pós-deploy (`curl` bruto em `https://somar.ia.br/automacao-whatsapp-ia/`,
com cache-buster):**

```html
<a href="https://wa.me/5585992556672" target="_blank" style="color:#00ff88;text-decoration:none;" onclick="gtagConversion()">Nordeste: (85) 99255-6672</a>
<a href="https://wa.me/5511925203237" target="_blank" style="color:#00ff88;text-decoration:none;" onclick="gtagConversion()">(11) 92520-3237</a>
```

**Status: CONCLUÍDO.** Os 4 CTAs principais + os 2 links de rodapé (6 no total) agora têm
tracking nessa página. Nenhuma outra rota do site foi alterada.

## 2026-10-08 — Pendente: Search Console para somarsite.netlify.app (fora do escopo)

Versão antiga do site (`https://somarsite.netlify.app/`, título "Somar.IA — Automações
inteligentes para sua empresa") estava indexada no Google. Foi configurado 301 de
`somarsite.netlify.app/*` → `https://somar.ia.br/solucoes/`.

**A fazer (não executado):** no Google Search Console, solicitar remoção/atualização da
URL antiga (Remoções → Remoção temporária ou inspecionar URL para reprocessar). Opcional —
o 301 já transfere o sinal e desindexa com o tempo.
