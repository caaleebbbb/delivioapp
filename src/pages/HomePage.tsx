import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UtensilsCrossed, Truck, Shield } from "lucide-react";
import delivioLogo from "@/assets/delivio-logo.png";

const roles = [
  {
    title: "Order Food",
    description: "Browse restaurants and place orders for delivery",
    icon: ShoppingBag,
    href: "/order",
    variant: "warning" as const,
  },
  {
    title: "Restaurant",
    description: "Manage your menu and handle incoming orders",
    icon: UtensilsCrossed,
    href: "/restaurant",
    variant: "default" as const,
  },
  {
    title: "Driver",
    description: "Claim deliveries and complete orders",
    icon: Truck,
    href: "/driver",
    variant: "outline" as const,
  },
  {
    title: "Owner / Admin",
    description: "Oversee all restaurants, users, and orders",
    icon: Shield,
    href: "/admin",
    variant: "outline" as const,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-10 flex flex-col items-center">
          <img src={delivioLogo} alt="Delivio" className="w-24 h-24 md:w-32 md:h-32 object-contain mb-2" />
          <h1 className="text-5xl font-extrabold flex items-center justify-center gap-1">
            <span className="text-primary">Deli</span>
            <span className="text-secondary">vio</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Local pickup & delivery</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Link key={role.href} to={role.href}>
              <Card className="h-full border-border/50 bg-card/80 backdrop-blur hover:border-primary/40 transition-all cursor-pointer group">
                <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <role.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h2 className="text-lg font-bold">{role.title}</h2>
                  <p className="text-muted-foreground text-sm">{role.description}</p>
                  <Button variant={role.variant} size="sm" className="mt-2 w-full">
                    {role.title === "Order Food" ? "Start Ordering" : `Go to ${role.title}`}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
