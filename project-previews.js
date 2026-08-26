(() => {
  const previewShell = document.querySelector("[data-project-preview-shell]");
  const previewCards = Array.from(document.querySelectorAll("[data-project-preview-card]"));

  if (!previewShell || previewCards.length === 0) return;

  const previewVideo = previewShell.querySelector("[data-project-preview-video]");
  const previewTitle = previewShell.querySelector("[data-project-preview-title]");
  const previewDescription = previewShell.querySelector("[data-project-preview-description]");
  const previewStatus = previewShell.querySelector("[data-project-preview-status]");
  const previewIndex = previewShell.querySelector(".project-preview__index");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = Boolean(navigator.connection?.saveData);
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

  function clearPreviewMedia() {
    shouldPlayWhenReady = false;
    previewShell.classList.remove("has-media", "is-loading", "is-playing", "has-media-error");

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
    if (!mediaEnabled || !previewVideo) {
      setStatus("Interactive preview coming soon");
      return;
    }

    const source = getPreviewSource(card);
    const poster = card.dataset.previewPoster || "";
    const { title } = getCardContent(card);

    if (poster) previewVideo.poster = poster;
    if (source || poster) {
      previewShell.classList.add("has-media");
      previewVideo.setAttribute("aria-label", `${title} project preview`);
      previewVideo.setAttribute("aria-hidden", "false");
    }

    if (!source) {
      setStatus(poster ? "Project preview poster" : "Interactive preview coming soon");
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
    if (previewIndex) {
      previewIndex.textContent = String(previewCards.indexOf(card) + 1).padStart(2, "0");
    }
    previewShell.style.setProperty("--preview-accent", card.dataset.previewAccent || "#c9362b");

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
