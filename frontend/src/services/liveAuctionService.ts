import request, { API_BASE_URL } from "./api";

export interface JoinAuctionResponse {
  auctionId: number;
  currentItemId: number | null;
  currentItemName: string | null;
  currentItemDescription: string | null;
  basePrice: number | null;
  currentBid: number | null;
  bidderNumber: number;
  canBid: boolean;
  chequeDisponible: number | null; // si paga con cheque certificado: monto aún disponible
  streamingLink: string | null;
  currency: string;
}

export interface BidUpdate {
  bidId: number;
  itemId: number;
  auctionId: number;
  amount: number;
  bidderNumber: number;
  timestamp: string;
  minNextBid: number;
  maxNextBid: number | null;
}

export interface ItemResult {
  itemId: number;
  auctionId: number;
  itemName: string;
  sold: boolean;
  winnerBidderNumber: number | null;
  finalAmount: number;
  commission: number;
  shippingCost: number;
  nextItemId: number | null;
  nextItemName: string | null;
  nextBasePrice: number | null;
  auctionFinished: boolean;
}

export const joinAuctionApi = (auctionId: number, paymentMethodId?: number) =>
  request<JoinAuctionResponse>(`/auctions/${auctionId}/join`, {
    method: "POST",
    body: JSON.stringify({ paymentMethodId: paymentMethodId ?? null }),
  });

export const leaveAuctionApi = (auctionId: number) =>
  request<void>(`/auctions/${auctionId}/leave`, { method: "POST" });

export const getAuctionStateApi = (auctionId: number) =>
  request<JoinAuctionResponse>(`/auctions/${auctionId}/state`, { method: "GET" });

export const getItemBidsApi = (itemId: number) =>
  request<BidUpdate[]>(`/auctions/items/${itemId}/bids`, { method: "GET" });

export const WS_URL = `${API_BASE_URL}/ws`;

export const placeBidApi = (auctionId: number, itemId: number, amount: number) =>
  request<BidUpdate>(`/auctions/${auctionId}/bid`, {
    method: "POST",
    body: JSON.stringify({ itemId, amount }),
  });
