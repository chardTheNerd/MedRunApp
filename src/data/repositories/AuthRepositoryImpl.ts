import { Result } from '../../core/types/result';
import { User } from '../../domain/entities/User';
import {
  AuthRepository,
  RegisterInput,
  RegisterResult,
  SignInResult,
} from '../../domain/repositories/AuthRepository';
import {
  currentAuthUser,
  observeAuthState,
  registerWithEmail,
  resendSignupConfirmation,
  signInWithEmail,
  signOutCurrentUser,
} from '../supabase/connectors/authConnector';
import { wrap } from '../supabase/wrap';

export class AuthRepositoryImpl implements AuthRepository {
  currentUser(): Promise<Result<User | null>> {
    return wrap(currentAuthUser);
  }

  observeAuth(onChange: (user: User | null) => void): () => void {
    return observeAuthState(onChange);
  }

  register(input: RegisterInput): Promise<Result<RegisterResult>> {
    return wrap(() => registerWithEmail(input));
  }

  signIn(email: string, password: string): Promise<Result<SignInResult>> {
    return wrap(() => signInWithEmail(email, password));
  }

  resendSignupConfirmation(email: string): Promise<Result<void>> {
    return wrap(() => resendSignupConfirmation(email));
  }

  signOut(): Promise<Result<void>> {
    return wrap(signOutCurrentUser);
  }
}
