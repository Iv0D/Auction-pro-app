import request from "./api";

export interface AuthResponse {
  token: string;
  userId: number;
  clientId: number;
  email: string;
  name: string;
  category: string | null;
  admitted: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  document: string;
  address: string;
  dniFrenteBase64: string;
  dniDorsoBase64: string;
  countryId?: number;
  email: string;
  // sin password
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface SetPasswordPayload {
  token: string;
  password: string;
}

export const loginApi = (payload: LoginPayload) =>
  request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) });

export const registerApi = (payload: RegisterPayload) =>
  request<RegisterResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) });

export const setPasswordApi = (payload: SetPasswordPayload) =>
  request<AuthResponse>("/auth/set-password", { method: "POST", body: JSON.stringify(payload) });
export const forgotPasswordApi = (email: string) =>
  request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPasswordApi = (token: string, newPassword: string) =>
  request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
