import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFoodImage } from "@/lib/foodImages";
import { getRestaurantLogo } from "@/lib/restaurantLogos";
import { getVariantGroup } from "@/lib/foodVariants";
import { ShoppingCart, Plus, Minus, Search, Clock, Star, MapPin, ChevronRight, User, LogOut, Package, X } from "lucide-react";

interface Profile {
  id: string;
  role: string;
  business_name: string | null;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  category: string | null;
}

interface CartItem {
  id: string; // composite key: menuItemId or menuItemId::variant
  menuItemId: string;
  name: string; // includes "(Flavor)" if variant chosen
  price: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  id: string;
  restaurant_name: string;
  status: string;
  total: number;
  created_at: string;
  address: string;
  driver_name: string | null;
}

const STATUS_STEPS = ["placed", "preparing", "ready", "out-for-delivery", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  placed: "Order Placed",
  preparing: "Being Prepared",
  ready: "Ready for Pickup",
  "out-for-delivery": "On Its Way",
  delivered: "Delivered",
};
const STATUS_EMOJI: Record<string, string> = {
  placed: "📝", preparing: "👨‍🍳", ready: "✅", "out-for-delivery": "🚗", delivered: "🎉",
};

// Fake delivery time estimates (random per restaurant, seeded by id)
function getDeliveryTime(id: string): string {
  const hash = id.charCodeAt(0) + id.charCodeAt(1);
  const min = 15 + (hash % 20);
  return `${min}-${min + 10}`;
}

function getRating(id: string): string {
  const hash = id.charCodeAt(2) + id.charCodeAt(3);
  return (4.0 + (hash % 10) / 10).toFixed(1);
}

export default function CustomerDashboard() {
  const { user, profile, signIn, signUp, signOut } = useAuth();
  const [restaurants, setRestaurants] = useState<Profile[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [view, setView] = useState<"browse" | "restaurant" | "tracking" | "history" | "auth">("browse");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingVariantItem, setPendingVariantItem] = useState<MenuItem | null>(null);

  const isLoggedIn = !!user && profile?.role === "customer";

  useEffect(() => {
    const load = async () => {
      const { data: rests } = await supabase.from("profiles").select("*").eq("role", "restaurant");
      if (rests) setRestaurants(rests as Profile[]);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", selectedRestaurantId)
      .eq("is_available", true)
      .order("name")
      .then(({ data }) => { if (data) setMenuItems(data as MenuItem[]); });
  }, [selectedRestaurantId]);

  // Load orders for logged-in customer
  const fetchOrders = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  }, [profile]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
      const channel = supabase.channel("customer-orders")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn, fetchOrders]);

  // Pre-fill name from profile
  useEffect(() => {
    if (profile?.full_name && !customerName) setCustomerName(profile.full_name);
  }, [profile]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.category || "Other"));
    return Array.from(cats).sort();
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory) items = items.filter((i) => (i.category || "Other") === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1, lineTotal: (c.quantity + 1) * item.price }
            : c
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, lineTotal: item.price }];
    });
  };

  const changeQty = (id: string, dir: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, quantity: c.quantity + dir, lineTotal: (c.quantity + dir) * c.price } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.lineTotal, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);
  const deliveryFee = 2.99;
  const serviceFee = useMemo(() => parseFloat((cartTotal * 0.05).toFixed(2)), [cartTotal]);

  const placeOrder = async () => {
    if (!selectedRestaurantId || cart.length === 0 || !address.trim() || !customerName.trim()) return;
    const rest = restaurants.find((r) => r.id === selectedRestaurantId);
    if (!rest) return;

    const orderTotal = parseFloat((cartTotal + deliveryFee + serviceFee).toFixed(2));

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName.trim(),
        customer_id: profile?.id || null,
        restaurant_id: selectedRestaurantId,
        restaurant_name: rest.business_name || "Restaurant",
        address: address.trim(),
        total: orderTotal,
        status: "placed",
      })
      .select()
      .single();

    if (error || !order) {
      setMessage("Could not place order. Please try again.");
      return;
    }

    await supabase.from("order_items").insert(
      cart.map((c) => ({
        order_id: order.id,
        menu_item_id: c.id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        line_total: parseFloat(c.lineTotal.toFixed(2)),
      }))
    );

    setCart([]);
    setShowCart(false);

    if (isLoggedIn) {
      setSelectedOrder(order as Order);
      setView("tracking");
      fetchOrders();
    } else {
      setMessage("Order placed successfully! 🎉");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    if (authMode === "signup") {
      const { error } = await signUp(authEmail, authPassword, { role: "customer", full_name: authName });
      if (error) setAuthError(error.message);
      else setView("browse");
    } else {
      const { error } = await signIn(authEmail, authPassword);
      if (error) setAuthError(error.message);
      else setView("browse");
    }
    setAuthLoading(false);
  };

  // Auth view
  if (view === "auth") {
    return (
      <div className="max-w-md mx-auto space-y-5 animate-fade-in">
        <button onClick={() => setView("browse")} className="text-muted-foreground text-sm hover:text-foreground">← Back</button>
        <Card>
          <CardHeader>
            <CardTitle>{authMode === "login" ? "Sign In" : "Create Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            {authError && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{authError}</div>}
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <div className="space-y-1">
                  <Label className="text-xs">Full Name</Label>
                  <Input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" required />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" variant="warning" className="w-full" disabled={authLoading}>
                {authLoading ? "Loading..." : authMode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {authMode === "login" ? "No account? " : "Already have one? "}
              <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="text-primary font-bold">
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Order tracking view
  if (view === "tracking" && selectedOrder) {
    const stepIndex = STATUS_STEPS.indexOf(selectedOrder.status);
    return (
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
        <button onClick={() => { setView("browse"); setSelectedOrder(null); }} className="text-muted-foreground text-sm hover:text-foreground">← Back to menu</button>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <p className="text-4xl mb-2">{STATUS_EMOJI[selectedOrder.status] || "📦"}</p>
              <h3 className="text-xl font-extrabold">{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</h3>
              <p className="text-muted-foreground text-sm mt-1">{selectedOrder.restaurant_name}</p>
            </div>

            {/* Progress steps */}
            <div className="flex items-center justify-between px-4">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-6 sm:w-10 h-0.5 ${i < stepIndex ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order #</span>
                <span className="font-mono">{selectedOrder.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">${selectedOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{selectedOrder.address}</span>
              </div>
              {selectedOrder.driver_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-bold">{selectedOrder.driver_name}</span>
                </div>
              )}
            </div>

            {selectedOrder.status !== "delivered" && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">Estimated delivery</p>
                <p className="font-extrabold text-primary">{getDeliveryTime(selectedOrder.id)} min</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Order history view
  if (view === "history") {
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setView("browse")} className="text-muted-foreground text-sm hover:text-foreground">← Back to menu</button>
        <h2 className="text-2xl font-extrabold">Order History</h2>
        {orders.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No orders yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setSelectedOrder(order); setView("tracking"); }}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{order.restaurant_name}</h4>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(order.created_at).toLocaleDateString()} • ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={order.status === "delivered" ? "bg-muted text-muted-foreground border-0" : "bg-primary/15 text-primary border-0"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Restaurant detail view
  if (view === "restaurant" && selectedRestaurantId) {
    const rest = restaurants.find((r) => r.id === selectedRestaurantId);
    return (
      <div className="space-y-5 animate-fade-in pb-24 md:pb-0">
        <button onClick={() => { setView("browse"); setActiveCategory(null); setSearchQuery(""); }} className="text-muted-foreground text-sm hover:text-foreground">← All restaurants</button>

        {/* Restaurant header */}
        <div className="flex items-center gap-4">
          {getRestaurantLogo(rest?.business_name || "") ? (
            <img src={getRestaurantLogo(rest?.business_name || "")} alt={rest?.business_name || ""} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
              {rest?.business_name?.charAt(0) || "R"}
            </div>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold">{rest?.business_name}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-secondary fill-secondary" /> {getRating(selectedRestaurantId)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {getDeliveryTime(selectedRestaurantId)} min</span>
              <span>$2.99 delivery</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          <div className="md:col-span-2">
            {filteredItems.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No items found.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {/* Group by category */}
                {(activeCategory ? [activeCategory] : categories).map((cat) => {
                  const catItems = filteredItems.filter((i) => (i.category || "Other") === cat);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat}>
                      {!activeCategory && <h3 className="text-base font-extrabold mb-2 mt-4 first:mt-0">{cat}</h3>}
                      <div className="space-y-2">
                        {catItems.map((item) => {
                          const img = getFoodImage(item.name);
                          const inCart = cart.find((c) => c.id === item.id);
                          return (
                            <Card key={item.id} className="overflow-hidden">
                              <div className="flex">
                                <CardContent className="flex-1 py-3 space-y-1">
                                  <h4 className="font-bold text-sm">{item.name}</h4>
                                  {item.description && <p className="text-muted-foreground text-xs line-clamp-2">{item.description}</p>}
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="font-bold text-sm">${item.price.toFixed(2)}</span>
                                    {inCart ? (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                                        <span className="font-bold text-sm w-4 text-center">{inCart.quantity}</span>
                                        <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                                      </div>
                                    ) : (
                                      <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80">
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </CardContent>
                                {img && (
                                  <div className="w-28 h-28 shrink-0">
                                    <img src={img} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Cart */}
          <div className="hidden md:block sticky top-5">
            <CartPanel
              cart={cart} cartTotal={cartTotal} deliveryFee={deliveryFee} serviceFee={serviceFee}
              customerName={customerName} setCustomerName={setCustomerName}
              address={address} setAddress={setAddress}
              changeQty={changeQty} placeOrder={placeOrder}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>

        {/* Mobile Cart FAB */}
        {cart.length > 0 && (
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
            <Button variant="warning" className="w-full h-14 text-base font-extrabold shadow-lg" onClick={() => setShowCart(true)}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart ({cartCount}) — ${(cartTotal + deliveryFee + serviceFee).toFixed(2)}
            </Button>
          </div>
        )}

        {showCart && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setShowCart(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[85vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-extrabold">Your Cart</h3>
                  <button onClick={() => setShowCart(false)} className="text-muted-foreground text-sm">Close</button>
                </div>
                <CartPanel
                  cart={cart} cartTotal={cartTotal} deliveryFee={deliveryFee} serviceFee={serviceFee}
                  customerName={customerName} setCustomerName={setCustomerName}
                  address={address} setAddress={setAddress}
                  changeQty={changeQty} placeOrder={placeOrder}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Browse restaurants view (default)
  const activeOrders = orders.filter((o) => o.status !== "delivered");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold">What are you craving?</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" /> Delivering to your area</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setView("history")}>
                <Package className="w-4 h-4 mr-1" /> Orders
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setView("auth")}>
              <User className="w-4 h-4 mr-1" /> Sign In
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">{message}</div>
      )}

      {/* Active order banner */}
      {activeOrders.length > 0 && (
        <Card className="border-primary/30 bg-primary/5 cursor-pointer" onClick={() => { setSelectedOrder(activeOrders[0]); setView("tracking"); }}>
          <CardContent className="py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                {STATUS_EMOJI[activeOrders[0].status]}
              </div>
              <div>
                <p className="font-bold text-sm">{activeOrders[0].restaurant_name}</p>
                <p className="text-xs text-muted-foreground">{STATUS_LABELS[activeOrders[0].status]}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Promo banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 p-5">
        <p className="text-xs font-bold text-secondary uppercase tracking-wider">Limited Time</p>
        <h3 className="text-lg font-extrabold mt-1">Free delivery on your first order</h3>
        <p className="text-muted-foreground text-sm mt-1">No minimum order required</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search restaurants..." className="pl-9" />
      </div>

      {/* Restaurant cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((rest) => (
          <Card
            key={rest.id}
            className="overflow-hidden cursor-pointer hover:border-primary/40 transition-all group"
            onClick={() => { setSelectedRestaurantId(rest.id); setView("restaurant"); setCart([]); setActiveCategory(null); setSearchQuery(""); }}
          >
            {/* Restaurant header image */}
            <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
              {getRestaurantLogo(rest.business_name || "") ? (
                <img src={getRestaurantLogo(rest.business_name || "")} alt={rest.business_name || ""} className="w-20 h-20 object-contain" loading="lazy" />
              ) : (
                <span className="text-5xl opacity-50">{rest.business_name?.charAt(0)}</span>
              )}
            </div>
            <CardContent className="pt-3 pb-4">
              <h4 className="font-bold group-hover:text-primary transition-colors">{rest.business_name}</h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-secondary fill-secondary" /> {getRating(rest.id)}</span>
                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {getDeliveryTime(rest.id)} min</span>
                <span>$2.99 delivery</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CartPanel({
  cart, cartTotal, deliveryFee, serviceFee,
  customerName, setCustomerName,
  address, setAddress,
  changeQty, placeOrder, isLoggedIn,
}: {
  cart: CartItem[];
  cartTotal: number;
  deliveryFee: number;
  serviceFee: number;
  customerName: string;
  setCustomerName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  changeQty: (id: string, dir: number) => void;
  placeOrder: () => void;
  isLoggedIn: boolean;
}) {
  const grandTotal = cartTotal + deliveryFee + serviceFee;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Order</CardTitle>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <p className="text-muted-foreground text-sm">Add items to get started.</p>
        ) : (
          <>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-muted-foreground text-xs">${item.lineTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs hover:bg-muted">−</button>
                    <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs hover:bg-muted">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 mt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service fee</span><span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold pt-2 border-t border-border">
                <span>Total</span><span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        <div className="space-y-3 mt-4">
          {!isLoggedIn && (
            <div className="space-y-1">
              <Label className="text-xs">Your Name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Delivery Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
          </div>
        </div>

        <Button variant="warning" className="w-full mt-3 font-extrabold" disabled={cart.length === 0 || !customerName.trim() || !address.trim()} onClick={placeOrder}>
          Place Order — ${(cartTotal + deliveryFee + serviceFee).toFixed(2)}
        </Button>
      </CardContent>
    </Card>
  );
}
