import AsyncStorage from "@react-native-async-storage/async-storage";

import { Platform } from "react-native";

const sharedUrl = process.env.EXPO_PUBLIC_API_URL;
const apiUrl = Platform.select({
  web: process.env.EXPO_PUBLIC_API_URL_WEB || sharedUrl || "http://localhost:8080",
  android: process.env.EXPO_PUBLIC_API_URL_ANDROID || sharedUrl || "http://10.0.2.2:8080",
  default: process.env.EXPO_PUBLIC_API_URL_IOS || sharedUrl || "http://localhost:8080",
});

export const API_BASE_URL = apiUrl.replace(/\/+$/, "");

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.text();
  const data = body && res.headers.get("content-type")?.includes("json")
    ? JSON.parse(body)
    : undefined;

  if (!res.ok) {
    throw new Error(data?.error ?? `Error del servidor (HTTP ${res.status})`);
  }

  return data as T;
}

export default request;