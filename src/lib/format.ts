const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const money = (v: number) => brl.format(v);

/** "32,00" — sem o símbolo, para inputs. */
export const moneyInput = (v: number) => v.toFixed(2).replace(".", ",");

/** Lê "32,50" ou "32.50" e devolve 32.5 (NaN quando inválido). */
export const parseMoney = (v: string) => Number(String(v).replace(/\s/g, "").replace(",", "."));

export const qtyFmt = (v: number, unit: string) =>
  `${unit === "kg" || unit === "l" ? v.toFixed(1).replace(".", ",") : Math.round(v)} ${unit}`;

export function elapsed(from: number, now: number) {
  const m = Math.max(0, Math.floor((now - from) / 60000));
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h${String(m % 60).padStart(2, "0")}`;
}

export const timeFmt = (t: number) =>
  new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const dateFmt = (t: number) =>
  new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export const dateTimeFmt = (t: number) => `${dateFmt(t)} ${timeFmt(t)}`;

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Id legível e estável a partir de um nome ("Torres de Batata" → "torres-de-batata"). */
export const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Texto sem acento e em minúsculas, para buscas. */
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Link do WhatsApp a partir do número salvo nas configurações. */
export const waLink = (whatsapp: string, text?: string) =>
  `https://wa.me/${onlyDigits(whatsapp)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const instagramUrl = (handle: string) =>
  `https://instagram.com/${handle.replace(/^@/, "").trim()}`;

/** Converte uma matriz de linhas em CSV com BOM (abre certo no Excel brasileiro). */
export function toCSV(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
