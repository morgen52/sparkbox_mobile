import { authenticateWithCloud, type AuthMode, type Session } from '../authFlow';
import { apiJson } from './cloudJson';

type AuthForm = {
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
};

export async function authenticateSession(authMode: AuthMode, form: AuthForm): Promise<Session> {
  return authenticateWithCloud(
    {
      login: (payload) =>
        apiJson<Session>('/api/auth/login', {
          method: 'POST',
          body: payload,
        }),
      register: (payload) =>
        apiJson('/api/auth/register', {
          method: 'POST',
          body: payload,
        }),
      join: (payload) =>
        apiJson<Session>('/api/auth/join', {
          method: 'POST',
          body: payload,
        }),
    },
    authMode,
    form,
  );
}

export async function revokeSession(token?: string): Promise<void> {
  if (!token) {
    return;
  }
  try {
    await apiJson('/api/auth/session', {
      method: 'DELETE',
      token,
    });
  } catch {
    // ignore logout failures
  }
}