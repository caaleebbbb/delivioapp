import { useAuth } from "@/hooks/useAuth";
import RoleAuthPage from "@/components/RoleAuthPage";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const { signOut } = useAuth();

  return (
    <RoleAuthPage role="admin">
      <div className="max-w-[1180px] mx-auto px-4 md:px-5">
        <header className="flex justify-between items-center gap-4 py-5 pb-10">
          <a href="/">
            <h1 className="text-2xl font-extrabold flex gap-1">
              <span className="text-primary">Deli</span>
              <span className="text-secondary">vio</span>
            </h1>
            <p className="text-muted-foreground text-xs">Admin Portal</p>
          </a>
          <span className="px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-extrabold">Admin</span>
        </header>
        <AdminDashboard onLogout={signOut} />
      </div>
    </RoleAuthPage>
  );
}
