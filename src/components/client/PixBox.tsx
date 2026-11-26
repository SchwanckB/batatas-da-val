"use client";

import { Check, Copy, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Press } from "@/components/ui/Press";
import { money } from "@/lib/format";

interface PixData {
  payload: string;
  svg: string;
  total: number;
  key: string;
  name: string;
}

/**
 * Pix do pedido: QR Code e "copia e cola" gerados no servidor a partir da
 * chave cadastrada no painel — o navegador nunca monta o código.
 */
export function PixBox({ token }: { token: string }) {
  const [data, setData] = useState<PixData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/pedidos/${token}/pix`, { cache: "no-store" });
        const body = (await res.json()) as PixData & { error?: string };
        if (!alive) return;
        if (!res.ok) setError(body.error ?? "Não foi possível gerar o Pix.");
        else setData(body);
      } catch {
        if (alive) setError("Sem conexão para gerar o Pix.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Copie o código manualmente: seu navegador bloqueou a área de transferência.");
    }
  };

  if (error)
    return (
      <div className="rounded-control border border-line bg-surface p-4">
        <p className="text-sm font-bold text-white">Pagamento por Pix</p>
        <p className="mt-1 text-small text-zinc-400">{error}</p>
      </div>
    );

  return (
    <div className="rounded-control border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <QrCode className="h-4 w-4 text-amber-400" aria-hidden /> Pague por Pix
      </p>

      {!data ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="skeleton h-40 w-40 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-32 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-md bg-white p-1.5 sm:mx-0"
            // SVG gerado no servidor pela biblioteca de QR Code
            dangerouslySetInnerHTML={{ __html: data.svg }}
            role="img"
            aria-label="QR Code do Pix"
          />
          <div className="min-w-0 flex-1">
            <p className="text-small text-zinc-400">Valor</p>
            <p className="text-xl font-bold tnum text-white">{money(data.total)}</p>
            <p className="mt-2 text-small text-zinc-400">Recebedor</p>
            <p className="truncate text-small font-semibold text-zinc-100">{data.name}</p>
            <Press variant="panel" className="mt-3 h-11 w-full text-sm" onClick={copy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#7fd79a]" aria-hidden /> Código copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden /> Copiar código Pix
                </>
              )}
            </Press>
            <p className="mt-2 text-2xs leading-relaxed text-zinc-500">
              Abra o aplicativo do banco, escolha Pix e aponte para o QR Code (ou cole o código). Depois manda o
              comprovante no WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
