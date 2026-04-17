import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";

const OFFER_DURATION_MS = 20_000;
const REFRESH_INTERVAL_MS = 4_000;

let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (_audioCtx.state === "suspended") {
    void _audioCtx.resume();
  }

  return _audioCtx;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    try {
      getAudioContext();
    } catch {
      return;
    }

    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function playNotificationDing() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880 + i * 220;

      const startAt = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.45, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startAt + 0.25);

      osc.start(startAt);
      osc.stop(startAt + 0.25);
    }
  } catch {
    // Ignore audio failures; toast still provides feedback.
  }
}

interface Order {
  id: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  address: string;
  total: number;
  created_at: string;
  driver_id: string | null;
  driver_name: string | null;
  offered_to_driver_id: string | null;
  offer_expires_at: string | null;
}

function getRemainingOfferMs(offerExpiresAt: string | null) {
  if (!offerExpiresAt) return 0;
  return new Date(offerExpiresAt).getTime() - Date.now();
}

function hasActiveOffer(order: Order, driverProfileId: string) {
  return (
    order.status === "ready" &&
    order.offered_to_driver_id === driverProfileId &&
    order.driver_id === null &&
    getRemainingOfferMs(order.offer_expires_at) > 0
  );
}

function needsOfferRepair(order: Order) {
  return (
    order.status === "ready" &&
    order.driver_id === null &&
    (!order.offered_to_driver_id || getRemainingOfferMs(order.offer_expires_at) <= 0)
  );
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
  const [timeLeft, setTimeLeft] = useState(() => {
    const secondsLeft = Math.ceil(getRemainingOfferMs(order.offer_expires_at) / 1000);
    return secondsLeft > 0 ? secondsLeft : OFFER_DURATION_MS / 1000;
  });
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!order.offer_expires_at) return;
    const expiresAt = new Date(order.offer_expires_at).getTime();

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, expiresAt - Date.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      setTimeLeft(remainingSeconds);
      setProgress((remainingMs / OFFER_DURATION_MS) * 100);

      if (remainingMs <= 0) {
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
  const prevOfferedRef = useRef<string | null>(null);
  const repairingOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (offeredOrder && offeredOrder.id !== prevOfferedRef.current) {
      playNotificationDing();
      toast("New delivery request", {
        description: `${offeredOrder.restaurant_name} • ${formatDate(offeredOrder.created_at)}`,
      });
    }

    prevOfferedRef.current = offeredOrder?.id || null;
  }, [offeredOrder]);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(`offered_to_driver_id.eq.${profile.id},driver_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load driver orders", error);
      return;
    }

    const typed = (data || []) as Order[];
    setOrders(typed);
    setOfferedOrder(typed.find((order) => hasActiveOffer(order, profile.id)) || null);
  }, [profile]);

  const repairStaleOffers = useCallback(async () => {
    if (!profile || !isAvailable) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "ready")
      .is("driver_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to scan ready orders", error);
      return;
    }

    const staleOrder = (data as Order[]).find(
      (order) => needsOfferRepair(order) && !repairingOrdersRef.current.has(order.id)
    );

    if (!staleOrder) return;

    repairingOrdersRef.current.add(staleOrder.id);

    const { error: invokeError } = await supabase.functions.invoke("reassign-order", {
      body: { order_id: staleOrder.id },
    });

    repairingOrdersRef.current.delete(staleOrder.id);

    if (invokeError) {
      console.error("Failed to reassign ready order", invokeError);
    }
  }, [isAvailable, profile]);

  const syncOrders = useCallback(async () => {
    await repairStaleOffers();
    await fetchOrders();
  }, [fetchOrders, repairStaleOffers]);

  useEffect(() => {
    void syncOrders();

    const channel = supabase
      .channel(`driver-orders-rt-${profile?.id || "guest"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void syncOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, syncOrders]);

  useEffect(() => {
    if (!profile || !isAvailable) return;

    const intervalId = window.setInterval(() => {
      void syncOrders();
    }, REFRESH_INTERVAL_MS);

    const handleFocus = () => {
      void syncOrders();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncOrders();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAvailable, profile, syncOrders]);

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

    try {
      getAudioContext();
    } catch {
      // Ignore audio prime failures.
    }

    setIsAvailable(val);

    const { error } = await supabase.from("profiles").update({ is_available: val } as any).eq("id", profile.id);

    if (error) {
      setIsAvailable(!val);
      toast.error("Could not update your driver status.");
      return;
    }

    toast.success(val ? "You’re online and ready for orders." : "You’re offline.");

    if (val) {
      void syncOrders();
    }
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

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "out-for-delivery",
        driver_id: profile.id,
        driver_name: profile.full_name || "Driver",
        offered_to_driver_id: null,
        offer_expires_at: null,
      })
      .eq("id", offeredOrder.id)
      .eq("status", "ready")
      .eq("offered_to_driver_id", profile.id)
      .is("driver_id", null)
      .select("id")
      .maybeSingle();

    if (error) {
      toast.error("Could not accept this order.");
      await fetchOrders();
      return;
    }

    if (!data) {
      toast.error("This order was already taken or expired.");
      await fetchOrders();
      return;
    }

    setOfferedOrder(null);
    toast.success("Order accepted.");
    await fetchOrders();
  };

  const declineOrder = async () => {
    if (!offeredOrder || !profile) return;

    const orderId = offeredOrder.id;
    setOfferedOrder(null);

    const { error } = await supabase.functions.invoke("reassign-order", {
      body: { order_id: orderId, declined_driver_id: profile.id },
    });

    if (error) {
      toast.error("Could not pass this order to another driver.");
    }

    await fetchOrders();
  };

  const completeOrder = async (orderId: string) => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId)
      .eq("driver_id", profile.id)
      .eq("status", "out-for-delivery")
      .select("id")
      .maybeSingle();

    if (error) {
      toast.error("Could not mark this order as delivered.");
      return;
    }

    if (!data) {
      toast.error("This order is no longer active.");
      await fetchOrders();
      return;
    }

    toast.success("Order marked as delivered.");
    await fetchOrders();
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
