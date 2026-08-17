import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  Clock,
  MessageCircle,
  Leaf,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  SearchX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { ChatPanel } from "@/components/ChatPanel";
import { useAuth } from "@/lib/auth";
import {
  formatDeadline,
  timeAgo,
  timeLeft,
  useSignedUrls,
  type Donation,
  type DonationStatus,
} from "@/lib/food";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Live Food Feed — Food Rescue" },
      {
        name: "description",
        content:
          "Browse surplus food donations near you in real time and claim meals before the pickup deadline.",
      },
      { property: "og:title", content: "Live Food Feed — Food Rescue" },
      {
        property: "og:description",
        content: "Real-time surplus food listings from donors near you.",
      },
    ],
  }),
  component: FeedPage,
});

type Row = Donation & {
  donor: { display_name: string; org_name: string | null; phone: string | null } | null;
};

const filters = [
  { id: "all", label: "All available" },
  { id: "veg", label: "Vegetarian" },
  { id: "cooked", label: "Cooked meals" },
  { id: "raw", label: "Raw produce" },
  { id: "mine", label: "My claims" },
];

function FeedPage() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chat, setChat] = useState<{ id: string; title: string } | null>(null);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    const donations = (data as unknown as Donation[]) ?? [];
    const ids = [...new Set(donations.map((d) => d.donor_id))];
    const { data: people } = ids.length
      ? await supabase.from("profiles").select("id, display_name, org_name, phone").in("id", ids)
      : { data: [] };
    const byId = new Map((people ?? []).map((p) => [p.id, p]));
    setRows(donations.map((d) => ({ ...d, donor: byId.get(d.donor_id) ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    void supabase.rpc("expire_stale_donations").then(() => fetchRows());

    const channel = supabase
      .channel("feed-donations")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => {
        void fetchRows();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((d) => {
      if (filter === "mine") {
        if (d.claimed_by !== user?.id) return false;
      } else if (filter === "veg") {
        if (!d.veg || d.status !== "AVAILABLE") return false;
      } else if (filter === "cooked" || filter === "raw") {
        if (d.category !== filter || d.status !== "AVAILABLE") return false;
      } else if (d.status !== "AVAILABLE") return false;

      if (!q) return true;
      const donor = d.donor?.org_name ?? d.donor?.display_name ?? "";
      return d.title.toLowerCase().includes(q) || donor.toLowerCase().includes(q);
    });
  }, [rows, filter, query, user?.id]);

  const claim = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("claim_donation", { _donation_id: id });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      void fetchRows();
      return;
    }
    toast.success("Claimed! Contact the donor and pick it up before the deadline.");
    void fetchRows();
  };

  const markPicked = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("mark_picked_up", { _donation_id: id });
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success("Pickup confirmed — thank you!");
    void fetchRows();
  };

  const requestDelivery = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("request_delivery", { _donation_id: id });
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success("Volunteer drivers have been notified — a run is now open.");
    void fetchRows();
  };

  const myClaims = rows.filter((d) => d.claimed_by === user?.id && d.status === "CLAIMED").length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -left-28 -top-24 h-72 w-72 bg-brand-soft opacity-60" />
      <div className="blob -right-24 top-96 h-60 w-60 bg-sun opacity-40" />
      <AppHeader active="feed" />

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">
          {profile?.org_name || profile?.display_name || "Receiver"} view
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Live Food Feed</h1>
          <span className="rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand">
            {visible.length} listing{visible.length === 1 ? "" : "s"}
          </span>
          {myClaims > 0 && (
            <span className="rounded-full bg-tangerine-soft px-4 py-1.5 text-sm font-bold text-accent-foreground">
              {myClaims} active claim{myClaims === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Listings update live as donors publish them. Claim early — the first claim locks the food.
        </p>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search food or donor…"
              className="field py-3 pl-12"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`btn-pill px-5 py-2 text-sm ${filter === f.id ? "btn-primary" : "btn-outline"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-soft h-64 animate-pulse p-6" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="card-soft mt-10 flex flex-col items-center px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
              <SearchX className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">No donations match right now</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              New listings show up here the moment a donor publishes them — no refresh needed.
            </p>
            <button
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="btn-pill btn-primary mt-6"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((d) => (
              <DonationCard
                key={d.id}
                row={d}
                mine={d.claimed_by === user?.id}
                busy={busyId === d.id}
                onClaim={() => void claim(d.id)}
                onPicked={() => void markPicked(d.id)}
                onChat={() => setChat({ id: d.id, title: d.title })}
                onRequestDelivery={() => void requestDelivery(d.id)}
              />
            ))}
          </div>
        )}
      </main>

      {chat && <ChatPanel donationId={chat.id} title={chat.title} onClose={() => setChat(null)} />}
    </div>
  );
}

const statusStyle: Record<DonationStatus, string> = {
  AVAILABLE: "bg-brand-soft text-brand",
  CLAIMED: "bg-tangerine-soft text-accent-foreground",
  PICKED_UP: "bg-secondary text-muted-foreground",
  EXPIRED: "bg-secondary text-muted-foreground",
};

function DonationCard({
  row,
  mine,
  busy,
  onClaim,
  onPicked,
  onChat,
  onRequestDelivery,
}: {
  row: Row;
  mine: boolean;
  busy: boolean;
  onClaim: () => void;
  onPicked: () => void;
  onChat: () => void;
  onRequestDelivery: () => void;
}) {
  const images = useSignedUrls(row.image_urls ?? []);
  const donorName = row.donor?.org_name || row.donor?.display_name || "Donor";

  return (
    <article className="card-soft flex flex-col overflow-hidden">
      {images[0] && (
        <img src={images[0]} alt={row.title} loading="lazy" className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="truncate font-bold">{donorName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(row.created_at)}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[row.status]}`}>
            {row.status === "PICKED_UP" ? "Picked up" : row.status.toLowerCase()}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-extrabold leading-snug">{row.title}</h2>

        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-brand" /> {row.quantity}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-tangerine" /> {formatDeadline(row.deadline)} ·{" "}
            {timeLeft(row.deadline)}
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span className="line-clamp-2">{row.address}</span>
          </p>
          {mine && row.donor?.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-brand" /> {row.donor.phone}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {row.veg && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              <Leaf className="h-3.5 w-3.5" /> Veg
            </span>
          )}
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
            {row.category}
          </span>
          {(row.allergens ?? []).map((a) => (
            <span
              key={a}
              className="rounded-full bg-tangerine-soft px-3 py-1 text-xs font-bold text-accent-foreground"
            >
              {a}
            </span>
          ))}
        </div>

        {row.notes && <p className="mt-3 text-sm text-muted-foreground">{row.notes}</p>}

        <div className="mt-auto pt-5">
          {row.status === "AVAILABLE" ? (
            <button onClick={onClaim} disabled={busy} className="btn-pill btn-primary w-full disabled:opacity-60">
              {busy ? "Claiming…" : "Claim food"}
            </button>
          ) : row.status === "CLAIMED" && mine ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={onPicked}
                  disabled={busy}
                  className="btn-pill btn-primary flex-1 px-4 py-2 text-sm disabled:opacity-60"
                >
                  <PackageCheck className="h-4 w-4" /> Picked up
                </button>
                <button onClick={onChat} className="btn-pill btn-outline px-4 py-2 text-sm">
                  <MessageCircle className="h-4 w-4" /> Chat
                </button>
              </div>
              {row.volunteer_id ? (
                <p className="rounded-full bg-brand-soft py-2 text-center text-xs font-bold text-brand">
                  Volunteer driver assigned
                </p>
              ) : row.delivery_requested ? (
                <p className="rounded-full bg-secondary py-2 text-center text-xs font-bold text-muted-foreground">
                  Waiting for a volunteer driver…
                </p>
              ) : (
                <button
                  onClick={onRequestDelivery}
                  disabled={busy}
                  className="btn-pill btn-outline w-full px-4 py-2 text-sm disabled:opacity-60"
                >
                  <Bike className="h-4 w-4" /> Request a volunteer driver
                </button>
              )}
            </div>
          ) : (
            <p className="rounded-full bg-secondary py-2.5 text-center text-sm font-bold text-muted-foreground">
              {row.status === "CLAIMED"
                ? "Claimed by another receiver"
                : row.status === "PICKED_UP"
                  ? "Delivered"
                  : "Expired"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
