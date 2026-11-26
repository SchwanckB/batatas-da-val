export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0A0A0C]">
      <div className="orb absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] rounded-full bg-amber-500/[0.13] blur-[120px]" />
      <div
        className="orb absolute -right-[15%] top-[25%] h-[45vmax] w-[45vmax] rounded-full bg-red-600/[0.11] blur-[130px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="orb absolute bottom-[-20%] left-[20%] h-[40vmax] w-[40vmax] rounded-full bg-orange-500/[0.08] blur-[120px]"
        style={{ animationDelay: "-11s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,#0A0A0C_75%)] opacity-60" />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
