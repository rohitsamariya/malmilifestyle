import type { Product, ProductCategory } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// MALMI LIFESTYLE — OFFICIAL LAUNCH PRICING (INR)
// Ratings / reviewCount are null — no fake review data is shown.
// ─────────────────────────────────────────────────────────────────────────────

const OIL_SIZES = ["500 ML", "1 L", "5 L"];

const PRODUCTS: Product[] = [
  // ── Wood-Pressed Oils ─────────────────────────────────────────────────────
  {
    id: "wp-oil-001",
    name: "Yellow Mustard Oil",
    slug: "yellow-mustard-oil",
    category: "wood-pressed-oils",
    description:
      "Traditional yellow mustard oil, cold-pressed the wood-pressed way. A staple for everyday Indian cooking.",
    images: ["/products/yellow-mustard-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `yellow-mustard-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [249, 449, 1999][i]!,
      compareAtPrice: [299, 549, 2399][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 449,
    compareAtPrice: 549,
    badge: null,
  },
  {
    id: "wp-oil-002",
    name: "Black Mustard Oil",
    slug: "black-mustard-oil",
    category: "wood-pressed-oils",
    description:
      "Black mustard oil pressed at low heat for an intense, peppery flavour and aroma.",
    images: ["/products/black-mustard-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `black-mustard-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [269, 479, 2149][i]!,
      compareAtPrice: [329, 579, 2549][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 479,
    compareAtPrice: 579,
    badge: null,
  },
  {
    id: "wp-oil-003",
    name: "Sunflower Oil",
    slug: "sunflower-oil",
    category: "wood-pressed-oils",
    description:
      "Light, mild wood-pressed sunflower oil, naturally golden and ideal for daily cooking.",
    images: ["/products/sunflower-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `sunflower-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [259, 469, 2099][i]!,
      compareAtPrice: [319, 569, 2499][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 469,
    compareAtPrice: 569,
    badge: null,
  },
  {
    id: "wp-oil-004",
    name: "Groundnut Oil",
    slug: "groundnut-oil",
    category: "wood-pressed-oils",
    description:
      "Wood-pressed groundnut oil with a deep, nutty taste — a beloved choice for dals and curries.",
    images: ["/products/groundnut-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `groundnut-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [339, 599, 2699][i]!,
      compareAtPrice: [409, 719, 3199][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 599,
    compareAtPrice: 719,
    badge: null,
  },
  {
    id: "wp-oil-005",
    name: "Black Sesame Oil",
    slug: "black-sesame-oil",
    category: "wood-pressed-oils",
    description:
      "Rich, dark wood-pressed sesame oil made from naturally selected black sesame seeds.",
    images: ["/products/black-sesame-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `black-sesame-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [429, 799, 3599][i]!,
      compareAtPrice: [519, 959, 4299][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 799,
    compareAtPrice: 959,
    badge: null,
  },
  {
    id: "wp-oil-006",
    name: "Coconut Oil",
    slug: "coconut-oil",
    category: "wood-pressed-oils",
    description:
      "Pure wood-pressed coconut oil with a mild aroma, pressed from sun-dried coconut kernel.",
    images: ["/products/coconut-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `coconut-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [389, 699, 3149][i]!,
      compareAtPrice: [469, 839, 3749][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 699,
    compareAtPrice: 839,
    badge: null,
  },
  {
    id: "wp-oil-007",
    name: "Virgin Black Mustard Oil",
    slug: "virgin-black-mustard-oil",
    category: "wood-pressed-oils",
    description:
      "First-press virgin black mustard oil, prized for its strong flavour and deep golden colour.",
    images: ["/products/virgin-black-mustard-oil.svg"],
    variants: OIL_SIZES.map((size, i) => ({
      id: `virgin-black-mustard-oil-${size.replace(/\s/g, "-").toLowerCase()}`,
      size,
      price:          [289, 519, 2349][i]!,
      compareAtPrice: [349, 619, 2799][i]!,
    })),
    madeWith: "Wood-Pressed",
    rating: null,
    reviewCount: null,
    price: 519,
    compareAtPrice: 619,
    badge: null,
  },

  // ── Stone Ground Wheat Atta ───────────────────────────────────────────────
  {
    id: "wheat-001",
    name: "Khapli Wheat Atta (Emmer Wheat Flour)",
    slug: "khapli-wheat-atta",
    category: "wheat-atta",
    description:
      "Stone-ground khapli (emmer) wheat flour, a traditional ancient-grain choice for rotis.",
    images: ["/products/khapli-wheat-atta.svg"],
    variants: [
      { id: "khapli-wheat-atta-1kg",  size: "1 kg",  price: 149,  compareAtPrice: 179  },
      { id: "khapli-wheat-atta-5kg",  size: "5 kg",  price: 699,  compareAtPrice: 849  },
      { id: "khapli-wheat-atta-10kg", size: "10 kg", price: 1349, compareAtPrice: 1649 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 149,
    compareAtPrice: 179,
    badge: null,
  },
  {
    id: "wheat-002",
    name: "Sharbati Wheat Atta Stone Ground",
    slug: "sharbati-wheat-atta",
    category: "wheat-atta",
    description:
      "Soft stone-ground sharbati wheat flour for fluffy, naturally sweet rotis at home.",
    images: ["/products/sharbati-wheat-atta.svg"],
    variants: [
      { id: "sharbati-wheat-atta-1kg",  size: "1 kg",  price: 99,  compareAtPrice: 119  },
      { id: "sharbati-wheat-atta-5kg",  size: "5 kg",  price: 449, compareAtPrice: 549  },
      { id: "sharbati-wheat-atta-10kg", size: "10 kg", price: 849, compareAtPrice: 1049 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 99,
    compareAtPrice: 119,
    badge: null,
  },
  {
    id: "wheat-003",
    name: "Lokwan Wheat Atta Stone Ground",
    slug: "lokwan-wheat-atta",
    category: "wheat-atta",
    description:
      "Stone-ground lokwan wheat flour from central India, a favourite for daily wheat rotis.",
    images: ["/products/lokwan-wheat-atta.svg"],
    variants: [
      { id: "lokwan-wheat-atta-1kg",  size: "1 kg",  price: 89,  compareAtPrice: 109 },
      { id: "lokwan-wheat-atta-5kg",  size: "5 kg",  price: 399, compareAtPrice: 499 },
      { id: "lokwan-wheat-atta-10kg", size: "10 kg", price: 749, compareAtPrice: 949 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 89,
    compareAtPrice: 109,
    badge: null,
  },

  // ── Stone Ground Multigrain Atta ──────────────────────────────────────────
  {
    id: "multigrain-001",
    name: "Multigrain Atta - Soybean Based",
    slug: "multigrain-atta-soybean-based",
    category: "multigrain-atta",
    description:
      "Stone-ground multigrain atta blended around soybean for a wholesome, protein-rich roti.",
    images: ["/products/multigrain-atta-soybean-based.svg"],
    variants: [
      { id: "multigrain-soybean-1kg",  size: "1 kg",  price: 149,  compareAtPrice: 179  },
      { id: "multigrain-soybean-5kg",  size: "5 kg",  price: 699,  compareAtPrice: 849  },
      { id: "multigrain-soybean-10kg", size: "10 kg", price: 1349, compareAtPrice: 1649 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 149,
    compareAtPrice: 179,
    badge: null,
  },
  {
    id: "multigrain-002",
    name: "Multigrain Atta - Channa Based",
    slug: "multigrain-atta-channa-based",
    category: "multigrain-atta",
    description:
      "Stone-ground multigrain atta with a channa (gram) base for hearty, everyday chapatis.",
    images: ["/products/multigrain-atta-channa-based.svg"],
    variants: [
      { id: "multigrain-channa-1kg",  size: "1 kg",  price: 149,  compareAtPrice: 179  },
      { id: "multigrain-channa-5kg",  size: "5 kg",  price: 699,  compareAtPrice: 849  },
      { id: "multigrain-channa-10kg", size: "10 kg", price: 1349, compareAtPrice: 1649 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 149,
    compareAtPrice: 179,
    badge: null,
  },
  {
    id: "multigrain-003",
    name: "Diabetic Care Atta",
    slug: "diabetic-care-atta",
    category: "multigrain-atta",
    description:
      "Stone-ground multigrain atta formulated for blood-sugar-conscious everyday meals.",
    images: ["/products/diabetic-care-atta.svg"],
    variants: [
      { id: "diabetic-care-1kg",  size: "1 kg",  price: 199,  compareAtPrice: 249  },
      { id: "diabetic-care-5kg",  size: "5 kg",  price: 949,  compareAtPrice: 1199 },
      { id: "diabetic-care-10kg", size: "10 kg", price: 1849, compareAtPrice: 2349 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 199,
    compareAtPrice: 249,
    badge: null,
  },
  {
    id: "multigrain-004",
    name: "Cholesterol Care Atta",
    slug: "cholesterol-care-atta",
    category: "multigrain-atta",
    description:
      "Stone-ground multigrain atta blended with heart-friendly grains for mindful eating.",
    images: ["/products/cholesterol-care-atta.svg"],
    variants: [
      { id: "cholesterol-care-1kg",  size: "1 kg",  price: 199,  compareAtPrice: 249  },
      { id: "cholesterol-care-5kg",  size: "5 kg",  price: 949,  compareAtPrice: 1199 },
      { id: "cholesterol-care-10kg", size: "10 kg", price: 1849, compareAtPrice: 2349 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 199,
    compareAtPrice: 249,
    badge: null,
  },

  // ── Stone Ground Millet Atta ──────────────────────────────────────────────
  {
    id: "millet-001",
    name: "Jowar / Sorghum Flour",
    slug: "jowar-sorghum-flour",
    category: "millet-atta",
    description:
      "Stone-ground jowar (sorghum) flour, a naturally gluten-free traditional grain.",
    images: ["/products/jowar-sorghum-flour.svg"],
    variants: [
      { id: "jowar-sorghum-500g", size: "500 g", price: 79,  compareAtPrice: 99  },
      { id: "jowar-sorghum-1kg",  size: "1 kg",  price: 149, compareAtPrice: 189 },
      { id: "jowar-sorghum-5kg",  size: "5 kg",  price: 699, compareAtPrice: 899 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 149,
    compareAtPrice: 189,
    badge: null,
  },
  {
    id: "millet-002",
    name: "Bajra / Pearl Millet Flour",
    slug: "bajra-pearl-millet-flour",
    category: "millet-atta",
    description:
      "Stone-ground bajra (pearl millet) flour for warm, earthy winter bhakris and rotis.",
    images: ["/products/bajra-pearl-millet-flour.svg"],
    variants: [
      { id: "bajra-500g", size: "500 g", price: 69,  compareAtPrice: 89  },
      { id: "bajra-1kg",  size: "1 kg",  price: 129, compareAtPrice: 169 },
      { id: "bajra-5kg",  size: "5 kg",  price: 599, compareAtPrice: 799 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 129,
    compareAtPrice: 169,
    badge: null,
  },
  {
    id: "millet-003",
    name: "Besan Flour | Gram Flour | Stoneground",
    slug: "besan-gram-flour",
    category: "millet-atta",
    description:
      "Stone-ground besan (gram) flour, essential for pakoras, cheelas and everyday recipes.",
    images: ["/products/besan-gram-flour.svg"],
    variants: [
      { id: "besan-500g", size: "500 g", price: 79,  compareAtPrice: 99  },
      { id: "besan-1kg",  size: "1 kg",  price: 149, compareAtPrice: 189 },
      { id: "besan-5kg",  size: "5 kg",  price: 699, compareAtPrice: 899 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 149,
    compareAtPrice: 189,
    badge: null,
  },
  {
    id: "millet-004",
    name: "Sattu Atta, Stoneground",
    slug: "sattu-atta-stoneground",
    category: "millet-atta",
    description:
      "Stone-ground sattu, a roasted gram-based flour beloved for refreshing summer drinks.",
    images: ["/products/sattu-atta.svg"],
    variants: [
      { id: "sattu-500g", size: "500 g", price: 89,  compareAtPrice: 109 },
      { id: "sattu-1kg",  size: "1 kg",  price: 169, compareAtPrice: 209 },
      { id: "sattu-5kg",  size: "5 kg",  price: 799, compareAtPrice: 999 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 169,
    compareAtPrice: 209,
    badge: null,
  },
  {
    id: "millet-005",
    name: "Ragi / Finger Millet Flour",
    slug: "ragi-finger-millet-flour",
    category: "millet-atta",
    description:
      "Stone-ground ragi (finger millet) flour, a calcium-rich ancient grain for healthy meals.",
    images: ["/products/ragi-finger-millet-flour.svg"],
    variants: [
      { id: "ragi-500g", size: "500 g", price: 89,  compareAtPrice: 109 },
      { id: "ragi-1kg",  size: "1 kg",  price: 169, compareAtPrice: 209 },
      { id: "ragi-5kg",  size: "5 kg",  price: 799, compareAtPrice: 999 },
    ],
    madeWith: "Stone-Ground",
    rating: null,
    reviewCount: null,
    price: 169,
    compareAtPrice: 209,
    badge: null,
  },
];

export const products: Product[] = PRODUCTS;

export function getProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

/** Filters the catalog by category and/or search query (name, category, description). */
export function searchProducts({
  category,
  query,
}: {
  category?: string;
  query?: string;
}): Product[] {
  let result = products;

  if (category && category !== "all") {
    result = result.filter((p) => p.category === category);
  }

  const q = query?.trim().toLowerCase();
  if (q) {
    result = result.filter((p) => {
      const haystack = [
        p.name,
        p.category.replace(/-/g, " "),
        p.description,
        p.madeWith,
        ...p.variants.map((v) => v.size),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Sellable listing helpers — expand each product into per-variant listing items
// ---------------------------------------------------------------------------

import type { ProductListing } from "./types";

/**
 * Expands a list of products into flat ProductListing entries.
 * Each variant of each product becomes a separate listing card.
 *
 * Groundnut Oil (500 ML, 1 L, 5 L) => 3 listings.
 */
export function getSellableListings(productList: Product[]): ProductListing[] {
  const listings: ProductListing[] = [];
  for (const product of productList) {
    for (const variant of product.variants) {
      listings.push({
        listingKey: `${product.id}__${variant.id}`,
        product,
        variant,
      });
    }
  }
  return listings;
}

/** All sellable listings across the full catalog. */
export function getAllListings(): ProductListing[] {
  return getSellableListings(products);
}

/** Sellable listings for a specific category. */
export function getListingsByCategory(category: ProductCategory): ProductListing[] {
  return getSellableListings(getProductsByCategory(category));
}

/**
 * Search across listings — matches against product name, description,
 * category, madeWith, and variant size. Case-insensitive.
 */
export function searchListings({
  category,
  query,
}: {
  category?: string;
  query?: string;
}): ProductListing[] {
  const q = query?.trim().toLowerCase() ?? "";

  let base = category && category !== "all"
    ? getProductsByCategory(category as ProductCategory)
    : products;

  if (q) {
    base = base.filter((p) => {
      const haystack = [
        p.name,
        p.category.replace(/-/g, " "),
        p.description,
        p.madeWith,
        ...p.variants.map((v) => v.size),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return getSellableListings(base);
}

/**
 * Find a specific listing by product slug + variant id.
 * Useful for linking from a card to the PDP with the correct default variant.
 */
export function getListingBySlugAndVariant(
  slug: string,
  variantId: string,
): ProductListing | undefined {
  const product = getProductBySlug(slug);
  if (!product) return undefined;
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return undefined;
  return { listingKey: `${product.id}__${variant.id}`, product, variant };
}