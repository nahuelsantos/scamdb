// The visitor's country, guessed in the browser (nothing is sent): first from the time zone, which says where the
// device is, then from the language settings ("es-AR" → Argentina). Many browsers say "en-US" wherever they are, so the
// time zone comes first. Returns '' when nothing fits one of the `available` country codes.
const ZONES = {
  ar: ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza', 'America/Buenos_Aires', 'America/Cordoba'],
  au: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Hobart', 'Australia/Darwin', 'Australia/Canberra'],
  nz: ['Pacific/Auckland', 'Pacific/Chatham'],
  us: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'America/Detroit',
    'America/Indiana/Indianapolis', 'America/Kentucky/Louisville', 'America/Boise', 'America/Juneau', 'Pacific/Honolulu', 'America/Puerto_Rico'],
  ca: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Regina', 'America/Montreal'],
  gb: ['Europe/London', 'Europe/Belfast'], mx: ['America/Mexico_City', 'America/Monterrey', 'America/Tijuana', 'America/Cancun', 'America/Merida', 'America/Chihuahua', 'America/Hermosillo', 'America/Mazatlan'],
  es: ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'], br: ['America/Sao_Paulo', 'America/Fortaleza', 'America/Recife', 'America/Bahia', 'America/Manaus', 'America/Belem', 'America/Cuiaba', 'America/Porto_Velho'],
  pt: ['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores'], ie: ['Europe/Dublin'], mt: ['Europe/Malta'], fr: ['Europe/Paris'], be: ['Europe/Brussels'],
  lu: ['Europe/Luxembourg'], nl: ['Europe/Amsterdam'], de: ['Europe/Berlin', 'Europe/Busingen'], at: ['Europe/Vienna'], ch: ['Europe/Zurich'], it: ['Europe/Rome'],
  pl: ['Europe/Warsaw'], ro: ['Europe/Bucharest'], md: ['Europe/Chisinau'], ua: ['Europe/Kyiv', 'Europe/Kiev'], tr: ['Europe/Istanbul', 'Asia/Istanbul'],
  gr: ['Europe/Athens'], cy: ['Asia/Nicosia', 'Europe/Nicosia', 'Asia/Famagusta'], bg: ['Europe/Sofia'], se: ['Europe/Stockholm'], dk: ['Europe/Copenhagen'],
  no: ['Europe/Oslo'], fi: ['Europe/Helsinki'], is: ['Atlantic/Reykjavik'], cz: ['Europe/Prague'], sk: ['Europe/Bratislava'], hu: ['Europe/Budapest'],
  si: ['Europe/Ljubljana'], hr: ['Europe/Zagreb'], ee: ['Europe/Tallinn'], lv: ['Europe/Riga'], lt: ['Europe/Vilnius'], rs: ['Europe/Belgrade'],
  ba: ['Europe/Sarajevo'], me: ['Europe/Podgorica'], mk: ['Europe/Skopje'], al: ['Europe/Tirane'], ru: ['Europe/Moscow', 'Europe/Samara', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Vladivostok', 'Europe/Kaliningrad'],
  by: ['Europe/Minsk'], ge: ['Asia/Tbilisi'], am: ['Asia/Yerevan'], az: ['Asia/Baku'], cl: ['America/Santiago', 'America/Punta_Arenas'], co: ['America/Bogota'],
  pe: ['America/Lima'], uy: ['America/Montevideo'], py: ['America/Asuncion'], bo: ['America/La_Paz'], ec: ['America/Guayaquil'], ve: ['America/Caracas'],
  gt: ['America/Guatemala'], sv: ['America/El_Salvador'], hn: ['America/Tegucigalpa'], ni: ['America/Managua'], cr: ['America/Costa_Rica'], pa: ['America/Panama'],
  bz: ['America/Belize'], ph: ['Asia/Manila'], ng: ['Africa/Lagos'], in: ['Asia/Kolkata', 'Asia/Calcutta'], id: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
  ae: ['Asia/Dubai'], th: ['Asia/Bangkok'], kr: ['Asia/Seoul'], jp: ['Asia/Tokyo'], tw: ['Asia/Taipei'],
};
const BY_ZONE = new Map(Object.entries(ZONES).flatMap(([cc, zones]) => zones.map((z) => [z, cc])));

/** @param {{ timeZone?: string, languages?: string[] }} browser  @param {Set<string>} available */
export function guessCountry({ timeZone, languages } = {}, available) {
  const zone = BY_ZONE.get(timeZone);
  if (zone && available.has(zone)) return zone;
  for (const l of languages ?? []) {
    const region = String(l).split('-')[1]?.toLowerCase();
    if (region && available.has(region)) return region;
  }
  return '';
}

/** What this browser says about itself, for guessCountry. */
export function browserHints() {
  let timeZone;
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* very old browser */ }
  return { timeZone, languages: navigator.languages?.length ? navigator.languages : [navigator.language] };
}
