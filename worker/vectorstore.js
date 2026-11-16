// Saves the catalogue's embeddings in D1 once per catalogue version, so a new Worker isolate reads one row instead of
// re-embedding the whole catalogue (about 3 s). Vectors are stored as int8 with a per-vector scale (~1 KB each).
const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** [{ id, v: number[] }] -> a compact string. */
export function encodeVectors(list) {
  const dim = list[0]?.v.length ?? 0;
  const q = new Int8Array(list.length * dim);
  const scales = list.map(({ v }, i) => {
    const max = Math.max(...v.map(Math.abs)) || 1;
    for (let j = 0; j < dim; j++) q[i * dim + j] = Math.round((v[j] / max) * 127);
    return max / 127;
  });
  return JSON.stringify({ dim, ids: list.map((x) => x.id), scales, data: b64(new Uint8Array(q.buffer)) });
}

export function decodeVectors(text) {
  const { dim, ids, scales, data } = JSON.parse(text);
  const q = new Int8Array(unb64(data).buffer);
  return ids.map((id, i) => ({ id, v: Array.from(q.subarray(i * dim, (i + 1) * dim), (x) => x * scales[i]) }));
}

/** The store scoreWithWorkersAI uses: get(version) -> list | null, put(version, list). Only the latest version is kept. */
export const d1VectorStore = (db) => ({
  async get(version) {
    const row = await db.prepare('SELECT data FROM catalogue_vectors WHERE version = ?').bind(version).first();
    return row ? decodeVectors(row.data) : null;
  },
  async put(version, list) {
    await db.batch([
      db.prepare('DELETE FROM catalogue_vectors WHERE version != ?').bind(version),
      db.prepare('INSERT OR REPLACE INTO catalogue_vectors (version, data, created_at) VALUES (?, ?, ?)').bind(version, encodeVectors(list), new Date().toISOString()),
    ]);
  },
});
