// Bascule avant / arrière pour chaque article.
const canHover = window.matchMedia("(hover: hover)").matches;

document.querySelectorAll(".product").forEach((product) => {
  const media = product.querySelector(".product-media");
  const buttons = product.querySelectorAll(".views button");

  const show = (view) => {
    product.dataset.view = view;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === view)));
  };

  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.set)));

  // Clic / tap sur la photo : on retourne l'article.
  media.addEventListener("click", () => {
    show(product.dataset.view === "front" ? "back" : "front");
  });

  // Sur ordinateur : survol = vue de dos.
  if (canHover) {
    media.addEventListener("mouseenter", () => show("back"));
    media.addEventListener("mouseleave", () => show("front"));
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
