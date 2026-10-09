/* =========================================================
   Portfólio — Área de trabalho do Windows 7 (Caminho 1)
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. TEMA CLARO/ESCURO (persistente) ---------- */
  const htmlEl = document.documentElement;
  const themeIcos = document.querySelectorAll(".theme-ico");

  function applyTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    themeIcos.forEach((i) => (i.textContent = theme === "dark" ? "☀️" : "🌙"));
    try { localStorage.setItem("portfolio-theme", theme); } catch (e) {}
  }
  function toggleTheme() {
    const atual = htmlEl.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(atual === "dark" ? "light" : "dark");
  }
  let salvo = "light";
  try { salvo = localStorage.getItem("portfolio-theme") || "light"; } catch (e) {}
  applyTheme(salvo);
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  document.getElementById("start-theme").addEventListener("click", () => { toggleTheme(); closeStart(); });

  /* ---------- 2. RELÓGIO DA BARRA DE TAREFAS ---------- */
  const clockTime = document.getElementById("clock-time");
  const clockDate = document.getElementById("clock-date");
  function tick() {
    const d = new Date();
    clockTime.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    clockDate.textContent = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }
  tick();
  setInterval(tick, 1000 * 20);

  /* ---------- 3. GERENCIAMENTO DE JANELAS ---------- */
  const windows = {};
  document.querySelectorAll(".window").forEach((w) => (windows[w.dataset.win] = w));
  const taskItems = document.getElementById("task-items");
  let zTop = 10;

  function openWindow(name) {
    const w = windows[name];
    if (!w) return;
    w.classList.remove("hidden", "minimized");
    bringToFront(w);
    if (name === "habilidades") animateSkills();
    revealIn(w);
  }
  function closeWindow(w) { w.classList.add("hidden"); w.classList.remove("maximized", "minimized"); syncTaskbar(); }
  function bringToFront(w) { zTop += 1; w.style.zIndex = zTop; syncTaskbar(); }

  // minimizar com animação: a janela some de vista mas CONTINUA na barra de tarefas
  function minimizeWindow(w) {
    if (w.classList.contains("hidden") || w.classList.contains("minimized")) return;
    w.classList.add("minimizing");
    setTimeout(() => {
      w.classList.remove("minimizing");
      w.classList.add("minimized");
      syncTaskbar();
    }, 300);
  }

  // restaura uma janela minimizada
  function restoreWindow(w) {
    w.classList.remove("minimized");
    bringToFront(w);
  }

  // minimizar todas as janelas abertas (botão "Mostrar área de trabalho")
  function showDesktop() {
    Object.values(windows).forEach((w) => {
      if (!w.classList.contains("hidden") && !w.classList.contains("minimized")) minimizeWindow(w);
    });
  }

  document.querySelectorAll(".window").forEach((w) => {
    w.querySelector(".titlebar").addEventListener("mousedown", () => bringToFront(w));
    w.querySelectorAll(".tb-buttons button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = btn.dataset.action;
        if (act === "close") closeWindow(w);
        else if (act === "max") w.classList.toggle("maximized");
        else if (act === "min") minimizeWindow(w);
      });
    });
  });

  // qualquer elemento com data-open abre a janela
  document.querySelectorAll("[data-open]").forEach((el) =>
    el.addEventListener("click", () => { openWindow(el.dataset.open); closeStart(); })
  );

  // barra de tarefas reflete janelas abertas (inclui as minimizadas)
  function syncTaskbar() {
    taskItems.innerHTML = "";
    Object.values(windows).forEach((w) => {
      if (w.classList.contains("hidden")) return; // só janelas fechadas somem da barra
      const titulo = w.querySelector(".tb-title").textContent.trim().split("—")[0].trim();
      const btn = document.createElement("button");
      btn.textContent = titulo;
      const minimizada = w.classList.contains("minimized");
      const ativa = !minimizada && parseInt(w.style.zIndex, 10) === zTop;
      if (ativa) btn.classList.add("active");
      btn.addEventListener("click", () => {
        if (w.classList.contains("minimized")) { restoreWindow(w); }      // minimizada -> restaura
        else if (parseInt(w.style.zIndex, 10) === zTop) { minimizeWindow(w); } // ativa -> minimiza
        else { bringToFront(w); }                                          // atrás -> traz pra frente
      });
      const li = document.createElement("li");
      li.appendChild(btn);
      taskItems.appendChild(li);
    });
  }

  /* ---------- 4. ARRASTAR JANELAS ---------- */
  document.querySelectorAll(".window").forEach((w) => {
    const bar = w.querySelector(".titlebar");
    let arrastando = false, offX = 0, offY = 0;
    bar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".tb-buttons")) return;
      if (w.classList.contains("maximized")) return;
      if (window.innerWidth <= 760) return;
      arrastando = true;
      const r = w.getBoundingClientRect();
      offX = e.clientX - r.left; offY = e.clientY - r.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!arrastando) return;
      let x = Math.max(0, Math.min(e.clientX - offX, window.innerWidth - 90));
      let y = Math.max(0, Math.min(e.clientY - offY, window.innerHeight - 80));
      w.style.left = x + "px"; w.style.top = y + "px";
    });
    document.addEventListener("mouseup", () => (arrastando = false));
  });

  /* ---------- 4b. REDIMENSIONAR JANELAS (bordas e cantos) ---------- */
  const RH_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  const MIN_W = 320, MIN_H = 180;
  document.querySelectorAll(".window").forEach((w) => {
    RH_DIRS.forEach((dir) => {
      const h = document.createElement("div");
      h.className = "resize-handle rh-" + dir;
      h.dataset.dir = dir;
      w.appendChild(h);
      h.addEventListener("mousedown", (e) => iniciarResize(e, w, dir));
    });
  });

  let rz = null;
  function iniciarResize(e, w, dir) {
    if (w.classList.contains("maximized")) return;
    if (window.innerWidth <= 760) return;
    const r = w.getBoundingClientRect();
    rz = { w, dir, startX: e.clientX, startY: e.clientY, x: r.left, y: r.top, width: r.width, height: r.height };
    w.classList.add("resized");
    bringToFront(w);
    e.preventDefault();
    e.stopPropagation();
  }
  document.addEventListener("mousemove", (e) => {
    if (!rz) return;
    const dx = e.clientX - rz.startX, dy = e.clientY - rz.startY;
    let { x, y, width, height, dir } = rz;
    if (dir.includes("e")) width = rz.width + dx;
    if (dir.includes("s")) height = rz.height + dy;
    if (dir.includes("w")) { width = rz.width - dx; x = rz.x + dx; }
    if (dir.includes("n")) { height = rz.height - dy; y = rz.y + dy; }
    // respeita tamanho mínimo sem deixar a janela "fugir" ao encolher pela esquerda/topo
    if (width < MIN_W) { if (dir.includes("w")) x = rz.x + (rz.width - MIN_W); width = MIN_W; }
    if (height < MIN_H) { if (dir.includes("n")) y = rz.y + (rz.height - MIN_H); height = MIN_H; }
    // limita à área visível (acima da barra de tarefas)
    width = Math.min(width, window.innerWidth - x);
    height = Math.min(height, window.innerHeight - 44 - y);
    rz.w.style.width = width + "px";
    rz.w.style.height = height + "px";
    rz.w.style.left = x + "px";
    rz.w.style.top = y + "px";
  });
  document.addEventListener("mouseup", () => (rz = null));

  /* ---------- 5. MENU INICIAR ---------- */
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");
  function closeStart() { startMenu.classList.add("hidden"); startBtn.setAttribute("aria-expanded", "false"); }
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const fechado = startMenu.classList.toggle("hidden");
    startBtn.setAttribute("aria-expanded", String(!fechado));
  });
  document.addEventListener("click", (e) => {
    if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) closeStart();
  });
  document.getElementById("start-shutdown").addEventListener("click", () => {
    closeStart();
    shutdown();
  });

  // botão "Mostrar área de trabalho" (minimiza todas as janelas)
  document.getElementById("show-desktop").addEventListener("click", showDesktop);

  function shutdown() {
    // tela de "desligando" sobre tudo
    const tela = document.createElement("div");
    tela.className = "shutdown-screen";
    tela.innerHTML = '<div class="shutdown-spinner"></div><p>Desligando...</p>';
    document.body.appendChild(tela);
    requestAnimationFrame(() => tela.classList.add("on"));

    setTimeout(() => {
      // tenta fechar a aba (só funciona se a página foi aberta por script)
      window.open("", "_self");
      window.close();
      // se o navegador bloquear o fechamento, troca para tela de despedida
      setTimeout(() => {
        tela.innerHTML = '<p class="bye">Você já pode fechar esta aba.<br><small>Obrigado pela visita!</small></p>' +
          '<button class="btn btn-primary" id="shutdown-back">Ligar novamente</button>';
        document.getElementById("shutdown-back").addEventListener("click", () => tela.remove());
      }, 400);
    }, 1600);
  }

  /* ---------- 6. INTERAÇÃO JS #1: TEXT TYPING ---------- */
  (function startTyping() {
    const el = document.getElementById("logon-typed");
    if (!el) return;
    const palavras = ["Rafael De Filippo", "estudante de TI", "futuro dev"];
    let wi = 0, ci = 0, apagando = false;
    function loop() {
      const p = palavras[wi];
      el.textContent = p.slice(0, ci);
      if (!apagando && ci < p.length) { ci++; setTimeout(loop, 110); }
      else if (apagando && ci > 0) { ci--; setTimeout(loop, 55); }
      else if (!apagando) { apagando = true; setTimeout(loop, 1400); }
      else { apagando = false; wi = (wi + 1) % palavras.length; setTimeout(loop, 300); }
    }
    loop();
  })();

  /* ---------- 7. INTERAÇÃO JS #2: ANIMATE ON SCROLL ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((ent) => {
      if (ent.isIntersecting) { ent.target.classList.add("shown"); io.unobserve(ent.target); }
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  function revealIn(scope) {
    scope.querySelectorAll(".reveal").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 80) el.classList.add("shown");
      else io.observe(el);
    });
  }
  function animateSkills() {
    document.querySelectorAll("#win-habilidades .skill-card").forEach((c, i) =>
      setTimeout(() => c.classList.add("shown"), 120 * i)
    );
  }

  /* ---------- 8. MODAL / CAIXA DE DIÁLOGO ---------- */
  const overlay = document.getElementById("modal-overlay");
  const dgTitle = document.getElementById("dialog-title");
  const dgText = document.getElementById("dialog-text");
  const dgIcon = document.getElementById("dialog-icon");
  function showDialog(text, title = "Mensagem", type = "info") {
    dgText.textContent = text; dgTitle.textContent = title;
    dgIcon.className = "dialog-icon " + (type === "ok" ? "ok" : type === "warn" ? "warn" : "");
    dgIcon.textContent = type === "ok" ? "✓" : type === "warn" ? "!" : "i";
    overlay.classList.remove("hidden");
  }
  function hideDialog() { overlay.classList.add("hidden"); }
  document.getElementById("dialog-ok").addEventListener("click", hideDialog);
  document.getElementById("dialog-x").addEventListener("click", hideDialog);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) hideDialog(); });

  document.querySelectorAll(".project-card, .project-featured").forEach((card) => {
    if (card.classList.contains("project-soon")) return; // "em breve" não abre modal
    const abrir = () => showDialog(`${card.dataset.desc}\n\nTecnologias: ${card.dataset.tech}`, card.dataset.title, "info");
    card.addEventListener("click", abrir);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") abrir(); });
  });

  /* ---------- 9. FORMULÁRIO: MÁSCARAS + VALIDAÇÃO ---------- */
  const form = document.getElementById("contact-form");
  const nome = document.getElementById("nome");
  const telefone = document.getElementById("telefone");
  const email = document.getElementById("email");
  const mensagem = document.getElementById("mensagem");
  const msgCount = document.getElementById("msg-count");

  telefone.addEventListener("input", () => {
    let v = telefone.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    telefone.value = v;
  });
  nome.addEventListener("input", () => {
    nome.value = nome.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "").replace(/\b\w/g, (c) => c.toUpperCase());
  });
  email.addEventListener("input", () => { email.value = email.value.toLowerCase().replace(/\s/g, ""); });
  mensagem.addEventListener("input", () => { msgCount.textContent = mensagem.value.length; });

  function setErr(f, msg) { const el = document.querySelector(`.err[data-for="${f}"]`); if (el) el.textContent = msg || ""; }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    ["nome", "telefone", "email", "mensagem"].forEach((f) => setErr(f));
    if (nome.value.trim().length < 3) { setErr("nome", "Informe seu nome completo."); ok = false; }
    if (telefone.value.replace(/\D/g, "").length < 10) { setErr("telefone", "Telefone incompleto."); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { setErr("email", "E-mail inválido."); ok = false; }
    if (mensagem.value.trim().length < 10) { setErr("mensagem", "Escreva ao menos 10 caracteres."); ok = false; }
    if (!ok) { showDialog("Alguns campos precisam de atenção. Confira os destaques em vermelho.", "Formulário incompleto", "warn"); return; }
    showDialog(`Obrigado, ${nome.value.split(" ")[0]}! Sua mensagem foi registrada. Em breve eu respondo.`, "Mensagem enviada", "ok");
    form.reset(); msgCount.textContent = "0";
  });

  /* ---------- 10. ESC fecha menu e modal ---------- */
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeStart(); hideDialog(); } });

  /* ---------- 11. PROMPT DE COMANDO ---------- */
  const cmdInput = document.getElementById("cmd-input");
  const cmdOutput = document.getElementById("cmd-output");
  const cmdBody = document.getElementById("cmd-body");
  let cmdIniciado = false;

  function cmdPrint(texto, classe) {
    const div = document.createElement("div");
    if (classe) div.className = classe;
    div.textContent = texto;
    cmdOutput.appendChild(div);
    cmdBody.scrollTop = cmdBody.scrollHeight;
  }

  function cmdBanner() {
    cmdPrint("Microsoft Windows [versao 6.1.7601]", "cmd-accent");
    cmdPrint("(c) Rafael De Filippo Machado. Portfolio.");
    cmdPrint("");
    cmdPrint("Digite 'ajuda' para ver os comandos disponiveis.", "cmd-ok");
    cmdPrint("");
  }

  const cmdComandos = {
    ajuda: () => {
      cmdPrint("Comandos disponiveis:");
      cmdPrint("  ajuda        - mostra esta lista");
      cmdPrint("  sobre        - quem sou eu");
      cmdPrint("  habilidades  - minhas habilidades");
      cmdPrint("  projetos     - meus projetos");
      cmdPrint("  contato      - como falar comigo");
      cmdPrint("  github       - abre meu GitHub");
      cmdPrint("  tema         - alterna claro/escuro");
      cmdPrint("  data         - data e hora atuais");
      cmdPrint("  limpar       - limpa a tela");
      cmdPrint("  sair         - fecha o prompt");
    },
    sobre: () => {
      cmdPrint("Rafael De Filippo Machado");
      cmdPrint("Estudante do curso tecnico em Informatica no Colegio Cotemig.");
      cmdPrint("Apaixonado por tecnologia, musica, e judo.");
      cmdPrint("Dica: abra a janela 'Sobre mim' para o texto completo.", "cmd-accent");
    },
    habilidades: () => {
      cmdPrint("Habilidades:");
      cmdPrint("  HTML5 ........ 85%");
      cmdPrint("  CSS3 ......... 80%");
      cmdPrint("  JavaScript ... 70%");
      cmdPrint("  C# ........... 85%");
      cmdPrint("  C++ .......... 80%");
      cmdPrint("  MySQL ........ 45% (basico)");
    },
    projetos: () => {
      cmdPrint("Projetos:");
      cmdPrint("  [1] Portfolio Windows 7  (HTML, CSS, JavaScript)  <- este site");
      cmdPrint("  [2] Estudos em C#        (pratica de logica)");
      cmdPrint("  [3] Estudos em C++       (pratica de logica)");
      cmdPrint("Abra a janela 'Projetos' para ver os detalhes.", "cmd-accent");
    },
    contato: () => {
      cmdPrint("E-mail ...: rafa.dfmachado@gmail.com");
      cmdPrint("Telefone .: (31) 99356-0045");
      cmdPrint("GitHub ...: github.com/Rafascia");
    },
    github: () => {
      cmdPrint("Abrindo github.com/Rafascia ...", "cmd-ok");
      window.open("https://github.com/Rafascia", "_blank", "noopener");
    },
    tema: () => {
      toggleTheme();
      cmdPrint("Tema alternado.", "cmd-ok");
    },
    data: () => {
      const d = new Date();
      cmdPrint(d.toLocaleDateString("pt-BR") + "  " + d.toLocaleTimeString("pt-BR"));
    },
    limpar: () => { cmdOutput.innerHTML = ""; },
    sair: () => { closeWindow(windows["cmd"]); },
  };

  function cmdExecutar(entrada) {
    const linha = entrada.trim();
    cmdPrint("C:\\Rafael> " + linha, "cmd-echo");
    if (linha === "") return;
    const cmd = linha.toLowerCase().split(/\s+/)[0];
    // alguns apelidos amigaveis
    const apelidos = { help: "ajuda", clear: "limpar", cls: "limpar", exit: "sair", about: "sobre" };
    const alvo = apelidos[cmd] || cmd;
    if (cmdComandos[alvo]) cmdComandos[alvo]();
    else { cmdPrint("'" + linha + "' nao e reconhecido como um comando.", "cmd-warn"); cmdPrint("Digite 'ajuda' para ver a lista.", "cmd-warn"); }
    cmdPrint("");
  }

  if (cmdInput) {
    cmdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { cmdExecutar(cmdInput.value); cmdInput.value = ""; }
    });
    // clicar em qualquer lugar da janela foca o campo
    cmdBody.addEventListener("click", () => cmdInput.focus());
  }

  // mostra o banner e foca o campo quando o Prompt abre (via menu, ícone, comando)
  function cmdAoAbrir() {
    if (!cmdIniciado) { cmdBanner(); cmdIniciado = true; }
    setTimeout(() => cmdInput && cmdInput.focus(), 80);
  }
  document.querySelectorAll('[data-open="cmd"]').forEach((el) =>
    el.addEventListener("click", () => setTimeout(cmdAoAbrir, 20))
  );

  /* ---------- 11b. TELA DE LOGON (BOAS-VINDAS) ---------- */
  const logon = document.getElementById("logon");
  const logonWelcome = document.getElementById("logon-welcome");

  function mostrarLogon() {
    if (!logon) return;
    logon.classList.remove("hidden", "saindo");
    if (logonWelcome) logonWelcome.classList.add("hidden");
  }
  function entrar() {
    if (!logon) return;
    // mostra "Bem-vindo" e depois revela o desktop
    if (logonWelcome) logonWelcome.classList.remove("hidden");
    setTimeout(() => {
      logon.classList.add("saindo");
      setTimeout(() => logon.classList.add("hidden"), 600);
      // no celular, abre uma seção para a tela não ficar vazia
      if (window.innerWidth <= 760) openWindow("sobre");
    }, 1200);
  }
  const logonEnter = document.getElementById("logon-enter");
  if (logonEnter) logonEnter.addEventListener("click", entrar);
  // "Trocar usuário" no menu Iniciar reexibe o logon
  const menuLogon = document.getElementById("menu-logon");
  if (menuLogon) menuLogon.addEventListener("click", () => { closeStart(); mostrarLogon(); });

  /* ---------- 12. INICIALIZAÇÃO (BOOT) + SOM ---------- */
  const boot = document.getElementById("boot");
  const bootVideo = document.getElementById("boot-video");
  const bootFallback = document.getElementById("boot-fallback");
  const soundIco = document.querySelector(".sound-ico");
  let somLigado = true;
  let encerrado = false;

  function encerrarBoot() {
    if (encerrado) return;
    encerrado = true;
    boot.classList.add("done");
    setTimeout(() => boot.classList.add("hidden"), 800);
    mostrarLogon(); // após a inicialização, mostra a tela de boas-vindas (logon)
  }

  // usa a animação em CSS quando o vídeo não existe/não carrega
  function usarReserva() {
    if (bootVideo) bootVideo.style.display = "none";
    if (bootFallback) bootFallback.hidden = false;
    setTimeout(encerrarBoot, 3600);
  }

  // botão de mudo (controla o som do vídeo)
  document.getElementById("sound-toggle").addEventListener("click", () => {
    somLigado = !somLigado;
    soundIco.textContent = somLigado ? "🔊" : "🔇";
    if (bootVideo) bootVideo.muted = !somLigado;
  });

  // sequência de inicialização
  window.addEventListener("load", () => {
    if (!bootVideo) { usarReserva(); syncTaskbar(); return; }

    // navegadores bloqueiam vídeo COM som no autoplay; começa mudo e tenta ligar o som no 1º gesto
    bootVideo.muted = true;
    const p = bootVideo.play();
    if (p && p.catch) p.catch(() => { /* se nem mudo tocar, cai na reserva */ usarReserva(); });

    // ao primeiro clique/tecla, liga o som do vídeo (se o usuário não tiver mutado)
    const ligaSom = () => {
      if (somLigado && bootVideo && !bootVideo.ended) { bootVideo.muted = false; }
      window.removeEventListener("pointerdown", ligaSom);
      window.removeEventListener("keydown", ligaSom);
    };
    window.addEventListener("pointerdown", ligaSom);
    window.addEventListener("keydown", ligaSom);

    // quando o vídeo termina, revela o desktop
    bootVideo.addEventListener("ended", encerrarBoot);
    // erro ao carregar o arquivo -> reserva
    bootVideo.addEventListener("error", usarReserva);
    // trava de segurança: se nada acontecer em 9s, encerra assim mesmo
    setTimeout(encerrarBoot, 9000);
  });

  syncTaskbar();
})();
