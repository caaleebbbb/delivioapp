import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import RoleAuthPage from "@/components/RoleAuthPage";
import MenuEditor from "@/components/MenuEditor";
import RestaurantOrders from "@/components/RestaurantOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import delivioLogo from "@/assets/delivio-logo.png";

function RestaurantDashboard() {
  const { profile, signOut } = useAuth();
  const [view, setView] = useState("dashboard");

  const handleLogout = async () => {
    await signOut();
  };

  if (view === "menu-editor") return <MenuEditor onBack={() => setView("dashboard")} />;
  if (view === "orders") return <RestaurantOrders onBack={() => setView("dashboard")} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-3xl font-extrabold mb-2">Welcome back, {profile?.business_name}!</h2>
          <p className="text-muted-foreground mb-6">Manage your restaurant</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button onClick={() => setView("menu-editor")} className="w-full">Open Menu Editor</Button>
            <Button variant="warning" onClick={() => setView("orders")} className="w-full">View Orders</Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">Log Out</Button>
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

export default function RestaurantPage() {
  return (
    <RoleAuthPage role="restaurant">
      <div className="max-w-[1180px] mx-auto px-4 md:px-5">
        <header className="flex justify-between items-center gap-4 py-5 pb-10">
          <a href="/" className="flex items-center gap-2">
            <img src={delivioLogo} alt="Delivio" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-extrabold flex gap-1">
                <span className="text-primary">Deli</span>
                <span className="text-secondary">vio</span>
              </h1>
              <p className="text-muted-foreground text-xs">Restaurant Portal</p>
            </div>
          </a>
          <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-extrabold">Restaurant</span>
        </header>
        <RestaurantDashboard />
      </div>
    </RoleAuthPage>
  );
}
