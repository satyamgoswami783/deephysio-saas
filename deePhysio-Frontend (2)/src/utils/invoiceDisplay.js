/**
 * Human-facing invoice reference from API (invoice_number) with legacy fallback.
 * @param {{ invoice_number?: string | null, id?: string } | null | undefined} inv
 * @param {string} [rawId] optional uuid when inv is partial
 */
export function getInvoiceDisplayNumber(inv, rawId) {
  const num = inv?.invoice_number;
  if (num != null && String(num).trim() !== '') return String(num).trim();
  const id = rawId ?? inv?.id;
  if (!id) return '--';
  const firstChunk = String(id).split('-')[0] || String(id).slice(0, 8);
  return `INV-${firstChunk.toUpperCase()}`;
}
