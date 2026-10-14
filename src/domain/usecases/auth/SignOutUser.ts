import { Result } from '../../../core/types/result';
import { AuthRepository } from '../../repositories/AuthRepository';

export class SignOutUser {
  constructor(private readonly auth: AuthRepository) {}

  execute(): Promise<Result<void>> {
    return this.auth.signOut();
  }
}
