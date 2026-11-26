import request, { API_BASE_URL } from "./api";

export interface Auction {
  id: number;
  date: string;
  time: string;
  status: "abierta" | "cerrada";
  auctioneerId: number | null;
  auctioneerName: string | null;
  location: string | null;
  capacity: number | null;
  hasWarehouse: boolean | null;
  privateSecurity: boolean | null;
  category: string | null;
  totalItems: number;
}

export interface CatalogItem {
  id: number;
  productName: string;
  productBrand: string | null;
  productDescription: string | null;
  productType: "normal" | "art";
  auctioned: "si" | "no";
  basePrice: number | null;   // null si no está logueado
  commission: number | null;
}

export const getAuctionsApi = () =>
  request<Auction[]>("/auctions", { method: "GET" });

export const getAuctionByIdApi = (id: number) =>
  request<Auction>(`/auctions/${id}`, { method: "GET" });

export const getAuctionCatalogApi = (id: number) =>
  request<CatalogItem[]>(`/auctions/${id}/catalog`, { method: "GET" });

export interface CatalogItemDetail {
  id: number;
  auctioned: "si" | "no";
  basePrice: number | null;
  commission: number | null;
  productId: number;
  productType: "normal" | "art";
  productName: string;
  productBrand: string | null;
  catalogDescription: string | null;
  fullDescription: string | null;
  history: string | null;
  quantity: number | null;
  productDate: string | null;
  auctionId: number;
  auctionLocation: string | null;
  auctionStatus: string | null;
  auctionDate: string | null;
  auctionTime: string | null;
  auctioneerName: string | null;
}

export const getCatalogItemDetailApi = (itemId: number) =>
  request<CatalogItemDetail>(`/auctions/items/${itemId}`, { method: "GET" });

export const getAuctionCoverUrl  = (auctionId: number)  => `${API_BASE_URL}/auctions/${auctionId}/cover`;
export const getItemPhotoUrl     = (itemId: number)      => `${API_BASE_URL}/auctions/items/${itemId}/photo`;

export const getItemPhotoIdsApi = (itemId: number) =>
  request<number[]>(`/auctions/items/${itemId}/photos`, { method: "GET" });

export const getPhotoUrl = (photoId: number) => `${API_BASE_URL}/photos/${photoId}`;
