// Auto-detect flavor/variant options for common food items based on the item name.
// Returns an object describing the variant group, or null if no variants apply.

export interface VariantGroup {
  label: string; // e.g. "Flavor", "Choose a side"
  options: string[];
}

const RULES: { match: RegExp; group: VariantGroup }[] = [
  // Milkshakes / shakes / smoothies
  {
    match: /\b(milk\s*shake|milkshake|shake|smoothie|frapp[eé]|float)\b/i,
    group: { label: "Flavor", options: ["Vanilla", "Chocolate", "Strawberry", "Cookies & Cream", "Caramel"] },
  },
  // Ice cream / sundae / gelato
  {
    match: /\b(ice\s*cream|sundae|gelato|sorbet)\b/i,
    group: { label: "Flavor", options: ["Vanilla", "Chocolate", "Strawberry", "Mint Chip", "Cookies & Cream"] },
  },
  // Soda / pop / fountain drink / soft drink
  {
    match: /\b(soda|pop|fountain\s*drink|soft\s*drink|cola|coke)\b/i,
    group: { label: "Flavor", options: ["Coke", "Diet Coke", "Sprite", "Dr Pepper", "Root Beer", "Lemonade"] },
  },
  // Lemonade variations
  {
    match: /\blemonade\b/i,
    group: { label: "Flavor", options: ["Classic", "Strawberry", "Raspberry", "Peach", "Mango"] },
  },
  // Iced tea
  {
    match: /\biced?\s*tea\b/i,
    group: { label: "Flavor", options: ["Sweet", "Unsweet", "Peach", "Raspberry", "Lemon"] },
  },
  // Coffee / latte / cappuccino
  {
    match: /\b(latte|cappuccino|macchiato|mocha|americano|espresso)\b/i,
    group: { label: "Size & Milk", options: ["Whole Milk", "2% Milk", "Oat Milk", "Almond Milk", "Skim Milk"] },
  },
  // Wings (sauce)
  {
    match: /\b(wings?|tenders?|nuggets?)\b/i,
    group: { label: "Sauce", options: ["Buffalo", "BBQ", "Honey Mustard", "Garlic Parmesan", "Ranch", "Plain"] },
  },
  // Pizza by the slice — topping choice
  {
    match: /\b(slice|pizza\s*slice)\b/i,
    group: { label: "Topping", options: ["Cheese", "Pepperoni", "Sausage", "Veggie", "Hawaiian"] },
  },
  // Donut / doughnut
  {
    match: /\b(donut|doughnut)\b/i,
    group: { label: "Flavor", options: ["Glazed", "Chocolate", "Strawberry", "Boston Cream", "Maple"] },
  },
  // Bagel
  {
    match: /\bbagel\b/i,
    group: { label: "Style", options: ["Plain", "Everything", "Sesame", "Cinnamon Raisin", "Blueberry"] },
  },
  // Cupcake / muffin / cake
  {
    match: /\b(cupcake|muffin)\b/i,
    group: { label: "Flavor", options: ["Vanilla", "Chocolate", "Red Velvet", "Blueberry", "Lemon"] },
  },
  // Cookie
  {
    match: /\bcookies?\b/i,
    group: { label: "Flavor", options: ["Chocolate Chip", "Sugar", "Oatmeal Raisin", "Snickerdoodle", "Double Chocolate"] },
  },
  // Pancakes / waffles
  {
    match: /\b(pancakes?|waffles?|crepes?)\b/i,
    group: { label: "Topping", options: ["Maple Syrup", "Strawberry", "Blueberry", "Chocolate Chip", "Banana"] },
  },
  // Burger doneness
  {
    match: /\b(burger|cheeseburger|patty melt)\b/i,
    group: { label: "Cooked", options: ["Medium Rare", "Medium", "Medium Well", "Well Done"] },
  },
  // Salad dressing
  {
    match: /\bsalad\b/i,
    group: { label: "Dressing", options: ["Ranch", "Caesar", "Italian", "Balsamic", "Honey Mustard", "No Dressing"] },
  },
  // Pasta sauce
  {
    match: /\b(pasta|spaghetti|penne|linguine|fettuccine|rigatoni)\b/i,
    group: { label: "Sauce", options: ["Marinara", "Alfredo", "Pesto", "Bolognese", "Olive Oil & Garlic"] },
  },
  // Tacos / burritos protein
  {
    match: /\b(taco|burrito|quesadilla|fajita)\b/i,
    group: { label: "Protein", options: ["Chicken", "Steak", "Carnitas", "Veggie", "Shrimp"] },
  },
];

export function getVariantGroup(itemName: string): VariantGroup | null {
  for (const rule of RULES) {
    if (rule.match.test(itemName)) return rule.group;
  }
  return null;
}
