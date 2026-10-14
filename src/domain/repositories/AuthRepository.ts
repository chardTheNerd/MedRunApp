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
  register(input: RegisterInput): Promise<Result<User>>;
  signIn(email: string, password: string): Promise<Result<User>>;
  signOut(): Promise<Result<void>>;
}
