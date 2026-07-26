/**
 * Normaliza telefone para armazenamento: apenas dígitos, sem máscara.
 * Remove código do país 55 quando o número brasileiro vier em formato internacional.
 */
export function normalizePhoneNumber(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits.slice(2);
  }

  return digits;
}
