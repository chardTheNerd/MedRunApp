import { AppError } from '../../../core/errors/AppError';
import { err, Result } from '../../../core/types/result';
import { toE164Ng } from '../../../core/utils/phoneNg';
import { AuthRepository, RegisterResult } from '../../repositories/AuthRepository';

export class RegisterPatient {
  constructor(private readonly auth: AuthRepository) {}

  execute(input: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }): Promise<Result<RegisterResult>> {
    const phoneE164 = input.phone ? toE164Ng(input.phone) : null;
    if (input.phone && !phoneE164) {
      return Promise.resolve(err(new AppError('validation', 'Enter a valid Nigerian phone number.')));
    }
    return this.auth.register({
      email: input.email.trim(),
      password: input.password,
      displayName: input.displayName.trim(),
      phoneE164,
      role: 'patient',
    });
  }
}
