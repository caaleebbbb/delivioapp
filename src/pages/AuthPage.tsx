import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Role = "restaurant" | "customer" | "driver";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const metadata: Record<string, string> = { role: signupRole };
    if (signupRole === "restaurant") {
      metadata.business_name = businessName;
    } else {
      metadata.full_name = fullName;
    }
    if (signupRole === "driver") {
      metadata.vehicle = vehicle;
    }
    const { error } = await signUp(signupEmail, signupPassword, metadata);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Account created successfully!");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start animate-fade-in">
        {/* Left - Hero */}
        <div className="space-y-6 pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            One app for{" "}
            <span className="text-secondary">restaurants</span>,{" "}
            customers, and drivers.
          </h1>
          <p className="text-muted-foreground text-lg">
            Delivio supports the full delivery flow: restaurants build menus,
            customers place orders, and drivers complete deliveries.
          </p>
        </div>

        {/* Right - Auth Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                {success}
              </div>
            )}

            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Signing in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
                  {(["restaurant", "customer", "driver"] as Role[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setSignupRole(role)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-bold capitalize transition-colors ${
                        signupRole === role
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  {signupRole === "restaurant" ? (
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>{signupRole === "driver" ? "Driver Name" : "Full Name"}</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  )}
                  {signupRole === "driver" && (
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Sedan, scooter, bike..." required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" variant="warning" className="w-full" disabled={submitting}>
                    {submitting ? "Creating..." : `Create ${signupRole.charAt(0).toUpperCase() + signupRole.slice(1)} Account`}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
