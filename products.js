// Catalogue ODD — pour ajouter un article, copier un bloc et changer les valeurs.
// Les prix sont en cents : 17999 = 179,99 $. « compareAt » = ancien prix barré (facultatif).
// « available: false » = en rupture de stock.

const CATEGORIES = [
  { id: "tout", label: "Toutes les collections" },
  { id: "snowpants", label: "Snowpants" },
  { id: "jacket", label: "Jacket" },
  { id: "jeans", label: "Jeans" },
  { id: "beanies", label: "Beanies" },
  { id: "belts", label: "Belts" },
];

// Couleurs proposées dans le filtre (seules celles utilisées par un article s'affichent).
const COLORS = {
  Beige: "#e8dab2",
  Blanc: "#ffffff",
  Marine: "#22228a",
  Marron: "#8f5a3a",
  Multicolore: "conic-gradient(#e4472f, #f2c230, #3bb273, #2f6fe4, #9b4fc6, #e4472f)",
  Noir: "#000000",
  Violet: "#9b4fc6",
};

// Ordre d'affichage des grandeurs dans le filtre.
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL"];

const PRODUCTS = [
  {
    id: "snowpants-v2",
    name: "ODD SNOWPANTS V2",
    category: "snowpants",
    color: "Noir",
    price: 17999,
    compareAt: 19999,
    sizes: ["S", "M", "L", "XL"],
    available: true,
    front: "images/pantalon-avant.jpg",
    back: "images/pantalon-arriere.jpg",
  },
  {
    id: "jacket-v2",
    name: "ODD JACKET V2",
    category: "jacket",
    color: "Noir",
    price: 15999,
    compareAt: 18999,
    sizes: ["S", "M", "L", "XL"],
    available: true,
    front: "images/veste-avant.jpg",
    back: "images/veste-arriere.jpg",
  },
];
