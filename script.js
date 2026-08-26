const menuButton = document.querySelector("[data-menu-button]");
const navLinks = document.querySelector("[data-nav-links]");
const navItems = document.querySelectorAll(".nav-links a");

function closeMenu() {
  if (!menuButton || !navLinks) return;
  menuButton.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
  document.body.classList.remove("nav-open");
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
  });

  navItems.forEach((item) => {
    item.addEventListener("click", closeMenu);
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        navItems.forEach((link) => link.classList.remove("is-active"));
        if (activeLink) activeLink.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

const canvas = document.querySelector("[data-hero-canvas]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  const context = canvas.getContext("2d");
  const heroSection = canvas.closest(".hero-section");
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const meshColumns = 18;
  const meshRows = 9;
  let width = 0;
  let height = 0;
  let frame = 0;
  let animationId = null;
  let mesh = [];
  const pointer = {
    active: false,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
  };

  function buildMesh() {
    const top = height * 0.08;
    const bottom = height * 1.02;
    const center = width * 0.5;

    mesh = Array.from({ length: meshRows + 1 }, (_, rowIndex) => {
      const depth = rowIndex / meshRows;
      const easedDepth = depth ** 1.18;
      const spread = 0.62 + depth * 0.5;
      const baseY = top + easedDepth * (bottom - top);

      return Array.from({ length: meshColumns + 1 }, (_, columnIndex) => {
        const columnPosition = columnIndex / meshColumns - 0.5;
        const baseX = center + columnPosition * width * spread;

        return {
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          velocityX: 0,
          velocityY: 0,
        };
      });
    });
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    width = Math.floor(bounds.width);
    height = Math.floor(bounds.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildMesh();
  }

  function updateMesh() {
    const influenceRadius = Math.min(240, Math.max(130, width * 0.18));
    const repulsionRadius = Math.min(190, Math.max(105, width * 0.14));

    mesh.forEach((row) => {
      row.forEach((point) => {
        point.velocityX += (point.baseX - point.x) * 0.045;
        point.velocityY += (point.baseY - point.y) * 0.045;

        if (pointer.active) {
          const deltaX = pointer.x - point.x;
          const deltaY = pointer.y - point.y;
          const distance = Math.hypot(deltaX, deltaY);

          if (distance < influenceRadius) {
            const influence = (1 - distance / influenceRadius) ** 2;
            point.velocityX += pointer.velocityX * influence * 0.12;
            point.velocityY += pointer.velocityY * influence * 0.12;
          }

          if (distance < repulsionRadius) {
            const safeDistance = Math.max(distance, 0.001);
            const repulsion = (1 - distance / repulsionRadius) ** 2;
            const repulsionStrength = repulsion * 1.65;
            point.velocityX -= (deltaX / safeDistance) * repulsionStrength;
            point.velocityY -= (deltaY / safeDistance) * repulsionStrength;
          }
        }

        point.velocityX *= 0.86;
        point.velocityY *= 0.86;
        point.x += point.velocityX;
        point.y += point.velocityY;
      });
    });

    pointer.velocityX *= 0.8;
    pointer.velocityY *= 0.8;
  }

  function drawMesh() {
    context.lineWidth = 1;
    context.strokeStyle = "rgba(24, 89, 168, 0.14)";

    mesh.forEach((row, rowIndex) => {
      context.beginPath();
      row.forEach((point, columnIndex) => {
        const idleOffset = Math.sin(frame * 0.012 + rowIndex * 0.48 + columnIndex * 0.16) * 0.7;
        const y = point.y + idleOffset;

        if (columnIndex === 0) {
          context.moveTo(point.x, y);
        } else {
          context.lineTo(point.x, y);
        }
      });
      context.stroke();
    });

    for (let columnIndex = 0; columnIndex <= meshColumns; columnIndex += 1) {
      context.beginPath();
      mesh.forEach((row, rowIndex) => {
        const point = row[columnIndex];
        const idleOffset = Math.sin(frame * 0.012 + rowIndex * 0.48 + columnIndex * 0.16) * 0.7;

        if (rowIndex === 0) {
          context.moveTo(point.x, point.y + idleOffset);
        } else {
          context.lineTo(point.x, point.y + idleOffset);
        }
      });
      context.stroke();
    }
  }

  function drawFrame() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(242, 240, 232, 0.2)";
    context.fillRect(0, 0, width, height);

    const horizon = height * 0.64;
    const cellWidth = width / meshColumns;

    updateMesh();
    drawMesh();

    for (let column = 0; column < meshColumns; column += 1) {
      const phase = (frame * 0.018 + column * 0.7) % 6;
      const barHeight = 18 + ((column * 23 + frame) % 90);
      const x = column * cellWidth + cellWidth * 0.18;
      const y = horizon - barHeight - Math.sin(phase) * 10;
      const w = Math.max(12, cellWidth * 0.34);

      context.fillStyle =
        column % 5 === 0
          ? "rgba(201, 54, 43, 0.3)"
          : column % 3 === 0
            ? "rgba(226, 174, 37, 0.38)"
            : "rgba(24, 89, 168, 0.24)";
      context.fillRect(x, y, w, barHeight);
    }

    context.fillStyle = "rgba(226, 174, 37, 0.42)";
    context.fillRect(width * 0.72, height * 0.18, Math.min(130, width * 0.12), Math.min(130, width * 0.12));

    context.fillStyle = "rgba(201, 54, 43, 0.32)";
    context.beginPath();
    context.arc(width * 0.18, height * 0.34, Math.min(72, width * 0.07), 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(24, 89, 168, 0.28)";
    context.beginPath();
    context.moveTo(width * 0.82, height * 0.54);
    context.lineTo(width * 0.92, height * 0.54);
    context.lineTo(width * 0.87, height * 0.38);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(23, 23, 19, 0.24)";
    context.lineWidth = 2;
    context.beginPath();
    for (let x = 0; x <= width; x += 16) {
      const y =
        horizon -
        44 -
        Math.sin(x * 0.014 + frame * 0.025) * 18 -
        Math.cos(x * 0.006 + frame * 0.01) * 12;
      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();

    context.fillStyle = "rgba(23, 23, 19, 0.72)";
    context.font = "700 12px ui-sans-serif, system-ui, sans-serif";
    context.fillText("binaryoutlook.github.io", Math.max(18, width * 0.055), height - 30);

    frame += 1;
    if (!reduceMotion) {
      animationId = requestAnimationFrame(drawFrame);
    }
  }

  resizeCanvas();
  drawFrame();

  if (heroSection && supportsFinePointer && !reduceMotion) {
    heroSection.addEventListener("pointerenter", (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.active = true;
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.velocityX = 0;
      pointer.velocityY = 0;
    });

    heroSection.addEventListener("pointermove", (event) => {
      const bounds = canvas.getBoundingClientRect();
      const nextX = event.clientX - bounds.left;
      const nextY = event.clientY - bounds.top;
      pointer.velocityX = Math.max(-28, Math.min(28, nextX - pointer.x));
      pointer.velocityY = Math.max(-28, Math.min(28, nextY - pointer.y));
      pointer.x = nextX;
      pointer.y = nextY;
    });

    function releasePointer() {
      pointer.active = false;
      pointer.velocityX = 0;
      pointer.velocityY = 0;
    }

    heroSection.addEventListener("pointerleave", releasePointer);
    heroSection.addEventListener("pointercancel", releasePointer);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (reduceMotion) drawFrame();
  });

  if (reduceMotion && animationId) {
    cancelAnimationFrame(animationId);
  }
}

const directionAccordion = document.querySelector("[data-direction-accordion]");

if (directionAccordion) {
  const directionPanels = Array.from(
    directionAccordion.querySelectorAll("[data-direction-panel]")
  );
  const canHoverDirection = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function setActiveDirection(activePanel = null) {
    directionPanels.forEach((panel) => {
      const trigger = panel.querySelector("[data-direction-trigger]");
      const details = panel.querySelector("[data-direction-details]");
      const isActive = panel === activePanel;

      panel.classList.toggle("is-active", isActive);
      trigger?.setAttribute("aria-expanded", String(isActive));
      details?.setAttribute("aria-hidden", String(!isActive));
      details?.toggleAttribute("inert", !isActive);
    });
  }

  setActiveDirection();

  directionPanels.forEach((panel) => {
    const trigger = panel.querySelector("[data-direction-trigger]");

    trigger?.addEventListener("focus", () => setActiveDirection(panel));
    trigger?.addEventListener("click", () => setActiveDirection(panel));
    trigger?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setActiveDirection();
      trigger.blur();
    });

    if (canHoverDirection) {
      panel.addEventListener("pointerenter", () => setActiveDirection(panel));
    }
  });

  if (canHoverDirection) {
    directionAccordion.addEventListener("pointerleave", () => {
      if (!directionAccordion.contains(document.activeElement)) {
        setActiveDirection();
      }
    });
  }

  directionAccordion.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (
        !directionAccordion.contains(document.activeElement) &&
        !directionAccordion.matches(":hover")
      ) {
        setActiveDirection();
      }
    }, 0);
  });
}

const languageWidget = document.querySelector("[data-language-widget]");
const languageCacheTtl = 1000 * 60 * 60 * 12;
const languageScanLimit = 36;
const languageColors = {
  JavaScript: "#f1c232",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "C++": "#f34b7d",
  C: "#555555",
  CUDA: "#76b900",
  Java: "#b07219",
  Jupyter: "#da5b0b",
  "Jupyter Notebook": "#da5b0b",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Go: "#00add8",
  Rust: "#dea584",
};
const fallbackLanguageColors = ["#e2ae25", "#1859a8", "#c9362b", "#0b786e", "#57438b"];

function getLanguageCacheKey(username) {
  return `binaryoutlook-language-stats-v1-${username}`;
}

function readLanguageCache(username) {
  try {
    const rawCache = window.localStorage.getItem(getLanguageCacheKey(username));
    if (!rawCache) return null;

    const cached = JSON.parse(rawCache);
    if (!cached || Date.now() - cached.cachedAt > languageCacheTtl) return null;

    return cached.data;
  } catch (error) {
    return null;
  }
}

function writeLanguageCache(username, data) {
  try {
    window.localStorage.setItem(
      getLanguageCacheKey(username),
      JSON.stringify({ cachedAt: Date.now(), data })
    );
  } catch (error) {
    // Local storage is an enhancement; the live panel still works without it.
  }
}

async function fetchGitHubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    },
  });

  if (!response.ok) {
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");
    const rateLimitNote =
      rateLimitRemaining === "0" && rateLimitReset
        ? ` Rate limit resets at ${new Date(Number(rateLimitReset) * 1000).toLocaleTimeString()}.`
        : "";
    throw new Error(`GitHub API request failed with ${response.status}.${rateLimitNote}`);
  }

  return response.json();
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

async function fetchLanguageData(username) {
  const repos = await fetchGitHubJson(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&direction=desc&per_page=100`
  );

  if (!Array.isArray(repos)) {
    throw new Error("GitHub API returned an unexpected repository payload.");
  }

  const eligibleRepos = repos.filter(
    (repo) => !repo.fork && !repo.archived && !repo.disabled && repo.size > 0
  );
  const sourceRepos = eligibleRepos.slice(0, languageScanLimit);
  const totals = new Map();
  const failures = [];

  await mapWithConcurrency(sourceRepos, 4, async (repo) => {
    try {
      const languages = await fetchGitHubJson(repo.languages_url);
      Object.entries(languages).forEach(([language, bytes]) => {
        totals.set(language, (totals.get(language) || 0) + bytes);
      });
    } catch (error) {
      failures.push(repo.name);
    }
  });

  const totalBytes = Array.from(totals.values()).reduce((sum, bytes) => sum + bytes, 0);

  if (!totalBytes) {
    throw new Error("No language totals were available from GitHub.");
  }

  const languages = Array.from(totals, ([name, bytes]) => ({
    name,
    bytes,
    percent: (bytes / totalBytes) * 100,
  }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 7);

  return {
    languages,
    repoCount: sourceRepos.length,
    totalRepoCount: eligibleRepos.length,
    isLimited: eligibleRepos.length > sourceRepos.length,
    skippedCount: failures.length,
    scannedAt: new Date().toISOString(),
    totalBytes,
  };
}

function getLanguageColor(languageName, index) {
  return languageColors[languageName] || fallbackLanguageColors[index % fallbackLanguageColors.length];
}

function createLanguageRow(language, index) {
  const row = document.createElement("div");
  row.className = "language-row";
  row.setAttribute("aria-label", `${language.name}: ${language.percent.toFixed(1)} percent`);
  row.style.setProperty("--language-color", getLanguageColor(language.name, index));
  row.style.setProperty("--language-width", `${Math.max(language.percent, 2).toFixed(2)}%`);

  const meta = document.createElement("div");
  meta.className = "language-row__meta";

  const name = document.createElement("span");
  name.className = "language-row__name";

  const swatch = document.createElement("span");
  swatch.className = "language-swatch";
  swatch.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = language.name;

  const percent = document.createElement("span");
  percent.className = "language-row__percent";
  percent.textContent = `${language.percent.toFixed(1)}%`;

  const bar = document.createElement("div");
  bar.className = "language-row__bar";
  bar.setAttribute("aria-hidden", "true");

  const fill = document.createElement("span");
  fill.className = "language-row__fill";

  name.append(swatch, label);
  meta.append(name, percent);
  bar.append(fill);
  row.append(meta, bar);

  return row;
}

function renderLanguageData(widget, data, fromCache = false) {
  const list = widget.querySelector("[data-language-list]");
  const summary = widget.querySelector("[data-language-summary]");
  const topLanguage = data.languages[0];
  const cacheNote = fromCache ? " using a recent local cache" : "";
  const skipNote = data.skippedCount ? ` ${data.skippedCount} repositories were skipped during the scan.` : "";
  const repoScope = data.isLimited
    ? `the ${data.repoCount} most recently pushed public owner repositories`
    : `${data.repoCount} public owner repositories`;

  summary.textContent = `${topLanguage.name} leads this snapshot. I scanned ${repoScope} through GitHub's language data${cacheNote}.${skipNote}`;
  list.replaceChildren(...data.languages.map(createLanguageRow));
  widget.classList.remove("has-error");
}

function renderLanguageError(widget) {
  const list = widget.querySelector("[data-language-list]");
  const summary = widget.querySelector("[data-language-summary]");
  const row = createLanguageRow({ name: "GitHub API unavailable", percent: 100 }, 2);

  summary.textContent =
    "Live language data is unavailable right now, usually because public API traffic is rate-limited. The GitHub profile link still has the full repository history.";
  list.replaceChildren(row);
  widget.classList.add("has-error");
}

async function initLanguageWidget(widget) {
  const username = widget.dataset.githubUser || "BinaryOutlook";
  const cachedData = readLanguageCache(username);

  if (cachedData) {
    renderLanguageData(widget, cachedData, true);
  }

  try {
    const liveData = await fetchLanguageData(username);
    writeLanguageCache(username, liveData);
    renderLanguageData(widget, liveData);
  } catch (error) {
    if (!cachedData) renderLanguageError(widget);
  }
}

if (languageWidget) {
  initLanguageWidget(languageWidget);
}

function addWritingContactCta() {
  const writingMain = document.querySelector(".writing-page main");

  if (!writingMain || writingMain.querySelector("[data-writing-contact-cta]")) return;

  const contactCta = document.createElement("section");
  contactCta.className = "section writing-contact-cta";
  contactCta.setAttribute("aria-labelledby", "writing-contact-title");
  contactCta.dataset.writingContactCta = "";
  contactCta.innerHTML = `
    <div class="writing-contact-cta__inner">
      <div class="writing-contact-cta__copy">
        <p class="section-kicker">Start a conversation</p>
        <h2 id="writing-contact-title">An idea worth discussing?</h2>
        <p>Share what you are building, questioning, or trying to understand.</p>
      </div>
      <a class="button primary" href="./index.html#contact">Contact me</a>
    </div>
  `;

  writingMain.append(contactCta);
}

function copyTextFallback(text) {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();

  if (!copied) throw new Error("Copy command was unavailable");
}

async function copyEmail(button) {
  const email = button.dataset.copyEmail;
  const label = button.querySelector("[data-copy-label]");
  const status = button.closest(".contact-panel__lead")?.querySelector(".contact-copy-status");

  if (!email || !label) return;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(email);
    } else {
      copyTextFallback(email);
    }

    label.textContent = "Email copied";
    button.classList.add("is-copied");
    if (status) status.textContent = `${email} copied to your clipboard.`;
  } catch (error) {
    label.textContent = "Copy unavailable";
    if (status) status.textContent = `Copy did not work. Select the visible address: ${email}`;
  }

  window.setTimeout(() => {
    label.textContent = "Copy email";
    button.classList.remove("is-copied");
    if (status) status.textContent = "";
  }, 2800);
}

addWritingContactCta();

document.querySelectorAll("[data-copy-email]").forEach((button) => {
  button.classList.add("is-ready");
  button.addEventListener("click", () => copyEmail(button));
});
