const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const money = (v: number) => brl.format(v);

export const qtyFmt = (v: number, unit: string) =>
  `${unit === "kg" ? v.toFixed(1).replace(".", ",") : Math.round(v)} ${unit}`;

export function elapsed(from: number, now: number) {
  const m = Math.max(0, Math.floor((now - from) / 60000));
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${String(m % 60).padStart(2, "0")}`;
}

export const timeFmt = (t: number) =>
  new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const uid = () => Math.random().toString(36).slice(2, 10);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const STORE = {
  name: "Batatas da Val",
  slogan: "Crocante por fora, cremosa por dentro!",
  city: "Três Cachoeiras - RS",
  hours: "Qua a Dom a partir das 19:30",
  hoursLong: "De quarta a domingo a partir das 19:30",
  phone: "(51) 9687-0865",
  whatsapp: "555196870865",
  instagram: "@batatasval",
  instagramUrl: "https://instagram.com/batatasval",
};
