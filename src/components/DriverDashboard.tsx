import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Create a notification ding using Web Audio API
function playNotificationDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Play two quick tones for a "ding-ding"
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Audio not available
  }
}
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

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
  offered_to_driver_id: string | null;
  offer_expires_at: string | null;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function OrderPopup({
  order,
  onAccept,
  onDecline,
}: {
  order: Order;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!order.offer_expires_at) return;
    const expiresAt = new Date(order.offer_expires_at).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      setProgress((remaining / 20) * 100);

      if (remaining <= 0) {
        clearInterval(interval);
        onDecline();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [order.offer_expires_at, onDecline]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md border-primary/50 shadow-2xl shadow-primary/20">
        <CardContent className="pt-6 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">New Delivery Request</p>
            <h3 className="text-2xl font-extrabold">{order.restaurant_name}</h3>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time remaining</span>
              <span className={`font-bold ${timeLeft <= 5 ? "text-destructive" : "text-primary"}`}>{timeLeft}s</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Customer</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Total</p>
              <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Delivery Address</p>
            <p className="font-medium">{order.address}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onDecline}>
              Decline
            </Button>
            <Button variant="warning" className="flex-1 text-lg font-extrabold" onClick={onAccept}>
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DriverDashboard({ onLogout }: { onLogout: () => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [offeredOrder, setOfferedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`offered_to_driver_id.eq.${profile.id},driver_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });
    if (data) {
      const typed = data as Order[];
      setOrders(typed);

      // Check for incoming offer
      const offer = typed.find(
        (o) =>
          o.status === "ready" &&
          o.offered_to_driver_id === profile.id &&
          o.driver_id === null &&
          o.offer_expires_at &&
          new Date(o.offer_expires_at).getTime() > Date.now()
      );
      setOfferedOrder(offer || null);
    }
  }, [profile]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("driver-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Load initial availability
  useEffect(() => {
    if (profile) {
      supabase
        .from("profiles")
        .select("is_available")
        .eq("id", profile.id)
        .single()
        .then(({ data }) => {
          if (data && typeof (data as any).is_available === "boolean") {
            setIsAvailable((data as any).is_available);
          }
        });
    }
  }, [profile]);

  const toggleAvailability = async (val: boolean) => {
    if (!profile) return;
    setIsAvailable(val);
    await supabase.from("profiles").update({ is_available: val } as any).eq("id", profile.id);
  };

  const activeOrders = useMemo(
    () => orders.filter((o) => o.driver_id === profile?.id && o.status === "out-for-delivery"),
    [orders, profile]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.driver_id === profile?.id && o.status === "delivered"),
    [orders, profile]
  );

  const acceptOrder = async () => {
    if (!offeredOrder || !profile) return;
    await supabase
      .from("orders")
      .update({
        status: "out-for-delivery",
        driver_id: profile.id,
        driver_name: profile.full_name || "Driver",
      })
      .eq("id", offeredOrder.id);
    setOfferedOrder(null);
    fetchOrders();
  };

  const declineOrder = async () => {
    if (!offeredOrder || !profile) return;
    setOfferedOrder(null);
    // Call reassign edge function to find another driver
    await supabase.functions.invoke("reassign-order", {
      body: { order_id: offeredOrder.id, declined_driver_id: profile.id },
    });
    fetchOrders();
  };

  const completeOrder = async (orderId: string) => {
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    fetchOrders();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {offeredOrder && (
        <OrderPopup order={offeredOrder} onAccept={acceptOrder} onDecline={declineOrder} />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-extrabold">Driver Delivery Hub</h2>
          <p className="text-muted-foreground">Toggle available to receive delivery requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={toggleAvailability}
            />
            <Label htmlFor="availability" className={isAvailable ? "text-success font-bold" : "text-muted-foreground"}>
              {isAvailable ? "Online" : "Offline"}
            </Label>
          </div>
          <Button variant="outline" onClick={onLogout}>Log Out</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-muted-foreground text-sm">Status</p>
            <p className={`text-lg font-extrabold ${isAvailable ? "text-success" : "text-muted-foreground"}`}>
              {isAvailable ? "🟢 Online" : "🔴 Offline"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-muted-foreground text-sm">Active</p>
            <p className="text-2xl font-extrabold">{activeOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-muted-foreground text-sm">Completed</p>
            <p className="text-2xl font-extrabold">{completedOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-extrabold">My Active Deliveries</h3>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              {isAvailable ? "Waiting for delivery requests..." : "Go online to receive orders."}
            </CardContent>
          </Card>
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
                  <p className="text-sm font-bold">${order.total.toFixed(2)}</p>
                  <Button className="w-full" onClick={() => completeOrder(order.id)}>
                    Mark Delivered
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {completedOrders.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-extrabold">Completed Today</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {completedOrders.slice(0, 6).map((order) => (
              <Card key={order.id} className="opacity-60">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{order.restaurant_name}</span>
                    <Badge className="bg-muted text-muted-foreground border-0">Delivered</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{order.customer_name} • ${order.total.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
