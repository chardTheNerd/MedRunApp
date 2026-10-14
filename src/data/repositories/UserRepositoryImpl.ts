import { Result } from '../../core/types/result';
import { DeliveryAddress, User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { getUserById, saveUserAddress, upsertUserProfile } from '../supabase/connectors/usersConnector';
import { wrap } from '../supabase/wrap';

export class UserRepositoryImpl implements UserRepository {
  getById(userId: string): Promise<Result<User>> {
    return wrap(() => getUserById(userId));
  }

  upsertProfile(user: User): Promise<Result<User>> {
    return wrap(() => upsertUserProfile(user));
  }

  saveAddress(userId: string, address: DeliveryAddress): Promise<Result<User>> {
    return wrap(() => saveUserAddress(userId, address));
  }
}
