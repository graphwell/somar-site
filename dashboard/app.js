(function () {
  "use strict";

  const DATA_URL = "./data/ads-data.json";
  const DAYS_OF_WEEK_PT = {
    MONDAY: "Seg", TUESDAY: "Ter", WEDNESDAY: "Qua", THURSDAY: "Qui",
    FRIDAY: "Sex", SATURDAY: "Sáb", SUNDAY: "Dom",
  };
  const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  function fmtBRL(v) {
    return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function statusFromThreshold(value, { greenMin, yellowMin, invert }) {
    // invert=true significa "menor é melhor" (ex.: CPC)
    if (value == null || Number.isNaN(value)) return "indisponivel";
    if (invert) {
      if (value < greenMin) return "verde";
      if (value <= yellowMin) return "amarelo";
      return "vermelho";
    }
    if (value > greenMin) return "verde";
    if (value >= yellowMin) return "amarelo";
    return "vermelho";
  }

  const STATUS_LABEL = { verde: "OK", amarelo: "Atenção", vermelho: "Ação imediata", indisponivel: "Indisponível" };
  const STATUS_BAR_PCT = { verde: 85, amarelo: 55, vermelho: 20, indisponivel: 0 };

  function kpiCardHTML({ icon, label, value, sub, status }) {
    return `
      <div class="kpi-card status-${status}">
        <div class="kpi-label">${icon} ${label}</div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-sub">${sub}</div>
        <span class="kpi-status-pill">${STATUS_LABEL[status]}</span>
        <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${STATUS_BAR_PCT[status]}%"></div></div>
      </div>`;
  }

  function renderKPIs(data) {
    const o = data.overview;
    const cpcStatus = statusFromThreshold(o.avg_cpc_brl, { greenMin: 4, yellowMin: 6, invert: true });
    const ctrStatus = statusFromThreshold(o.ctr_pct, { greenMin: 3, yellowMin: 1 });
    const waStatus = statusFromThreshold(o.whatsapp_rate_pct, { greenMin: 25, yellowMin: 10 });
    const saldoStatus = "indisponivel";

    const weeklyBudget = (o.daily_budget_active_brl || 0) * 7;
    const pctOfBudget = weeklyBudget ? Math.min(100, Math.round((o.cost_brl / weeklyBudget) * 100)) : null;

    const html = [
      kpiCardHTML({
        icon: "💰", label: "Investido (7d)", value: fmtBRL(o.cost_brl),
        sub: `CPC médio ${fmtBRL(o.avg_cpc_brl)}${pctOfBudget != null ? ` · ${pctOfBudget}% do orçamento semanal` : ""}`,
        status: cpcStatus,
      }),
      kpiCardHTML({
        icon: "👆", label: "Cliques (7d)", value: o.clicks,
        sub: `${o.impressions} impressões · CTR ${o.ctr_pct}%`,
        status: ctrStatus,
      }),
      kpiCardHTML({
        icon: "💬", label: "WhatsApp", value: `${o.whatsapp_conversions} (${o.whatsapp_rate_pct}%)`,
        sub: o.whatsapp_action_found ? "conversões / cliques (7d)" : "ação de conversão não encontrada",
        status: o.whatsapp_action_found ? waStatus : "indisponivel",
      }),
      kpiCardHTML({
        icon: "💳", label: "Saldo", value: "—",
        sub: data.saldo.motivo,
        status: saldoStatus,
      }),
    ].join("");
    document.getElementById("kpi-grid").innerHTML = html;
  }

  function renderDailyLineChart(daily) {
    const el = document.getElementById("chart-daily");
    if (!daily || !daily.length) {
      el.innerHTML = `<div class="empty-state">Sem dados de cliques por dia no período.</div>`;
      return;
    }
    const w = 320, h = 140, pad = 20;
    const maxClicks = Math.max(1, ...daily.map((d) => d.clicks));
    const stepX = (w - pad * 2) / Math.max(1, daily.length - 1);
    const points = daily.map((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (d.clicks / maxClicks) * (h - pad * 2);
      return { x, y, d };
    });
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaD = `${pathD} L${points[points.length - 1].x.toFixed(1)},${h - pad} L${points[0].x.toFixed(1)},${h - pad} Z`;
    const dots = points.map((p) => `<circle class="dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"><title>${p.d.date}: ${p.d.clicks} cliques, ${fmtBRL(p.d.cost_brl)}</title></circle>`).join("");
    const labels = points.map((p, i) => {
      if (i !== 0 && i !== points.length - 1 && i % Math.ceil(points.length / 5) !== 0) return "";
      const short = p.d.date.slice(5).replace("-", "/");
      return `<text class="axis-label" x="${p.x.toFixed(1)}" y="${h - 4}" text-anchor="middle">${short}</text>`;
    }).join("");

    el.innerHTML = `
      <svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#25D366" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#25D366" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path class="line-area" d="${areaD}"></path>
        <path class="line-path" d="${pathD}"></path>
        ${dots}
        ${labels}
      </svg>`;
  }

  function renderServicosChart(data) {
    const el = document.getElementById("chart-servicos");
    el.innerHTML = `<div class="empty-state"><strong>⚠️</strong><span>Sem dados — depende do evento GA4 <code>clique_whatsapp</code> com parâmetro <code>servico</code>, ainda não configurado.</span></div>`;
    document.getElementById("ga4-motivo").textContent = data.ga4.motivo;
  }

  function renderHeatmap(hourly) {
    const el = document.getElementById("chart-heatmap");
    if (!hourly || !hourly.length) {
      el.innerHTML = `<div class="empty-state">Sem dados de horário no período.</div>`;
      return;
    }
    const maxClicks = Math.max(1, ...hourly.map((h) => h.clicks));
    const grid = {};
    hourly.forEach((h) => { grid[`${h.day_of_week}_${h.hour}`] = h; });

    function colorFor(clicks) {
      if (!clicks) return "#1a1f2e";
      const ratio = clicks / maxClicks;
      // verde-agua (accent) crescente em opacidade
      const alpha = 0.15 + ratio * 0.85;
      return `rgba(37, 211, 102, ${alpha.toFixed(2)})`;
    }

    let head = "<tr><th></th>";
    for (let hr = 0; hr < 24; hr++) head += `<th>${hr % 3 === 0 ? hr : ""}</th>`;
    head += "</tr>";

    let rows = "";
    DAYS_ORDER.forEach((day) => {
      rows += `<tr><td class="day-label">${DAYS_OF_WEEK_PT[day]}</td>`;
      for (let hr = 0; hr < 24; hr++) {
        const cell = grid[`${day}_${hr}`];
        const clicks = cell ? cell.clicks : 0;
        const title = cell ? `${DAYS_OF_WEEK_PT[day]} ${hr}h: ${cell.clicks} cliques, ${fmtBRL(cell.cost_brl)}` : `${DAYS_OF_WEEK_PT[day]} ${hr}h: sem dados`;
        rows += `<td class="cell" style="background:${colorFor(clicks)}" title="${title}"></td>`;
      }
      rows += "</tr>";
    });

    el.innerHTML = `<div class="heatmap-wrap"><table class="heatmap">${head}${rows}</table></div>`;
  }

  function renderKeywordsTable(searchTerms) {
    const tbody = document.querySelector("#table-keywords tbody");
    if (!searchTerms || !searchTerms.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="na">Sem termos de pesquisa no período.</td></tr>`;
      return;
    }
    tbody.innerHTML = searchTerms.slice(0, 100).map((t) => `
      <tr>
        <td>${t.term}</td>
        <td>${t.clicks}</td>
        <td>${fmtBRL(t.cost_brl)}</td>
        <td>${t.ctr}%</td>
        <td class="na">não disponível</td>
      </tr>`).join("");
  }

  function renderHorariosTable(hourly) {
    const tbody = document.querySelector("#table-horarios tbody");
    if (!hourly || !hourly.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="na">Sem dados no período.</td></tr>`;
      return;
    }
    const sorted = [...hourly].sort((a, b) => b.cost_brl - a.cost_brl || b.clicks - a.clicks);
    tbody.innerHTML = sorted.map((h) => `
      <tr>
        <td>${DAYS_OF_WEEK_PT[h.day_of_week] || h.day_of_week}</td>
        <td>${String(h.hour).padStart(2, "0")}h</td>
        <td>${h.clicks}</td>
        <td>${h.impressions}</td>
        <td>${fmtBRL(h.cost_brl)}</td>
      </tr>`).join("");
  }

  const REC_ICON = { critico: "🔴", alerta: "🟡", ok: "🟢" };
  function renderRecommendations(recs) {
    const el = document.getElementById("recommendations-list");
    if (!recs || !recs.length) {
      el.innerHTML = `<div class="empty-state">Sem recomendações no momento.</div>`;
      return;
    }
    el.innerHTML = recs.map((r) => `
      <div class="rec-item rec-${r.severity}">
        <span class="rec-icon">${REC_ICON[r.severity] || "•"}</span>
        <span>${r.texto}</span>
      </div>`).join("");
  }

  function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        document.getElementById(btn.dataset.tab).classList.add("active");
      });
    });
  }

  function formatTimestamp(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    } catch (e) {
      return iso;
    }
  }

  async function loadAndRender(bustCache) {
    const url = bustCache ? `${DATA_URL}?t=${Date.now()}` : DATA_URL;
    const res = await fetch(url, { cache: bustCache ? "no-store" : "default" });
    if (!res.ok) throw new Error(`Falha ao carregar ${DATA_URL}: HTTP ${res.status}`);
    const data = await res.json();

    renderKPIs(data);
    renderDailyLineChart(data.daily_clicks);
    renderServicosChart(data);
    renderHeatmap(data.hourly_heatmap);
    renderKeywordsTable(data.search_terms);
    renderHorariosTable(data.hourly_heatmap);
    renderRecommendations(data.recommendations);
    document.getElementById("last-updated").textContent = formatTimestamp(data.generated_at);
    document.getElementById("period-badge").textContent =
      data.period === "LAST_7_DAYS" ? "últimos 7 dias" : data.period;

    return data;
  }

  function setupRefreshButton() {
    const btn = document.getElementById("refresh-btn");
    btn.addEventListener("click", async () => {
      btn.classList.add("spinning");
      btn.disabled = true;
      try {
        await loadAndRender(true);
      } catch (e) {
        alert(
          "Não consegui recarregar o snapshot: " + e.message +
          "\n\nLembrete: este botão só recarrega o arquivo data/ads-data.json — ele não consulta a API do Google Ads ao vivo (por segurança). Para dados novos, é preciso rodar o script de geração e publicar de novo."
        );
      } finally {
        btn.classList.remove("spinning");
        btn.disabled = false;
      }
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupRefreshButton();
    registerServiceWorker();
    loadAndRender(false).catch((e) => {
      document.getElementById("kpi-grid").innerHTML =
        `<div class="empty-state" style="grid-column:1/-1"><strong>⚠️</strong><span>Erro ao carregar dados: ${e.message}</span></div>`;
    });
  });
})();
