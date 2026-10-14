const pageLoader = document.getElementById("pageLoader");
let loaderTimeout;

function hidePageLoader() {
  if (!pageLoader || pageLoader.classList.contains("is-hidden")) return;

  window.clearTimeout(loaderTimeout);
  pageLoader.classList.add("is-hidden");
  pageLoader.setAttribute("aria-hidden", "true");
}

if (pageLoader) {
  if (document.readyState === "complete") {
    window.setTimeout(hidePageLoader, 150);
  } else {
    window.addEventListener("load", hidePageLoader, { once: true });
  }
  loaderTimeout = window.setTimeout(hidePageLoader, 5000);
}

const revealElements = document.querySelectorAll(
  ".section1 > .image, .section1 > .description, #about .title, #about .profil, #about .resumes, #about .informatique, #about .diplome, #about .language-item, #about .skill-list li, #projects .section-title, .project-card, #contact .section-title, .contact-info, .detail-item, .contact-form, .credentials-main > .desc, .credentials-main > .title, .credentials-main > .credentials-intro, .credential-card, .certificates-section, .certificate-link, .credentials-main > .bouton, .footer-section, .footer-bottom",
);

if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const staggerGroupSelector =
    ".informatique, .diplome, .language-item, .skill-list li, .project-card, .detail-item, .credential-card, .certificate-link";
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -48px 0px" },
  );

  revealElements.forEach((element, index) => {
    element.classList.add("reveal");
    const staggerGroup = element.matches(staggerGroupSelector)
      ? element
      : element.closest(staggerGroupSelector);
    const siblings = staggerGroup
      ? [...staggerGroup.parentElement.children].filter((sibling) =>
          sibling.matches(staggerGroupSelector),
        )
      : [];
    const staggerIndex = siblings.indexOf(staggerGroup);
    element.style.setProperty(
      "--reveal-delay",
      `${(staggerIndex >= 0 ? staggerIndex % 4 : index % 2) * 80}ms`,
    );
    revealObserver.observe(element);
  });
}
