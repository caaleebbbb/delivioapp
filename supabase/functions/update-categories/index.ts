import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Category mapping by item name
const categoryMap: Record<string, string> = {
  // Liberty Burger Co.
  "Classic Cheeseburger": "Burgers", "BBQ Bacon Burger": "Burgers", "Loaded Fries": "Sides", "Milkshake": "Drinks",
  "Mushroom Swiss Burger": "Burgers", "Spicy Jalapeño Burger": "Burgers", "Crispy Chicken Sandwich": "Sandwiches",
  "Philly Cheesesteak": "Sandwiches", "Onion Rings": "Sides", "Mac & Cheese Bites": "Sides",
  "Sweet Potato Fries": "Sides", "Coleslaw": "Sides", "Chocolate Brownie": "Desserts",
  "Apple Pie Slice": "Desserts", "Coca-Cola": "Drinks", "Lemonade": "Drinks",
  "Double Bacon Cheeseburger": "Burgers", "Veggie Burger": "Burgers", "Buffalo Wings (8pc)": "Appetizers",
  "Mozzarella Sticks (6pc)": "Appetizers",
  // Mama Nkechi's Kitchen
  "Jollof Rice & Chicken": "Main Dishes", "Suya Skewers": "Main Dishes", "Egusi Soup & Pounded Yam": "Soups",
  "Puff Puff": "Snacks", "Pepper Soup": "Soups", "Moi Moi": "Sides", "Fried Plantain": "Sides",
  "Chin Chin": "Snacks", "Akara (Bean Cakes)": "Snacks", "Ofada Rice & Stew": "Main Dishes",
  "Fried Rice & Chicken": "Main Dishes", "Asun (Spicy Goat)": "Main Dishes", "Gizdodo": "Main Dishes",
  "Ogbono Soup & Fufu": "Soups", "Zobo Drink": "Drinks", "Chapman": "Drinks", "Meat Pie": "Snacks",
  "Sausage Roll": "Snacks", "Efo Riro & Rice": "Main Dishes", "Catfish Pepper Soup": "Soups",
  // Golden Dragon Palace
  "General Tso's Chicken": "Main Dishes", "Beef Lo Mein": "Noodles", "Pork Fried Rice": "Rice",
  "Spring Rolls (4pc)": "Appetizers", "Kung Pao Chicken": "Main Dishes", "Sesame Chicken": "Main Dishes",
  "Mapo Tofu": "Main Dishes", "Sweet & Sour Pork": "Main Dishes", "Wonton Soup": "Soups",
  "Hot & Sour Soup": "Soups", "Crab Rangoon (6pc)": "Appetizers", "Dumplings (8pc)": "Appetizers",
  "Orange Chicken": "Main Dishes", "Mongolian Beef": "Main Dishes", "Shrimp Fried Rice": "Rice",
  "Chow Mein": "Noodles", "Egg Drop Soup": "Soups", "Fried Rice Combo": "Rice",
  "Bubble Tea": "Drinks", "Mango Pudding": "Desserts",
  // Casa de Sabor
  "Carne Asada Tacos (3)": "Tacos", "Chicken Burrito": "Main Dishes", "Chips & Guacamole": "Appetizers",
  "Horchata": "Drinks", "Carnitas Plate": "Main Dishes", "Fish Tacos (3)": "Tacos",
  "Quesadilla": "Main Dishes", "Enchiladas (3)": "Main Dishes", "Elote (Street Corn)": "Sides",
  "Mexican Rice": "Sides", "Refried Beans": "Sides", "Nachos Supreme": "Appetizers",
  "Tamales (3)": "Main Dishes", "Churros (4pc)": "Desserts", "Tres Leches Cake": "Desserts",
  "Agua Fresca": "Drinks", "Jarritos": "Drinks", "Birria Tacos (3)": "Tacos",
  "Sopas de Tortilla": "Soups", "Chile Relleno": "Main Dishes",
  // Napoli's Trattoria
  "Margherita Pizza": "Pizza", "Fettuccine Alfredo": "Pasta", "Bruschetta": "Appetizers",
  "Tiramisu": "Desserts", "Pepperoni Pizza": "Pizza", "Four Cheese Pizza": "Pizza",
  "Spaghetti Bolognese": "Pasta", "Lasagna": "Pasta", "Caesar Salad": "Salads",
  "Caprese Salad": "Salads", "Garlic Bread": "Sides", "Minestrone Soup": "Soups",
  "Chicken Parmesan": "Main Dishes", "Penne Arrabbiata": "Pasta", "Cannoli (2pc)": "Desserts",
  "Panna Cotta": "Desserts", "Italian Soda": "Drinks", "Espresso": "Drinks",
  "Risotto ai Funghi": "Main Dishes", "Prosciutto & Melon": "Appetizers",
  // Sakura Sushi Bar
  "Salmon Sashimi (8pc)": "Sashimi", "Dragon Roll": "Rolls", "Chicken Teriyaki Bowl": "Main Dishes",
  "Miso Soup": "Soups", "California Roll": "Rolls", "Spicy Tuna Roll": "Rolls",
  "Rainbow Roll": "Rolls", "Tempura Shrimp Roll": "Rolls", "Edamame": "Appetizers",
  "Gyoza (6pc)": "Appetizers", "Agedashi Tofu": "Appetizers", "Yakitori (4pc)": "Appetizers",
  "Tonkotsu Ramen": "Noodles", "Udon Noodle Soup": "Noodles", "Katsu Curry": "Main Dishes",
  "Sashimi Platter": "Sashimi", "Green Tea Ice Cream": "Desserts", "Mochi (3pc)": "Desserts",
  "Ramune Soda": "Drinks", "Hot Sake": "Drinks",
  // Taj Spice House
  "Butter Chicken": "Curries", "Lamb Biryani": "Rice", "Garlic Naan (2pc)": "Bread",
  "Mango Lassi": "Drinks", "Chicken Tikka Masala": "Curries", "Palak Paneer": "Curries",
  "Tandoori Chicken": "Tandoori", "Dal Makhani": "Curries", "Chicken Biryani": "Rice",
  "Samosa (2pc)": "Appetizers", "Onion Bhaji (4pc)": "Appetizers", "Paneer Tikka": "Appetizers",
  "Aloo Gobi": "Curries", "Chana Masala": "Curries", "Plain Naan": "Bread", "Raita": "Sides",
  "Gulab Jamun (3pc)": "Desserts", "Kheer": "Desserts", "Masala Chai": "Drinks", "Sweet Lassi": "Drinks",
  // Bangkok Street Eats
  "Pad Thai": "Noodles", "Green Curry": "Curries", "Thai Iced Tea": "Drinks",
  "Mango Sticky Rice": "Desserts", "Tom Yum Soup": "Soups", "Tom Kha Gai": "Soups",
  "Massaman Curry": "Curries", "Red Curry": "Curries", "Papaya Salad": "Salads",
  "Larb Gai": "Salads", "Satay Chicken (4pc)": "Appetizers", "Thai Fish Cakes (4pc)": "Appetizers",
  "Basil Fried Rice": "Rice", "Pineapple Fried Rice": "Rice", "Drunken Noodles": "Noodles",
  "Crispy Pork Belly": "Main Dishes", "Coconut Ice Cream": "Desserts",
  "Roti with Condensed Milk": "Desserts", "Lemongrass Iced Tea": "Drinks", "Coconut Water": "Drinks",
  // Island Vibes Grill
  "Jerk Chicken Plate": "Main Dishes", "Oxtail Stew": "Main Dishes", "Beef Patty": "Snacks",
  "Sorrel Drink": "Drinks", "Curry Goat": "Main Dishes", "Brown Stew Chicken": "Main Dishes",
  "Escovitch Fish": "Main Dishes", "Ackee & Saltfish": "Main Dishes", "Rice & Peas": "Sides",
  "Festival (3pc)": "Sides", "Callaloo": "Sides", "Doubles": "Snacks",
  "Roti Wrap": "Main Dishes", "Plantain Chips": "Snacks", "Rum Cake": "Desserts",
  "Coconut Drops": "Desserts", "Ginger Beer": "Drinks", "Mauby": "Drinks", "Peanut Punch": "Drinks",
  // Seoul Kitchen BBQ
  "Bulgogi Bowl": "Bowls", "Korean Fried Chicken": "Main Dishes", "Japchae": "Noodles",
  "Kimchi Jjigae": "Stews", "Bibimbap": "Bowls", "Tteokbokki": "Snacks",
  "Galbi (Short Ribs)": "BBQ", "Samgyeopsal": "BBQ", "Kimchi Fried Rice": "Rice",
  "Jajangmyeon": "Noodles", "Mandoo (8pc)": "Appetizers", "Pajeon": "Appetizers",
  "Kimbap (10pc)": "Rolls", "Sundubu Jjigae": "Stews", "Dakgalbi": "Main Dishes",
  "Corn Cheese": "Sides", "Hotteok (2pc)": "Desserts", "Bingsu": "Desserts",
  "Soju": "Drinks", "Banana Milk": "Drinks",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let updated = 0;
  for (const [name, category] of Object.entries(categoryMap)) {
    const { count } = await supabase
      .from("menu_items")
      .update({ category })
      .eq("name", name)
      .select("id", { count: "exact", head: true });
    updated += (count || 0);
  }

  return new Response(JSON.stringify({ success: true, updated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
