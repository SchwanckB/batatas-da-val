"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { cn } from "@/lib/format";
import type { OrderRating } from "@/lib/types";

/** Avaliação do pedido entregue: estrelas + um comentário opcional. */
export function RatingBox({
  rating,
  onSend,
}: {
  rating?: OrderRating;
  onSend: (stars: number, comment: string) => Promise<string | null>;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (rating || done) {
    const value = rating?.stars ?? stars;
    return (
      <div className="rounded-control border border-line bg-surface p-4 text-center">
        <p className="text-sm font-bold text-white">Avaliação enviada</p>
        <div className="mt-2 flex justify-center gap-1" aria-label={`${value} de 5 estrelas`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn("h-5 w-5", i <= value ? "fill-gold text-gold" : "text-zinc-600")}
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-2 text-small text-zinc-400">Obrigado! Isso ajuda a Val a acertar o ponto.</p>
      </div>
    );
  }

  return (
    <div className="rounded-control border border-line bg-surface p-4">
      <p className="text-sm font-bold text-white">Como foi o pedido?</p>
      <div className="mt-2.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.85 }}
            transition={spring}
            onClick={() => setStars(i)}
            aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`}
            className="p-1"
          >
            <Star
              className={cn("h-7 w-7 transition-colors", i <= stars ? "fill-gold text-gold" : "text-zinc-600")}
              aria-hidden
            />
          </motion.button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder="Quer contar alguma coisa para a cozinha? (opcional)"
        className="mt-3 w-full resize-none rounded-control border border-line bg-ink px-3.5 py-2.5 text-small text-white placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
      />
      {error && <p className="mt-1.5 text-small font-medium text-brasa">{error}</p>}
      <Press
        variant="cta"
        className="mt-3 h-11 w-full"
        disabled={stars === 0 || sending}
        onClick={async () => {
          setSending(true);
          setError("");
          const err = await onSend(stars, comment.trim());
          setSending(false);
          if (err) setError(err);
          else setDone(true);
        }}
      >
        {sending ? "Enviando…" : "Enviar avaliação"}
      </Press>
    </div>
  );
}
