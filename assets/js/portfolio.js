const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const themeToggle = document.getElementById("icons");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let menuAnimationTimer;
let menuPanelTimer;
let menuPanelCleanupTimer;

function resetMenuAnimation() {
  window.clearTimeout(menuAnimationTimer);
  window.clearTimeout(menuPanelTimer);
  window.clearTimeout(menuPanelCleanupTimer);
  menuToggle?.classList.remove("is-opening", "is-closing");
  navMenu?.classList.remove("is-opening", "is-closing");
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuToggle || !navMenu) return;

  const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
  if (!wasOpen) return;

  resetMenuAnimation();
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  menuToggle.classList.remove("active");
  menuToggle.classList.add("is-closing");
  navMenu.classList.remove("active");
  navMenu.classList.add("is-closing");
  navMenu.inert = true;
  document.documentElement.classList.remove("menu-open");

  if (restoreFocus) menuToggle.focus();

  menuAnimationTimer = window.setTimeout(
    () => menuToggle.classList.remove("is-closing"),
    reducedMotion.matches ? 0 : 820,
  );
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu({ restoreFocus: true });
      return;
    }

    resetMenuAnimation();
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", "Fermer le menu");
    menuToggle.classList.add("active", "is-opening");
    navMenu.inert = false;
    document.documentElement.classList.add("menu-open");

    menuPanelTimer = window.setTimeout(
      () => {
        if (menuToggle.getAttribute("aria-expanded") !== "true") return;
        navMenu.classList.add("active", "is-opening");
        navMenu.querySelector("a[href]")?.focus({ preventScroll: true });
        menuPanelCleanupTimer = window.setTimeout(
          () => navMenu.classList.remove("is-opening"),
          reducedMotion.matches ? 0 : 820,
        );
      },
      reducedMotion.matches ? 0 : 360,
    );

    menuAnimationTimer = window.setTimeout(
      () => {
        menuToggle.classList.remove("is-opening");
      },
      reducedMotion.matches ? 0 : 820,
    );
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("pointermove", (event) => {
      const bounds = link.getBoundingClientRect();
      link.style.setProperty("--link-pointer-x", `${event.clientX - bounds.left}px`);
      link.style.setProperty("--link-pointer-y", `${event.clientY - bounds.top}px`);
    }, { passive: true });

    link.addEventListener("click", () => {
      const target = link.hash
        ? document.getElementById(decodeURIComponent(link.hash.slice(1)))
        : null;
      closeMenu();

      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu({ restoreFocus: true });
      return;
    }

    if (event.key !== "Tab" || menuToggle.getAttribute("aria-expanded") !== "true") return;

    if (!navMenu.classList.contains("active")) {
      event.preventDefault();
      menuToggle.focus();
      return;
    }

    const focusableItems = [menuToggle, ...navMenu.querySelectorAll("a[href]")];
    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  });

  const mobileMenuQuery = window.matchMedia("(max-width: 820px)");
  const closeMenuOnDesktop = (event) => {
    if (!event.matches) closeMenu();
  };
  if ("addEventListener" in mobileMenuQuery) {
    mobileMenuQuery.addEventListener("change", closeMenuOnDesktop);
  } else {
    mobileMenuQuery.addListener(closeMenuOnDesktop);
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    themeToggle.innerHTML = `<i class="bi ${isDark ? "bi-sun" : "bi-moon-stars"}" aria-hidden="true"></i>`;
    themeToggle.setAttribute("aria-label", isDark ? "Passer au thème clair" : "Passer au thème sombre");
  });
}

const sectionLinks = [...document.querySelectorAll("#navMenu a[href^='#']")];
const navigableSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && navigableSections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const currentSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!currentSection) return;

      sectionLinks.forEach((link) => {
        const isCurrent = link.hash === `#${currentSection.target.id}`;
        link.classList.toggle("active", isCurrent);
        link.closest(".item")?.classList.toggle("active", isCurrent);
        if (isCurrent) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.1, 0.4, 0.75] },
  );

  navigableSections.forEach((section) => sectionObserver.observe(section));
}

const canTilt =
  !reducedMotion.matches &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canTilt) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
      card.style.setProperty("--tilt-y", `${(x - 0.5) * 7}deg`);
      card.style.setProperty("--pointer-x", `${x * 100}%`);
      card.style.setProperty("--pointer-y", `${y * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });

  const hero = document.querySelector(".hero");
  const orbitScene = document.getElementById("orbitScene");

  if (hero && orbitScene) {
    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      orbitScene.style.setProperty("--pointer-rotate-x", `${-y * 12}deg`);
      orbitScene.style.setProperty("--pointer-rotate-y", `${x * 14}deg`);
      hero.style.setProperty("--light-x", `${event.clientX - bounds.left}px`);
      hero.style.setProperty("--light-y", `${event.clientY - bounds.top}px`);
    });
  }
}

document.querySelectorAll(".skill-card img").forEach((icon) => {
  icon.addEventListener("error", () => {
    const card = icon.closest(".skill-card");
    const label = card?.querySelector("h4")?.textContent?.trim();
    if (!card || !label) return;

    const fallback = document.createElement("span");
    fallback.className = "skill-icon-fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = label.slice(0, 2).toUpperCase();
    icon.replaceWith(fallback);
  }, { once: true });
});

const contactForm = document.getElementById("contactForm");
const emailInput = document.getElementById("email");
const replyToInput = contactForm?.querySelector('input[name="_replyto"]');

if (contactForm && emailInput && replyToInput) {
  contactForm.addEventListener("submit", () => {
    replyToInput.value = emailInput.value.trim();
  });
}

const particleCanvas = document.getElementById("particleField");
const canvasContext = particleCanvas?.getContext("2d", { alpha: true });

if (particleCanvas && canvasContext) {
  const context = canvasContext;
  const lowPower =
    navigator.hardwareConcurrency < 4 ||
    navigator.connection?.saveData === true ||
    window.matchMedia("(max-width: 700px)").matches;
  const particleCount = lowPower ? 18 : 42;
  const particles = [];
  const pointer = { x: -1000, y: -1000 };
  let animationFrame = 0;
  let width = 0;
  let height = 0;

  function resizeCanvas() {
    const bounds = particleCanvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = bounds.width;
    height = bounds.height;
    particleCanvas.width = Math.round(width * pixelRatio);
    particleCanvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (!particles.length) {
      for (let index = 0; index < particleCount; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.4,
          speed: Math.random() * 0.22 + 0.06,
          phase: Math.random() * Math.PI * 2,
        });
      }
    } else {
      particles.forEach((particle) => {
        particle.x = Math.min(particle.x, width);
        particle.y = Math.min(particle.y, height);
      });
    }

    drawParticles(!reducedMotion.matches);
  }

  function drawParticles(animate) {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      if (animate) {
        particle.phase += particle.speed * 0.04;
        particle.y += Math.sin(particle.phase) * particle.speed;
        particle.x += Math.cos(particle.phase * 0.7) * particle.speed * 0.4;
        particle.x += (pointer.x - particle.x) * 0.0007;
        particle.y += (pointer.y - particle.y) * 0.0007;

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(91, 190, 255, 0.58)";
      context.fill();

      for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
        const next = particles[nextIndex];
        const distance = Math.hypot(next.x - particle.x, next.y - particle.y);
        if (distance > 120) continue;

        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(next.x, next.y);
        context.strokeStyle = `rgba(22, 119, 255, ${0.12 * (1 - distance / 120)})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
    });

    if (animate && !document.hidden) {
      animationFrame = window.requestAnimationFrame(() => drawParticles(true));
    }
  }

  const particleHost = particleCanvas.closest(".hero") || particleCanvas;
  particleHost.addEventListener("pointermove", (event) => {
    const bounds = particleCanvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
  }, { passive: true });

  particleHost.addEventListener("pointerleave", () => {
    pointer.x = -1000;
    pointer.y = -1000;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    window.cancelAnimationFrame(animationFrame);
    if (!document.hidden && !reducedMotion.matches) drawParticles(true);
  });

  reducedMotion.addEventListener?.("change", () => {
    window.cancelAnimationFrame(animationFrame);
    drawParticles(!reducedMotion.matches);
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(particleCanvas);
  } else {
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }

  resizeCanvas();
}
