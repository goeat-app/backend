export interface RegisterUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}
