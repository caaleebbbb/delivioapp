import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  business_name: string | null;
  vehicle: string | null;
  created_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  total: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-blue-500/15 text-blue-300",
  preparing: "bg-secondary/15 text-secondary",
  ready: "bg-success/15 text-success",
  "out-for-delivery": "bg-primary/15 text-primary",
  delivered: "bg-muted text-muted-foreground",
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"overview" | "restaurants" | "customers" | "drivers" | "orders">("overview");

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (p) setProfiles(p as Profile[]);
      const { data: o } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (o) setOrders(o as Order[]);
    };
    load();
  }, []);

  const restaurants = profiles.filter((p) => p.role === "restaurant");
  const customers = profiles.filter((p) => p.role === "customer");
  const drivers = profiles.filter((p) => p.role === "driver");
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const renderList = (list: Profile[], label: string) => (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setView("overview")}>← Back</Button>
      <h3 className="text-xl font-extrabold">{label} ({list.length})</h3>
      {list.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground">None yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{p.business_name || p.full_name || "Unknown"}</p>
                    <p className="text-muted-foreground text-sm">{p.role}</p>
                    {p.vehicle && <p className="text-sm mt-1">Vehicle: {p.vehicle}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize">{p.role}</Badge>
                </div>
                <p className="text-muted-foreground text-xs mt-2">Joined {new Date(p.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-extrabold">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage all restaurants, customers, drivers, and orders.</p>
        </div>
        <Button variant="outline" onClick={onLogout}>Log Out</Button>
      </div>

      {view === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setView("restaurants")}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-muted-foreground text-sm">Restaurants</p>
                <p className="text-2xl font-extrabold">{restaurants.length}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setView("customers")}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-muted-foreground text-sm">Customers</p>
                <p className="text-2xl font-extrabold">{customers.length}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setView("drivers")}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-muted-foreground text-sm">Drivers</p>
                <p className="text-2xl font-extrabold">{drivers.length}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setView("orders")}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-muted-foreground text-sm">Total Revenue</p>
                <p className="text-2xl font-extrabold">${totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium">{order.customer_name} → {order.restaurant_name}</p>
                        <p className="text-muted-foreground text-sm">#{order.id.slice(-6)} • ${order.total.toFixed(2)}</p>
                      </div>
                      <Badge className={`${STATUS_COLORS[order.status] || ""} border-0`}>{order.status.replace(/-/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {view === "restaurants" && renderList(restaurants, "Restaurants")}
      {view === "customers" && renderList(customers, "Customers")}
      {view === "drivers" && renderList(drivers, "Drivers")}
      {view === "orders" && (
        <div className="space-y-3">
          <Button variant="outline" size="sm" onClick={() => setView("overview")}>← Back</Button>
          <h3 className="text-xl font-extrabold">All Orders ({orders.length})</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{order.customer_name} → {order.restaurant_name}</p>
                      <p className="text-muted-foreground text-sm">${order.total.toFixed(2)} • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[order.status] || ""} border-0`}>{order.status.replace(/-/g, " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
