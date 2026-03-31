import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/AuthPage";
import MenuEditor from "@/components/MenuEditor";
import RestaurantOrders from "@/components/RestaurantOrders";
import CustomerDashboard from "@/components/CustomerDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function RestaurantHome({ onOpenMenu, onOpenOrders, onLogout }: {
  onOpenMenu: () => void;
  onOpenOrders: () => void;
  onLogout: () => void;
}) {
  const { profile } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-3xl font-extrabold mb-2">Welcome back, {profile?.business_name}!</h2>
          <p className="text-muted-foreground mb-6">Logged in as {profile?.role}</p>
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={onOpenMenu} className="w-full">Open Menu Editor</Button>
            <Button variant="warning" onClick={onOpenOrders} className="w-full">View Orders</Button>
            <Button variant="outline" onClick={onLogout} className="w-full">Log Out</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-muted-foreground text-sm">Restaurant Portal</p>
          <p className="text-xl font-extrabold text-success">Live</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-muted-foreground text-sm">Menu Management</p>
          <p className="text-xl font-extrabold">Ready</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <p className="text-muted-foreground text-sm">Order Tracking</p>
          <p className="text-xl font-extrabold">Ready</p>
        </CardContent></Card>
      </div>
    </div>
  );
}

export default function Index() {
  const { profile, loading, signOut } = useAuth();
  const [view, setView] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) return <AuthPage />;

  const handleLogout = async () => {
    await signOut();
    setView("dashboard");
  };

  let content;

  if (profile.role === "admin") {
    content = <AdminDashboard onLogout={handleLogout} />;
  } else if (profile.role === "restaurant") {
    if (view === "menu-editor") {
      content = <MenuEditor onBack={() => setView("dashboard")} />;
    } else if (view === "orders") {
      content = <RestaurantOrders onBack={() => setView("dashboard")} />;
    } else {
      content = (
        <RestaurantHome
          onOpenMenu={() => setView("menu-editor")}
          onOpenOrders={() => setView("orders")}
          onLogout={handleLogout}
        />
      );
    }
  } else if (profile.role === "customer") {
    content = <CustomerDashboard onLogout={handleLogout} />;
  } else if (profile.role === "driver") {
    content = <DriverDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="max-w-[1180px] mx-auto p-5">
      <header className="flex justify-between items-center gap-4 py-5 pb-10">
        <div>
          <h1 className="text-2xl font-extrabold flex gap-1">
            <span className="text-primary">Deli</span>
            <span className="text-secondary">vio</span>
          </h1>
          <p className="text-muted-foreground text-xs">Local pickup & delivery</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-extrabold capitalize">
          {profile.role}
        </span>
      </header>
      {content}
    </div>
  );
}
