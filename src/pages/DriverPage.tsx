import { useAuth } from "@/hooks/useAuth";
import RoleAuthPage from "@/components/RoleAuthPage";
import DriverDashboard from "@/components/DriverDashboard";
import delivioLogo from "@/assets/delivio-logo.png";

export default function DriverPage() {
  const { signOut } = useAuth();

  return (
    <RoleAuthPage role="driver">
      <div className="max-w-[1180px] mx-auto px-4 md:px-5">
        <header className="flex justify-between items-center gap-4 py-5 pb-10">
          <a href="/" className="flex items-center gap-2">
            <img src={delivioLogo} alt="Delivio" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-extrabold flex gap-1">
                <span className="text-primary">Deli</span>
                <span className="text-secondary">vio</span>
              </h1>
              <p className="text-muted-foreground text-xs">Driver Portal</p>
            </div>
          </a>
          <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-extrabold">Driver</span>
        </header>
        <DriverDashboard onLogout={signOut} />
      </div>
    </RoleAuthPage>
  );
}
