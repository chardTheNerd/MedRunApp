import { Result } from '../../../core/types/result';
import { AuthRepository, SignInResult } from '../../repositories/AuthRepository';

export class SignInUser {
  constructor(private readonly auth: AuthRepository) {}

  execute(email: string, password: string): Promise<Result<SignInResult>> {
    return this.auth.signIn(email.trim(), password);
  }
}
