import { Result } from '../../../core/types/result';
import { User } from '../../entities/User';
import { AuthRepository } from '../../repositories/AuthRepository';

export class SignInUser {
  constructor(private readonly auth: AuthRepository) {}

  execute(email: string, password: string): Promise<Result<User>> {
    return this.auth.signIn(email.trim(), password);
  }
}
