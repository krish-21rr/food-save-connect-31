import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DonationStatus = "AVAILABLE" | "CLAIMED" | "PICKED_UP" | "EXPIRED";

export type Donation = {
  id: string;
  donor_id: string;
  title: string;
  category: string;
  quantity: string;
  veg: boolean;
  allergens: string[];
  deadline: string;
  address: string;
  notes: string | null;
  image_urls: string[];
  status: DonationStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  created_at: string;
  delivery_requested: boolean;
  volunteer_id: string | null;
  volunteer_accepted_at: string | null;
  delivered_at: string | null;
};

export const BUCKET = "food-photos";

export const statusLabel: Record<DonationStatus, string> = {
  AVAILABLE: "Available",
  CLAIMED: "Claimed",
  PICKED_UP: "Picked up",
  EXPIRED: "Expired",
};

export function formatDeadline(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "deadline passed";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min left`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hr left`;
  return `${Math.round(hours / 24)} days left`;
}

/** Signed URLs for private storage paths. */
export function useSignedUrls(paths: string[]) {
  const key = paths.join("|");
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (!key) {
      setUrls([]);
      return;
    }
    void supabase.storage
      .from(BUCKET)
      .createSignedUrls(key.split("|"), 3600)
      .then(({ data }) => {
        if (!active) return;
        setUrls((data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[]);
      });
    return () => {
      active = false;
    };
  }, [key]);

  return urls;
}
