import { Result } from '../../core/types/result';
import { DeliveryAddress, User } from '../entities/User';

export interface UserRepository {
  getById(userId: string): Promise<Result<User>>;
  upsertProfile(user: User): Promise<Result<User>>;
  saveAddress(userId: string, address: DeliveryAddress): Promise<Result<User>>;
}
