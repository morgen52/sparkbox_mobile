import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createHouseholdTask,
  deleteHouseholdTask,
  getHouseholdTaskHistory,
  getHouseholdTasks,
  triggerHouseholdTask,
  updateHouseholdTask,
} from './householdApi';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('household tasks API', () => {
  it('loads, creates, updates, triggers, reads history, and deletes tasks', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'task-1', name: 'Lights', scope: 'family', enabled: 1, command_type: 'zeroclaw', command: 'lights', cron_expr: '0 18 * * *' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'task-2', name: 'Dinner', scope: 'family', enabled: 1, command_type: 'zeroclaw', command: 'dinner', cron_expr: '0 19 * * *' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'task-2', name: 'Dinner', scope: 'family', enabled: 0, command_type: 'zeroclaw', command: 'dinner', cron_expr: '0 19 * * *', updated_at: '2026-03-20T12:00:00Z' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, message: 'Task queued for immediate execution' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'run-1', status: 'success', output: 'ok', started_at: '2026-03-20T12:01:00Z' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    global.fetch = fetchMock;

    const listed = await getHouseholdTasks('token-1', 'family');
    const created = await createHouseholdTask('token-1', 'family', {
      name: 'Dinner',
      cronExpr: '0 19 * * *',
      command: 'dinner',
      commandType: 'zeroclaw',
      enabled: true,
    });
    const updated = await updateHouseholdTask('token-1', 'task-2', {
      enabled: false,
    });
    const triggered = await triggerHouseholdTask('token-1', 'task-2');
    const history = await getHouseholdTaskHistory('token-1', 'task-2');
    const removed = await deleteHouseholdTask('token-1', 'task-2');

    expect(listed).toHaveLength(1);
    expect(created.id).toBe('task-2');
    expect(updated.enabled).toBe(false);
    expect(triggered.ok).toBe(true);
    expect(history[0]?.id).toBe('run-1');
    expect(removed).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/tasks?scope=family',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/tasks?scope=family',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Dinner',
          cron_expr: '0 19 * * *',
          command: 'dinner',
          command_type: 'zeroclaw',
          enabled: true,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://morgen52.site/familyserver/api/tasks/task-2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ enabled: false }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://morgen52.site/familyserver/api/tasks/task-2/trigger',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://morgen52.site/familyserver/api/tasks/task-2/history?limit=20',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      'https://morgen52.site/familyserver/api/tasks/task-2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
