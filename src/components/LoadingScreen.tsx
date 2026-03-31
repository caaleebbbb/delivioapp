import delivioLogo from "@/assets/delivio-logo.png";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background animate-fade-in">
      <img
        src={delivioLogo}
        alt="Delivio"
        className="w-32 h-32 md:w-40 md:h-40 object-contain animate-pulse"
      />
      <div className="mt-6 flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
