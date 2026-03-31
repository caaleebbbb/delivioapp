import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-extrabold">Menu Manager</h2>
          <p className="text-muted-foreground">Add items, update availability, and keep your storefront current.</p>
        </div>
        <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>New Item</CardTitle>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                {feedback}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spicy Chicken Sandwich" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Briefly describe the ingredients..."
                />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
              </div>
              <Button type="submit" variant="warning" className="w-full">Add to Menu</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {myItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No items on your menu yet.</CardContent></Card>
          ) : (
            myItems.map((item) => (
              <Card key={item.id} className={!item.is_available ? "opacity-60" : ""}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <Badge variant="secondary" className="bg-success/20 text-success border-0 shrink-0">
                      ${item.price.toFixed(2)}
                    </Badge>
                  </div>
                  {item.description && <p className="text-muted-foreground text-sm mt-2">{item.description}</p>}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <button onClick={() => toggleAvailability(item)} className="text-sm font-bold text-secondary hover:text-secondary/80">
                      {item.is_available ? "Mark Unavailable" : "Mark Available"}
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-sm font-bold text-destructive hover:text-destructive/80">
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
