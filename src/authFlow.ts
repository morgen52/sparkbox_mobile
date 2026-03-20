export type AuthMode = 'login' | 'register' | 'join';

export type Session = {
  token: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    role: string;
    household_id: string;
  };
  household: {
    id: string;
    name: string;
  };
};

type RegisterResponse = {
  user: {
    id: string;
  };
  household: {
    id: string;
    name: string;
  };
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = LoginInput & {
  displayName: string;
  inviteCode?: string;
};

type AuthApi = {
  login: (payload: LoginInput) => Promise<Session>;
  register: (payload: { email: string; password: string; display_name: string }) => Promise<RegisterResponse>;
  join: (payload: { email: string; password: string; display_name: string; invite_code: string }) => Promise<Session>;
};

export async function authenticateWithCloud(
  api: AuthApi,
  mode: AuthMode,
  input: RegisterInput,
): Promise<Session> {
  if (mode === 'join') {
    return api.join({
      email: input.email,
      password: input.password,
      display_name: input.displayName,
      invite_code: input.inviteCode ?? '',
    });
  }

  if (mode === 'register') {
    await api.register({
      email: input.email,
      password: input.password,
      display_name: input.displayName,
    });
  }

  return api.login({
    email: input.email,
    password: input.password,
  });
}
