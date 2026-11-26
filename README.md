# Web-site

Boutique ODD : logo qui tourne en haut à gauche, menu des collections et filtres sur le côté, panier et page de paiement.

## Contenu

- `index.html` — la page (boutique, panier, paiement)
- `products.js` — **le catalogue** : catégories, couleurs du filtre, articles, prix, tailles, stock, photos
- `script.js` — catégories, panier (gardé dans le navigateur), formulaire de paiement
- `style.css` — la mise en page
- `images/` — logo détouré et photos au format 4:5

## Voir le site

Ouvrir `index.html` dans un navigateur — aucune installation nécessaire.

## Ajouter un article

Dans `products.js`, copier un bloc de `PRODUCTS` et changer `id`, `name`, `category`
(`snowpants`, `jacket`, `jeans`, `beanies` ou `belts`), les prix en cents
(`17999` = 179,99 $ ; `compareAt` = ancien prix barré) et les deux photos.

## Paiement

Le formulaire (contact, livraison, choix du mode de paiement) est prêt, mais **aucun
prestataire n'est encore branché** : le bouton « Payer » affiche qu'aucune commande n'a été
passée. Pour encaisser, il faut relier un prestataire (Shopify, Stripe ou PayPal) dans
`script.js` (`PAYMENT_PROVIDER`). Les numéros de carte doivent être saisis chez le
prestataire, jamais sur ce site.
