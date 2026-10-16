import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { container } from '../../di/container';
import { isSupabaseConfigured } from '../../core/config/env';
import { User } from '../../domain/entities/User';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'unconfigured';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  error: string | null;
};

type AuthEvent =
  | { type: 'loading' }
  | { type: 'unconfigured' }
  | { type: 'signedIn'; user: User }
  | { type: 'signedOut' }
  | { type: 'failed'; message: string };

function authReducer(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case 'loading':
      return { ...state, status: 'loading', error: null };
    case 'unconfigured':
      return { status: 'unconfigured', user: null, error: null };
    case 'signedIn':
      return { status: 'authenticated', user: event.user, error: null };
    case 'signedOut':
      return { status: 'anonymous', user: null, error: null };
    case 'failed':
      return { ...state, status: state.user ? 'authenticated' : 'anonymous', error: event.message };
    default:
      return state;
  }
}

type AuthContextValue = AuthState & {
  registerPatient: (input: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) => Promise<'signed-in' | 'check-email' | false>;
  signIn: (email: string, password: string) => Promise<'signed-in' | 'check-email' | false>;
  resendConfirmation: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    status: 'idle',
    user: null,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'unconfigured' });
      return;
    }
    dispatch({ type: 'loading' });
    return container.repositories.auth.observeAuth((user) => {
      if (user) {
        dispatch({ type: 'signedIn', user });
      } else {
        dispatch({ type: 'signedOut' });
      }
    });
  }, []);

  const registerPatient = useCallback(async (input: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }) => {
    dispatch({ type: 'loading' });
    const result = await container.usecases.registerPatient.execute(input);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return false;
    }
    if (result.value.status === 'signed-in') {
      dispatch({ type: 'signedIn', user: result.value.user });
      return 'signed-in';
    }
    dispatch({ type: 'failed', message: 'Check your inbox to confirm your email.' });
    return 'check-email';
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'loading' });
    const result = await container.usecases.signInUser.execute(email, password);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return false;
    }
    if (result.value.status === 'signed-in') {
      dispatch({ type: 'signedIn', user: result.value.user });
      return 'signed-in';
    }
    dispatch({ type: 'failed', message: 'Check your inbox to confirm your email.' });
    return 'check-email';
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const result = await container.repositories.auth.resendSignupConfirmation(email);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await container.usecases.signOutUser.execute();
    dispatch({ type: 'signedOut' });
  }, []);

  const value = useMemo(
    () => ({ ...state, registerPatient, signIn, resendConfirmation, signOut }),
    [state, registerPatient, signIn, resendConfirmation, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return value;
}
