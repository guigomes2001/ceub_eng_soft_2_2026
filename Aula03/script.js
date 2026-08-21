/* =========================================================================
   Fábrica Viva — camada de comportamento
   Sem dependências, sem backend. Estado do carrinho em localStorage.
   ========================================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var brl = new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0
  });
  var num = new Intl.NumberFormat("pt-BR");

  function money(v) { return brl.format(Math.round(v)); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------------------
     1. CATÁLOGO — fonte de dados
     --------------------------------------------------------------------- */
  var ICONS = {
    sensor: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="18" width="20" height="24" rx="3"/><path d="M24 18v-6"/><circle cx="24" cy="30" r="4"/><path d="M14 8a14 14 0 0 1 20 0M18 13a8 8 0 0 1 12 0"/></svg>',
    camera: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="14" width="30" height="22" rx="3"/><path d="M36 22l8-5v16l-8-5z"/><circle cx="19" cy="25" r="6"/><circle cx="19" cy="25" r="2"/></svg>',
    probe: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v10"/><rect x="17" y="16" width="14" height="18" rx="7"/><path d="M24 34v8"/><path d="M14 40h20"/><path d="M21 22h6M21 27h6"/></svg>',
    robot: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 42h12"/><path d="M14 42V28"/><circle cx="14" cy="26" r="4"/><path d="m17 23 11-9"/><circle cx="30" cy="12" r="4"/><path d="m33 14 6 6"/><path d="M36 20h8v6h-8z"/></svg>',
    agv: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="20" width="38" height="12" rx="3"/><circle cx="14" cy="37" r="4"/><circle cx="34" cy="37" r="4"/><path d="M15 20v-8h18v8"/><path d="M11 26h6M31 26h6"/></svg>',
    gateway: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="26" width="34" height="14" rx="3"/><path d="M14 33h4M24 33h10"/><path d="M24 26v-6"/><path d="M16 14a11 11 0 0 1 16 0M20 9a17 17 0 0 1 8 0"/></svg>',
    radio: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="4"/><path d="M15 15a13 13 0 0 0 0 18M33 15a13 13 0 0 1 0 18"/><path d="M9 9a21 21 0 0 0 0 30M39 9a21 21 0 0 1 0 30"/></svg>',
    twin: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 5 41 14v20L24 43 7 34V14z"/><path d="M24 24 41 14M24 24v19M24 24 7 14"/></svg>',
    meter: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="17"/><path d="m24 24 8-7"/><path d="M24 7v3M41 24h-3M24 41v-3M7 24h3"/><path d="M20 33h8"/></svg>'
  };

  var PRODUTOS = [
    {
      pn: "NX-VS400", cat: "sensoriamento", icon: "sensor", badge: "top",
      nome: "Sensor de Vibração IIoT",
      desc: "Acelerômetro triaxial com FFT embarcada para detecção precoce de falha em rolamentos e desalinhamento.",
      preco: 2480, prazo: "7 dias",
      specs: [["Faixa", "±16 g / 10 kHz"], ["Protocolo", "MQTT · LoRaWAN"], ["Bateria", "5 anos"]]
    },
    {
      pn: "VI-8K", cat: "sensoriamento", icon: "camera",
      nome: "Câmera de Inspeção com IA",
      desc: "Visão computacional na borda para inspeção 100% da produção, com aprendizado por amostras aprovadas.",
      preco: 19750, prazo: "21 dias",
      specs: [["Resolução", "8 MP global shutter"], ["Inferência", "38 ms / peça"], ["Grau", "IP67 · NR-12"]]
    },
    {
      pn: "TH-220", cat: "sensoriamento", icon: "probe",
      nome: "Sonda de Temperatura e Umidade",
      desc: "Monitoramento de estufas, câmaras frias e salas elétricas com registro contínuo para auditoria.",
      preco: 1190, prazo: "5 dias",
      specs: [["Faixa", "−40 a 125 °C"], ["Precisão", "±0,2 °C"], ["Alcance", "1,8 km"]]
    },
    {
      pn: "CB-07", cat: "robotica", icon: "robot", badge: "new",
      nome: "Braço Robótico Colaborativo",
      desc: "Cobot de 7 kg de carga para pick and place e paletização, programável por condução manual.",
      preco: 128000, prazo: "45 dias",
      specs: [["Carga útil", "7 kg"], ["Alcance", "1.300 mm"], ["Repetibilidade", "±0,03 mm"]]
    },
    {
      pn: "AV-2T", cat: "robotica", icon: "agv",
      nome: "AGV Autônomo de 2 Toneladas",
      desc: "Veículo guiado por SLAM para movimentação entre células, com desvio dinâmico de obstáculos.",
      preco: 214500, prazo: "60 dias",
      specs: [["Capacidade", "2.000 kg"], ["Autonomia", "10 h"], ["Navegação", "LiDAR + SLAM"]]
    },
    {
      pn: "EG-1200", cat: "conectividade", icon: "gateway", badge: "top",
      nome: "Gateway de Edge Computing",
      desc: "Processa e filtra telemetria no chão de fábrica, mantendo a operação mesmo sem link com a nuvem.",
      preco: 8900, prazo: "12 dias",
      specs: [["Latência", "12 ms"], ["Padrões", "OPC UA · Modbus"], ["Buffer local", "72 h"]]
    },
    {
      pn: "RW-5G", cat: "conectividade", icon: "radio",
      nome: "Roteador Industrial 5G Privado",
      desc: "Rede privada dedicada para AGVs e handhelds, com fatiamento de tráfego crítico e redundância.",
      preco: 14600, prazo: "18 dias",
      specs: [["Banda", "5G SA n78"], ["Cobertura", "400 m"], ["Temperatura", "−30 a 70 °C"]]
    },
    {
      pn: "DT-CORE", cat: "software", icon: "twin",
      nome: "Gêmeo Digital · Licença Anual",
      desc: "Réplica virtual da linha para simular sequenciamento e prever gargalos antes de mexer no físico.",
      preco: 46000, prazo: "Imediato",
      specs: [["Ativos", "Até 250"], ["Simulação", "Tempo real"], ["Integração", "ERP · MES"]]
    },
    {
      pn: "PM-500", cat: "energia", icon: "meter",
      nome: "Medidor de Energia Inteligente",
      desc: "Submedição por circuito para atribuir consumo ao centro de custo e flagrar desvio de eficiência.",
      preco: 3150, prazo: "9 dias",
      specs: [["Classe", "0,5S"], ["Grandezas", "32 por circuito"], ["Amostragem", "1 s"]]
    }
  ];

  /* ---------------------------------------------------------------------
     2. TEMA
     --------------------------------------------------------------------- */
  var root = document.documentElement;
  var STORE_THEME = "fv:tema";

  try {
    var saved = localStorage.getItem(STORE_THEME);
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (e) { /* armazenamento indisponível — segue no tema do sistema */ }

  var themeBtn = $("#themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var isLight = root.getAttribute("data-theme") === "light" ||
        (!root.hasAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: light)").matches);
      var next = isLight ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(STORE_THEME, next); } catch (e) {}
      toast(next === "dark" ? "Tema escuro ativado" : "Tema claro ativado");
    });
  }

  /* ---------------------------------------------------------------------
     3. TOAST
     --------------------------------------------------------------------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }

  /* ---------------------------------------------------------------------
     4. RENDERIZAÇÃO DO CATÁLOGO
     --------------------------------------------------------------------- */
  var grid = $("#productGrid");
  var emptyState = $("#emptyState");
  var resultCount = $("#resultCount");

  var filtro = { cat: "todos", termo: "", teto: 220000 };

  function cardHTML(p) {
    var badge = "";
    if (p.badge === "top") badge = '<span class="badge badge-top">Mais vendido</span>';
    if (p.badge === "new") badge = '<span class="badge badge-new">Lançamento</span>';

    var specs = p.specs.map(function (s) {
      return "<li>" + s[0] + "<b>" + s[1] + "</b></li>";
    }).join("");

    return '' +
      '<article class="card reveal" data-cat="' + p.cat + '" data-pn="' + p.pn + '">' +
        '<div class="card-plate"><span class="card-pn">' + p.pn + '</span>' + badge + '</div>' +
        '<div class="card-art">' + ICONS[p.icon] + '</div>' +
        '<div class="card-body">' +
          '<h3>' + p.nome + '</h3>' +
          '<p class="card-desc">' + p.desc + '</p>' +
          '<ul class="card-specs">' + specs +
            '<li>Prazo de entrega<b>' + p.prazo + '</b></li>' +
          '</ul>' +
        '</div>' +
        '<div class="card-foot">' +
          '<p class="price"><small>Preço unitário</small><b>' + money(p.preco) + '</b></p>' +
          '<button class="add-btn" type="button" data-add="' + p.pn + '" aria-label="Adicionar ' + p.nome + ' à cotação">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
          '</button>' +
        '</div>' +
      '</article>';
  }

  function render() {
    if (!grid) return;
    var termo = filtro.termo.trim().toLowerCase();

    var lista = PRODUTOS.filter(function (p) {
      var okCat = filtro.cat === "todos" || p.cat === filtro.cat;
      var okPreco = p.preco <= filtro.teto;
      var okTermo = !termo ||
        p.nome.toLowerCase().indexOf(termo) > -1 ||
        p.pn.toLowerCase().indexOf(termo) > -1 ||
        p.desc.toLowerCase().indexOf(termo) > -1;
      return okCat && okPreco && okTermo;
    });

    grid.innerHTML = lista.map(cardHTML).join("");
    if (resultCount) resultCount.textContent = lista.length;
    if (emptyState) emptyState.hidden = lista.length !== 0;

    $$(".card", grid).forEach(function (el, i) {
      if (reduced) { el.classList.add("is-in"); return; }
      el.style.transitionDelay = Math.min(i * 40, 240) + "ms";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add("is-in"); });
      });
    });
  }

  /* filtros */
  $$(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $$(".chip").forEach(function (c) {
        c.classList.remove("is-active");
        c.setAttribute("aria-pressed", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-pressed", "true");
      filtro.cat = chip.dataset.cat;
      render();
    });
  });

  var searchInput = $("#searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filtro.termo = searchInput.value;
      render();
    });
  }

  var priceRange = $("#priceRange");
  var priceRead = $("#priceRead");
  if (priceRange) {
    priceRange.addEventListener("input", function () {
      filtro.teto = Number(priceRange.value);
      if (priceRead) priceRead.textContent = money(filtro.teto);
      render();
    });
  }

  var clearBtn = $("#clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      filtro = { cat: "todos", termo: "", teto: 220000 };
      if (searchInput) searchInput.value = "";
      if (priceRange) priceRange.value = 220000;
      if (priceRead) priceRead.textContent = money(220000);
      $$(".chip").forEach(function (c) {
        var on = c.dataset.cat === "todos";
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      render();
      toast("Filtros limpos");
    });
  }

  render();

  /* ---------------------------------------------------------------------
     5. CARRINHO
     --------------------------------------------------------------------- */
  var STORE_CART = "fv:cotacao";
  var carrinho = {};

  try {
    var raw = localStorage.getItem(STORE_CART);
    if (raw) carrinho = JSON.parse(raw) || {};
  } catch (e) { carrinho = {}; }

  function persist() {
    try { localStorage.setItem(STORE_CART, JSON.stringify(carrinho)); } catch (e) {}
  }

  function acharProduto(pn) {
    for (var i = 0; i < PRODUTOS.length; i++) if (PRODUTOS[i].pn === pn) return PRODUTOS[i];
    return null;
  }

  /* desconto progressivo por volume financeiro */
  function faixaDesconto(sub) {
    if (sub >= 500000) return 0.12;
    if (sub >= 250000) return 0.08;
    if (sub >= 100000) return 0.05;
    return 0;
  }

  var cartList = $("#cartList");
  var cartEmpty = $("#cartEmpty");
  var cartCount = $("#cartCount");

  function pintarCarrinho() {
    var pns = Object.keys(carrinho);
    var sub = 0, unidades = 0;

    if (cartList) {
      cartList.innerHTML = pns.map(function (pn) {
        var p = acharProduto(pn);
        if (!p) return "";
        var q = carrinho[pn];
        sub += p.preco * q;
        unidades += q;
        return '' +
          '<li class="cart-item">' +
            '<p class="ci-pn">' + p.pn + '</p>' +
            '<p class="ci-name">' + p.nome + '</p>' +
            '<p class="ci-price">' + money(p.preco * q) + '</p>' +
            '<div class="ci-ctrl">' +
              '<div class="qty">' +
                '<button type="button" data-dec="' + pn + '" aria-label="Diminuir quantidade de ' + p.nome + '">&minus;</button>' +
                '<output aria-label="Quantidade de ' + p.nome + '">' + q + '</output>' +
                '<button type="button" data-inc="' + pn + '" aria-label="Aumentar quantidade de ' + p.nome + '">+</button>' +
              '</div>' +
              '<button class="ci-remove" type="button" data-del="' + pn + '">Remover</button>' +
            '</div>' +
          '</li>';
      }).join("");
    } else {
      pns.forEach(function (pn) {
        var p = acharProduto(pn);
        if (p) { sub += p.preco * carrinho[pn]; unidades += carrinho[pn]; }
      });
    }

    var taxa = faixaDesconto(sub);
    var desc = sub * taxa;

    if (cartEmpty) cartEmpty.hidden = pns.length > 0;
    if (cartCount) cartCount.textContent = unidades;

    var sumSub = $("#sumSub"), sumDisc = $("#sumDisc"), sumTotal = $("#sumTotal");
    if (sumSub) sumSub.textContent = money(sub);
    if (sumDisc) sumDisc.textContent = "− " + money(desc) + (taxa ? " (" + Math.round(taxa * 100) + "%)" : "");
    if (sumTotal) sumTotal.textContent = money(sub - desc);
  }

  function adicionar(pn) {
    var p = acharProduto(pn);
    if (!p) return;
    carrinho[pn] = (carrinho[pn] || 0) + 1;
    persist();
    pintarCarrinho();
    if (cartCount) {
      cartCount.classList.remove("bump");
      void cartCount.offsetWidth;
      cartCount.classList.add("bump");
    }
    toast(p.nome + " adicionado à cotação");
  }

  document.addEventListener("click", function (ev) {
    var add = ev.target.closest("[data-add]");
    if (add) { adicionar(add.dataset.add); return; }

    var inc = ev.target.closest("[data-inc]");
    if (inc) { carrinho[inc.dataset.inc]++; persist(); pintarCarrinho(); return; }

    var dec = ev.target.closest("[data-dec]");
    if (dec) {
      var k = dec.dataset.dec;
      carrinho[k]--;
      if (carrinho[k] <= 0) delete carrinho[k];
      persist(); pintarCarrinho();
      return;
    }

    var del = ev.target.closest("[data-del]");
    if (del) {
      delete carrinho[del.dataset.del];
      persist(); pintarCarrinho();
      toast("Item removido da cotação");
    }
  });

  pintarCarrinho();

  /* ---------------------------------------------------------------------
     6. DRAWER
     --------------------------------------------------------------------- */
  var drawer = $("#cartDrawer");
  var scrim = $("#scrim");
  var ultimoFoco = null;

  function abrirDrawer() {
    if (!drawer) return;
    ultimoFoco = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) scrim.hidden = false;
    document.body.style.overflow = "hidden";
    var fechar = $("#cartClose");
    if (fechar) fechar.focus();
  }

  function fecharDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) scrim.hidden = true;
    document.body.style.overflow = "";
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  ["#cartOpen", "#cartOpen2"].forEach(function (sel) {
    var b = $(sel);
    if (b) b.addEventListener("click", abrirDrawer);
  });
  var closeBtn = $("#cartClose");
  if (closeBtn) closeBtn.addEventListener("click", fecharDrawer);
  if (scrim) scrim.addEventListener("click", fecharDrawer);

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && drawer && drawer.classList.contains("is-open")) fecharDrawer();

    /* prende o foco dentro do drawer enquanto ele estiver aberto */
    if (ev.key === "Tab" && drawer && drawer.classList.contains("is-open")) {
      var focaveis = $$('button, [href], input, output, [tabindex]:not([tabindex="-1"])', drawer)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focaveis.length) return;
      var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    }
  });

  var checkout = $("#checkout");
  if (checkout) {
    checkout.addEventListener("click", function () {
      if (!Object.keys(carrinho).length) { toast("Adicione ao menos um ativo antes de enviar"); return; }
      toast("Cotação registrada — um engenheiro responde em até 48 h");
      carrinho = {};
      persist();
      pintarCarrinho();
      setTimeout(fecharDrawer, 900);
    });
  }

  /* ---------------------------------------------------------------------
     7. SIMULADOR DE ROI
     --------------------------------------------------------------------- */
  var REDUCAO_BASE = 0.27;
  var MESES = 24;

  var rMachines = $("#rMachines"), rHours = $("#rHours"),
      rCost = $("#rCost"), rInvest = $("#rInvest");

  function calcularROI() {
    if (!rMachines) return;

    var maquinas = Number(rMachines.value);
    var horas = Number(rHours.value);
    var custo = Number(rCost.value);
    var invest = Number(rInvest.value);

    /* a eficácia cresce com a cobertura de ativos monitorados e satura */
    var cobertura = 0.55 + 0.45 * Math.min(1, maquinas / 80);
    var reducao = REDUCAO_BASE * cobertura;

    var economiaMes = horas * custo * reducao;
    var economiaAno = economiaMes * 12;
    var payback = economiaMes > 0 ? invest / economiaMes : Infinity;
    var roi24 = ((economiaMes * MESES - invest) / invest) * 100;
    var horasAno = horas * reducao * 12;

    $("#oMachines").textContent = maquinas + " máquinas";
    $("#oHours").textContent = horas + " h/mês";
    $("#oCost").textContent = money(custo) + " /h";
    $("#oInvest").textContent = money(invest);

    $("#kSave").textContent = money(economiaAno);
    $("#kPayback").textContent = isFinite(payback)
      ? (payback < 1 ? "menos de 1 mês" : payback.toFixed(1).replace(".", ",") + " meses")
      : "—";
    $("#kRoi").textContent = (roi24 >= 0 ? "+" : "") + Math.round(roi24) + "%";
    $("#kHours").textContent = num.format(Math.round(horasAno)) + " h";

    desenharGrafico(economiaMes, invest, payback);
  }

  function desenharGrafico(economiaMes, invest, payback) {
    var svg = $("#roiChart");
    if (!svg) return;

    var W = 560, H = 220, padB = 18, padT = 14;
    var acumulado = [];
    for (var m = 0; m <= MESES; m++) acumulado.push(economiaMes * m);

    var topo = Math.max(acumulado[MESES], invest) * 1.14 || 1;
    var x = function (m) { return (m / MESES) * W; };
    var y = function (v) { return H - padB - (v / topo) * (H - padB - padT); };

    /* grade horizontal */
    var gridEl = $("#chartGrid");
    if (gridEl) {
      var linhas = "";
      for (var g = 0; g <= 4; g++) {
        var gy = padT + (g / 4) * (H - padB - padT);
        linhas += '<line x1="0" x2="' + W + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"></line>';
      }
      gridEl.innerHTML = linhas;
    }

    var pontos = acumulado.map(function (v, m) { return x(m).toFixed(1) + "," + y(v).toFixed(1); });

    $("#chartLine").setAttribute("d", "M" + pontos.join("L"));
    $("#chartArea").setAttribute("d",
      "M0," + (H - padB) + "L" + pontos.join("L") + "L" + W + "," + (H - padB) + "Z");

    var linhaInvest = $("#investLine");
    linhaInvest.setAttribute("y1", y(invest).toFixed(1));
    linhaInvest.setAttribute("y2", y(invest).toFixed(1));

    var dot = $("#breakDot");
    if (isFinite(payback) && payback <= MESES) {
      dot.setAttribute("cx", x(payback).toFixed(1));
      dot.setAttribute("cy", y(invest).toFixed(1));
      dot.style.display = "";
    } else {
      dot.style.display = "none";
    }
  }

  [rMachines, rHours, rCost, rInvest].forEach(function (el) {
    if (el) el.addEventListener("input", calcularROI);
  });
  calcularROI();

  /* ---------------------------------------------------------------------
     8. PAINEL HMI — medidor e telemetria viva
     --------------------------------------------------------------------- */
  var gaugeFill = $("#gaugeFill");
  var oeeValue = $("#oeeValue");

  function pintarGauge(pct) {
    if (!gaugeFill) return;
    var len = gaugeFill.getTotalLength();
    gaugeFill.style.strokeDasharray = len;
    gaugeFill.style.strokeDashoffset = len - (len * pct) / 100;
  }

  function animarOEE(alvo) {
    if (!oeeValue) return;
    if (reduced) {
      oeeValue.textContent = alvo.toFixed(1).replace(".", ",");
      pintarGauge(alvo);
      return;
    }
    var inicio = performance.now(), dur = 1400;
    (function passo(agora) {
      var t = Math.min(1, (agora - inicio) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      oeeValue.textContent = (alvo * e).toFixed(1).replace(".", ",");
      pintarGauge(alvo * e);
      if (t < 1) requestAnimationFrame(passo);
    })(performance.now());
  }

  var oeeAtual = 78.4;
  animarOEE(oeeAtual);

  if (!reduced) {
    setInterval(function () {
      oeeAtual = Math.max(74, Math.min(83, oeeAtual + (Math.random() - 0.5) * 1.1));
      if (oeeValue) oeeValue.textContent = oeeAtual.toFixed(1).replace(".", ",");
      pintarGauge(oeeAtual);

      var tOee = $('[data-tele="oee"]');
      var tAlert = $('[data-tele="alert"]');
      var tLat = $('[data-tele="lat"]');
      if (tOee) tOee.textContent = oeeAtual.toFixed(1).replace(".", ",");
      if (tAlert) tAlert.textContent = 30 + Math.floor(Math.random() * 14);
      if (tLat) tLat.textContent = 9 + Math.floor(Math.random() * 8);
    }, 3000);
  }

  /* ---------------------------------------------------------------------
     9. CONTADORES
     --------------------------------------------------------------------- */
  function animarContador(el) {
    var alvo = Number(el.dataset.to);
    var sufixo = el.dataset.suffix || "";
    var separa = el.dataset.sep === "1";

    if (reduced) {
      el.textContent = (separa ? num.format(alvo) : alvo) + sufixo;
      return;
    }
    var inicio = performance.now(), dur = 1600;
    (function passo(agora) {
      var t = Math.min(1, (agora - inicio) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      var v = Math.round(alvo * e);
      el.textContent = (separa ? num.format(v) : v) + sufixo;
      if (t < 1) requestAnimationFrame(passo);
    })(performance.now());
  }

  /* ---------------------------------------------------------------------
     10. REVELAÇÃO NO SCROLL
     --------------------------------------------------------------------- */
  var alvos = ".section-head, .pillar, .step-list li, .case, .cta-box, .roi-panel, .hmi";
  $$(alvos).forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    $$(".reveal").forEach(function (el) { obs.observe(el); });

    var obsCount = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        animarContador(e.target);
        obsCount.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    $$(".count").forEach(function (el) { obsCount.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    $$(".count").forEach(animarContador);
  }

  /* ---------------------------------------------------------------------
     11. MALHA ANIMADA DO HERO
     Nós = ativos conectados; arestas surgem quando estão ao alcance.
     --------------------------------------------------------------------- */
  var canvas = $("#meshCanvas");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d");
    var nos = [];
    var largura = 0, altura = 0, dpr = 1;
    var ALCANCE = 148;

    function corAcento() {
      return getComputedStyle(root).getPropertyValue("--data").trim() || "#4FD1E0";
    }
    var cor = corAcento();

    function medir() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = rect.width; altura = rect.height;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var densidade = Math.max(26, Math.min(64, Math.round((largura * altura) / 17000)));
      nos = [];
      for (var i = 0; i < densidade; i++) {
        nos.push({
          x: Math.random() * largura,
          y: Math.random() * altura,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          r: Math.random() * 1.5 + 0.9,
          fase: Math.random() * Math.PI * 2
        });
      }
    }

    function quadro(tempo) {
      ctx.clearRect(0, 0, largura, altura);

      for (var i = 0; i < nos.length; i++) {
        var n = nos[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > largura) n.vx *= -1;
        if (n.y < 0 || n.y > altura) n.vy *= -1;

        for (var j = i + 1; j < nos.length; j++) {
          var o = nos[j];
          var dx = n.x - o.x, dy = n.y - o.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < ALCANCE) {
            ctx.globalAlpha = (1 - d / ALCANCE) * 0.2;
            ctx.strokeStyle = cor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(o.x, o.y);
            ctx.stroke();
          }
        }

        /* pulso lento: o nó "transmite" */
        var brilho = 0.35 + 0.35 * Math.sin(tempo / 900 + n.fase);
        ctx.globalAlpha = brilho;
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(quadro);
    }

    medir();
    requestAnimationFrame(quadro);

    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { medir(); cor = corAcento(); }, 180);
    });

    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        setTimeout(function () { cor = corAcento(); }, 60);
      });
    }
  }

  /* ---------------------------------------------------------------------
     12. NAVEGAÇÃO SUAVE COM COMPENSAÇÃO DO HEADER FIXO
     --------------------------------------------------------------------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var alvo = document.querySelector(a.getAttribute("href"));
      if (!alvo) return;
      ev.preventDefault();
      var header = $(".site-header");
      var offset = header ? header.offsetHeight + 12 : 0;
      var y = alvo.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    });
  });

})();
