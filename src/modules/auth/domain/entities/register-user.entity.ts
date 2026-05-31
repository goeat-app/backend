export interface RegisterUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  firebaseUid?: string | null;
  createdAt?: string;
}
