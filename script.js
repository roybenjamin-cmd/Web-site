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

  // ---------- Panneaux latéraux (panier, menu, filtres) ----------
  const dialogs = [...document.querySelectorAll("dialog")];
  const open = (d) => !d.open && d.showModal();
  const closeAll = () => dialogs.forEach((d) => d.open && d.close());
  dialogs.forEach((d) =>
    d.addEventListener("click", (e) => {
      if (e.target === d || e.target.closest("[data-close]")) d.close(); // clic à côté ou bouton fermer
    })
  );

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

  // ---------- Filtres ----------
  const PRICE_TOP = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 1000) * 10; // en dollars, arrondi à 10
  const F = { avail: new Set(), color: new Set(), size: new Set(), min: 0, max: PRICE_TOP };
  const AVAIL = [
    { value: "in", label: "En stock" },
    { value: "out", label: "En rupture de stock" },
  ];
  const usedColors = Object.keys(COLORS).filter((c) => PRODUCTS.some((p) => p.color === c));
  const usedSizes = SIZE_ORDER.filter((s) => PRODUCTS.some((p) => p.sizes.includes(s)));
  let currentCat = "tout";

  const inCategory = () => (currentCat === "tout" ? PRODUCTS : PRODUCTS.filter((p) => p.category === currentCat));

  // skip = la facette à ignorer (pour calculer ses propres compteurs)
  function matches(p, skip) {
    if (skip !== "avail" && F.avail.size && !F.avail.has(p.available ? "in" : "out")) return false;
    if (skip !== "color" && F.color.size && !F.color.has(p.color)) return false;
    if (skip !== "size" && F.size.size && !p.sizes.some((s) => F.size.has(s))) return false;
    const dollars = p.price / 100;
    if (dollars < F.min || (F.max < PRICE_TOP && dollars > F.max)) return false;
    return true;
  }

  const activeFilters = () =>
    F.avail.size + F.color.size + F.size.size + (F.min > 0 || F.max < PRICE_TOP ? 1 : 0);

  function buildFilters() {
    $("#f-avail").innerHTML = AVAIL.map(
      (o) => `<label class="opt-row"><input type="checkbox" data-facet="avail" value="${o.value}">
        <span class="box" aria-hidden="true"></span><span>${o.label} <span class="n" data-count="avail:${o.value}"></span></span></label>`
    ).join("");
    $("#f-color").innerHTML = usedColors
      .map(
        (c) => `<label class="opt-row color-row"><input type="checkbox" data-facet="color" value="${esc(c)}">
        <span class="swatch" style="background:${COLORS[c]}" aria-hidden="true"></span><span>${esc(c)} <span class="n" data-count="color:${esc(c)}"></span></span></label>`
      )
      .join("");
    $("#f-size").innerHTML = usedSizes
      .map(
        (s) => `<label class="opt-row"><input type="checkbox" data-facet="size" value="${esc(s)}">
        <span class="box" aria-hidden="true"></span><span>${esc(s)} <span class="n" data-count="size:${esc(s)}"></span></span></label>`
      )
      .join("");
    for (const id of ["#price-min", "#price-max"]) $(id).max = PRICE_TOP;
    syncPriceInputs();
  }

  function syncPriceInputs() {
    $("#price-min").value = F.min;
    $("#price-max").value = F.max;
    $("#price-min-label").textContent = money(F.min * 100);
    $("#price-max-label").textContent = money(F.max * 100);
    $("#range-fill").style.left = `${(F.min / PRICE_TOP) * 100}%`;
    $("#range-fill").style.right = `${100 - (F.max / PRICE_TOP) * 100}%`;
  }

  function updateFilterCounts() {
    const list = inCategory();
    const tally = (facet, test) => list.filter((p) => matches(p, facet) && test(p)).length;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const [facet, value] = el.dataset.count.split(":");
      const n =
        facet === "avail"
          ? tally("avail", (p) => (p.available ? "in" : "out") === value)
          : facet === "color"
            ? tally("color", (p) => p.color === value)
            : tally("size", (p) => p.sizes.includes(value));
      el.textContent = `(${n})`;
      const input = el.closest("label").querySelector("input");
      input.disabled = n === 0 && !input.checked;
    });
    const a = activeFilters();
    $("#filter-count").textContent = a;
    $("#filter-count").hidden = a === 0;
    $("#toolbar-clear").hidden = a === 0;
  }

  $("#filter-form").addEventListener("change", (e) => {
    const facet = e.target.dataset.facet;
    if (!facet) return;
    e.target.checked ? F[facet].add(e.target.value) : F[facet].delete(e.target.value);
    renderGrid();
  });

  $("#price-min").addEventListener("input", (e) => {
    F.min = Math.min(Number(e.target.value), F.max);
    syncPriceInputs();
    renderGrid();
  });
  $("#price-max").addEventListener("input", (e) => {
    F.max = Math.max(Number(e.target.value), F.min);
    syncPriceInputs();
    renderGrid();
  });

  function clearFilters() {
    F.avail.clear();
    F.color.clear();
    F.size.clear();
    F.min = 0;
    F.max = PRICE_TOP;
    document.querySelectorAll("#filter-form input[type=checkbox]").forEach((i) => (i.checked = false));
    syncPriceInputs();
    renderGrid();
  }
  $("#filter-clear").addEventListener("click", clearFilters);
  $("#toolbar-clear").addEventListener("click", clearFilters);
  // « Voir N produits » : ferme le menu et revient à la boutique si on était au paiement
  $("#filter-apply").addEventListener("click", () => {
    if (!$("#checkout").hidden) location.hash = currentCat;
  });
  $("#filter-form").addEventListener("submit", (e) => e.preventDefault());

  // ---------- Menu des collections ----------
  function renderMenu() {
    $("#categories").innerHTML = CATEGORIES.map((c) => {
      const n = c.id === "tout" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
      const current = c.id === currentCat ? ' aria-current="page"' : "";
      return `<li><a href="#${c.id}" data-close${current}><span>${esc(c.label)}</span><span class="n">${n}</span></a></li>`;
    }).join("");
  }
  $("#menu-open").addEventListener("click", () => {
    renderMenu();
    open($("#menu"));
  });

  // ---------- Boutique ----------
  const grid = $("#grid");

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
        ${
          p.available
            ? `<fieldset class="sizes"><legend class="sr-only">Taille</legend>${sizes}</fieldset>
               <p class="size-error" aria-live="polite"></p>
               <button class="btn btn-block add" type="button">Ajouter au panier</button>`
            : `<button class="btn btn-block add" type="button" disabled>En rupture de stock</button>`
        }
      </article>`;
  }

  function renderShop(cat) {
    currentCat = cat;
    $("#shop-title").textContent = CATEGORIES.find((x) => x.id === cat).label;
    renderMenu();
    renderGrid();
  }

  function renderGrid() {
    const all = inCategory();
    const list = all.filter((p) => matches(p));
    const label = CATEGORIES.find((x) => x.id === currentCat).label;
    $("#shop-count").textContent = plural(list.length, "article");
    $("#filter-apply").textContent = `Voir ${plural(list.length, "produit")}`;
    updateFilterCounts();
    if (list.length) grid.innerHTML = list.map(productCard).join("");
    else if (!all.length)
      grid.innerHTML = `<div class="empty">
           <p class="empty-title">Bientôt disponible</p>
           <p class="muted">Aucun article dans « ${esc(label)} » pour l'instant.</p>
           <a class="btn" href="#tout">Voir toutes les collections</a>
         </div>`;
    else
      grid.innerHTML = `<div class="empty">
           <p class="empty-title">Aucun résultat</p>
           <p class="muted">Aucun article ne correspond à ces filtres.</p>
           <button class="btn" type="button" data-clear-filters>Tout effacer</button>
         </div>`;
    grid.querySelectorAll(".product").forEach(wireCard);
  }

  grid.addEventListener("click", (e) => e.target.closest("[data-clear-filters]") && clearFilters());

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
    if (!error) return; // rupture de stock
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
    open(drawer);
  }

  $("#cart-open").addEventListener("click", openCart);
  $("#to-checkout").addEventListener("click", () => drawer.close());
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
    closeAll();
    $("#shop").hidden = view !== "shop";
    $("#checkout").hidden = view !== "checkout";
    if (view === "shop") renderShop(CATEGORIES.some((c) => c.id === h) ? h : "tout");
    else renderSummary();
    if (view !== lastView && lastView !== null) window.scrollTo({ top: 0, behavior: "instant" });
    lastView = view;
  }
  window.addEventListener("hashchange", route);

  buildFilters();
  renderBadge();
  renderCart();
  route();
  $("#year").textContent = new Date().getFullYear();
}
