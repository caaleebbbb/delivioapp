import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

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

function formatDate(ts: string) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DriverDashboard({ onLogout }: { onLogout: () => void }) {
  const { profile } = useAuth();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const lastAnnouncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAvailable) {
      lastAnnouncedRef.current = null;
      return;
    }

    const newest = availableOrders[0];

    if (newest && newest.id !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = newest.id;
      playNotificationDing();
      toast("New delivery request", {
        description: `${newest.restaurant_name} • ${formatDate(newest.created_at)}`,
      });
    }
  }, [availableOrders, isAvailable]);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;

    const { data: mineData, error: mineError } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", profile.id)
      .order("created_at", { ascending: false });

    if (mineError) {
      console.error("Failed to load driver orders", mineError);
    } else {
      setMyOrders((mineData || []) as Order[]);
    }

    const { data: openData, error: openError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "ready")
      .is("driver_id", null)
      .order("created_at", { ascending: false });

    if (openError) {
      console.error("Failed to load ready orders", openError);
      return;
    }

    setAvailableOrders((openData || []) as Order[]);
  }, [profile]);

  useEffect(() => {
    void fetchOrders();

    const channel = supabase
      .channel(`driver-orders-rt-${profile?.id || "guest"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchOrders]);

  useEffect(() => {
    if (!profile || !isAvailable) return;

    const intervalId = window.setInterval(() => {
      void fetchOrders();
    }, REFRESH_INTERVAL_MS);

    const handleFocus = () => {
      void fetchOrders();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchOrders();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAvailable, profile, fetchOrders]);

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
      void fetchOrders();
    }
  };

  const activeOrders = useMemo(
    () => myOrders.filter((o) => o.status === "out-for-delivery"),
    [myOrders]
  );
  const completedOrders = useMemo(
    () => myOrders.filter((o) => o.status === "delivered"),
    [myOrders]
  );

  const acceptOrder = async (orderId: string) => {
    if (!profile) return;

    setAcceptingId(orderId);

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "out-for-delivery",
        driver_id: profile.id,
        driver_name: profile.full_name || "Driver",
        offered_to_driver_id: null,
        offer_expires_at: null,
      })
      .eq("id", orderId)
      .eq("status", "ready")
      .is("driver_id", null)
      .select("id")
      .maybeSingle();

    setAcceptingId(null);

    if (error) {
      toast.error("Could not accept this order.");
      await fetchOrders();
      return;
    }

    if (!data) {
      toast.error("Another driver got this one first.");
      await fetchOrders();
      return;
    }

    toast.success("Order accepted.");
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-extrabold">Driver Delivery Hub</h2>
          <p className="text-muted-foreground">Go online to see live delivery requests. First to accept gets the order.</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <p className="text-muted-foreground text-sm">Available</p>
            <p className="text-2xl font-extrabold">{isAvailable ? availableOrders.length : 0}</p>
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
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold">Available Orders</h3>
          <span className="text-muted-foreground text-sm">First to accept wins</span>
        </div>
        {!isAvailable ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Go online to see live delivery requests.
            </CardContent>
          </Card>
        ) : availableOrders.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Waiting for new delivery requests...
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {availableOrders.map((order) => (
              <Card key={order.id} className="border-primary/40">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{order.restaurant_name}</span>
                    <Badge className="bg-success/15 text-success border-0">Ready</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">Customer: {order.customer_name}</p>
                  <p className="text-sm">{order.address}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                    <span className="font-bold">${order.total.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="warning"
                    className="w-full text-lg font-extrabold"
                    disabled={acceptingId === order.id}
                    onClick={() => acceptOrder(order.id)}
                  >
                    {acceptingId === order.id ? "Accepting..." : "Accept Order"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-extrabold">My Active Deliveries</h3>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              No active deliveries right now.
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
