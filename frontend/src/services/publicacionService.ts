import request from "./api";

export type ProductType = "normal" | "art";

export interface ProductCreatePayload {
  type: ProductType;
  name: string;
  brand: string;
  quantity: number;
  catalogDescription: string;
  fullDescription: string;
  // Solo art
  year?: number;
  history?: string;
  ownerConfirmed: boolean;
  photosBase64: string[];
}

export interface ProductResponse {
  id: number;
  type: ProductType;
  name: string;
  brand: string | null;
  catalogDescription: string | null;
  fullDescription: string | null;
  history: string | null;
  date: string;
  available: string;
  photoCount: number;
}

export const crearProductoApi = (payload: ProductCreatePayload) =>
  request<ProductResponse>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMisProductosApi = () =>
  request<ProductResponse[]>("/products/mine", { method: "GET" });

// ─── Detalle completo de un producto ─────────────────────────────────────────

export interface InsuranceInfo {
  policyNumber: string;
  company: string;
  combinedPolicy: string | null;
  amount: number;
}

export interface DepositoInfo {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string | null;
  pais: string | null;
  telefono: string | null;
  responsable: string | null;
  horario: string | null;
}

export interface ProductDetailResponse {
  id: number;
  type: "art" | "normal";
  name: string;
  brand: string | null;
  quantity: number | null;
  catalogDescription: string | null;
  fullDescription: string | null;
  history: string | null;
  date: string;
  available: string;
  photosBase64: string[];
  insurance: InsuranceInfo | null;
  deposito: DepositoInfo | null;
  reviewerName: string | null;
}

export const getProductDetailApi = (id: number) =>
  request<ProductDetailResponse>(`/products/${id}/detail`, { method: "GET" });
