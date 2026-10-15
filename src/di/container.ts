import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { ConsultationRepositoryImpl } from '../data/repositories/ConsultationRepositoryImpl';
import { InventoryRepositoryImpl } from '../data/repositories/InventoryRepositoryImpl';
import { OrderRepositoryImpl } from '../data/repositories/OrderRepositoryImpl';
import { PharmacyRepositoryImpl } from '../data/repositories/PharmacyRepositoryImpl';
import { UserRepositoryImpl } from '../data/repositories/UserRepositoryImpl';
import { RegisterPatient } from '../domain/usecases/auth/RegisterPatient';
import { SignInUser } from '../domain/usecases/auth/SignInUser';
import { SignOutUser } from '../domain/usecases/auth/SignOutUser';
import { RequestConsultation } from '../domain/usecases/consultations/RequestConsultation';
import { SearchNearbyListings } from '../domain/usecases/inventory/SearchNearbyListings';
import { PlaceOrder } from '../domain/usecases/orders/PlaceOrder';

const authRepository = new AuthRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const pharmacyRepository = new PharmacyRepositoryImpl();
const inventoryRepository = new InventoryRepositoryImpl();
const orderRepository = new OrderRepositoryImpl();
const consultationRepository = new ConsultationRepositoryImpl();

export const container = {
  repositories: {
    auth: authRepository,
    users: userRepository,
    pharmacies: pharmacyRepository,
    inventory: inventoryRepository,
    orders: orderRepository,
    consultations: consultationRepository,
  },
  usecases: {
    registerPatient: new RegisterPatient(authRepository),
    signInUser: new SignInUser(authRepository),
    signOutUser: new SignOutUser(authRepository),
    searchNearbyListings: new SearchNearbyListings(inventoryRepository),
    placeOrder: new PlaceOrder(orderRepository),
    requestConsultation: new RequestConsultation(consultationRepository),
  },
};
