import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  address: string;
  total: number;
  created_at: string;
  driver_id: string | null;
  driver_name: string;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DriverDashboard({ onLogout }: { onLogout: () => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`status.eq.ready,driver_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel("driver-orders").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => fetchOrders()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const readyOrders = useMemo(() => orders.filter((o) => o.status === "ready" && !o.driver_id), [orders]);
  const activeOrders = useMemo(() => orders.filter((o) => o.driver_id === profile?.id && o.status === "out-for-delivery"), [orders, profile]);
  const completedOrders = useMemo(() => orders.filter((o) => o.driver_id === profile?.id && o.status === "delivered"), [orders, profile]);

  const claimOrder = async (orderId: string) => {
    if (!profile) return;
    await supabase.from("orders").update({
      status: "out-for-delivery",
      driver_id: profile.id,
      driver_name: profile.full_name || "Driver",
    }).eq("id", orderId);
    fetchOrders();
  };

  const completeOrder = async (orderId: string) => {
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    fetchOrders();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-extrabold">Driver Delivery Hub</h2>
          <p className="text-muted-foreground">Claim ready orders, view addresses, and mark deliveries complete.</p>
        </div>
        <Button variant="outline" onClick={onLogout}>Log Out</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-muted-foreground text-sm">Ready to Claim</p>
          <p className="text-2xl font-extrabold">{readyOrders.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-muted-foreground text-sm">Active</p>
          <p className="text-2xl font-extrabold">{activeOrders.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-muted-foreground text-sm">Completed</p>
          <p className="text-2xl font-extrabold">{completedOrders.length}</p>
        </CardContent></Card>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-extrabold">Available Orders</h3>
        {readyOrders.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">No ready orders right now.</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {readyOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{order.restaurant_name}</span>
                    <Badge className="bg-success/15 text-success border-0">Ready</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{formatDate(order.created_at)}</p>
                  <p className="text-sm"><strong>Dropoff:</strong> {order.address}</p>
                  <p className="text-sm"><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                  <Button variant="warning" className="w-full" onClick={() => claimOrder(order.id)}>Claim Delivery</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-extrabold">My Active Deliveries</h3>
        {activeOrders.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">No active deliveries.</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{order.restaurant_name}</span>
                    <Badge className="bg-primary/15 text-primary border-0">On the Way</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">Customer: {order.customer_name}</p>
                  <p className="text-sm">{order.address}</p>
                  <Button className="w-full" onClick={() => completeOrder(order.id)}>Mark Delivered</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
