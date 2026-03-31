import CustomerDashboard from "@/components/CustomerDashboard";

export default function OrderPage() {
  return (
    <div className="max-w-[1180px] mx-auto p-5">
      <header className="flex justify-between items-center gap-4 py-5 pb-10">
        <a href="/" className="block">
          <h1 className="text-2xl font-extrabold flex gap-1">
            <span className="text-primary">Deli</span>
            <span className="text-secondary">vio</span>
          </h1>
          <p className="text-muted-foreground text-xs">Local pickup & delivery</p>
        </a>
      </header>
      <CustomerDashboard />
    </div>
  );
}
