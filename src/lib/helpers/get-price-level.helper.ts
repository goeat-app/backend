/**
 * Converte o preço médio em uma escala de 1-5
 * 1 = Muito barato (até R$ 30)
 * 2 = Barato (R$ 30-50)
 * 3 = Médio (R$ 50-80)
 * 4 = Caro (R$ 80-120)
 * 5 = Muito caro (acima de R$ 120)
 */
export function getPriceLevel(averagePrice: number): number {
  if (averagePrice <= 30) return 1;
  if (averagePrice <= 50) return 2;
  if (averagePrice <= 80) return 3;
  if (averagePrice <= 120) return 4;
  return 5;
}