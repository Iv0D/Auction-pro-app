import request from "./api";
import type { ItemResult } from "./liveAuctionService";
import type { PaymentMethod } from "./paymentService";
import type { ProductResponse } from "./publicacionService";

interface PendingClient {
  clientId: number;
  name: string;
  email: string;
}

export const getPendingClients = () => request<PendingClient[]>("/admin/clients/pending");
export const getPendingPayments = () => request<{ email: string; method: PaymentMethod }[]>("/admin/payment-methods/pending");
export const getPendingProducts = () => request<ProductResponse[]>("/admin/products/pending");

export function reviewClient(id: number, approved: boolean) {
  return request(`/admin/clients/${id}/${approved ? "approve" : "reject"}`, { method: "POST" });
}

export function verifyPayment(id: number) {
  return request(`/admin/payment-methods/${id}/verify`, { method: "POST" });
}

export function reviewProduct(id: number, terms?: { basePrice: number; commissionRate: number }) {
  return request(`/admin/products/${id}/${terms ? "approve" : "reject"}`, {
    method: "POST",
    body: terms && JSON.stringify(terms),
  });
}

export function closeAuctionLot(auctionId: number, lotId: number) {
  return request<ItemResult>(`/auctions/${auctionId}/items/${lotId}/close`, { method: "POST" });
}
