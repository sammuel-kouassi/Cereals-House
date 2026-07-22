// Micro-interaction de marque : quand un client ajoute un produit au panier,
// un petit grain doré s'envole du bouton cliqué jusqu'à l'icône panier du
// header. Purement décoratif (n'affecte jamais la logique métier), et
// silencieusement ignoré si l'icône panier n'est pas trouvée dans le DOM
// (ex: rendu serveur) ou si l'utilisateur préfère moins d'animations.
export function flyToCart(originEl: HTMLElement | null) {
  if (!originEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.getElementById("site-cart-icon");
  if (!target) return;

  const from = originEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();

  const grain = document.createElement("div");
  grain.textContent = "🌾";
  grain.style.position = "fixed";
  grain.style.left = `${from.left + from.width / 2 - 12}px`;
  grain.style.top = `${from.top + from.height / 2 - 12}px`;
  grain.style.fontSize = "24px";
  grain.style.lineHeight = "1";
  grain.style.zIndex = "9999";
  grain.style.pointerEvents = "none";
  grain.style.transition = "transform 0.7s cubic-bezier(0.3, 0.1, 0.3, 1), opacity 0.7s ease-in";
  grain.style.willChange = "transform, opacity";
  document.body.appendChild(grain);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  // Force le navigateur à appliquer l'état de départ avant de déclencher la
  // transition vers l'état d'arrivée (sinon les deux se confondent en un seul
  // rendu, sans animation visible).
  requestAnimationFrame(() => {
    grain.style.transform = `translate(${dx}px, ${dy}px) scale(0.35) rotate(50deg)`;
    grain.style.opacity = "0.15";
  });

  window.setTimeout(() => grain.remove(), 750);
}