/**
 * Utilitários de Filtragem Avançada (Datas, Textos e Colunas)
 */

export function normalizeText(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function matchTextFilter(
  value: string | number | undefined | null,
  searchTerm: string | number | undefined | null
): boolean {
  if (!searchTerm && searchTerm !== 0) return true;
  const term = normalizeText(searchTerm);
  if (!term) return true;
  const val = normalizeText(value);
  return val.includes(term);
}

/**
 * Verifica correspondência de data extremamente flexível:
 * Aceita:
 * - '01/10/2026', '01/10', '10/2026', '2026', '26'
 * - '2026-10-01', '2026-10', '10-01'
 * - 'out', 'outubro', 'out/26'
 * - Comparações numéricas sem barras ou traços ('01102026')
 */
export function matchDateFilter(
  dataValue: string | Date | undefined | null,
  searchTerm: string | undefined | null
): boolean {
  if (!searchTerm || !searchTerm.trim()) return true;
  if (!dataValue) return false;

  const search = searchTerm.trim().toLowerCase();
  const searchNorm = normalizeText(search);
  const raw = String(dataValue).trim();

  // Verificação direta
  if (raw.toLowerCase().includes(search)) return true;
  if (normalizeText(raw).includes(searchNorm)) return true;

  let year = '';
  let month = '';
  let day = '';

  if (raw.includes('-')) {
    // ISO format YYYY-MM-DD
    const parts = raw.split('T')[0].split('-');
    if (parts.length >= 1) year = parts[0];
    if (parts.length >= 2) month = parts[1].padStart(2, '0');
    if (parts.length >= 3) day = parts[2].padStart(2, '0');
  } else if (raw.includes('/')) {
    // DD/MM/YYYY format
    const parts = raw.split('/');
    if (parts.length >= 1) day = parts[0].padStart(2, '0');
    if (parts.length >= 2) month = parts[1].padStart(2, '0');
    if (parts.length >= 3) year = parts[2];
  }

  const mesesExtenso = [
    'janeiro',
    'fevereiro',
    'marco',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const monthIdx = parseInt(month, 10) - 1;
  const mesNome = monthIdx >= 0 && monthIdx < 12 ? mesesExtenso[monthIdx] : '';
  const mesAbrev = monthIdx >= 0 && monthIdx < 12 ? mesesAbrev[monthIdx] : '';

  const candidates = [
    raw.toLowerCase(),
    // Formato BR
    day && month && year ? `${day}/${month}/${year}` : '',
    day && month && year ? `${day}/${month}/${year.slice(-2)}` : '',
    day && month ? `${day}/${month}` : '',
    month && year ? `${month}/${year}` : '',
    month && year ? `${month}/${year.slice(-2)}` : '',
    // Formato ISO
    year && month && day ? `${year}-${month}-${day}` : '',
    year && month ? `${year}-${month}` : '',
    // Partes individuais
    day,
    month,
    year,
    year ? year.slice(-2) : '',
    // Nomes de mês
    mesNome,
    mesAbrev,
    mesAbrev && year ? `${mesAbrev}/${year}` : '',
    mesAbrev && year ? `${mesAbrev}/${year.slice(-2)}` : '',
  ].filter(Boolean);

  for (const cand of candidates) {
    if (cand.includes(search) || normalizeText(cand).includes(searchNorm)) {
      return true;
    }
  }

  // Comparação sem caracteres especiais (somente dígitos)
  const digitsSearch = search.replace(/\D/g, '');
  if (digitsSearch) {
    const digitsRaw = raw.replace(/\D/g, '');
    const digitsBr = `${day}${month}${year}`;
    const digitsIso = `${year}${month}${day}`;
    if (digitsRaw.includes(digitsSearch) || digitsBr.includes(digitsSearch) || digitsIso.includes(digitsSearch)) {
      return true;
    }
  }

  return false;
}
