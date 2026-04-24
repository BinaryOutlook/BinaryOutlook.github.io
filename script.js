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
    context.fillStyle = "rgba(244, 246, 241, 0.2)";
    context.fillRect(0, 0, width, height);

    const horizon = height * 0.64;
    const columns = 18;
    const rows = 9;
    const cellWidth = width / columns;
    const cellHeight = Math.max(34, height / 18);

    context.lineWidth = 1;
    context.strokeStyle = "rgba(13, 118, 111, 0.12)";

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
          ? "rgba(168, 69, 34, 0.28)"
          : column % 3 === 0
            ? "rgba(96, 74, 139, 0.2)"
            : "rgba(13, 118, 111, 0.22)";
      context.fillRect(x, y, w, barHeight);
    }

    context.strokeStyle = "rgba(29, 36, 34, 0.22)";
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

    context.fillStyle = "rgba(29, 36, 34, 0.7)";
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
