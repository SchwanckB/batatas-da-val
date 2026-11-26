import type { DayHours, StoreSettings, Weekday } from "./types";

export const TZ = "America/Sao_Paulo";

export const DAY_NAMES: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export const DAY_SHORT: Record<Weekday, string> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sáb",
};

/** Ordem de exibição começando na segunda (como o brasileiro lê a semana). */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Dia da semana e minutos desde a meia-noite no fuso da loja. */
export function storeClock(at: number = Date.now()): { weekday: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(at));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = Math.max(0, WD.indexOf(get("weekday"))) as Weekday;
  const hour = Number(get("hour")) % 24;
  return { weekday, minutes: hour * 60 + Number(get("minute")) };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Horário que vira o dia seguinte (ex.: 19:30 → 00:30). */
const crossesMidnight = (d: DayHours) => toMinutes(d.to) <= toMinutes(d.from);

const prevDay = (w: Weekday) => (((w + 6) % 7) as Weekday);

/** Só o que o cálculo de horário precisa (serve para o estado público também). */
export type StoreSchedule = Pick<StoreSettings, "hours" | "paused">;

export interface OpenStatus {
  /** Aceita pedidos agora. */
  open: boolean;
  reason: "aberto" | "fechado" | "pausado";
  /** "Aberto até 23:30" / "Abrimos hoje às 19:30" / "Abrimos sábado às 19:30". */
  label: string;
  /** Fecha às (quando aberto). */
  closesAt?: string;
  /** Próxima abertura (quando fechado). */
  opensAt?: string;
  opensWeekday?: Weekday;
}

/** Status de atendimento considerando o fuso da loja e a pausa manual. */
export function openStatus(settings: StoreSchedule, at: number = Date.now()): OpenStatus {
  const { weekday, minutes } = storeClock(at);
  const today = settings.hours[weekday];
  const yesterday = settings.hours[prevDay(weekday)];

  let closesAt: string | undefined;
  // Continuação da noite anterior (fechamos depois da meia-noite)
  if (yesterday?.open && crossesMidnight(yesterday) && minutes < toMinutes(yesterday.to)) {
    closesAt = yesterday.to;
  } else if (today?.open) {
    const from = toMinutes(today.from);
    const end = crossesMidnight(today) ? 1440 : toMinutes(today.to);
    if (minutes >= from && minutes < end) closesAt = today.to;
  }

  if (closesAt) {
    if (settings.paused) return { open: false, reason: "pausado", label: "Pedidos pausados", closesAt };
    return { open: true, reason: "aberto", label: `Aberto até ${closesAt}`, closesAt };
  }

  const next = nextOpening(settings, at);
  return {
    open: false,
    reason: "fechado",
    label: next ? `Abrimos ${next.when} às ${next.from}` : "Fechado",
    opensAt: next?.from,
    opensWeekday: next?.weekday,
  };
}

/** Próxima abertura dentro de 7 dias. */
export function nextOpening(
  settings: StoreSchedule,
  at: number = Date.now(),
): { weekday: Weekday; from: string; when: string } | null {
  const { weekday, minutes } = storeClock(at);
  for (let i = 0; i < 8; i++) {
    const w = ((weekday + i) % 7) as Weekday;
    const d = settings.hours[w];
    if (!d?.open) continue;
    if (i === 0 && minutes >= toMinutes(d.from)) continue;
    const when = i === 0 ? "hoje" : i === 1 ? "amanhã" : DAY_NAMES[w].toLowerCase();
    return { weekday: w, from: d.from, when };
  }
  return null;
}

/** Dias seguidos com o mesmo horário viram uma linha só: "qua a dom 19:30–23:30". */
export function hoursLines(settings: StoreSchedule): string[] {
  const groups: { days: Weekday[]; h: DayHours }[] = [];
  for (const w of WEEK_ORDER) {
    const d = settings.hours[w];
    if (!d?.open) continue;
    const last = groups[groups.length - 1];
    if (last && last.h.from === d.from && last.h.to === d.to && WEEK_ORDER.indexOf(w) === WEEK_ORDER.indexOf(last.days[last.days.length - 1]) + 1) {
      last.days.push(w);
    } else {
      groups.push({ days: [w], h: d });
    }
  }
  if (!groups.length) return ["Horários a definir"];
  return groups
    .map((g) => {
      const first = DAY_NAMES[g.days[0]];
      const last = DAY_NAMES[g.days[g.days.length - 1]];
      const span =
        g.days.length === 1
          ? first
          : g.days.length === 2
            ? `${first} e ${last.toLowerCase()}`
            : `${first} a ${last.toLowerCase()}`;
      return `${span}, das ${g.h.from} às ${g.h.to}`;
    });
}

/** Mesma informação em uma linha, para espaços apertados. */
export const hoursSummary = (settings: StoreSchedule) => hoursLines(settings).join(". ");

/** openingHoursSpecification do schema.org (JSON-LD). */
export function openingHoursSchema(settings: StoreSchedule) {
  const EN: Record<Weekday, string> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return WEEK_ORDER.filter((w) => settings.hours[w]?.open).map((w) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${EN[w]}`,
    opens: settings.hours[w].from,
    closes: settings.hours[w].to,
  }));
}

/** Previsão de entrega: preparo + deslocamento do bairro. */
export const etaRange = (prepMinutes: number, etaMin: number, etaMax: number) =>
  `${prepMinutes + etaMin}–${prepMinutes + etaMax} min`;
