// Catalogue ODD — pour ajouter un article, copier un bloc et changer les valeurs.
// Les prix sont en cents : 17999 = 179,99 $. « compareAt » = ancien prix barré (facultatif).

const CATEGORIES = [
  { id: "tout", label: "Toutes les collections" },
  { id: "snowpants", label: "Snowpants" },
  { id: "jacket", label: "Jacket" },
  { id: "jeans", label: "Jeans" },
  { id: "beanies", label: "Beanies" },
  { id: "belts", label: "Belts" },
];

const PRODUCTS = [
  {
    id: "snowpants-v2",
    name: "ODD SNOWPANTS V2",
    category: "snowpants",
    color: "Noir",
    price: 17999,
    compareAt: 19999,
    sizes: ["S", "M", "L", "XL"],
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
    front: "images/veste-avant.jpg",
    back: "images/veste-arriere.jpg",
  },
];
