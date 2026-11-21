// Small HTTP helpers shared by every route. Errors are JSON { error, message }.
export class HttpError extends Error {
  constructor(status, code, message, headers = {}) { super(message); this.status = status; this.code = code; this.headers = headers; }
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

export const error = (status, code, message, headers = {}) => json({ error: code, message }, status, headers);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
  'access-control-max-age': '86400',
};

/** Adds the open CORS headers used by /v1/reports. */
export function cors(response) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(CORS)) r.headers.set(k, v);
  return r;
}

/** Parses a JSON body, refusing other content types, oversized bodies and bad JSON. */
export async function readJson(request, maxBytes = 20000) {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') ?? '')) throw new HttpError(415, 'unsupported_media_type', 'Send JSON with Content-Type: application/json.');
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new HttpError(413, 'too_large', `The body is larger than ${maxBytes} bytes.`);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new HttpError(413, 'too_large', `The body is larger than ${maxBytes} bytes.`);
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object');
    return data;
  } catch { throw new HttpError(400, 'bad_json', 'The body is not a JSON object.'); }
}
