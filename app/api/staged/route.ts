import { loadState, saveState } from '@/lib/printify/posters';

export async function POST(request: Request) {
  const { key, staged } = (await request.json()) as { key: string; staged: boolean };
  if (typeof key !== 'string' || typeof staged !== 'boolean') {
    return Response.json({ error: 'key (string) and staged (boolean) are required.' }, { status: 400 });
  }
  const state = loadState();
  if (staged) {
    state.staged = { ...state.staged, [key]: true };
  } else if (state.staged) {
    delete state.staged[key];
    if (Object.keys(state.staged).length === 0) delete state.staged;
  }
  saveState(state);
  return Response.json({ ok: true, staged });
}
