/**
 * Small deterministic helpers: same input string always yields the same
 * pseudo-random sequence. Used to synthesize stable demo data (heatmaps,
 * benchmark figures, storyteller metrics) seeded from campaign ids.
 */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) seeded from an arbitrary string. */
export function seededRandom(seed: string): () => number {
  let a = hashString(seed) || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickSeeded<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}
