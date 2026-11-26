import type { Auction } from "../services/auctionService";

export function getAuctionPhase(auction: Auction | null) {
  if (auction?.status !== "abierta") return "closed";
  if (!auction.date || !auction.time) return "unscheduled";

  const start = new Date(`${auction.date}T${auction.time}`).getTime();
  if (!Number.isFinite(start)) return "unscheduled";
  return start > Date.now() ? "upcoming" : "live";
}

export const isAuctionLive = (auction: Auction) => getAuctionPhase(auction) === "live";
export const isAuctionUpcoming = (auction: Auction) => getAuctionPhase(auction) === "upcoming";
