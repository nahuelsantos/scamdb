// POST /v1/reports (completed in Task 3).
import { readJson, error, cors } from './http.js';
import { authKey } from './keys.js';

export async function handleReport(request, env) {
  await readJson(request);
  await authKey(request, env);
  return cors(error(501, 'not_ready', 'Reports are not open yet.'));
}
