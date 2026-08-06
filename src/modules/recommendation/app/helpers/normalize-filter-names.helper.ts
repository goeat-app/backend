const FOOD_TYPE_ALIASES: Record<string, string> = {
  Lanche: 'Sanduíches',
  Vegetariana: 'Vegetariano',
  'Frutos do mar': 'Frutos do Mar',
};

const PLACE_TYPE_ALIASES: Record<string, string> = {
  'Fast-food': 'Fast Food',
  Cafeteria: 'Café',
};

function normalizeNames(
  names: string[],
  aliases: Record<string, string>,
): string[] {
  return names.map((name) => aliases[name] ?? name);
}

export function normalizeFoodTypeNames(names: string[]): string[] {
  return normalizeNames(names, FOOD_TYPE_ALIASES);
}

export function normalizePlaceTypeNames(names: string[]): string[] {
  return normalizeNames(names, PLACE_TYPE_ALIASES);
}
