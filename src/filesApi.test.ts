import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createHouseholdDirectory,
  deleteHouseholdPath,
  getHouseholdFiles,
  renameHouseholdPath,
  uploadHouseholdFiles,
} from './householdApi';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('household files API', () => {
  it('lists, creates folders, renames, uploads, and deletes files', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          space: 'family',
          path: '',
          entries: [{ name: 'docs', path: 'docs', is_dir: true, uploaded_by_user_id: 'owner-1' }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, path: 'notes' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, saved: [{ name: 'brief.txt', size: 5 }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    global.fetch = fetchMock;

    const listed = await getHouseholdFiles('token-1', 'family', '');
    const created = await createHouseholdDirectory('token-1', 'family', 'notes');
    const renamed = await renameHouseholdPath('token-1', 'family', 'notes', 'notes-2');
    const uploaded = await uploadHouseholdFiles('token-1', 'family', '', [
      { name: 'brief.txt', mimeType: 'text/plain', data: new Uint8Array([104, 101, 108, 108, 111]) },
    ]);
    const deleted = await deleteHouseholdPath('token-1', 'family', 'notes-2');

    expect(listed.entries[0]?.name).toBe('docs');
    expect(created.ok).toBe(true);
    expect(renamed.ok).toBe(true);
    expect(uploaded.saved[0]?.name).toBe('brief.txt');
    expect(deleted.ok).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/files?space=family&path=',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/files/mkdir?space=family&path=notes',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://morgen52.site/familyserver/api/files/rename?space=family&src=notes&dst=notes-2',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://morgen52.site/familyserver/api/files/upload?space=family&path=',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://morgen52.site/familyserver/api/files?space=family&path=notes-2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
