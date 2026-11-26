import request from "./api";

export interface UserProfile {
  id: number;
  nombre: string;
  email: string;
  domicilioLegal: string;
  paisOrigen: string;
  categoria: string;
  estado: string;
}

export interface UpdateProfilePayload {
  paisOrigen: string;
  domicilioLegal: string;
}

export interface ChangePasswordPayload {
  passwordActual: string;
  passwordNueva: string;
  confirmPassword: string;
}

export const getProfileApi = () =>
  request<UserProfile>("/users/profile", { method: "GET" });

export const updateProfileApi = (payload: UpdateProfilePayload) =>
  request<{ message: string }>("/users/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const changePasswordApi = (payload: ChangePasswordPayload) =>
  request<{ message: string }>("/users/change-password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
