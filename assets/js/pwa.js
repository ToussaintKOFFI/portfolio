if (window.location.pathname.endsWith("/index.html")) {
  const cleanUrl = new URL("./", window.location.href);
  cleanUrl.search = window.location.search;
  cleanUrl.hash = window.location.hash;
  window.history.replaceState(null, "", cleanUrl);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Échec de l'enregistrement du service worker :", error);
    });
  });
}
