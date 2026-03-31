import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFoodImage } from "@/lib/foodImages";

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
}

export default function MenuEditor({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchItems = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", profile.id)
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, [profile]);

  const myItems = useMemo(() => items.filter((i) => i.restaurant_id === profile?.id), [items, profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !name.trim() || !price) return;
    const { error } = await supabase.from("menu_items").insert({
      restaurant_id: profile.id,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(parseFloat(price).toFixed(2)),
      is_available: true,
    });
    if (!error) {
      setName("");
      setDescription("");
      setPrice("");
      setFeedback("Menu item added!");
      fetchItems();
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    fetchItems();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold">Menu Manager</h2>
          <p className="text-muted-foreground text-sm">Add items, update availability, and keep your storefront current.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-5 items-start">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New Item</CardTitle>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div className="mb-3 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                {feedback}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Item Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spicy Chicken Sandwich" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={2}
                  placeholder="Briefly describe the ingredients..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price ($)</Label>
                <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
              </div>
              <Button type="submit" variant="warning" className="w-full">Add to Menu</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {myItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No items on your menu yet.</CardContent></Card>
          ) : (
            myItems.map((item) => {
              const img = getFoodImage(item.name);
              return (
                <Card key={item.id} className={`overflow-hidden ${!item.is_available ? "opacity-60" : ""}`}>
                  <div className="flex">
                    {img && (
                      <div className="w-24 h-24 shrink-0">
                        <img src={img} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className={`flex-1 py-3 ${img ? "pl-3" : "pt-4"}`}>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <Badge variant="secondary" className="bg-success/20 text-success border-0 shrink-0 text-xs">
                          ${item.price.toFixed(2)}
                        </Badge>
                      </div>
                      {item.description && <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{item.description}</p>}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                        <button onClick={() => toggleAvailability(item)} className="text-xs font-bold text-secondary hover:text-secondary/80">
                          {item.is_available ? "Unavailable" : "Available"}
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="text-xs font-bold text-destructive hover:text-destructive/80">
                          Delete
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
