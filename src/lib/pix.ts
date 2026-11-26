/**
 * BR Code (Pix "copia e cola") estático com valor — padrão EMV®QRCPS do Banco Central.
 * Gerado só no servidor, a partir da chave cadastrada no painel.
 */

const tag = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** Maiúsculas, sem acento e sem caractere fora do permitido pelo padrão. */
const sanitize = (v: string, max: number) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .-]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max);

/** CRC16/CCITT-FALSE — exigido no campo 63 do BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixInput {
  key: string;
  name: string;
  city: string;
  amount: number;
  /** Identificador do pedido (até 25 caracteres, sem espaço). */
  txid?: string;
}

/** Retorna a string do "copia e cola". */
export function pixPayload({ key, name, city, amount, txid }: PixInput): string {
  const merchant = tag("00", "br.gov.bcb.pix") + tag("01", key.trim());
  const reference = sanitize(txid ?? "***", 25).replace(/ /g, "") || "***";

  const body =
    tag("00", "01") +
    // Campo 01 omitido: QR estático (o valor já vai no campo 54).
    tag("26", merchant) +
    tag("52", "0000") +
    tag("53", "986") +
    (amount > 0 ? tag("54", amount.toFixed(2)) : "") +
    tag("58", "BR") +
    tag("59", sanitize(name, 25) || "RECEBEDOR") +
    tag("60", sanitize(city, 15) || "BRASIL") +
    tag("62", tag("05", reference));

  const partial = `${body}6304`;
  return `${partial}${crc16(partial)}`;
}
