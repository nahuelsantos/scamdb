// Finds the brands and agencies a message names (data/brands.json), for counting reports per brand in the feed.
import { normalize } from './text.js';

/** brands: data/brands.json's list. Returns the ids of brands for `country` that the text names, as whole words. */
export function brandsIn(text, brands, country) {
  const t = ` ${normalize(text)} `;
  return brands.filter((b) => b.countries.includes(country) && b.aliases.some((a) => t.includes(` ${normalize(a)} `))).map((b) => b.id);
}
