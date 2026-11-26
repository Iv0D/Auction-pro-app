import request from "./api";

export interface BidHistory {
  bidId: number;
  productName: string;
  productBrand: string | null;
  productType: "normal" | "art";
  auctionId: number;
  auctionDate: string;
  auctionLocation: string | null;
  amount: number;
  winner: boolean | null;  // null = en curso
}

export interface BidMetrics {
  totalBids: number;
  auctionsAttended: number;
  auctionsWon: number;
  auctionsLost: number;
  totalSpent: number;
  totalBid: number;
}

export const getBidHistoryApi = () =>
  request<BidHistory[]>("/users/bids/history", { method: "GET" });

export const getBidMetricsApi = () =>
  request<BidMetrics>("/users/bids/metrics", { method: "GET" });
