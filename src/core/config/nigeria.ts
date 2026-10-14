export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

export const NG_COUNTRY_CODE = 'NG' as const;
export const NG_DIAL_CODE = '+234';
export const NG_CURRENCY = 'NGN' as const;
export const NG_LOCALE = 'en-NG' as const;
export const NG_TIMEZONE = 'Africa/Lagos' as const;

export const MAJOR_CITY_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  Lagos: { latitude: 6.5244, longitude: 3.3792 },
  Abuja: { latitude: 9.0765, longitude: 7.3986 },
  Kano: { latitude: 12.0022, longitude: 8.592 },
  Ibadan: { latitude: 7.3775, longitude: 3.947 },
  'Port Harcourt': { latitude: 4.8156, longitude: 7.0498 },
  Benin: { latitude: 6.335, longitude: 5.6037 },
  Kaduna: { latitude: 10.51, longitude: 7.4165 },
  Enugu: { latitude: 6.4527, longitude: 7.5103 },
};
