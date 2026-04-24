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
  let width = 0;
  let height = 0;
  let frame = 0;
  let animationId = null;

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    width = Math.floor(bounds.width);
    height = Math.floor(bounds.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawFrame() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(242, 240, 232, 0.2)";
    context.fillRect(0, 0, width, height);

    const horizon = height * 0.64;
    const columns = 18;
    const rows = 9;
    const cellWidth = width / columns;
    const cellHeight = Math.max(34, height / 18);

    context.lineWidth = 1;
    context.strokeStyle = "rgba(24, 89, 168, 0.12)";

    for (let column = 0; column <= columns; column += 1) {
      const x = column * cellWidth;
      context.beginPath();
      context.moveTo(x, horizon - rows * cellHeight * 0.6);
      context.lineTo(x + (column - columns / 2) * 12, height);
      context.stroke();
    }

    for (let row = 0; row < rows; row += 1) {
      const y = horizon + row * cellHeight;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + row * 10);
      context.stroke();
    }

    for (let column = 0; column < columns; column += 1) {
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
    context.fillText("BINARY OUTLOOK / LIVE SIGNAL", Math.max(18, width * 0.055), height - 30);

    frame += 1;
    if (!reduceMotion) {
      animationId = requestAnimationFrame(drawFrame);
    }
  }

  resizeCanvas();
  drawFrame();

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (reduceMotion) drawFrame();
  });

  if (reduceMotion && animationId) {
    cancelAnimationFrame(animationId);
  }
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
