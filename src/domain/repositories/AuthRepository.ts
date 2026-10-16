import { Result } from '../../core/types/result';
import { User, UserRole } from '../entities/User';

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  phoneE164: string | null;
  role?: UserRole;
};

export interface AuthRepository {
  currentUser(): Promise<Result<User | null>>;
  observeAuth(onChange: (user: User | null) => void): () => void;
  register(input: RegisterInput): Promise<Result<RegisterResult>>;
  signIn(email: string, password: string): Promise<Result<SignInResult>>;
  resendSignupConfirmation(email: string): Promise<Result<void>>;
  signOut(): Promise<Result<void>>;
}

export type RegisterResult =
  | { status: 'signed-in'; user: User }
  | { status: 'check-email'; email: string; displayName: string };

export type SignInResult =
  | { status: 'signed-in'; user: User }
  | { status: 'check-email'; email: string };
