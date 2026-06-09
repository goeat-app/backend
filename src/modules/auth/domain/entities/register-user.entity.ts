export interface RegisterUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  latitude: number;
  longitude: number;
  firebaseUid?: string | null;
  createdAt?: string;
}
