import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Donor-side: shows the private handover QR for a claimed donation. */
export function PickupQRDialog({
  donationId,
  title,
  onClose,
}: {
  donationId: string;
  title: string;
  onClose: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.rpc("get_pickup_code", { _donation_id: donationId });
      if (!active) return;
      if (error || !data) {
        setError(error?.message ?? "Could not load the pickup code");
        return;
      }
      setCode(data as string);
      const url = await QRCode.toDataURL(`foodrescue:${donationId}:${data as string}`, {
        width: 512,
        margin: 1,
        color: { dark: "#0f3d2e", light: "#ffffff" },
      });
      if (active) setPng(url);
    })();
    return () => {
      active = false;
    };
  }, [donationId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="card-soft w-full max-w-sm p-6 text-center">
        <div className="flex items-start gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <QrCode className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-tight">Pickup QR</p>
            <p className="truncate text-sm text-muted-foreground">{title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:border-brand"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-destructive">{error}</p>
        ) : png ? (
          <>
            <img
              src={png}
              alt="Pickup QR code"
              className="mx-auto mt-6 h-56 w-56 rounded-3xl border border-border bg-white p-3"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Show this at handover. The receiver or volunteer scans it to confirm pickup.
            </p>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-[0.2em]">{code}</p>
            <p className="text-xs text-muted-foreground">Backup code if the camera won't scan</p>
          </>
        ) : (
          <div className="mx-auto mt-6 h-56 w-56 animate-pulse rounded-3xl bg-secondary" />
        )}
      </div>
    </div>
  );
}
