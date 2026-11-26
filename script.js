{
  // ---------- Outils ----------
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });
  const money = (cents) => fmt.format(cents / 100);
  const nameHtml = (name) => esc(name).replace(/ (\S+)$/, "&nbsp;$1"); // garde « V2 » avec le nom
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
  const canHover = window.matchMedia("(hover: hover)").matches;

  // ---------- Panier (gardé dans le navigateur) ----------
  const STORE = "odd-cart";
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(STORE) || "[]").filter((l) => byId(l.id) && l.qty > 0);
  } catch (e) {
    cart = [];
  }
  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(cart));
    } catch (e) {}
  };
  const lineKey = (l) => `${l.id}|${l.size}`;
  const count = () => cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = () => cart.reduce((n, l) => n + byId(l.id).price * l.qty, 0);
  const savings = () =>
    cart.reduce((n, l) => {
      const p = byId(l.id);
      return n + ((p.compareAt || p.price) - p.price) * l.qty;
    }, 0);

  function addToCart(id, size) {
    const line = cart.find((l) => l.id === id && l.size === size);
    if (line) line.qty += 1;
    else cart.push({ id, size, qty: 1 });
    changed();
  }

  function setQty(key, qty) {
    cart = cart
      .map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(0, Math.min(10, qty)) } : l))
      .filter((l) => l.qty > 0);
    changed();
  }

  function changed() {
    save();
    renderBadge();
    renderCart();
    renderSummary();
  }

  // ---------- Prix ----------
  function priceHtml(p, qty = 1) {
    const now = `<span class="sale"><span class="sr-only">Prix réduit :</span> ${money(p.price * qty)}</span>`;
    if (!p.compareAt || p.compareAt <= p.price) return `<span class="sale">${money(p.price * qty)}</span>`;
    return `<s><span class="sr-only">Prix régulier :</span> ${money(p.compareAt * qty)}</s> ${now}`;
  }

  // ---------- Boutique ----------
  const grid = $("#grid");

  function renderCategories(active) {
    $("#categories").innerHTML = CATEGORIES.map((c) => {
      const n = c.id === "tout" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
      const current = c.id === active ? ' aria-current="page"' : "";
      return `<li><a href="#${c.id}"${current}>${esc(c.label)} <span class="n">${n}</span></a></li>`;
    }).join("");
  }

  function productCard(p) {
    const sizes = p.sizes
      .map(
        (s) =>
          `<label class="size"><input type="radio" name="size-${esc(p.id)}" value="${esc(s)}"><span>${esc(s)}</span></label>`
      )
      .join("");
    return `
      <article class="product" data-id="${esc(p.id)}" data-view="front">
        <button class="product-media" type="button" aria-label="Voir l'autre côté : ${esc(p.name)}">
          <img class="front" src="${esc(p.front)}" alt="${esc(p.name)}, vue de face" width="1000" height="1250">
          <img class="back" src="${esc(p.back)}" alt="${esc(p.name)}, vue de dos" width="1000" height="1250" loading="lazy">
        </button>
        <div class="product-info">
          <div>
            <h2>${nameHtml(p.name)}</h2>
            <p class="meta">${esc(p.color)}</p>
            <p class="price">${priceHtml(p)}</p>
          </div>
          <div class="views" role="group" aria-label="Choisir la vue">
            <button type="button" data-set="front" aria-pressed="true">Avant</button>
            <button type="button" data-set="back" aria-pressed="false">Arrière</button>
          </div>
        </div>
        <fieldset class="sizes">
          <legend class="sr-only">Taille</legend>
          ${sizes}
        </fieldset>
        <p class="size-error" aria-live="polite"></p>
        <button class="btn btn-block add" type="button">Ajouter au panier</button>
      </article>`;
  }

  function renderShop(cat) {
    const c = CATEGORIES.find((x) => x.id === cat);
    const list = cat === "tout" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
    $("#shop-count").textContent = plural(list.length, "article");
    renderCategories(cat);
    grid.innerHTML = list.length
      ? list.map(productCard).join("")
      : `<div class="empty">
           <p class="empty-title">Bientôt disponible</p>
           <p class="muted">Aucun article dans « ${esc(c.label)} » pour l'instant.</p>
           <a class="btn" href="#tout">Voir toutes les collections</a>
         </div>`;
    grid.querySelectorAll(".product").forEach(wireCard);
  }

  function wireCard(card) {
    const media = card.querySelector(".product-media");
    const views = card.querySelectorAll(".views button");
    const show = (v) => {
      card.dataset.view = v;
      views.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === v)));
    };
    views.forEach((b) => b.addEventListener("click", () => show(b.dataset.set)));
    media.addEventListener("click", () => show(card.dataset.view === "front" ? "back" : "front"));
    if (canHover) {
      media.addEventListener("mouseenter", () => show("back"));
      media.addEventListener("mouseleave", () => show("front"));
    }

    const error = card.querySelector(".size-error");
    card.querySelectorAll(".sizes input").forEach((i) => i.addEventListener("change", () => (error.textContent = "")));
    card.querySelector(".add").addEventListener("click", () => {
      const picked = card.querySelector(".sizes input:checked");
      if (!picked) {
        error.textContent = "Choisissez une taille.";
        return;
      }
      addToCart(card.dataset.id, picked.value);
      openCart();
    });
  }

  // ---------- Tiroir panier ----------
  const drawer = $("#cart");

  function renderBadge() {
    const n = count();
    const badge = $("#cart-count");
    badge.textContent = n;
    badge.hidden = n === 0;
    $("#cart-open").setAttribute("aria-label", `Ouvrir le panier, ${plural(n, "article")}`);
  }

  function renderCart() {
    const empty = cart.length === 0;
    $("#cart-title").textContent = empty ? "Panier" : `Panier (${count()})`;
    $("#cart-empty").hidden = !empty;
    $("#cart-foot").hidden = empty;
    $("#cart-items").innerHTML = cart
      .map((l) => {
        const p = byId(l.id);
        const key = esc(lineKey(l));
        return `
          <li class="cart-line">
            <img src="${esc(p.front)}" alt="" width="72" height="90">
            <div class="cart-line-body">
              <p class="cart-line-name">${nameHtml(p.name)}</p>
              <p class="muted">Taille ${esc(l.size)} · ${esc(p.color)}</p>
              <p class="price">${priceHtml(p, l.qty)}</p>
              <div class="cart-line-actions">
                <div class="qty" role="group" aria-label="Quantité">
                  <button type="button" data-key="${key}" data-step="-1" aria-label="Retirer un">−</button>
                  <span aria-live="polite">${l.qty}</span>
                  <button type="button" data-key="${key}" data-step="1" aria-label="Ajouter un">+</button>
                </div>
                <button class="link" type="button" data-key="${key}" data-remove>Retirer</button>
              </div>
            </div>
          </li>`;
      })
      .join("");
    $("#cart-subtotal").textContent = money(subtotal());
  }

  $("#cart-items").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-key]");
    if (!b) return;
    const line = cart.find((l) => lineKey(l) === b.dataset.key);
    if (!line) return;
    setQty(b.dataset.key, b.hasAttribute("data-remove") ? 0 : line.qty + Number(b.dataset.step));
  });

  function openCart() {
    renderCart();
    if (!drawer.open) drawer.showModal();
  }
  const closeCart = () => drawer.open && drawer.close();

  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  drawer.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeCart));
  drawer.addEventListener("click", (e) => e.target === drawer && closeCart()); // clic à côté
  $("#to-checkout").addEventListener("click", closeCart);
  $("#summary-edit").addEventListener("click", openCart);

  // ---------- Paiement ----------
  function renderSummary() {
    const empty = cart.length === 0;
    $("#checkout-empty").hidden = !empty;
    $("#checkout-grid").hidden = empty;
    $("#summary-items").innerHTML = cart
      .map((l) => {
        const p = byId(l.id);
        return `
          <li class="summary-line">
            <span class="thumb"><img src="${esc(p.front)}" alt="" width="56" height="70"><span class="qty-badge">${l.qty}</span></span>
            <span class="summary-name">${nameHtml(p.name)}<span class="muted">Taille ${esc(l.size)} · ${esc(p.color)}</span></span>
            <span class="price">${priceHtml(p, l.qty)}</span>
          </li>`;
      })
      .join("");
    const saved = savings();
    $("#summary-totals").innerHTML = `
      <div><dt>Sous-total · ${plural(count(), "article")}</dt><dd>${money(subtotal())}</dd></div>
      ${saved > 0 ? `<div class="saving"><dt>Vos économies</dt><dd>−${money(saved)}</dd></div>` : ""}
      <div><dt>Livraison</dt><dd class="muted">Calculée à l'étape suivante</dd></div>
      <div><dt>Taxes</dt><dd class="muted">Calculées à l'étape suivante</dd></div>
      <div class="total"><dt>Total</dt><dd>${money(subtotal())}</dd></div>`;
    $("#pay-button").textContent = `Payer ${money(subtotal())}`;
  }

  // Branchez ici le prestataire de paiement (Shopify, Stripe, PayPal…).
  // Tant que rien n'est branché, aucune commande n'est passée et rien n'est débité.
  const PAYMENT_PROVIDER = null;

  $("#checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const error = $("#form-error");
    const notice = $("#pay-notice");
    notice.hidden = true;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
    if (invalid.length) {
      invalid.forEach((el) => el.setAttribute("aria-invalid", "true"));
      error.textContent = "Veuillez remplir les champs en rouge.";
      error.hidden = false;
      invalid[0].focus();
      return;
    }
    error.hidden = true;
    if (PAYMENT_PROVIDER) {
      PAYMENT_PROVIDER.checkout({ cart, customer: Object.fromEntries(new FormData(form)) });
      return;
    }
    notice.innerHTML =
      "<strong>Le paiement en ligne n'est pas encore activé.</strong> Aucune commande n'a été passée et rien n'a été débité.";
    notice.hidden = false;
  });

  $("#checkout-form").addEventListener("input", (e) => {
    if (e.target.checkValidity && e.target.checkValidity()) e.target.removeAttribute("aria-invalid");
  });

  // ---------- Navigation (#tout, #snowpants, #paiement…) ----------
  let lastView = null;
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    const view = h === "paiement" ? "checkout" : "shop";
    closeCart();
    $("#shop").hidden = view !== "shop";
    $("#checkout").hidden = view !== "checkout";
    if (view === "shop") renderShop(CATEGORIES.some((c) => c.id === h) ? h : "tout");
    else renderSummary();
    if (view !== lastView && lastView !== null) window.scrollTo({ top: 0, behavior: "instant" });
    lastView = view;
  }
  window.addEventListener("hashchange", route);

  renderBadge();
  renderCart();
  route();
  $("#year").textContent = new Date().getFullYear();
}
