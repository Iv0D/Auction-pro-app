import request from "./api";

export interface Fine {
  id: number;
  amount: number;
  dueDate: string;
  status: "pendiente" | "pagada";
  bidId: number;
  bidAmount: number;
  productName: string;
  auctionId: number;
}

export interface PayFineResponse {
  message: string;
  hasPendingFines: boolean;
}

export const getMyFinesApi = () =>
  request<Fine[]>("/users/fines", { method: "GET" });

export const getMyPendingFinesApi = () =>
  request<Fine[]>("/users/fines/pending", { method: "GET" });

export const payFineApi = (fineId: number) =>
  request<PayFineResponse>(`/users/fines/${fineId}/pay`, { method: "POST" });