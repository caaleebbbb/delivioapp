import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";

let _restAudioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_restAudioCtx) _restAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_restAudioCtx.state === "suspended") void _restAudioCtx.resume();
  return _restAudioCtx;
}
if (typeof window !== "undefined") {
  const unlock = () => { try { getCtx(); } catch {} };
  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}
function playNewOrderDing() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = 660 + i * 220;
      const t = now + i * 0.2;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    }
  } catch {}
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
}

interface Order {
  id: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  address: string;
  total: number;
  created_at: string;
  driver_name: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready: "Ready for Driver",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
};

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

export default function RestaurantOrders({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    if (!profile) return;
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", profile.id)
      .order("created_at", { ascending: false });

    if (!ordersData) return;

    const ordersWithItems: Order[] = await Promise.all(
      ordersData.map(async (order) => {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);
        return { ...order, items: itemsData || [] } as Order;
      })
    );
    setOrders(ordersWithItems);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel("restaurant-orders").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => fetchOrders()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const grouped = useMemo(() => {
    const g: Record<string, Order[]> = { placed: [], preparing: [], ready: [], "out-for-delivery": [], delivered: [] };
    orders.forEach((o) => { if (g[o.status]) g[o.status].push(o); });
    return g;
  }, [orders]);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

    if (error) {
      toast.error("Could not update this order.");
      return;
    }

    await fetchOrders();

    toast.success(status === "ready" ? "Order marked ready for drivers." : "Order status updated.");
  };

  const actionMap: Record<string, { label: string; next: string } | null> = {
    placed: { label: "Start Preparing", next: "preparing" },
    preparing: { label: "Mark Ready", next: "ready" },
    ready: null,
    "out-for-delivery": null,
    delivered: null,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-extrabold">Order Board</h2>
          <p className="text-muted-foreground">Review placed orders, move them to ready, and track delivery progress.</p>
        </div>
        <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["placed", "preparing", "ready", "delivered"].map((s) => (
          <Card key={s}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-muted-foreground text-sm">{STATUS_LABELS[s]}</p>
              <p className="text-2xl font-extrabold">{grouped[s]?.length || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No orders yet.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([status, list]) => (
          <section key={status} className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold">{STATUS_LABELS[status]}</h3>
              <span className="text-muted-foreground text-sm">{list.length} order{list.length !== 1 ? "s" : ""}</span>
            </div>
            {list.length === 0 ? (
              <Card><CardContent className="py-4 text-center text-muted-foreground text-sm">Nothing here.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {list.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="font-bold">{order.customer_name}</h4>
                          <p className="text-muted-foreground text-sm">#{order.id.slice(-6)} • {formatDate(order.created_at)}</p>
                        </div>
                        <Badge className={`${STATUS_COLORS[order.status]} border-0`}>{STATUS_LABELS[order.status]}</Badge>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${item.line_total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">Address</p>
                          <p>{order.address}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">Total</p>
                          <p className="font-bold">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      {order.driver_name && (
                        <div className="p-3 rounded-lg bg-muted text-sm">Driver: {order.driver_name}</div>
                      )}
                      {actionMap[order.status] && (
                        <Button variant="warning" className="w-full" onClick={() => updateStatus(order.id, actionMap[order.status]!.next)}>
                          {actionMap[order.status]!.label}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
