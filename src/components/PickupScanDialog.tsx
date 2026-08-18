import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Receiver / volunteer side: scan the donor's QR (or type the code) to confirm pickup. */
export function PickupScanDialog({
  donationId,
  title,
  onClose,
  onConfirmed,
}: {
  donationId: string;
  title: string;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  const confirm = async (raw: string) => {
    if (submitted.current) return;
    const parts = raw.split(":");
    const code = parts.length === 3 && parts[0] === "foodrescue" ? parts[2] : raw;
    if (parts.length === 3 && parts[1] !== donationId) {
      toast.error("That QR belongs to a different donation");
      return;
    }
    submitted.current = true;
    setBusy(true);
    const { error } = await supabase.rpc("confirm_pickup_with_code", {
      _donation_id: donationId,
      _code: code.trim(),
    });
    setBusy(false);
    if (error) {
      submitted.current = false;
      toast.error(error.message);
      return;
    }
    toast.success("Pickup confirmed — thank you!");
    onConfirmed();
    onClose();
  };

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let active = true;
    const canvas = document.createElement("canvas");

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch {
        if (active) {
          setCamError("Camera unavailable — enter the code below instead.");
          setScanning(false);
        }
        return;
      }
      const video = videoRef.current;
      if (!video || !active) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const tick = () => {
        if (!active || !videoRef.current) return;
        const v = videoRef.current;
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const found = jsQR(img.data, img.width, img.height);
            if (found?.data) {
              void confirm(found.data);
              return;
            }
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, donationId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="card-soft w-full max-w-sm p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-tangerine-soft text-accent-foreground">
            <ScanLine className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-tight">Confirm pickup</p>
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

        <div className="mt-5 overflow-hidden rounded-3xl bg-secondary">
          {scanning ? (
            <video ref={videoRef} playsInline muted className="h-56 w-full object-cover" />
          ) : (
            <button
              onClick={() => {
                setCamError(null);
                setScanning(true);
              }}
              className="flex h-56 w-full flex-col items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-brand"
            >
              <Camera className="h-8 w-8" />
              Scan the donor's QR
            </button>
          )}
        </div>
        {camError && <p className="mt-3 text-sm text-destructive">{camError}</p>}

        <p className="mt-5 text-sm font-bold">Or enter the 12-character code</p>
        <div className="mt-2 flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            placeholder="A1B2C3D4E5F6"
            className="field py-2.5 tracking-[0.15em]"
          />
          <button
            onClick={() => void confirm(manual)}
            disabled={busy || manual.trim().length < 4}
            className="btn-pill btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? "…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
