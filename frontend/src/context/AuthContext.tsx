import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthResponse } from "../services/authService";

interface AuthContextValue {
  user: AuthResponse | null;
  isLoading: boolean;
  saveSession: (data: AuthResponse) => Promise<void>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("session");
        if (raw) setUser(JSON.parse(raw));
      } catch {
        // sesión corrupta: ignorar
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveSession = async (data: AuthResponse) => {
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("session", JSON.stringify(data));
    setUser(data);
  };

  const clearSession = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, saveSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}