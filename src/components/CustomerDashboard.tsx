import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-blue-500/15 text-blue-300",
  preparing: "bg-secondary/15 text-secondary",
  ready: "bg-success/15 text-success",
  "out-for-delivery": "bg-primary/15 text-primary",
  delivered: "bg-muted text-muted-foreground",
};

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
  };

  const changeQty = (id: string, dir: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, quantity: c.quantity + dir, lineTotal: (c.quantity + dir) * c.price } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.lineTotal, 0), [cart]);

  const placeOrder = async () => {
    if (!selectedRestaurantId || cart.length === 0 || !address.trim() || !customerName.trim()) return;
    const rest = restaurants.find((r) => r.id === selectedRestaurantId);
    if (!rest) return;

    // Guest orders: we need a guest profile or use anon insert
    // For simplicity, we'll insert directly using the restaurant's profile as a reference
    // We need to handle this via a public insert approach
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: rest.id, // placeholder - will fix with proper guest flow
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
    setMessage("Order placed successfully! 🎉");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold">Order Food</h2>
        <p className="text-muted-foreground">Browse restaurants and place your order — no account needed.</p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">{message}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left - Menu */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Choose a Restaurant</Label>
                <Select value={selectedRestaurantId} onValueChange={(v) => { setSelectedRestaurantId(v); setCart([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                  <SelectContent>
                    {restaurants.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.business_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {menuItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              {restaurants.length === 0 ? "No restaurants available yet." : "No available items from this restaurant."}
            </CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="font-bold">{item.name}</h4>
                      <Badge variant="secondary" className="bg-success/20 text-success border-0 shrink-0">${item.price.toFixed(2)}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">{item.description || "No description."}</p>
                    <Button className="w-full mt-4" onClick={() => addToCart(item)}>Add to Cart</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right - Cart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Cart</CardTitle>
                <Badge variant="secondary">{cart.reduce((s, c) => s + c.quantity, 0)} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-sm">Add menu items to start your order.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-sm">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted">−</button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <span className="font-bold">Subtotal</span>
                <span className="font-extrabold text-lg">${cartTotal.toFixed(2)}</span>
              </div>

              <Button variant="warning" className="w-full mt-4" disabled={cart.length === 0 || !customerName.trim() || !address.trim()} onClick={placeOrder}>
                Place Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
