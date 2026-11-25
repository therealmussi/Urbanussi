/** Formattazione numerica in stile italiano (separatore migliaia "." e decimale ","). */
export function fmtNumero(v: number | null | undefined, decimali = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return v.toLocaleString('it-IT', { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
}
