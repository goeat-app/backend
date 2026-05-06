export interface RegisterUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  cpf?: string | null;
  refreshToken?: string | null;
  password: string;
  createdAt?: string;
}
