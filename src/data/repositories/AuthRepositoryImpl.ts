import { Result } from '../../core/types/result';
import { User } from '../../domain/entities/User';
import { AuthRepository, RegisterInput } from '../../domain/repositories/AuthRepository';
import {
  currentAuthUser,
  observeAuthState,
  registerWithEmail,
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

  register(input: RegisterInput): Promise<Result<User>> {
    return wrap(() => registerWithEmail(input));
  }

  signIn(email: string, password: string): Promise<Result<User>> {
    return wrap(() => signInWithEmail(email, password));
  }

  signOut(): Promise<Result<void>> {
    return wrap(signOutCurrentUser);
  }
}
