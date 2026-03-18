import { describe, expect, it, vi } from 'vitest';

import { authenticateWithCloud } from './authFlow';

describe('authenticateWithCloud', () => {
  it('logs in immediately after registration so claim requests have a bearer token', async () => {
    const register = vi.fn().mockResolvedValue({
      user: { id: 'user-1' },
      household: { id: 'house-1', name: 'Home' },
    });
    const login = vi.fn().mockResolvedValue({
      token: 'cloud-token',
      user: {
        id: 'user-1',
        email: 'owner@example.com',
        display_name: 'Owner',
        role: 'owner',
        household_id: 'house-1',
      },
      household: {
        id: 'house-1',
        name: 'Home',
      },
    });

    const session = await authenticateWithCloud(
      { register, login },
      'register',
      { email: 'owner@example.com', password: 'test-pass-123', displayName: 'Owner' },
    );

    expect(register).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'test-pass-123',
      display_name: 'Owner',
    });
    expect(login).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'test-pass-123',
    });
    expect(session.token).toBe('cloud-token');
  });
});
