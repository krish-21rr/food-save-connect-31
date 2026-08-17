import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bike, Clock, MapPin, MessageCircle, PackageCheck, Phone, Users, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { ChatPanel } from "@/components/ChatPanel";
import { useAuth } from "@/lib/auth";
import { formatDeadline, timeLeft, type Donation } from "@/lib/food";

export const Route = createFileRoute("/_authenticated/volunteer")({
  head: () => ({
    meta: [
      { title: "Delivery Runs — Food Rescue" },
      {
        name: "description",
        content:
          "Volunteer drivers accept pickup-and-delivery runs, chat with the donor and receiver, and confirm handover.",
      },
      { property: "og:title", content: "Delivery Runs — Food Rescue" },
      {
        property: "og:description",
        content: "Accept a food rescue delivery run and get the meal where it's needed.",
      },
    ],
  }),
  component: VolunteerPage,
});

type Person = { id: string; display_name: string; org_name: string | null; phone: string | null };
type Row = Donation & { donor: Person | null; receiver: Person | null };

function VolunteerPage() {
  const { user, profile, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chat, setChat] = useState<{ id: string; title: string } | null>(null);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("status", "CLAIMED")
      .eq("delivery_requested", true)
      .order("deadline", { ascending: true })
      .limit(100);
    if (error) toast.error(error.message);
    const donations = (data as unknown as Donation[]) ?? [];
    const ids = [
      ...new Set(donations.flatMap((d) => [d.donor_id, d.claimed_by]).filter(Boolean)),
    ] as string[];
    const { data: people } = ids.length
      ? await supabase.from("profiles").select("id, display_name, org_name, phone").in("id", ids)
      : { data: [] };
    const byId = new Map(((people as Person[]) ?? []).map((p) => [p.id, p]));
    setRows(
      donations.map((d) => ({
        ...d,
        donor: byId.get(d.donor_id) ?? null,
        receiver: (d.claimed_by && byId.get(d.claimed_by)) || null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void fetchRows();
    const channel = supabase
      .channel("volunteer-donations")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => {
        void fetchRows();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const open = useMemo(() => rows.filter((r) => !r.volunteer_id), [rows]);
  const mine = useMemo(() => rows.filter((r) => r.volunteer_id === user?.id), [rows, user?.id]);

  const run = async (fn: string, id: string, ok: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc(fn as "accept_delivery", { _donation_id: id });
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success(ok);
    void fetchRows();
  };

  if (role && role !== "volunteer") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader active="volunteer" />
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl font-extrabold">Delivery runs</h1>
          <p className="mt-3 text-muted-foreground">
            This board is for volunteer drivers. Your account is registered as a{" "}
            {role === "donor" ? "donor" : "receiver"}.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -left-28 -top-24 h-72 w-72 bg-brand-soft opacity-60" />
      <div className="blob -right-24 top-96 h-60 w-60 bg-sun opacity-40" />
      <AppHeader active="volunteer" />

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">
          {profile?.display_name || "Volunteer"} view
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Delivery Runs</h1>
          <span className="rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand">
            {open.length} open run{open.length === 1 ? "" : "s"}
          </span>
          {mine.length > 0 && (
            <span className="rounded-full bg-tangerine-soft px-4 py-1.5 text-sm font-bold text-accent-foreground">
              {mine.length} assigned to you
            </span>
          )}
        </div>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Claimed food that needs a driver. Accept a run, coordinate in chat, then confirm the
          handover once it's delivered.
        </p>

        {mine.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-extrabold">Your runs</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((r) => (
                <RunCard
                  key={r.id}
                  row={r}
                  assigned
                  busy={busyId === r.id}
                  onAccept={() => void run("accept_delivery", r.id, "Run accepted")}
                  onCancel={() => void run("cancel_delivery", r.id, "Run released")}
                  onDelivered={() => void run("mark_picked_up", r.id, "Delivery confirmed — thank you!")}
                  onChat={() => setChat({ id: r.id, title: r.title })}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Open runs</h2>
          {loading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card-soft h-56 animate-pulse p-6" />
              ))}
            </div>
          ) : open.length === 0 ? (
            <div className="card-soft mt-5 flex flex-col items-center px-6 py-14 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
                <Bike className="h-8 w-8" />
              </span>
              <h3 className="mt-5 text-xl font-extrabold">No runs waiting right now</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                When a receiver asks for a driver, the run pops up here instantly.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {open.map((r) => (
                <RunCard
                  key={r.id}
                  row={r}
                  busy={busyId === r.id}
                  onAccept={() => void run("accept_delivery", r.id, "Run accepted — you're the driver!")}
                  onCancel={() => void run("cancel_delivery", r.id, "Run released")}
                  onDelivered={() => void run("mark_picked_up", r.id, "Delivery confirmed")}
                  onChat={() => setChat({ id: r.id, title: r.title })}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {chat && <ChatPanel donationId={chat.id} title={chat.title} onClose={() => setChat(null)} />}
    </div>
  );
}

function RunCard({
  row,
  assigned,
  busy,
  onAccept,
  onCancel,
  onDelivered,
  onChat,
}: {
  row: Row;
  assigned?: boolean;
  busy: boolean;
  onAccept: () => void;
  onCancel: () => void;
  onDelivered: () => void;
  onChat: () => void;
}) {
  const donor = row.donor?.org_name || row.donor?.display_name || "Donor";
  const receiver = row.receiver?.org_name || row.receiver?.display_name || "Receiver";

  return (
    <article className="card-soft flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-extrabold leading-snug">{row.title}</h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            assigned ? "bg-tangerine-soft text-accent-foreground" : "bg-brand-soft text-brand"
          }`}
        >
          {assigned ? "Your run" : "Open"}
        </span>
      </div>

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
          <span className="line-clamp-2">
            Pick up from {donor} — {row.address}
          </span>
        </p>
        <p className="flex items-start gap-2">
          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>Deliver to {receiver}</span>
        </p>
        {assigned && row.receiver?.phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-brand" /> {row.receiver.phone}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {assigned ? (
          <>
            <button
              onClick={onDelivered}
              disabled={busy}
              className="btn-pill btn-primary flex-1 px-4 py-2 text-sm disabled:opacity-60"
            >
              <PackageCheck className="h-4 w-4" /> Delivered
            </button>
            <button onClick={onChat} className="btn-pill btn-outline px-4 py-2 text-sm">
              <MessageCircle className="h-4 w-4" /> Chat
            </button>
            <button
              onClick={onCancel}
              disabled={busy}
              aria-label="Release run"
              className="btn-pill btn-outline px-3 py-2 text-sm disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onAccept}
            disabled={busy}
            className="btn-pill btn-primary w-full disabled:opacity-60"
          >
            <Bike className="h-4 w-4" /> {busy ? "Accepting…" : "Accept run"}
          </button>
        )}
      </div>
    </article>
  );
}
