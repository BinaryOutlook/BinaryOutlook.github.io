const menuButton = document.querySelector("[data-menu-button]");
const navLinks = document.querySelector("[data-nav-links]");
const navItems = document.querySelectorAll(".nav-links a");
const sectionNavItems = document.querySelectorAll('.nav-links a[href^="#"]');

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
        if (activeLink) {
          sectionNavItems.forEach((link) => link.classList.remove("is-active"));
          activeLink.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

const canvas = document.querySelector("[data-home-mesh]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  const context = canvas.getContext("2d");
  const contactSection = document.querySelector("#contact");
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const meshColumns = 18;
  const meshRows = 9;
  let width = 0;
  let height = 0;
  let frame = 0;
  let animationId = null;
  let scrollUpdateId = null;
  let scrollPosition = window.scrollY;
  let meshRegionActive = true;
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
        const idleOffset =
          Math.sin(
            frame * 0.012 +
              scrollPosition * 0.0015 +
              rowIndex * 0.48 +
              columnIndex * 0.16
          ) * 0.7;
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
        const idleOffset =
          Math.sin(
            frame * 0.012 +
              scrollPosition * 0.0015 +
              rowIndex * 0.48 +
              columnIndex * 0.16
          ) * 0.7;

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
    context.fillRect(
      width * 0.72,
      height * 0.18,
      Math.min(130, width * 0.12),
      Math.min(130, width * 0.12)
    );

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
        Math.sin(x * 0.014 + frame * 0.025 + scrollPosition * 0.001) * 18 -
        Math.cos(x * 0.006 + frame * 0.01) * 12;
      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();

    frame += 1;
  }

  function releasePointer() {
    pointer.active = false;
    pointer.velocityX = 0;
    pointer.velocityY = 0;
  }

  function stopAnimation() {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function animateMesh() {
    animationId = null;
    if (reduceMotion || !meshRegionActive || document.hidden) return;
    drawFrame();
    animationId = requestAnimationFrame(animateMesh);
  }

  function startAnimation() {
    if (reduceMotion || !meshRegionActive || document.hidden || animationId !== null) {
      return;
    }
    animationId = requestAnimationFrame(animateMesh);
  }

  function updateMeshRegion() {
    const bounds = canvas.getBoundingClientRect();
    const contactTop =
      contactSection?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    const shouldBeActive = contactTop > bounds.top + 2;

    meshRegionActive = shouldBeActive;
    canvas.classList.toggle("is-suspended", !shouldBeActive);

    if (shouldBeActive) {
      startAnimation();
    } else {
      releasePointer();
      stopAnimation();
    }
  }

  function acceptsPointer(event) {
    if (!meshRegionActive) return false;

    const bounds = canvas.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      return false;
    }

    const target = event.target instanceof Element ? event.target : null;
    return !target?.closest(".site-header, .contact-section, .site-footer");
  }

  resizeCanvas();
  updateMeshRegion();
  drawFrame();
  startAnimation();

  if (supportsFinePointer && !reduceMotion) {
    window.addEventListener(
      "pointermove",
      (event) => {
        if (!acceptsPointer(event)) {
          releasePointer();
          return;
        }

        const bounds = canvas.getBoundingClientRect();
        const nextX = event.clientX - bounds.left;
        const nextY = event.clientY - bounds.top;

        if (!pointer.active) {
          pointer.active = true;
          pointer.x = nextX;
          pointer.y = nextY;
          pointer.velocityX = 0;
          pointer.velocityY = 0;
          return;
        }

        pointer.velocityX = Math.max(-28, Math.min(28, nextX - pointer.x));
        pointer.velocityY = Math.max(-28, Math.min(28, nextY - pointer.y));
        pointer.x = nextX;
        pointer.y = nextY;
      },
      { passive: true }
    );

    window.addEventListener("pointercancel", releasePointer);
    window.addEventListener("blur", releasePointer);
    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) releasePointer();
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      if (scrollUpdateId !== null) return;
      scrollUpdateId = requestAnimationFrame(() => {
        scrollUpdateId = null;
        scrollPosition = window.scrollY;
        updateMeshRegion();
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    resizeCanvas();
    scrollPosition = window.scrollY;
    updateMeshRegion();
    if (reduceMotion) drawFrame();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      releasePointer();
      stopAnimation();
    } else {
      updateMeshRegion();
      startAnimation();
    }
  });
}

const animatedFooter = document.querySelector(".home-page .site-footer");

if (animatedFooter && !reduceMotion) {
  if ("IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        animatedFooter.classList.toggle("is-grid-active", entry.isIntersecting);
      },
      { rootMargin: "120px 0px" }
    );
    footerObserver.observe(animatedFooter);
  } else {
    animatedFooter.classList.add("is-grid-active");
  }
}

const directionAccordion = document.querySelector("[data-direction-accordion]");

if (directionAccordion) {
  const directionPanels = Array.from(
    directionAccordion.querySelectorAll("[data-direction-panel]")
  );
  let selectedDirection = null;

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

    trigger?.addEventListener("focus", () => {
      if (trigger.matches(":focus-visible")) setActiveDirection(panel);
    });
    trigger?.addEventListener("click", () => {
      selectedDirection = panel;
      setActiveDirection(selectedDirection);
    });
    trigger?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      selectedDirection = null;
      setActiveDirection();
      trigger.blur();
    });
  });

  directionAccordion.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!directionAccordion.contains(document.activeElement)) {
        setActiveDirection(selectedDirection);
      }
    }, 0);
  });
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

function getEmailAddress(element) {
  const user = element.dataset.emailUser;
  const domain = element.dataset.emailDomain;
  return user && domain ? `${user}@${domain}` : "";
}

async function copyEmail(button) {
  const email = getEmailAddress(button);
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

document.querySelectorAll("[data-email-action]").forEach((link) => {
  const email = getEmailAddress(link);
  if (email) link.href = `mailto:${email}`;
});

document.querySelectorAll("[data-copy-email]").forEach((button) => {
  button.classList.add("is-ready");
  button.addEventListener("click", () => copyEmail(button));
});
