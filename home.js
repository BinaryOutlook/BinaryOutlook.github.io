(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const wideLayout = window.matchMedia("(min-width: 981px)");

  /* ---------- Navigation ---------- */
  const menuButton = document.querySelector("[data-menu-button]");
  const navLinks = document.querySelector("[data-nav-links]");

  function setMenu(open) {
    if (!menuButton) return;
    menuButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  }

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  navLinks?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      setMenu(false);
      menuButton?.focus();
    }
  });

  window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  const sectionLinks = new Map();
  navLinks?.querySelectorAll('a[href^="#"]').forEach((link) => {
    sectionLinks.set(link.getAttribute("href").slice(1), link);
  });

  if ("IntersectionObserver" in window && sectionLinks.size) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach((link, id) => {
            const active = id === entry.target.id;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Theme ---------- */
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.dataset.theme || (prefersDark.matches ? "dark" : "light");
  }

  function syncThemeLabel() {
    if (!themeToggle) return;
    const next = currentTheme() === "dark" ? "light" : "dark";
    themeToggle.setAttribute("aria-label", `Switch to ${next} theme`);
    themeToggle.title = `Switch to ${next} theme`;
  }

  themeToggle?.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("bo-theme", next);
    } catch (error) {
      /* storage unavailable */
    }
    syncThemeLabel();
    document.dispatchEvent(new CustomEvent("themechange"));
  });

  prefersDark.addEventListener("change", () => {
    syncThemeLabel();
    document.dispatchEvent(new CustomEvent("themechange"));
  });
  syncThemeLabel();

  /* ---------- Reveal ---------- */
  const revealItems = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Hero composition ---------- */
  const composition = document.querySelector("[data-composition]");
  const recompose = document.querySelector("[data-recompose]");

  if (composition) {
    const tiles = Array.from(composition.querySelectorAll(".tile"));
    const shapes = ["circle", "quarter", "square", "triangle", "half", "ring", "bars", "blank"];
    const colors = ["red", "yellow", "blue", "ink"];
    const rotation = new WeakMap();
    let tickId = null;
    let heroVisible = true;

    tiles.forEach((tile) => {
      const match = tile.className.match(/r-(\d+)/);
      rotation.set(tile, match ? Number(match[1]) : 0);
    });

    function rotateTile(tile, step = 90) {
      const next = rotation.get(tile) + step;
      rotation.set(tile, next);
      tile.style.setProperty("--r", `${next}deg`);
    }

    function pick(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    function recomposeTiles() {
      tiles.forEach((tile, index) => {
        const apply = () => {
          const shape = Math.random() < 0.12 ? "blank" : pick(shapes.slice(0, -1));
          tile.className = `tile tile--${shape} c-${pick(colors)}${Math.random() < 0.15 ? " is-small" : ""}`;
          rotation.set(tile, Math.floor(Math.random() * 4) * 90);
          tile.style.setProperty("--r", `${rotation.get(tile)}deg`);
        };
        if (reduceMotion) apply();
        else window.setTimeout(apply, index * 35);
      });
    }

    tiles.forEach((tile) => {
      tile.addEventListener("pointerenter", () => {
        if (finePointer.matches) rotateTile(tile);
      });
      tile.addEventListener("click", () => rotateTile(tile));
    });

    recompose?.addEventListener("click", recomposeTiles);

    function tick() {
      rotateTile(pick(tiles), Math.random() < 0.5 ? 90 : -90);
    }

    function startTicker() {
      if (reduceMotion || tickId || !heroVisible || document.hidden) return;
      tickId = window.setInterval(tick, 2400);
    }

    function stopTicker() {
      window.clearInterval(tickId);
      tickId = null;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        if (heroVisible) startTicker();
        else stopTicker();
      }).observe(composition);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopTicker();
      else startTicker();
    });

    startTicker();
  }

  /* ---------- Direction layers ---------- */
  const direction = document.querySelector("[data-direction]");

  if (direction) {
    const layers = Array.from(direction.querySelectorAll("[data-layer]"));
    const triggers = layers.map((layer) => layer.querySelector("[data-layer-trigger]"));
    let activeLayer = layers[0];

    function setActive(layer) {
      activeLayer = layer;
      layers.forEach((item, index) => {
        const active = item === layer;
        item.classList.toggle("is-active", active);
        triggers[index]?.setAttribute("aria-expanded", String(active));
      });
    }

    layers.forEach((layer, index) => {
      const trigger = triggers[index];
      layer.addEventListener("pointerenter", () => {
        if (finePointer.matches && wideLayout.matches) setActive(layer);
      });
      trigger?.addEventListener("click", () => {
        if (!wideLayout.matches && activeLayer === layer) setActive(null);
        else setActive(layer);
      });
      trigger?.addEventListener("focus", () => {
        if (wideLayout.matches) setActive(layer);
      });
      trigger?.addEventListener("keydown", (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          triggers[event.key === "Home" ? 0 : triggers.length - 1]?.focus();
          return;
        }
        if (!(event.key in keys)) return;
        event.preventDefault();
        const next = (index + keys[event.key] + triggers.length) % triggers.length;
        triggers[next]?.focus();
        if (!wideLayout.matches) setActive(layers[next]);
      });
    });

    setActive(layers[0]);
  }

  /* ---------- Projects + GitHub snapshot ---------- */
  const panel = document.querySelector("[data-panel]");
  const projects = Array.from(document.querySelectorAll("[data-project]"));

  if (panel && projects.length) {
    const $ = (selector) => panel.querySelector(selector);
    const ui = {
      repo: $("[data-panel-repo]"),
      title: $("[data-panel-title]"),
      summary: $("[data-panel-summary]"),
      novelty: $("[data-panel-novelty]"),
      foundationRow: $("[data-panel-foundation-row]"),
      foundation: $("[data-panel-foundation]"),
      live: $("[data-panel-live]"),
      activity: $("[data-panel-activity]"),
      language: $("[data-panel-language]"),
      stars: $("[data-panel-stars]"),
      commits: $("[data-panel-commits]"),
      commit: $("[data-panel-commit]"),
      commitState: $("[data-panel-commit-state]"),
      commitDate: $("[data-panel-commit-date]"),
      fetched: $("[data-panel-fetched]"),
      refresh: $("[data-panel-refresh]"),
      action: $("[data-panel-action]"),
      actionLabel: $("[data-panel-action-label]"),
    };
    const selects = projects.map((project) => project.querySelector("[data-project-select]"));
    const cache = new Map();
    const cacheTtl = 10 * 60 * 1000;
    const timeoutMs = 8000;
    const compact = new Intl.NumberFormat("en", { notation: "compact" });
    const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    let activeProject = null;
    let requestId = 0;

    ui.refresh.hidden = false;

    function relativeDate(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const days = Math.round((date.getTime() - Date.now()) / 86400000);
      if (Math.abs(days) < 1) return "today";
      if (Math.abs(days) < 31) return relative.format(days, "day");
      if (Math.abs(days) < 365) return relative.format(Math.round(days / 30), "month");
      return relative.format(Math.round(days / 365), "year");
    }

    function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
    }

    function readStored(repo) {
      try {
        const stored = JSON.parse(sessionStorage.getItem(`bo-gh:${repo}`) || "null");
        if (stored && Date.now() - stored.fetchedAt < cacheTtl) return stored;
      } catch (error) {
        /* ignore */
      }
      return null;
    }

    function store(repo, snapshot) {
      cache.set(repo, snapshot);
      try {
        sessionStorage.setItem(`bo-gh:${repo}`, JSON.stringify(snapshot));
      } catch (error) {
        /* ignore */
      }
    }

    async function githubFetch(url) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal,
        });
        if (response.status === 409) return { response, data: [] };
        if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
        return { response, data: await response.json() };
      } finally {
        window.clearTimeout(timer);
      }
    }

    async function fetchSnapshot(repo) {
      const base = `https://api.github.com/repos/${repo.split("/").map(encodeURIComponent).join("/")}`;
      const [details, history] = await Promise.allSettled([
        githubFetch(base),
        githubFetch(`${base}/commits?per_page=1`),
      ]);

      if (details.status === "rejected" && history.status === "rejected") {
        throw details.reason;
      }

      const snapshot = { fetchedAt: Date.now(), partial: details.status === "rejected" || history.status === "rejected" };

      if (details.status === "fulfilled") {
        const data = details.value.data || {};
        snapshot.fullName = data.full_name || repo;
        snapshot.language = data.language || "—";
        snapshot.stars = Number.isFinite(data.stargazers_count) ? data.stargazers_count : null;
        snapshot.pushedAt = data.pushed_at || null;
      }

      if (history.status === "fulfilled") {
        const { response, data } = history.value;
        const list = Array.isArray(data) ? data : [];
        const last = (response.headers.get("link") || "").match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/i);
        snapshot.commits = last ? Number.parseInt(last[1], 10) : list.length;
        const head = list[0];
        if (head && /^[a-f0-9]{40}$/i.test(head.sha)) {
          snapshot.latestCommit = {
            title: (head.commit?.message || "View latest commit").split(/\r?\n/)[0],
            url: `https://github.com/${repo}/commit/${head.sha}`,
            date: head.commit?.committer?.date || head.commit?.author?.date || null,
          };
        }
      }

      return snapshot;
    }

    function setLive(state, text) {
      ui.live.className = `live is-${state}`;
      ui.live.lastChild.textContent = text;
    }

    function renderLoading(repo) {
      setLive("loading", "Fetching");
      ui.repo.textContent = repo;
      ui.repo.title = repo;
      [ui.activity, ui.language, ui.stars, ui.commits].forEach((node) => (node.textContent = "…"));
      ui.commit.hidden = true;
      ui.commitDate.hidden = true;
      ui.commitState.hidden = false;
      ui.commitState.textContent = "Loading latest commit…";
      ui.fetched.textContent = "Fetching GitHub data…";
      ui.refresh.disabled = true;
    }

    function renderSnapshot(repo, snapshot) {
      setLive(snapshot.partial ? "error" : "ok", snapshot.partial ? "Partial" : "Live data");
      ui.repo.textContent = snapshot.fullName || repo;
      ui.repo.title = snapshot.fullName || repo;

      const activity = snapshot.latestCommit?.date || snapshot.pushedAt;
      if (activity) {
        ui.activity.innerHTML = "";
        ui.activity.append(formatDate(activity));
        const small = document.createElement("small");
        small.textContent = relativeDate(activity);
        ui.activity.append(small);
      } else {
        ui.activity.textContent = "—";
      }
      ui.language.textContent = snapshot.language || "—";
      ui.language.title = snapshot.language || "";
      ui.stars.textContent = snapshot.stars == null ? "—" : compact.format(snapshot.stars);
      ui.commits.textContent = snapshot.commits == null ? "—" : compact.format(snapshot.commits);

      if (snapshot.latestCommit) {
        ui.commit.hidden = false;
        ui.commit.href = snapshot.latestCommit.url;
        ui.commit.textContent = snapshot.latestCommit.title;
        ui.commit.title = snapshot.latestCommit.title;
        ui.commitState.hidden = true;
        const date = formatDate(snapshot.latestCommit.date);
        ui.commitDate.hidden = !date;
        ui.commitDate.textContent = date;
        if (date) ui.commitDate.dateTime = snapshot.latestCommit.date;
      } else {
        ui.commit.hidden = true;
        ui.commitDate.hidden = true;
        ui.commitState.hidden = false;
        ui.commitState.textContent = "Latest commit unavailable";
      }

      ui.fetched.textContent = `${snapshot.partial ? "Partial data fetched" : "Fetched"} ${timeFormat.format(new Date(snapshot.fetchedAt))}`;
      ui.refresh.disabled = false;
    }

    function renderError(repo) {
      setLive("error", "Offline");
      ui.repo.textContent = repo;
      [ui.activity, ui.language, ui.stars, ui.commits].forEach((node) => (node.textContent = "—"));
      ui.commit.hidden = true;
      ui.commitDate.hidden = true;
      ui.commitState.hidden = false;
      ui.commitState.textContent = "GitHub could not be reached. Project details above still apply.";
      ui.fetched.textContent = "GitHub data unavailable";
      ui.refresh.disabled = false;
    }

    async function loadSnapshot(project, { force = false } = {}) {
      const repo = project.dataset.repo;
      const current = ++requestId;
      const cached = !force && (cache.get(repo) || readStored(repo));

      if (cached && Date.now() - cached.fetchedAt < cacheTtl) {
        cache.set(repo, cached);
        renderSnapshot(repo, cached);
        return;
      }

      renderLoading(repo);
      try {
        const snapshot = await fetchSnapshot(repo);
        store(repo, snapshot);
        if (current === requestId) renderSnapshot(repo, snapshot);
      } catch (error) {
        if (current === requestId) renderError(repo);
      }
    }

    function selectProject(project, { load = true, animate = true } = {}) {
      if (project === activeProject) return;
      activeProject = project;

      projects.forEach((item, index) => {
        const selected = item === project;
        item.classList.toggle("is-selected", selected);
        selects[index]?.setAttribute("aria-pressed", String(selected));
      });

      const apply = () => {
        panel.style.setProperty("--accent", project.style.getPropertyValue("--accent"));
        const onAccent = project.style.getPropertyValue("--on-accent");
        if (onAccent) panel.style.setProperty("--on-accent", onAccent);
        else panel.style.removeProperty("--on-accent");

        ui.title.textContent = project.querySelector("[data-project-select]").textContent.trim();
        ui.summary.textContent = project.dataset.summary || "";
        ui.novelty.textContent = project.dataset.novelty || "";
        ui.foundationRow.hidden = !project.dataset.foundation;
        ui.foundation.textContent = project.dataset.foundation || "";
        ui.action.href = project.dataset.actionUrl;
        ui.actionLabel.textContent = project.dataset.actionLabel || "Open project";
        panel.classList.remove("is-swapping");
      };

      if (reduceMotion || !animate) apply();
      else {
        panel.classList.add("is-swapping");
        window.setTimeout(apply, 160);
      }

      if (load) loadSnapshot(project);
    }

    projects.forEach((project, index) => {
      const select = selects[index];
      select?.addEventListener("click", () => {
        selectProject(project);
        if (!wideLayout.matches) panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
      select?.addEventListener("keydown", (event) => {
        const keys = { ArrowDown: 1, ArrowUp: -1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        const next = (index + keys[event.key] + projects.length) % projects.length;
        selects[next]?.focus();
        selectProject(projects[next]);
      });
    });

    ui.refresh.addEventListener("click", () => {
      if (activeProject) loadSnapshot(activeProject, { force: true });
    });

    selectProject(projects[0], { load: false, animate: false });

    if ("IntersectionObserver" in window) {
      const panelObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        panelObserver.disconnect();
        loadSnapshot(activeProject);
      }, { rootMargin: "300px 0px" });
      panelObserver.observe(panel);
    } else {
      loadSnapshot(activeProject);
    }
  }

  /* ---------- Email ---------- */
  function emailOf(element) {
    const { emailUser, emailDomain } = element.dataset;
    return emailUser && emailDomain ? `${emailUser}@${emailDomain}` : "";
  }

  document.querySelectorAll("[data-email-action]").forEach((link) => {
    const email = emailOf(link);
    if (email) link.href = `mailto:${email}`;
  });

  function copyFallback(text) {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Copy unavailable");
  }

  const copyStatus = document.querySelector("[data-copy-status]");
  document.querySelectorAll("[data-copy-email]").forEach((button) => {
    const label = button.querySelector("[data-copy-label]");
    let resetId = null;
    button.hidden = false;
    button.addEventListener("click", async () => {
      const email = emailOf(button);
      if (!email) return;
      try {
        if (navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(email);
        else copyFallback(email);
        label.textContent = "Email copied ✓";
        button.classList.add("is-copied");
        if (copyStatus) copyStatus.textContent = "Email address copied to your clipboard.";
      } catch (error) {
        label.textContent = "Copy unavailable";
        if (copyStatus) copyStatus.textContent = "Copy did not work. Use “Email me” to open your mail app.";
      }
      window.clearTimeout(resetId);
      resetId = window.setTimeout(() => {
        label.textContent = "Copy email";
        button.classList.remove("is-copied");
        if (copyStatus) copyStatus.textContent = "";
      }, 2800);
    });
  });

  /* ---------- Footer dot field ---------- */
  const field = document.querySelector("[data-footer-field]");
  const context = field?.getContext("2d");

  if (field && context) {
    const footer = field.parentElement;
    const spacing = 26;
    const pointer = { x: -9999, y: -9999, active: false };
    let width = 0;
    let height = 0;
    let palette = {};
    let frameId = null;
    let visible = false;
    let frame = 0;

    function readPalette() {
      const styles = getComputedStyle(root);
      palette = {
        line: styles.getPropertyValue("--line").trim(),
        accents: ["--red", "--yellow", "--blue"].map((name) => styles.getPropertyValue(name).trim()),
      };
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = field.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      field.width = Math.round(width * ratio);
      field.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      const radius = 150;
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const influence = pointer.active ? Math.max(0, 1 - distance / radius) : 0;
          const wave = reduceMotion ? 0 : (Math.sin(frame * 0.02 + x * 0.012 + y * 0.02) + 1) * 0.35;
          const size = 1.3 + wave + influence * 6;
          const push = influence * 10;
          const px = x + (distance ? (dx / distance) * push : 0);
          const py = y + (distance ? (dy / distance) * push : 0);

          if (influence > 0.05) {
            const band = Math.floor(((x / spacing) + (y / spacing)) % 3);
            context.fillStyle = palette.accents[band];
            context.globalAlpha = 0.35 + influence * 0.65;
            if (band === 2) {
              context.fillRect(px - size, py - size, size * 2, size * 2);
            } else {
              context.beginPath();
              context.arc(px, py, size, 0, Math.PI * 2);
              context.fill();
            }
          } else {
            context.globalAlpha = 1;
            context.fillStyle = palette.line;
            context.fillRect(px - size / 2, py - size / 2, size, size);
          }
        }
      }
      context.globalAlpha = 1;
    }

    function loop() {
      frame += 1;
      draw();
      frameId = window.requestAnimationFrame(loop);
    }

    function start() {
      if (frameId || reduceMotion || !visible || document.hidden) return;
      frameId = window.requestAnimationFrame(loop);
    }

    function stop() {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    readPalette();
    resize();
    draw();

    footer.addEventListener("pointermove", (event) => {
      const bounds = field.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
      if (reduceMotion) draw();
    });

    footer.addEventListener("pointerleave", () => {
      pointer.active = false;
      if (reduceMotion) draw();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      }).observe(footer);
    }

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    document.addEventListener("themechange", () => {
      readPalette();
      draw();
    });

    let resizeId = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(() => {
        resize();
        draw();
      }, 120);
    });
  }
})();
