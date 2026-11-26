/**
 * Fundo da página: preto quente com um halo dourado parado no topo e uma
 * textura bem fraca de papel. Sem bolhas flutuantes — elas eram o maior
 * cacoete de "site feito por IA" do visual anterior.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute -top-[22vmax] left-1/2 h-[46vmax] w-[86vmax] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(245,165,36,0.16),rgba(245,165,36,0.04)_45%,transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[linear-gradient(to_top,rgba(10,8,6,0.9),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
