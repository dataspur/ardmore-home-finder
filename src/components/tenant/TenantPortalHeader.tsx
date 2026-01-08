import logo from "@/assets/logo.svg";

export function TenantPortalHeader() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-gradient-hero text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="Precision Capital" 
              className="h-10 brightness-0 invert" 
            />
            <div className="hidden sm:block border-l border-white/30 pl-4">
              <p className="text-sm font-medium opacity-90">Resident Payment Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Today's Date</p>
            <p className="text-sm font-medium">{currentDate}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
