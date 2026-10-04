export type SectorFilter = 'all' | 'residential' | 'commercial';
const SECTORS: string[] = ['all', 'residential', 'commercial'];

export function parseSector(search: string): SectorFilter {
  const value = new URLSearchParams(search).get('sector') ?? '';
  return SECTORS.includes(value) ? (value as SectorFilter) : 'all';
}

export function matchesSector(sector: string, filter: SectorFilter): boolean {
  return filter === 'all' || sector === filter;
}
