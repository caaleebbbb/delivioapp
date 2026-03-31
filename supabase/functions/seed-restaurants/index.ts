import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const restaurants = [
  {
    email: "american@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Liberty Burger Co.",
    menu: [
      { name: "Classic Cheeseburger", price: 10.99, description: "Angus beef, cheddar, lettuce, tomato" },
      { name: "BBQ Bacon Burger", price: 12.99, description: "Smoky BBQ sauce, crispy bacon, onion rings" },
      { name: "Loaded Fries", price: 6.99, description: "Cheese sauce, jalapeños, sour cream" },
      { name: "Milkshake", price: 5.49, description: "Vanilla, chocolate, or strawberry" },
    ],
  },
  {
    email: "african@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Mama Nkechi's Kitchen",
    menu: [
      { name: "Jollof Rice & Chicken", price: 13.99, description: "Smoky tomato rice with grilled chicken" },
      { name: "Suya Skewers", price: 11.49, description: "Spicy grilled beef skewers with onions" },
      { name: "Egusi Soup & Pounded Yam", price: 14.99, description: "Rich melon seed soup with fufu" },
      { name: "Puff Puff", price: 5.99, description: "Sweet fried dough balls" },
    ],
  },
  {
    email: "chinese@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Golden Dragon Palace",
    menu: [
      { name: "General Tso's Chicken", price: 12.99, description: "Crispy chicken in sweet-spicy sauce" },
      { name: "Beef Lo Mein", price: 11.49, description: "Stir-fried noodles with tender beef" },
      { name: "Pork Fried Rice", price: 9.99, description: "Wok-tossed rice with BBQ pork" },
      { name: "Spring Rolls (4pc)", price: 6.49, description: "Crispy vegetable spring rolls" },
    ],
  },
  {
    email: "mexican@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Casa de Sabor",
    menu: [
      { name: "Carne Asada Tacos (3)", price: 11.99, description: "Grilled steak, cilantro, onion, salsa verde" },
      { name: "Chicken Burrito", price: 10.99, description: "Rice, beans, cheese, pico de gallo" },
      { name: "Chips & Guacamole", price: 7.49, description: "Fresh hand-smashed guacamole" },
      { name: "Horchata", price: 3.99, description: "Sweet cinnamon rice drink" },
    ],
  },
  {
    email: "italian@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Napoli's Trattoria",
    menu: [
      { name: "Margherita Pizza", price: 13.99, description: "San Marzano tomato, fresh mozzarella, basil" },
      { name: "Fettuccine Alfredo", price: 12.49, description: "Creamy parmesan sauce with grilled chicken" },
      { name: "Bruschetta", price: 7.99, description: "Toasted bread with tomato, garlic, basil" },
      { name: "Tiramisu", price: 6.99, description: "Classic espresso-soaked dessert" },
    ],
  },
  {
    email: "japanese@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Sakura Sushi Bar",
    menu: [
      { name: "Salmon Sashimi (8pc)", price: 14.99, description: "Fresh Atlantic salmon slices" },
      { name: "Dragon Roll", price: 13.49, description: "Eel, avocado, cucumber, unagi sauce" },
      { name: "Chicken Teriyaki Bowl", price: 11.99, description: "Grilled chicken, rice, teriyaki glaze" },
      { name: "Miso Soup", price: 3.99, description: "Tofu, seaweed, green onion" },
    ],
  },
  {
    email: "indian@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Taj Spice House",
    menu: [
      { name: "Butter Chicken", price: 13.99, description: "Creamy tomato curry with tender chicken" },
      { name: "Lamb Biryani", price: 15.49, description: "Fragrant basmati rice with spiced lamb" },
      { name: "Garlic Naan (2pc)", price: 4.99, description: "Fresh baked garlic flatbread" },
      { name: "Mango Lassi", price: 4.49, description: "Sweet mango yogurt drink" },
    ],
  },
  {
    email: "thai@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Bangkok Street Eats",
    menu: [
      { name: "Pad Thai", price: 12.49, description: "Rice noodles, shrimp, peanuts, lime" },
      { name: "Green Curry", price: 13.49, description: "Coconut curry with chicken & vegetables" },
      { name: "Thai Iced Tea", price: 4.49, description: "Sweet creamy orange tea" },
      { name: "Mango Sticky Rice", price: 7.99, description: "Sweet coconut rice with fresh mango" },
    ],
  },
  {
    email: "caribbean@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Island Vibes Grill",
    menu: [
      { name: "Jerk Chicken Plate", price: 13.99, description: "Spicy grilled chicken, rice & peas, plantains" },
      { name: "Oxtail Stew", price: 16.99, description: "Slow-braised oxtail with butter beans" },
      { name: "Beef Patty", price: 5.49, description: "Flaky crust with seasoned beef filling" },
      { name: "Sorrel Drink", price: 3.99, description: "Hibiscus ginger drink" },
    ],
  },
  {
    email: "korean@delivioapp.com",
    password: "Delivio2026!",
    business_name: "Seoul Kitchen BBQ",
    menu: [
      { name: "Bulgogi Bowl", price: 13.49, description: "Marinated beef, rice, pickled veggies" },
      { name: "Korean Fried Chicken", price: 12.99, description: "Double-fried with gochujang glaze" },
      { name: "Japchae", price: 10.99, description: "Glass noodles with vegetables & beef" },
      { name: "Kimchi Jjigae", price: 11.49, description: "Spicy kimchi tofu stew" },
    ],
  },
];

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

    // Create admin account
    const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
      email: "owner@delivioapp.com",
      password: "IHeartDelivioApp",
      email_confirm: true,
      user_metadata: { role: "admin", full_name: "Delivio Owner" },
    });
    if (adminErr) {
      results.push(`Admin: ${adminErr.message}`);
    } else {
      results.push(`Admin created: owner@delivioapp.com`);
    }

    // Create restaurant accounts
    for (const r of restaurants) {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: r.email,
        password: r.password,
        email_confirm: true,
        user_metadata: { role: "restaurant", business_name: r.business_name },
      });

      if (authErr) {
        results.push(`${r.business_name}: ${authErr.message}`);
        continue;
      }

      // Wait for profile trigger to create profile, then get it
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (!profile) {
        results.push(`${r.business_name}: profile not found`);
        continue;
      }

      // Insert menu items
      const menuItems = r.menu.map((item) => ({
        restaurant_id: profile.id,
        name: item.name,
        price: item.price,
        description: item.description,
        is_available: true,
      }));

      await supabase.from("menu_items").insert(menuItems);
      results.push(`${r.business_name}: created with ${r.menu.length} items`);
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
