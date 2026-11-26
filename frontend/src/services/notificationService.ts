import request from "./api";

export interface Notification {
  id: number;
  type: "PRODUCT_APPROVED" | "PRODUCT_REJECTED" | "BID_OUTBID" | "AUCTION_STARTING" | "AUCTION_WON" | "PAYMENT_SUCCESS" | "WATCHLIST_ALERT";
  message: string;
  basePrice: number | null;
  commissionRate: number | null;
  amount: number | null;
  minutesToStart: number | null;
  productId: number | null;
  productName: string;
  auctionId: number | null;
  auctionLocation: string | null;
  createdAt: string;
  read: boolean;
  userResponse: "PENDING" | "ACCEPTED" | "REJECTED_BY_USER";
}

export const getNotificationsApi    = ()         => request<Notification[]>("/notifications/mine",        { method: "GET" });
export const getRecentApi           = ()         => request<Notification[]>("/notifications/recent",      { method: "GET" });
export const getOthersApi           = ()         => request<Notification[]>("/notifications/others",      { method: "GET" });
export const getUnreadCountApi      = ()         => request<{ unread: number }>("/notifications/unread-count", { method: "GET" });
export const markAsReadApi          = (id: number) => request<void>(`/notifications/${id}/read`,          { method: "POST" });
export const respondToApprovalApi   = (id: number, response: "ACCEPTED" | "REJECTED_BY_USER") =>
  request<Notification>(`/notifications/${id}/respond`, { method: "POST", body: JSON.stringify({ response }) });
