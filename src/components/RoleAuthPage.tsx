import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoleAuthPageProps {
  role: "restaurant" | "driver" | "admin";
  children: React.ReactNode;
}

export default function RoleAuthPage({ role, children }: RoleAuthPageProps) {
  const { profile, loading, signIn, signUp, signOut } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If logged in with the correct role, show the dashboard
  if (profile && profile.role === role) {
    return <>{children}</>;
  }

  // If logged in with wrong role, show message
  if (profile && profile.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">
              You're logged in as <strong className="text-foreground capitalize">{profile.role}</strong>, but this page is for <strong className="text-foreground capitalize">{role}s</strong>.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="destructive" className="flex-1" onClick={signOut}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    const metadata: Record<string, string> = { role };
    if (role === "restaurant") metadata.business_name = businessName;
    else metadata.full_name = fullName;
    if (role === "driver") metadata.vehicle = vehicle;
    const { error } = await signUp(signupEmail, signupPassword, metadata);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  const roleLabel = role === "admin" ? "Owner / Admin" : role.charAt(0).toUpperCase() + role.slice(1);
  const hideSignup = role === "admin";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold flex items-center justify-center gap-1">
            <span className="text-primary">Deli</span>
            <span className="text-secondary">vio</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{roleLabel} Portal</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>{roleLabel} Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            {hideSignup ? (
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
            ) : (
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
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {role === "restaurant" ? (
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>{role === "driver" ? "Driver Name" : "Full Name"}</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                      </div>
                    )}
                    {role === "driver" && (
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
                      {submitting ? "Creating..." : `Create ${roleLabel} Account`}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            <div className="mt-4 text-center">
              <a href="/" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                ← Back to home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
