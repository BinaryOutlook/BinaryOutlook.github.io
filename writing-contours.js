const reduceWritingMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const writingCanvas = document.querySelector("[data-writing-contours]");

if (writingCanvas) {
  const writingHero = writingCanvas.closest(".writing-hello");
  const context = writingCanvas.getContext("2d");

  if (writingHero && context) {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    const contourCount = 12;
    const pointsPerContour = 64;
    const maximumDisplacement = 24;
    let width = 0;
    let height = 0;
    let frame = 0;
    let animationId = null;
    let resizeId = null;
    let contourVisible = true;
    let contours = [];
    let connectorGradient = null;
    let inkGradient = null;
    let accentGradient = null;
    const pointer = {
      active: false,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
    };

    function buildWritingContours() {
      const centerX = width * (width <= 620 ? 0.74 : 0.76);
      const centerY = height * 0.47;
      const outerRadiusX = Math.min(
        width * (width <= 620 ? 0.58 : 0.42),
        height * 0.62
      );
      const outerRadiusY = Math.min(height * 0.48, width * 0.75);

      contours = Array.from({ length: contourCount }, (_, contourIndex) => {
        const contourProgress = contourIndex / (contourCount - 1);
        const contourScale = 0.12 + contourProgress * 0.88;
        const contourCenterX = centerX + Math.sin(contourIndex * 0.72) * 6.5;
        const contourCenterY = centerY + Math.cos(contourIndex * 0.58) * 4.5;

        return Array.from({ length: pointsPerContour }, (_, pointIndex) => {
          const angle = (pointIndex / pointsPerContour) * Math.PI * 2;
          const radialWobble =
            1 +
            Math.sin(angle * 2 + contourIndex * 0.61) * 0.075 +
            Math.sin(angle * 5 - contourIndex * 0.29) * 0.034 +
            Math.cos(angle * 7 + contourIndex * 0.18) * 0.018;
          const verticalWobble =
            1 + Math.cos(angle * 3 + contourIndex * 0.43) * 0.035;
          const baseX =
            contourCenterX +
            Math.cos(angle) * outerRadiusX * contourScale * radialWobble +
            Math.sin(angle * 2 + contourIndex) * 9 * contourScale;
          const baseY =
            contourCenterY +
            Math.sin(angle) * outerRadiusY * contourScale * verticalWobble +
            Math.cos(angle * 3 - contourIndex) * 7 * contourScale;

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

    function resizeWritingCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = writingCanvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(bounds.width));
      height = Math.max(1, Math.floor(bounds.height));
      writingCanvas.width = Math.floor(width * ratio);
      writingCanvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildWritingContours();
      refreshContourGradients();
    }

    function updateWritingContours() {
      const influenceRadius = Math.min(190, Math.max(130, width * 0.17));

      contours.forEach((contour) => {
        contour.forEach((point) => {
          point.velocityX += (point.baseX - point.x) * 0.06;
          point.velocityY += (point.baseY - point.y) * 0.06;

          if (pointer.active) {
            const deltaX = pointer.x - point.x;
            const deltaY = pointer.y - point.y;
            const distance = Math.hypot(deltaX, deltaY);

            if (distance < influenceRadius) {
              const safeDistance = Math.max(distance, 0.001);
              const influence = (1 - distance / influenceRadius) ** 2;
              const persistentPressure = influence * 2.45;

              point.velocityX -=
                (deltaX / safeDistance) * persistentPressure;
              point.velocityY -=
                (deltaY / safeDistance) * persistentPressure;
              point.velocityX += pointer.velocityX * influence * 0.075;
              point.velocityY += pointer.velocityY * influence * 0.075;
            }
          }

          point.velocityX *= 0.83;
          point.velocityY *= 0.83;
          point.x += point.velocityX;
          point.y += point.velocityY;

          const offsetX = point.x - point.baseX;
          const offsetY = point.y - point.baseY;
          const displacement = Math.hypot(offsetX, offsetY);

          if (displacement > maximumDisplacement) {
            const displacementScale = maximumDisplacement / displacement;
            point.x = point.baseX + offsetX * displacementScale;
            point.y = point.baseY + offsetY * displacementScale;
            point.velocityX *= 0.42;
            point.velocityY *= 0.42;
          }
        });
      });

      pointer.velocityX *= 0.78;
      pointer.velocityY *= 0.78;
    }

    function getWritingPoint(point, contourIndex, pointIndex) {
      const idleX =
        Math.sin(frame * 0.008 + contourIndex * 0.47 + pointIndex * 0.04) *
        0.32;
      const idleY =
        Math.cos(frame * 0.007 + contourIndex * 0.31 + pointIndex * 0.05) *
        0.32;
      return { x: point.x + idleX, y: point.y + idleY };
    }

    function createContourGradient(red, green, blue, opacity) {
      const gradientStart = width * (width <= 620 ? 0.24 : 0.18);
      const gradientEnd = width * (width <= 620 ? 0.74 : 0.58);
      const gradient = context.createLinearGradient(
        gradientStart,
        0,
        gradientEnd,
        0
      );

      gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0)`);
      gradient.addColorStop(
        0.52,
        `rgba(${red}, ${green}, ${blue}, ${opacity * 0.38})`
      );
      gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${opacity})`);
      return gradient;
    }

    function refreshContourGradients() {
      connectorGradient = createContourGradient(23, 54, 64, 0.055);
      inkGradient = createContourGradient(23, 54, 64, 0.24);
      accentGradient = createContourGradient(168, 69, 50, 0.38);
    }

    function traceContour(contour, contourIndex) {
      const points = contour.map((point, pointIndex) =>
        getWritingPoint(point, contourIndex, pointIndex)
      );
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];

      context.beginPath();
      context.moveTo(
        (lastPoint.x + firstPoint.x) * 0.5,
        (lastPoint.y + firstPoint.y) * 0.5
      );

      points.forEach((point, pointIndex) => {
        const nextPoint = points[(pointIndex + 1) % points.length];
        context.quadraticCurveTo(
          point.x,
          point.y,
          (point.x + nextPoint.x) * 0.5,
          (point.y + nextPoint.y) * 0.5
        );
      });

      context.closePath();
    }

    function drawWritingContours() {
      context.clearRect(0, 0, width, height);

      context.strokeStyle = connectorGradient;
      context.lineWidth = 0.8;
      context.beginPath();
      for (
        let contourIndex = 1;
        contourIndex < contours.length;
        contourIndex += 1
      ) {
        if (contourIndex % 3 !== 1) continue;
        const connectorOffset = (contourIndex * 5) % 16;
        for (
          let pointIndex = connectorOffset;
          pointIndex < pointsPerContour;
          pointIndex += 16
        ) {
          const innerPoint = getWritingPoint(
            contours[contourIndex - 1][pointIndex],
            contourIndex - 1,
            pointIndex
          );
          const outerPoint = getWritingPoint(
            contours[contourIndex][pointIndex],
            contourIndex,
            pointIndex
          );
          context.moveTo(innerPoint.x, innerPoint.y);
          context.lineTo(outerPoint.x, outerPoint.y);
        }
      }
      context.stroke();

      const accentContourIndex = Math.floor(contours.length * 0.66);

      contours.forEach((contour, contourIndex) => {
        traceContour(contour, contourIndex);
        const isAccent = contourIndex === accentContourIndex;
        context.strokeStyle = isAccent ? accentGradient : inkGradient;
        context.lineWidth = isAccent ? 1.55 : 1.05;
        context.stroke();
      });
    }

    function drawWritingFrame() {
      updateWritingContours();
      drawWritingContours();
      frame += 1;
    }

    function releaseWritingPointer() {
      pointer.active = false;
      pointer.velocityX = 0;
      pointer.velocityY = 0;
    }

    function stopWritingAnimation() {
      if (animationId === null) return;
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    function animateWritingContours() {
      animationId = null;
      if (reduceWritingMotion || !contourVisible || document.hidden) return;
      drawWritingFrame();
      animationId = requestAnimationFrame(animateWritingContours);
    }

    function startWritingAnimation() {
      if (
        reduceWritingMotion ||
        !contourVisible ||
        document.hidden ||
        animationId !== null
      ) {
        return;
      }
      animationId = requestAnimationFrame(animateWritingContours);
    }

    resizeWritingCanvas();
    drawWritingFrame();

    if ("IntersectionObserver" in window) {
      const writingObserver = new IntersectionObserver(
        ([entry]) => {
          contourVisible = entry.isIntersecting;
          writingCanvas.classList.toggle("is-contour-active", contourVisible);
          if (contourVisible) {
            startWritingAnimation();
          } else {
            releaseWritingPointer();
            stopWritingAnimation();
          }
        },
        { rootMargin: "80px 0px" }
      );
      writingObserver.observe(writingCanvas);
    } else {
      writingCanvas.classList.add("is-contour-active");
      startWritingAnimation();
    }

    if (supportsFinePointer && !reduceWritingMotion) {
      writingHero.addEventListener(
        "pointermove",
        (event) => {
          const bounds = writingCanvas.getBoundingClientRect();
          const nextX = event.clientX - bounds.left;
          const nextY = event.clientY - bounds.top;

          if (!pointer.active) {
            pointer.active = true;
            pointer.x = nextX;
            pointer.y = nextY;
            return;
          }

          pointer.velocityX = Math.max(-22, Math.min(22, nextX - pointer.x));
          pointer.velocityY = Math.max(-22, Math.min(22, nextY - pointer.y));
          pointer.x = nextX;
          pointer.y = nextY;
        },
        { passive: true }
      );
      writingHero.addEventListener("pointerleave", releaseWritingPointer);
      writingHero.addEventListener("pointercancel", releaseWritingPointer);
      window.addEventListener("blur", releaseWritingPointer);
    }

    window.addEventListener("resize", () => {
      if (resizeId !== null) cancelAnimationFrame(resizeId);
      resizeId = requestAnimationFrame(() => {
        resizeId = null;
        releaseWritingPointer();
        resizeWritingCanvas();
        drawWritingFrame();
        startWritingAnimation();
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        releaseWritingPointer();
        stopWritingAnimation();
      } else {
        startWritingAnimation();
      }
    });

    startWritingAnimation();
  }
}
