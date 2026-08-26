(() => {
  const previewShell = document.querySelector("[data-project-preview-shell]");
  const previewCards = Array.from(document.querySelectorAll("[data-project-preview-card]"));

  if (!previewShell || previewCards.length === 0) return;

  const previewVideo = previewShell.querySelector("[data-project-preview-video]");
  const previewTitle = previewShell.querySelector("[data-project-preview-title]");
  const previewDescription = previewShell.querySelector("[data-project-preview-description]");
  const previewStatus = previewShell.querySelector("[data-project-preview-status]");
  const previewSnapshot = previewShell.querySelector("[data-project-preview-snapshot]");
  const previewRepository = previewShell.querySelector("[data-project-preview-repository]");
  const previewActivity = previewShell.querySelector("[data-project-preview-activity]");
  const previewLanguage = previewShell.querySelector("[data-project-preview-language]");
  const previewStars = previewShell.querySelector("[data-project-preview-stars]");
  const previewCommits = previewShell.querySelector("[data-project-preview-commits]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const repositoryCache = new Map();
  const countFormatter = new Intl.NumberFormat("en", { notation: "compact" });
  const githubHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  };
  const githubTimeoutMs = 8000;
  let activeCard = null;
  let shouldPlayWhenReady = false;

  function setStatus(message) {
    if (previewStatus) previewStatus.textContent = message;
  }

  function getPreviewSource(card) {
    if (!previewVideo) return "";

    const webm = card.dataset.previewWebm || "";
    const mp4 = card.dataset.previewMp4 || "";
    const supportsWebm = previewVideo.canPlayType("video/webm") !== "";
    const supportsMp4 = previewVideo.canPlayType("video/mp4") !== "";

    if (webm && supportsWebm) return webm;
    if (mp4 && supportsMp4) return mp4;
    return webm || mp4;
  }

  function getCardContent(card) {
    return {
      title: card.querySelector(".project-content h3")?.textContent.trim() || "Project preview",
      description:
        card.querySelector(".project-content p")?.textContent.trim() ||
        "A short demonstration of this project.",
    };
  }

  function getRepository(card) {
    const link = card.querySelector('.project-link[href*="github.com"]');
    if (!link) return null;

    try {
      const url = new URL(link.href, window.location.href);
      if (url.hostname !== "github.com") return null;
      const [owner, name] = url.pathname.split("/").filter(Boolean);
      if (!owner || !name) return null;
      const cleanName = name.replace(/\.git$/, "");
      return { owner, name: cleanName, path: `${owner}/${cleanName}` };
    } catch (error) {
      return null;
    }
  }

  function formatRepositoryDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unavailable";

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function formatCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 ? countFormatter.format(count) : "—";
  }

  function getCommitCount(response, commits) {
    const linkHeader = response.headers.get("link") || "";
    const lastPage = linkHeader.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/i);
    if (lastPage) return Number.parseInt(lastPage[1], 10);
    return commits.length;
  }

  async function fetchGitHubResource(url, { acceptedStatuses = [] } = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), githubTimeoutMs);

    try {
      const response = await fetch(url, { headers: githubHeaders, signal: controller.signal });
      if (acceptedStatuses.includes(response.status)) return { response, data: null };
      if (!response.ok) {
        throw new Error(`GitHub repository request failed with ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error("GitHub returned an invalid repository payload.");
      }
      return { response, data };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function fetchRepositoryDetails(repository) {
    const { data } = await fetchGitHubResource(
      `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`
    );
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("GitHub returned an unexpected repository payload.");
    }
    return data;
  }

  async function fetchCommitHistory(repository) {
    const { response, data } = await fetchGitHubResource(
      `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/commits?per_page=1`,
      { acceptedStatuses: [409] }
    );
    if (response.status === 409) return { count: 0, latestActivity: null };
    if (!Array.isArray(data)) {
      throw new Error("GitHub returned an unexpected commit payload.");
    }

    return {
      count: getCommitCount(response, data),
      latestActivity:
        data[0]?.commit?.committer?.date || data[0]?.commit?.author?.date || null,
    };
  }

  function setSnapshotValues({ repository, activity, language, stars, commits }) {
    if (previewRepository) {
      previewRepository.textContent = repository;
      previewRepository.title = repository;
    }
    if (previewActivity) previewActivity.textContent = activity;
    if (previewLanguage) previewLanguage.textContent = language;
    if (previewStars) previewStars.textContent = stars;
    if (previewCommits) previewCommits.textContent = commits;
  }

  async function fetchRepositorySnapshot(repository) {
    const cached = repositoryCache.get(repository.path);
    if (cached) return cached;

    const request = (async () => {
      const [detailsResult, historyResult] = await Promise.allSettled([
        fetchRepositoryDetails(repository),
        fetchCommitHistory(repository),
      ]);
      if (detailsResult.status === "rejected" && historyResult.status === "rejected") {
        throw new Error("Live repository data is unavailable.");
      }

      const details = detailsResult.status === "fulfilled" ? detailsResult.value : null;
      const history = historyResult.status === "fulfilled" ? historyResult.value : null;
      return {
        repository: repository.path,
        activity: formatRepositoryDate(
          history?.latestActivity || details?.pushed_at || details?.updated_at
        ),
        language: details ? details.language || "Mixed" : "—",
        stars: details ? formatCount(details.stargazers_count) : "—",
        commits: history ? formatCount(history.count) : "—",
        partial: !details || !history,
      };
    })();

    repositoryCache.set(repository.path, request);
    request
      .then((snapshot) => {
        if (snapshot.partial) repositoryCache.delete(repository.path);
      })
      .catch(() => repositoryCache.delete(repository.path));
    return request;
  }

  async function loadRepositorySnapshot(card, { announce = true } = {}) {
    const repository = getRepository(card);
    if (!repository) {
      previewShell.classList.remove("is-snapshot-loading");
      previewSnapshot?.setAttribute("aria-busy", "false");
      setSnapshotValues({
        repository: "Repository unavailable",
        activity: "Unavailable",
        language: "—",
        stars: "—",
        commits: "—",
      });
      if (announce) setStatus("Repository snapshot unavailable");
      return;
    }

    setSnapshotValues({
      repository: repository.path,
      activity: "Loading…",
      language: "—",
      stars: "—",
      commits: "—",
    });
    previewShell.classList.add("is-snapshot-loading");
    previewSnapshot?.setAttribute("aria-busy", "true");
    if (announce) setStatus("Loading live repository data");

    try {
      const snapshot = await fetchRepositorySnapshot(repository);
      if (card !== activeCard) return;
      setSnapshotValues(snapshot);
      if (announce) {
        setStatus(
          snapshot.partial
            ? "Repository snapshot partially available"
            : "Live repository snapshot"
        );
      }
    } catch (error) {
      if (card !== activeCard) return;
      setSnapshotValues({
        repository: repository.path,
        activity: "Unavailable",
        language: "—",
        stars: "—",
        commits: "—",
      });
      if (announce) setStatus("Repository snapshot unavailable");
    } finally {
      if (card === activeCard) {
        previewShell.classList.remove("is-snapshot-loading");
        previewSnapshot?.setAttribute("aria-busy", "false");
      }
    }
  }

  function clearPreviewMedia() {
    shouldPlayWhenReady = false;
    previewShell.classList.remove("has-media", "is-loading", "is-playing", "has-media-error");
    previewSnapshot?.setAttribute("aria-hidden", "false");

    if (!previewVideo) return;
    previewVideo.pause();
    previewVideo.removeAttribute("src");
    previewVideo.removeAttribute("poster");
    previewVideo.removeAttribute("aria-label");
    previewVideo.setAttribute("aria-hidden", "true");
    previewVideo.controls = false;
    previewVideo.dataset.previewKey = "";
    previewVideo.load();
  }

  function readyStatus() {
    if (reduceMotion || saveData || !canHover) return "Select Preview to play";
    return "Hover or focus to play";
  }

  function playPreview({ userInitiated = false } = {}) {
    if (!previewVideo || !previewVideo.currentSrc) return;

    if (!userInitiated && (!canHover || reduceMotion || saveData)) {
      shouldPlayWhenReady = false;
      setStatus("Select Preview to play");
      return;
    }

    shouldPlayWhenReady = true;
    previewVideo
      .play()
      .then(() => {
        previewShell.classList.add("is-playing");
        setStatus("Playing preview");
      })
      .catch(() => {
        shouldPlayWhenReady = false;
        setStatus("Select Preview to play");
      });
  }

  function pausePreview() {
    shouldPlayWhenReady = false;
    if (!previewVideo || previewVideo.paused) return;
    previewVideo.pause();
    previewShell.classList.remove("is-playing");
    setStatus(readyStatus());
  }

  function configurePreviewMedia(card, { play = false, userInitiated = false } = {}) {
    clearPreviewMedia();

    const mediaEnabled = card.dataset.previewEnabled === "true";
    loadRepositorySnapshot(card, { announce: !mediaEnabled });
    if (!mediaEnabled || !previewVideo) {
      return;
    }

    const source = getPreviewSource(card);
    const poster = card.dataset.previewPoster || "";
    const { title } = getCardContent(card);

    if (poster) previewVideo.poster = poster;
    if (source || poster) {
      previewShell.classList.add("has-media");
      previewSnapshot?.setAttribute("aria-hidden", "true");
      previewVideo.setAttribute("aria-label", `${title} project preview`);
      previewVideo.setAttribute("aria-hidden", "false");
    }

    if (!source) {
      setStatus(poster ? "Project preview poster" : "Repository snapshot available");
      return;
    }

    shouldPlayWhenReady = play;
    previewShell.classList.add("is-loading");
    previewVideo.dataset.previewKey = card.dataset.previewKey || "";
    previewVideo.preload = play && !saveData ? "metadata" : "none";
    previewVideo.controls = !canHover;
    previewVideo.src = source;
    previewVideo.load();
    setStatus(play && !reduceMotion && !saveData ? "Loading preview" : readyStatus());

    if (play) playPreview({ userInitiated });
  }

  function activatePreview(card, options = {}) {
    if (!card) return;

    const isSameCard = card === activeCard;
    activeCard = card;

    previewCards.forEach((candidate) => {
      const isActive = candidate === card;
      candidate.style.setProperty(
        "--card-preview-accent",
        candidate.dataset.previewAccent || "#1859a8"
      );
      candidate.classList.toggle("is-preview-active", isActive);
      candidate
        .querySelector("[data-project-preview-trigger]")
        ?.setAttribute("aria-pressed", String(isActive));
    });

    const { title, description } = getCardContent(card);
    if (previewTitle) previewTitle.textContent = title;
    if (previewDescription) previewDescription.textContent = description;
    if (!isSameCard) {
      configurePreviewMedia(card, options);
    } else if (options.play) {
      playPreview({ userInitiated: options.userInitiated });
    }
  }

  previewVideo?.addEventListener("loadeddata", () => {
    previewShell.classList.remove("is-loading", "has-media-error");
    previewShell.classList.add("has-media");
    setStatus(readyStatus());
    if (shouldPlayWhenReady) playPreview();
  });

  previewVideo?.addEventListener("playing", () => {
    previewShell.classList.remove("is-loading");
    previewShell.classList.add("is-playing");
    setStatus("Playing preview");
  });

  previewVideo?.addEventListener("error", () => {
    shouldPlayWhenReady = false;
    previewShell.classList.remove("has-media", "is-loading", "is-playing");
    previewShell.classList.add("has-media-error");
    previewSnapshot?.setAttribute("aria-hidden", "false");
    previewVideo.setAttribute("aria-hidden", "true");
    setStatus("Preview unavailable");
  });

  previewCards.forEach((card) => {
    const trigger = card.querySelector("[data-project-preview-trigger]");

    if (canHover) {
      card.addEventListener("pointerenter", () => activatePreview(card, { play: true }));
      card.addEventListener("pointerleave", () => {
        if (!card.contains(document.activeElement)) pausePreview();
      });
    }

    card.addEventListener("focusin", () => activatePreview(card, { play: true }));
    card.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!card.contains(document.activeElement) && !card.matches(":hover")) pausePreview();
      }, 0);
    });

    trigger?.addEventListener("click", () => {
      const isCurrentAndPlaying = card === activeCard && previewVideo && !previewVideo.paused;
      activatePreview(card);

      if (isCurrentAndPlaying) {
        pausePreview();
      } else {
        playPreview({ userInitiated: true });
      }
    });
  });

  if ("IntersectionObserver" in window && window.matchMedia("(min-width: 921px)").matches) {
    const cardObserver = new IntersectionObserver(
      (entries) => {
        const centeredCard = entries.find((entry) => entry.isIntersecting);
        if (centeredCard && !previewCards.some((card) => card.matches(":hover, :focus-within"))) {
          activatePreview(centeredCard.target);
        }
      },
      { rootMargin: "-38% 0px -48% 0px", threshold: 0 }
    );

    previewCards.forEach((card) => cardObserver.observe(card));
  }

  activatePreview(previewCards[0]);
})();
