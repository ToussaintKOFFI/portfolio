const viewCounterImage = document.querySelector(".view-counter-badge");

if (viewCounterImage) {
  const counterStatus = viewCounterImage.closest(".footer-views");
  const counterUrl = viewCounterImage.dataset.counterUrl;

  viewCounterImage.addEventListener("load", () => {
    viewCounterImage.alt = "Nombre total de vues du portfolio";
  });

  viewCounterImage.addEventListener("error", () => {
    viewCounterImage.hidden = true;
    counterStatus.classList.add("is-unavailable");
    counterStatus.querySelector("span").textContent =
      "Compteur momentanément indisponible";
    console.error("Le compteur de vues externe n'a pas pu être chargé.");
  });

  if (counterUrl) {
    const url = new URL(counterUrl);
    url.searchParams.set("refresh", Date.now().toString());
    viewCounterImage.src = url.href;
  }
}
