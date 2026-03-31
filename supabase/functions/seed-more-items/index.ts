import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 16 additional items per restaurant (already have 4 each)
const additionalMenus: Record<string, Array<{ name: string; price: number; description: string; category: string }>> = {
  "Liberty Burger Co.": [
    { name: "Mushroom Swiss Burger", price: 12.49, description: "Sautéed mushrooms, Swiss cheese, garlic aioli", category: "Burgers" },
    { name: "Spicy Jalapeño Burger", price: 11.99, description: "Pepper jack, jalapeños, chipotle mayo", category: "Burgers" },
    { name: "Crispy Chicken Sandwich", price: 10.99, description: "Buttermilk fried chicken, pickles, coleslaw", category: "Sandwiches" },
    { name: "Philly Cheesesteak", price: 13.49, description: "Shaved ribeye, provolone, peppers, onions", category: "Sandwiches" },
    { name: "Onion Rings", price: 5.99, description: "Beer-battered thick-cut onion rings", category: "Sides" },
    { name: "Mac & Cheese Bites", price: 6.49, description: "Crispy fried mac and cheese balls", category: "Sides" },
    { name: "Sweet Potato Fries", price: 5.49, description: "Crispy sweet potato fries with ranch", category: "Sides" },
    { name: "Coleslaw", price: 3.99, description: "Creamy homestyle coleslaw", category: "Sides" },
    { name: "Chocolate Brownie", price: 5.99, description: "Warm fudge brownie with vanilla ice cream", category: "Desserts" },
    { name: "Apple Pie Slice", price: 5.49, description: "Classic American apple pie à la mode", category: "Desserts" },
    { name: "Coca-Cola", price: 2.49, description: "Classic Coca-Cola", category: "Drinks" },
    { name: "Lemonade", price: 3.49, description: "Fresh-squeezed lemonade", category: "Drinks" },
    { name: "Double Bacon Cheeseburger", price: 14.99, description: "Two patties, double bacon, double cheese", category: "Burgers" },
    { name: "Veggie Burger", price: 10.49, description: "Plant-based patty, avocado, sprouts, tomato", category: "Burgers" },
    { name: "Buffalo Wings (8pc)", price: 9.99, description: "Crispy wings tossed in buffalo sauce", category: "Appetizers" },
    { name: "Mozzarella Sticks (6pc)", price: 7.49, description: "Breaded mozzarella with marinara sauce", category: "Appetizers" },
  ],
  "Mama Nkechi's Kitchen": [
    { name: "Pepper Soup", price: 10.99, description: "Spicy goat meat pepper soup", category: "Soups" },
    { name: "Moi Moi", price: 5.99, description: "Steamed bean pudding with eggs", category: "Sides" },
    { name: "Fried Plantain", price: 4.99, description: "Sweet ripe plantain, perfectly fried", category: "Sides" },
    { name: "Chin Chin", price: 4.49, description: "Crunchy fried dough snack", category: "Snacks" },
    { name: "Akara (Bean Cakes)", price: 5.49, description: "Deep-fried black-eyed pea fritters", category: "Snacks" },
    { name: "Ofada Rice & Stew", price: 13.99, description: "Local rice with spicy green pepper stew", category: "Main Dishes" },
    { name: "Fried Rice & Chicken", price: 12.99, description: "Nigerian-style fried rice with grilled chicken", category: "Main Dishes" },
    { name: "Asun (Spicy Goat)", price: 14.99, description: "Grilled spicy goat meat with peppers", category: "Main Dishes" },
    { name: "Gizdodo", price: 9.99, description: "Gizzard and plantain in pepper sauce", category: "Main Dishes" },
    { name: "Ogbono Soup & Fufu", price: 13.99, description: "Draw soup with assorted meat and fufu", category: "Soups" },
    { name: "Zobo Drink", price: 3.99, description: "Hibiscus flower drink with ginger", category: "Drinks" },
    { name: "Chapman", price: 4.99, description: "Nigerian cocktail with Fanta, Sprite, bitters", category: "Drinks" },
    { name: "Meat Pie", price: 4.99, description: "Flaky pastry with seasoned minced beef", category: "Snacks" },
    { name: "Sausage Roll", price: 3.99, description: "Puff pastry wrapped sausage", category: "Snacks" },
    { name: "Efo Riro & Rice", price: 12.99, description: "Spinach stew with assorted meat, white rice", category: "Main Dishes" },
    { name: "Catfish Pepper Soup", price: 15.99, description: "Whole catfish in aromatic pepper broth", category: "Soups" },
  ],
  "Golden Dragon Palace": [
    { name: "Kung Pao Chicken", price: 12.49, description: "Diced chicken with peanuts in spicy sauce", category: "Main Dishes" },
    { name: "Sesame Chicken", price: 11.99, description: "Crispy chicken in sweet sesame glaze", category: "Main Dishes" },
    { name: "Mapo Tofu", price: 10.99, description: "Silken tofu in spicy Sichuan chili sauce", category: "Main Dishes" },
    { name: "Sweet & Sour Pork", price: 12.49, description: "Crispy pork with pineapple in tangy sauce", category: "Main Dishes" },
    { name: "Wonton Soup", price: 7.99, description: "Pork wontons in clear savory broth", category: "Soups" },
    { name: "Hot & Sour Soup", price: 6.99, description: "Traditional spicy and sour egg drop soup", category: "Soups" },
    { name: "Crab Rangoon (6pc)", price: 7.49, description: "Cream cheese and crab in crispy wonton", category: "Appetizers" },
    { name: "Dumplings (8pc)", price: 8.99, description: "Pan-fried pork and cabbage dumplings", category: "Appetizers" },
    { name: "Orange Chicken", price: 11.99, description: "Crispy chicken in sweet orange citrus glaze", category: "Main Dishes" },
    { name: "Mongolian Beef", price: 13.49, description: "Tender beef with scallions in savory sauce", category: "Main Dishes" },
    { name: "Shrimp Fried Rice", price: 11.49, description: "Wok-fried rice with jumbo shrimp", category: "Rice & Noodles" },
    { name: "Chow Mein", price: 10.49, description: "Stir-fried egg noodles with vegetables", category: "Rice & Noodles" },
    { name: "Egg Drop Soup", price: 5.49, description: "Silky egg ribbons in chicken broth", category: "Soups" },
    { name: "Fried Rice Combo", price: 9.99, description: "Chicken, shrimp, and pork fried rice", category: "Rice & Noodles" },
    { name: "Bubble Tea", price: 5.49, description: "Taro milk tea with tapioca pearls", category: "Drinks" },
    { name: "Mango Pudding", price: 4.99, description: "Chilled creamy mango dessert", category: "Desserts" },
  ],
  "Casa de Sabor": [
    { name: "Carnitas Plate", price: 13.49, description: "Slow-braised pulled pork, rice, beans, tortillas", category: "Main Dishes" },
    { name: "Fish Tacos (3)", price: 12.99, description: "Battered fish, cabbage slaw, lime crema", category: "Tacos" },
    { name: "Quesadilla", price: 9.99, description: "Flour tortilla, cheese, chicken, peppers", category: "Main Dishes" },
    { name: "Enchiladas (3)", price: 11.99, description: "Rolled tortillas with red sauce, cheese, cream", category: "Main Dishes" },
    { name: "Elote (Street Corn)", price: 5.49, description: "Grilled corn with mayo, cotija, chili, lime", category: "Sides" },
    { name: "Mexican Rice", price: 3.99, description: "Tomato-seasoned rice with cilantro", category: "Sides" },
    { name: "Refried Beans", price: 3.49, description: "Creamy pinto beans with cheese", category: "Sides" },
    { name: "Nachos Supreme", price: 10.99, description: "Loaded nachos with beef, cheese, jalapeños", category: "Appetizers" },
    { name: "Tamales (3)", price: 9.99, description: "Corn masa with pork filling, steamed in husks", category: "Main Dishes" },
    { name: "Churros (4pc)", price: 6.49, description: "Cinnamon sugar churros with chocolate sauce", category: "Desserts" },
    { name: "Tres Leches Cake", price: 6.99, description: "Three-milk soaked sponge cake", category: "Desserts" },
    { name: "Agua Fresca", price: 3.99, description: "Fresh watermelon or cucumber water", category: "Drinks" },
    { name: "Jarritos", price: 2.99, description: "Mexican fruit soda", category: "Drinks" },
    { name: "Birria Tacos (3)", price: 13.99, description: "Braised beef tacos with consommé for dipping", category: "Tacos" },
    { name: "Sopas de Tortilla", price: 7.99, description: "Tortilla soup with avocado and cheese", category: "Soups" },
    { name: "Chile Relleno", price: 11.49, description: "Stuffed poblano with cheese, ranchera sauce", category: "Main Dishes" },
  ],
  "Napoli's Trattoria": [
    { name: "Pepperoni Pizza", price: 14.99, description: "Classic pepperoni with mozzarella and basil", category: "Pizza" },
    { name: "Four Cheese Pizza", price: 15.49, description: "Mozzarella, gorgonzola, parmesan, fontina", category: "Pizza" },
    { name: "Spaghetti Bolognese", price: 12.99, description: "Slow-simmered meat sauce over spaghetti", category: "Pasta" },
    { name: "Lasagna", price: 13.99, description: "Layered pasta with beef, ricotta, mozzarella", category: "Pasta" },
    { name: "Caesar Salad", price: 8.99, description: "Romaine, croutons, parmesan, Caesar dressing", category: "Salads" },
    { name: "Caprese Salad", price: 9.49, description: "Fresh mozzarella, tomato, basil, balsamic", category: "Salads" },
    { name: "Garlic Bread", price: 5.99, description: "Toasted bread with garlic butter and herbs", category: "Sides" },
    { name: "Minestrone Soup", price: 7.49, description: "Hearty Italian vegetable soup", category: "Soups" },
    { name: "Chicken Parmesan", price: 14.49, description: "Breaded chicken, marinara, melted mozzarella", category: "Main Dishes" },
    { name: "Penne Arrabbiata", price: 11.49, description: "Penne in spicy tomato sauce with garlic", category: "Pasta" },
    { name: "Cannoli (2pc)", price: 6.49, description: "Crispy shells filled with sweet ricotta cream", category: "Desserts" },
    { name: "Panna Cotta", price: 6.99, description: "Vanilla cream dessert with berry compote", category: "Desserts" },
    { name: "Italian Soda", price: 3.99, description: "Sparkling water with your choice of syrup", category: "Drinks" },
    { name: "Espresso", price: 3.49, description: "Double shot Italian espresso", category: "Drinks" },
    { name: "Risotto ai Funghi", price: 13.49, description: "Creamy mushroom risotto with parmesan", category: "Main Dishes" },
    { name: "Prosciutto & Melon", price: 9.99, description: "Aged prosciutto with fresh cantaloupe", category: "Appetizers" },
  ],
  "Sakura Sushi Bar": [
    { name: "California Roll", price: 9.99, description: "Crab, avocado, cucumber, sesame seeds", category: "Rolls" },
    { name: "Spicy Tuna Roll", price: 11.99, description: "Fresh tuna with spicy mayo and scallions", category: "Rolls" },
    { name: "Rainbow Roll", price: 14.99, description: "California roll topped with assorted sashimi", category: "Rolls" },
    { name: "Tempura Shrimp Roll", price: 12.49, description: "Crispy shrimp tempura with avocado", category: "Rolls" },
    { name: "Edamame", price: 4.99, description: "Steamed soybeans with sea salt", category: "Appetizers" },
    { name: "Gyoza (6pc)", price: 7.49, description: "Pan-fried pork dumplings with dipping sauce", category: "Appetizers" },
    { name: "Agedashi Tofu", price: 6.99, description: "Crispy fried tofu in dashi broth", category: "Appetizers" },
    { name: "Yakitori (4pc)", price: 8.99, description: "Grilled chicken skewers with tare sauce", category: "Appetizers" },
    { name: "Tonkotsu Ramen", price: 13.99, description: "Rich pork bone broth, chashu, soft egg, noodles", category: "Noodles" },
    { name: "Udon Noodle Soup", price: 11.99, description: "Thick wheat noodles in savory dashi broth", category: "Noodles" },
    { name: "Katsu Curry", price: 12.99, description: "Breaded pork cutlet with Japanese curry and rice", category: "Main Dishes" },
    { name: "Sashimi Platter", price: 18.99, description: "Chef's selection of 12 premium sashimi slices", category: "Sashimi" },
    { name: "Green Tea Ice Cream", price: 4.99, description: "Creamy matcha green tea ice cream", category: "Desserts" },
    { name: "Mochi (3pc)", price: 5.49, description: "Assorted flavors of sweet rice cake", category: "Desserts" },
    { name: "Ramune Soda", price: 3.99, description: "Japanese marble soda", category: "Drinks" },
    { name: "Hot Sake", price: 6.99, description: "Warm premium Japanese rice wine", category: "Drinks" },
  ],
  "Taj Spice House": [
    { name: "Chicken Tikka Masala", price: 13.49, description: "Grilled chicken in creamy spiced tomato sauce", category: "Curries" },
    { name: "Palak Paneer", price: 11.99, description: "Cottage cheese in creamy spinach sauce", category: "Curries" },
    { name: "Tandoori Chicken", price: 14.49, description: "Clay oven-roasted chicken marinated in yogurt spices", category: "Tandoori" },
    { name: "Dal Makhani", price: 10.99, description: "Slow-cooked black lentils in creamy butter sauce", category: "Curries" },
    { name: "Chicken Biryani", price: 13.99, description: "Fragrant basmati rice with spiced chicken", category: "Rice" },
    { name: "Samosa (2pc)", price: 5.99, description: "Crispy pastry filled with spiced potatoes and peas", category: "Appetizers" },
    { name: "Onion Bhaji (4pc)", price: 5.49, description: "Crispy onion fritters with mint chutney", category: "Appetizers" },
    { name: "Paneer Tikka", price: 9.99, description: "Grilled cottage cheese with peppers and onions", category: "Appetizers" },
    { name: "Aloo Gobi", price: 10.49, description: "Potato and cauliflower in turmeric spices", category: "Curries" },
    { name: "Chana Masala", price: 10.99, description: "Chickpeas in tangy tomato-onion gravy", category: "Curries" },
    { name: "Plain Naan", price: 2.99, description: "Traditional tandoor-baked flatbread", category: "Bread" },
    { name: "Raita", price: 2.99, description: "Cooling yogurt with cucumber and mint", category: "Sides" },
    { name: "Gulab Jamun (3pc)", price: 5.49, description: "Deep-fried milk balls in rose syrup", category: "Desserts" },
    { name: "Kheer", price: 4.99, description: "Cardamom rice pudding with pistachios", category: "Desserts" },
    { name: "Masala Chai", price: 3.49, description: "Spiced Indian tea with milk", category: "Drinks" },
    { name: "Sweet Lassi", price: 4.49, description: "Sweetened yogurt drink with cardamom", category: "Drinks" },
  ],
  "Bangkok Street Eats": [
    { name: "Tom Yum Soup", price: 9.99, description: "Spicy and sour shrimp soup with lemongrass", category: "Soups" },
    { name: "Tom Kha Gai", price: 9.49, description: "Coconut chicken soup with galangal", category: "Soups" },
    { name: "Massaman Curry", price: 13.49, description: "Rich peanut curry with potatoes and chicken", category: "Curries" },
    { name: "Red Curry", price: 12.99, description: "Spicy red curry with bamboo shoots and basil", category: "Curries" },
    { name: "Papaya Salad", price: 8.99, description: "Shredded green papaya with chili-lime dressing", category: "Salads" },
    { name: "Larb Gai", price: 10.49, description: "Minced chicken salad with mint and chili", category: "Salads" },
    { name: "Satay Chicken (4pc)", price: 8.99, description: "Grilled chicken skewers with peanut sauce", category: "Appetizers" },
    { name: "Thai Fish Cakes (4pc)", price: 7.99, description: "Red curry fish cakes with cucumber relish", category: "Appetizers" },
    { name: "Basil Fried Rice", price: 11.49, description: "Wok-fried rice with holy basil and chili", category: "Rice" },
    { name: "Pineapple Fried Rice", price: 11.99, description: "Fried rice with pineapple, cashews, raisins", category: "Rice" },
    { name: "Drunken Noodles", price: 12.49, description: "Flat noodles with chili, basil, and vegetables", category: "Noodles" },
    { name: "Crispy Pork Belly", price: 13.99, description: "Roasted pork belly with Chinese broccoli", category: "Main Dishes" },
    { name: "Coconut Ice Cream", price: 5.49, description: "Fresh coconut ice cream with toppings", category: "Desserts" },
    { name: "Roti with Condensed Milk", price: 4.99, description: "Crispy flatbread with sweet condensed milk", category: "Desserts" },
    { name: "Lemongrass Iced Tea", price: 3.99, description: "Refreshing lemongrass herbal tea", category: "Drinks" },
    { name: "Coconut Water", price: 3.49, description: "Fresh young coconut water", category: "Drinks" },
  ],
  "Island Vibes Grill": [
    { name: "Curry Goat", price: 15.99, description: "Slow-cooked goat in aromatic Caribbean curry", category: "Main Dishes" },
    { name: "Brown Stew Chicken", price: 13.49, description: "Braised chicken in rich brown gravy", category: "Main Dishes" },
    { name: "Escovitch Fish", price: 14.99, description: "Fried whole snapper with pickled vegetables", category: "Main Dishes" },
    { name: "Ackee & Saltfish", price: 13.99, description: "Jamaica's national dish with fried dumplings", category: "Main Dishes" },
    { name: "Rice & Peas", price: 4.99, description: "Coconut rice with kidney beans and thyme", category: "Sides" },
    { name: "Festival (3pc)", price: 4.49, description: "Sweet cornmeal fritters", category: "Sides" },
    { name: "Fried Plantain", price: 4.99, description: "Sweet ripe plantain slices, golden fried", category: "Sides" },
    { name: "Callaloo", price: 5.49, description: "Sautéed leafy greens with garlic and scotch bonnet", category: "Sides" },
    { name: "Doubles", price: 5.99, description: "Trinidadian chickpea-filled fried flatbread", category: "Snacks" },
    { name: "Roti Wrap", price: 11.99, description: "Curry chicken wrapped in dhalpuri roti", category: "Main Dishes" },
    { name: "Plantain Chips", price: 3.99, description: "Crispy thin-sliced green plantain chips", category: "Snacks" },
    { name: "Rum Cake", price: 6.99, description: "Dense butter cake soaked in Caribbean rum", category: "Desserts" },
    { name: "Coconut Drops", price: 4.99, description: "Chewy coconut candy with ginger", category: "Desserts" },
    { name: "Ginger Beer", price: 3.99, description: "Spicy homemade ginger beer", category: "Drinks" },
    { name: "Mauby", price: 3.49, description: "Traditional Caribbean bark drink, bittersweet", category: "Drinks" },
    { name: "Peanut Punch", price: 4.99, description: "Creamy peanut butter drink with nutmeg", category: "Drinks" },
  ],
  "Seoul Kitchen BBQ": [
    { name: "Bibimbap", price: 12.99, description: "Mixed rice bowl with vegetables, egg, gochujang", category: "Bowls" },
    { name: "Tteokbokki", price: 9.99, description: "Spicy stir-fried rice cakes in gochujang sauce", category: "Snacks" },
    { name: "Galbi (Short Ribs)", price: 17.99, description: "Marinated grilled beef short ribs", category: "BBQ" },
    { name: "Samgyeopsal", price: 15.99, description: "Grilled pork belly with lettuce wraps", category: "BBQ" },
    { name: "Kimchi Fried Rice", price: 10.99, description: "Fried rice with kimchi, pork, fried egg", category: "Rice" },
    { name: "Jajangmyeon", price: 11.49, description: "Noodles in black bean sauce with pork", category: "Noodles" },
    { name: "Mandoo (8pc)", price: 7.99, description: "Korean dumplings, steamed or fried", category: "Appetizers" },
    { name: "Pajeon", price: 8.99, description: "Crispy scallion pancake with dipping sauce", category: "Appetizers" },
    { name: "Kimbap (10pc)", price: 8.49, description: "Korean rice rolls with vegetables and beef", category: "Rolls" },
    { name: "Sundubu Jjigae", price: 11.99, description: "Soft tofu stew with seafood and egg", category: "Stews" },
    { name: "Dakgalbi", price: 13.49, description: "Spicy stir-fried chicken with vegetables", category: "Main Dishes" },
    { name: "Corn Cheese", price: 6.49, description: "Sweet corn with melted mozzarella", category: "Sides" },
    { name: "Hotteok (2pc)", price: 5.49, description: "Sweet filled Korean pancakes", category: "Desserts" },
    { name: "Bingsu", price: 7.99, description: "Shaved ice dessert with red bean and mochi", category: "Desserts" },
    { name: "Soju", price: 5.99, description: "Classic Korean rice spirit", category: "Drinks" },
    { name: "Banana Milk", price: 3.49, description: "Sweet Korean banana-flavored milk", category: "Drinks" },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: string[] = [];

    // Get all restaurant profiles
    const { data: restaurants } = await supabase
      .from("profiles")
      .select("id, business_name")
      .eq("role", "restaurant");

    if (!restaurants) {
      return new Response(JSON.stringify({ error: "No restaurants found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const rest of restaurants) {
      const additional = additionalMenus[rest.business_name || ""];
      if (!additional) {
        results.push(`${rest.business_name}: no additional items defined`);
        continue;
      }

      // Check what already exists
      const { data: existing } = await supabase
        .from("menu_items")
        .select("name")
        .eq("restaurant_id", rest.id);

      const existingNames = new Set((existing || []).map((e: any) => e.name));
      const newItems = additional.filter((item) => !existingNames.has(item.name));

      if (newItems.length === 0) {
        results.push(`${rest.business_name}: all items already exist`);
        continue;
      }

      const { error } = await supabase.from("menu_items").insert(
        newItems.map((item) => ({
          restaurant_id: rest.id,
          name: item.name,
          price: item.price,
          description: item.description,
          is_available: true,
        }))
      );

      if (error) {
        results.push(`${rest.business_name}: ${error.message}`);
      } else {
        results.push(`${rest.business_name}: added ${newItems.length} new items`);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
