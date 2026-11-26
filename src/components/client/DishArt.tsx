import { useId } from "react";
import type { DishArtSpec, Topping } from "@/lib/types";

/**
 * Ilustrações vetoriais dos produtos, no estilo da marca (caixa preta com friso dourado,
 * embalagem vermelha das porções). Consistentes em qualquer sistema — ao contrário de emojis.
 */
export function DishArt({ spec, className, steam = true }: { spec: DishArtSpec; className?: string; steam?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  return (
    <svg viewBox="22 4 156 152" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id={id("fry")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9A23B" />
          <stop offset=".45" stopColor="#FFDA7B" />
          <stop offset="1" stopColor="#E39A2E" />
        </linearGradient>
        <linearGradient id={id("box")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E1C11" />
          <stop offset="1" stopColor="#100905" />
        </linearGradient>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B45309" />
          <stop offset=".5" stopColor="#FCD34D" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={id("red")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F43F5E" />
          <stop offset="1" stopColor="#9F1239" />
        </linearGradient>
        <radialGradient id={id("gloss")} cx=".35" cy=".25" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="152" rx="64" ry="6" fill="#000" opacity=".45" />
      {steam && (spec.kind === "batatao" || spec.kind === "porcao") && <Steam />}

      {spec.kind === "batatao" && <Batatao spec={spec} id={id} />}
      {spec.kind === "porcao" && <Porcao spec={spec} id={id} />}
      {spec.kind === "pote" && <Pote />}
      {spec.kind === "lata" && <Lata spec={spec} id={id} />}
      {spec.kind === "garrafa" && <Garrafa spec={spec} id={id} />}
    </svg>
  );
}

type IdFn = (n: string) => string;

function Steam() {
  return (
    <g className="steam" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round">
      <path d="M80 34c-6-7 6-11 0-19" />
      <path d="M100 30c-6-7 6-11 0-19" style={{ animationDelay: ".6s" }} />
      <path d="M120 34c-6-7 6-11 0-19" style={{ animationDelay: "1.2s" }} />
    </g>
  );
}

const FRIES: [number, number, number][] = [
  // x, ângulo, topo
  [58, -24, 50], [70, -15, 40], [82, -8, 34], [94, -3, 30], [106, 4, 31], [118, 10, 35], [130, 16, 41], [142, 24, 50],
  [76, -12, 46], [100, 0, 40], [124, 13, 46],
];

function Fries({ id, base = 96 }: { id: IdFn; base?: number }) {
  return (
    <g>
      {FRIES.map(([x, a, top], i) => (
        <rect
          key={i}
          x={x - 5.5}
          y={top}
          width="11"
          height={base - top + 10}
          rx="3"
          fill={`url(#${id("fry")})`}
          stroke="#C9781A"
          strokeOpacity=".55"
          strokeWidth="1"
          transform={`rotate(${a} ${x} ${base})`}
        />
      ))}
    </g>
  );
}

const SPOTS: [number, number][] = [
  [66, 74], [78, 64], [90, 72], [102, 60], [114, 70], [126, 62], [138, 74], [72, 82], [96, 80], [120, 80], [108, 66], [84, 58], [132, 70], [144, 82],
];

function Toppings({ toppings }: { toppings: Topping[] }) {
  const main = toppings.filter((t) => t !== "ervas");
  return (
    <g>
      {main.length > 0 &&
        SPOTS.map(([x, y], i) => {
          const t = main[i % main.length];
          const r = (i * 37) % 60;
          switch (t) {
            case "carne":
              return (
                <g key={i} transform={`rotate(${r} ${x} ${y})`}>
                  <rect x={x - 4} y={y - 3.5} width="8" height="7" rx="2.5" fill="#5A2C12" />
                  <rect x={x - 2.5} y={y - 2.5} width="3" height="2" rx="1" fill="#8A4A22" />
                </g>
              );
            case "frango":
              return <path key={i} d={`M${x - 5} ${y}q3-4 6-1t5-1`} stroke="#F1D2A0" strokeWidth="2.6" fill="none" strokeLinecap="round" transform={`rotate(${r} ${x} ${y})`} />;
            case "bacon":
              return (
                <g key={i} transform={`rotate(${r} ${x} ${y})`}>
                  <rect x={x - 3.5} y={y - 3.5} width="7" height="7" rx="1.6" fill="#8E2F17" />
                  <rect x={x - 3.5} y={y - 0.6} width="7" height="1.5" fill="#E9A38A" opacity=".8" />
                </g>
              );
            case "palha":
              return <path key={i} d={`M${x - 4} ${y}h8`} stroke="#FBC75A" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${r * 3} ${x} ${y})`} />;
            case "queijo":
              return <circle key={i} cx={x} cy={y} r="3.4" fill="#FCD34D" stroke="#E7A10F" strokeWidth=".8" />;
            default:
              return null;
          }
        })}
      {toppings.includes("ervas") &&
        SPOTS.concat(SPOTS.map(([x, y]) => [x + 5, y - 4] as [number, number])).map(([x, y], i) => (
          <circle key={`e${i}`} cx={x + 3} cy={y + 2} r="1.3" fill={i % 2 ? "#4D7C0F" : "#84CC16"} />
        ))}
    </g>
  );
}

const SAUCE =
  "M46 86C42 72 56 60 70 63C76 50 96 46 104 56C114 45 134 49 137 61C152 60 160 74 154 86L154 88C154 97 147 99 146 90L144 88L128 88C128 101 119 104 119 92L118 88L92 88C92 97 85 98 85 90L84 88L66 88C66 104 57 104 57 92L56 88C50 90 46 90 46 86Z";

function Batatao({ spec, id }: { spec: Extract<DishArtSpec, { kind: "batatao" }>; id: IdFn }) {
  return (
    <g>
      <Fries id={id} base={92} />
      {/* caixa */}
      <path d="M40 86H160L149 146Q148 151 143 151H57Q52 151 51 146Z" fill={`url(#${id("box")})`} />
      <path d="M40 86H160L159 92H41Z" fill="#000" opacity=".35" />
      <rect x="36" y="81" width="128" height="8" rx="4" fill={`url(#${id("gold")})`} />
      <path d="M47 116H153" stroke={`url(#${id("gold")})`} strokeWidth="1.2" opacity=".7" />
      <path d="M49 136H151" stroke={`url(#${id("gold")})`} strokeWidth="1.2" opacity=".7" />
      <text x="100" y="129.5" textAnchor="middle" fontSize="8.5" fontWeight="800" letterSpacing="2" fill="#FBBF24" fontFamily="inherit">
        BATATAS DA VAL
      </text>
      {/* molho */}
      <path d={SAUCE} fill={spec.sauce} />
      <path d={SAUCE} fill={`url(#${id("gloss")})`} />
      {spec.sauce2 && (
        <path d="M60 74C70 64 80 80 90 70S108 60 116 72S134 64 144 76" stroke={spec.sauce2} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".95" />
      )}
      <Toppings toppings={spec.toppings} />
    </g>
  );
}

function Porcao({ spec, id }: { spec: Extract<DishArtSpec, { kind: "porcao" }>; id: IdFn }) {
  return (
    <g>
      <Fries id={id} base={86} />
      <path d="M50 74H150L136 148Q135 151 131 151H69Q65 151 64 148Z" fill={`url(#${id("red")})`} />
      <path d="M50 74H150L148 84Q100 96 52 84Z" fill="#000" opacity=".18" />
      <circle cx="100" cy="116" r="17" fill="#FDE7C2" />
      <circle cx="100" cy="116" r="17" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
      <text x="100" y="120.5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9F1239" fontFamily="inherit">
        BV
      </text>
      <path d="M58 80L68 148" stroke="#fff" strokeOpacity=".18" strokeWidth="4" strokeLinecap="round" />
      {spec.sauce && (
        <path d="M64 58C74 48 84 64 94 54S112 46 120 56S136 50 140 60" stroke={spec.sauce} strokeWidth="7" fill="none" strokeLinecap="round" />
      )}
      {spec.toppings.length > 0 && (
        <g transform="translate(0 -14)">
          <Toppings toppings={spec.toppings} />
        </g>
      )}
    </g>
  );
}

function Pote() {
  return (
    <g>
      <path d="M58 92H142L134 140Q133 148 125 148H75Q67 148 66 140Z" fill="#F8FAFC" />
      <path d="M58 92H142L140 104Q100 112 60 104Z" fill="#000" opacity=".08" />
      <ellipse cx="100" cy="92" rx="42" ry="10" fill="#E2E8F0" />
      <path d="M66 90C72 70 92 66 100 74C108 64 130 70 134 90Z" fill="#FDF3D3" />
      <path d="M78 84C84 76 94 80 100 76" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".8" />
      <circle cx="92" cy="84" r="1.4" fill="#65A30D" />
      <circle cx="110" cy="82" r="1.4" fill="#4D7C0F" />
      <circle cx="120" cy="86" r="1.4" fill="#65A30D" />
      <rect x="74" y="116" width="52" height="14" rx="7" fill="#E11D48" />
      <text x="100" y="126" textAnchor="middle" fontSize="7.5" fontWeight="800" letterSpacing="1" fill="#fff" fontFamily="inherit">
        DA CASA
      </text>
    </g>
  );
}

function Lata({ spec, id }: { spec: Extract<DishArtSpec, { kind: "lata" }>; id: IdFn }) {
  return (
    <g>
      <rect x="72" y="28" width="56" height="122" rx="9" fill={spec.color} />
      <rect x="72" y="28" width="56" height="122" rx="9" fill={`url(#${id("gloss")})`} />
      <rect x="76" y="22" width="48" height="10" rx="4" fill="#CBD5E1" />
      <rect x="84" y="20" width="32" height="4" rx="2" fill="#94A3B8" />
      <path d="M72 96C88 84 110 110 128 92" stroke="#fff" strokeWidth="5" fill="none" />
      <text x="100" y="78" textAnchor="middle" fontSize="13" fontWeight="900" letterSpacing="1" fill="#fff" fontFamily="inherit">
        {spec.label}
      </text>
      <rect x="80" y="36" width="5" height="104" rx="2.5" fill="#fff" opacity=".22" />
      {[[112, 50], [118, 118], [90, 128], [116, 136], [86, 112]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" opacity=".5" />
      ))}
    </g>
  );
}

function Garrafa({ spec, id }: { spec: Extract<DishArtSpec, { kind: "garrafa" }>; id: IdFn }) {
  const body = "M90 18H110V30C110 40 126 46 126 64V138Q126 150 114 150H86Q74 150 74 138V64C74 46 90 40 90 30Z";
  return (
    <g>
      <path d={body} fill={spec.liquid} opacity=".92" />
      <path d={body} fill={`url(#${id("gloss")})`} />
      <path d={body} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
      <rect x="88" y="10" width="24" height="12" rx="3" fill={spec.color} />
      <rect x="74" y="84" width="52" height="32" fill={spec.color} />
      <text x="100" y="104" textAnchor="middle" fontSize={spec.label.length > 5 ? 8.5 : 11} fontWeight="900" letterSpacing=".5" fill="#fff" fontFamily="inherit">
        {spec.label}
      </text>
      <rect x="80" y="54" width="5" height="88" rx="2.5" fill="#fff" opacity=".25" />
    </g>
  );
}
