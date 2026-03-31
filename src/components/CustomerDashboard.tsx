import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFoodImage } from "@/lib/foodImages";
import { ShoppingCart, Plus, Minus } from "lucide-react";

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
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<Profile[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState("");
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: rests } = await supabase.from("profiles").select("*").eq("role", "restaurant");
      if (rests && rests.length > 0) {
        setRestaurants(rests as Profile[]);
        setSelectedRestaurantId(rests[0].id);
      }
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
      .then(({ data }) => { if (data) setMenuItems(data); });
  }, [selectedRestaurantId]);

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
    setMessage(`${item.name} added to cart.`);
    setTimeout(() => setMessage(""), 2000);
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

  const placeOrder = async () => {
    if (!selectedRestaurantId || cart.length === 0 || !address.trim() || !customerName.trim()) return;
    const rest = restaurants.find((r) => r.id === selectedRestaurantId);
    if (!rest) return;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName.trim(),
        restaurant_id: selectedRestaurantId,
        restaurant_name: rest.business_name || "Restaurant",
        address: address.trim(),
        total: parseFloat(cartTotal.toFixed(2)),
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
    setMessage("Order placed successfully! 🎉");
  };

  return (
    <div className="space-y-5 animate-fade-in pb-24 md:pb-0">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold">Order Food</h2>
        <p className="text-muted-foreground text-sm">Browse restaurants and place your order — no account needed.</p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">{message}</div>
      )}

      <Card>
        <CardContent className="pt-5 pb-5">
          <Label className="mb-2 block">Choose a Restaurant</Label>
          <Select value={selectedRestaurantId} onValueChange={(v) => { setSelectedRestaurantId(v); setCart([]); }}>
            <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
            <SelectContent>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.business_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-5 items-start">
        {/* Menu Items */}
        <div className="md:col-span-2 space-y-4">
          {menuItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              {restaurants.length === 0 ? "No restaurants available yet." : "No available items from this restaurant."}
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const img = getFoodImage(item.name);
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <Card key={item.id} className="overflow-hidden">
                    {img && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={img}
                          alt={item.name}
                          loading="lazy"
                          width={512}
                          height={320}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className={img ? "pt-3 pb-4" : "pt-6 pb-4"}>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                        <Badge variant="secondary" className="bg-success/20 text-success border-0 shrink-0 text-xs">${item.price.toFixed(2)}</Badge>
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{item.description}</p>
                      )}
                      {inCart ? (
                        <div className="flex items-center justify-between mt-3">
                          <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold">{inCart.quantity}</span>
                          <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full mt-3" onClick={() => addToCart(item)}>
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart */}
        <div className="hidden md:block sticky top-5">
          <CartPanel
            cart={cart}
            cartTotal={cartTotal}
            customerName={customerName}
            setCustomerName={setCustomerName}
            address={address}
            setAddress={setAddress}
            changeQty={changeQty}
            placeOrder={placeOrder}
          />
        </div>
      </div>

      {/* Mobile Cart FAB */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <Button
            variant="warning"
            className="w-full h-14 text-base font-extrabold shadow-lg"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({cartCount}) — ${cartTotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Mobile Cart Sheet */}
      {showCart && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setShowCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[85vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold">Your Cart</h3>
                <button onClick={() => setShowCart(false)} className="text-muted-foreground text-sm">Close</button>
              </div>
              <CartPanel
                cart={cart}
                cartTotal={cartTotal}
                customerName={customerName}
                setCustomerName={setCustomerName}
                address={address}
                setAddress={setAddress}
                changeQty={changeQty}
                placeOrder={() => { placeOrder(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartPanel({
  cart,
  cartTotal,
  customerName,
  setCustomerName,
  address,
  setAddress,
  changeQty,
  placeOrder,
}: {
  cart: CartItem[];
  cartTotal: number;
  customerName: string;
  setCustomerName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  changeQty: (id: string, dir: number) => void;
  placeOrder: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Your Cart</CardTitle>
          <Badge variant="secondary">{cart.reduce((s, c) => s + c.quantity, 0)} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <p className="text-muted-foreground text-sm">Add menu items to start your order.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-muted-foreground text-xs">${item.price.toFixed(2)} ea</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted">−</button>
                  <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted">+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 mt-4">
          <div className="space-y-1">
            <Label className="text-xs">Your Name</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Delivery Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
          <span className="font-bold text-sm">Subtotal</span>
          <span className="font-extrabold text-lg">${cartTotal.toFixed(2)}</span>
        </div>

        <Button variant="warning" className="w-full mt-3" disabled={cart.length === 0 || !customerName.trim() || !address.trim()} onClick={placeOrder}>
          Place Order
        </Button>
      </CardContent>
    </Card>
  );
}
