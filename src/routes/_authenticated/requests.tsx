import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  HandHeart,
  Leaf,
  MapPin,
  Plus,
  Soup,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import { formatDeadline, timeAgo, timeLeft } from "@/lib/food";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Food Request Board — Food Rescue" },
      {
        name: "description",
        content:
          "Shelters and community kitchens post the meals they need; donors browse open requests and fulfil them.",
      },
      { property: "og:title", content: "Food Request Board — Food Rescue" },
      {
        property: "og:description",
        content: "Post what you need, or fulfil an open request from a nearby receiver.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestsPage,
});

type RequestStatus = "OPEN" | "FULFILLED" | "CANCELLED";

type FoodRequest = {
  id: string;
  receiver_id: string;
  title: string;
  meals_needed: number;
  needed_by: string;
  address: string;
  notes: string | null;
  veg_only: boolean;
  status: RequestStatus;
  fulfilled_by: string | null;
  fulfilled_donation_id: string | null;
  created_at: string;
};

type Row = FoodRequest & {
  receiver: { display_name: string; org_name: string | null; phone: string | null } | null;
};

type MyDonation = { id: string; title: string; status: string };

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function RequestsPage() {
  const { user, role, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"open" | "mine" | "closed">("open");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState<Row | null>(null);
  const [myDonations, setMyDonations] = useState<MyDonation[]>([]);

  const fetchRows = async () => {
    const { data } = await supabase
      .from("food_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const list = (data as FoodRequest[]) ?? [];
    const ids = [...new Set(list.map((r) => r.receiver_id))];
    let profiles: Record<string, Row["receiver"]> = {};
    if (ids.length) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, display_name, org_name, phone")
        .in("id", ids);
      profiles = Object.fromEntries(
        (p ?? []).map((x) => [
          x.id,
          { display_name: x.display_name, org_name: x.org_name, phone: x.phone },
        ]),
      );
    }
    setRows(list.map((r) => ({ ...r, receiver: profiles[r.receiver_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    void fetchRows();
    const channel = supabase
      .channel("food-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_requests" }, () =>
        void fetchRows(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (role !== "donor" || !user) return;
    void supabase
      .from("donations")
      .select("id, title, status")
      .eq("donor_id", user.id)
      .in("status", ["AVAILABLE", "CLAIMED"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyDonations((data as MyDonation[]) ?? []));
  }, [role, user]);

  const visible = useMemo(() => {
    if (tab === "mine") return rows.filter((r) => r.receiver_id === user?.id);
    if (tab === "closed") return rows.filter((r) => r.status !== "OPEN");
    return rows.filter((r) => r.status === "OPEN");
  }, [rows, tab, user]);

  const cancel = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("cancel_request", { _request_id: id });
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success("Request closed");
    void fetchRows();
  };

  const fulfill = async (req: Row, donationId: string | null) => {
    setBusyId(req.id);
    const { error } = await supabase.rpc(
      "fulfill_request",
      donationId ? { _request_id: req.id, _donation_id: donationId } : { _request_id: req.id },
    );
    setBusyId(null);
    setFulfilling(null);
    if (error) toast.error(error.message);
    else toast.success("Thank you! The receiver has been notified.");
    void fetchRows();
  };

  const openCount = rows.filter((r) => r.status === "OPEN").length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -right-28 -top-24 h-72 w-72 bg-tangerine-soft opacity-60" />
      <div className="blob -left-24 top-96 h-60 w-60 bg-brand-soft opacity-50" />
      <AppHeader active="requests" />

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">
          {profile?.org_name || profile?.display_name || "Community"} board
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Request Board</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Receivers post what they need and by when. Donors browse open requests and fulfil the
              ones they can cover.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand">
              {openCount} open
            </span>
            {role === "receiver" && (
              <button onClick={() => setShowForm(true)} className="btn-pill btn-primary">
                <Plus className="h-4 w-4" /> Post a request
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(
            [
              { id: "open", label: "Open requests" },
              { id: "mine", label: "My requests" },
              { id: "closed", label: "Fulfilled & closed" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn-pill px-5 py-2 text-sm ${tab === t.id ? "btn-primary" : "btn-outline"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-soft h-56 animate-pulse p-6" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="card-soft mt-10 flex flex-col items-center px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
              <Soup className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">Nothing on the board yet</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              {role === "receiver"
                ? "Post what your kitchen needs this week — donors get it instantly."
                : "Open requests from shelters and kitchens will appear here in real time."}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((r) => (
              <RequestCard
                key={r.id}
                row={r}
                mine={r.receiver_id === user?.id}
                canFulfil={role === "donor" && r.status === "OPEN" && r.receiver_id !== user?.id}
                busy={busyId === r.id}
                onCancel={() => void cancel(r.id)}
                onFulfil={() => setFulfilling(r)}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <RequestForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void fetchRows();
          }}
        />
      )}

      {fulfilling && (
        <FulfilDialog
          request={fulfilling}
          donations={myDonations}
          busy={busyId === fulfilling.id}
          onClose={() => setFulfilling(null)}
          onConfirm={(donationId) => void fulfill(fulfilling, donationId)}
        />
      )}
    </div>
  );
}

const statusStyle: Record<RequestStatus, string> = {
  OPEN: "bg-brand-soft text-brand",
  FULFILLED: "bg-tangerine-soft text-accent-foreground",
  CANCELLED: "bg-secondary text-muted-foreground",
};

function RequestCard({
  row,
  mine,
  canFulfil,
  busy,
  onCancel,
  onFulfil,
}: {
  row: Row;
  mine: boolean;
  canFulfil: boolean;
  busy: boolean;
  onCancel: () => void;
  onFulfil: () => void;
}) {
  const name = row.receiver?.org_name || row.receiver?.display_name || "Receiver";
  return (
    <article className="card-soft flex flex-col p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(row.created_at)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[row.status]}`}
        >
          {row.status.toLowerCase()}
        </span>
      </div>

      <h2 className="mt-4 text-xl font-extrabold leading-snug">{row.title}</h2>

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-brand" /> {row.meals_needed} meals needed
        </p>
        <p className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 text-tangerine" />{" "}
          {formatDeadline(row.needed_by)} · {timeLeft(row.needed_by)}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span className="line-clamp-2">{row.address}</span>
        </p>
      </div>

      {row.veg_only && (
        <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
          <Leaf className="h-3.5 w-3.5" /> Vegetarian only
        </span>
      )}

      {row.notes && <p className="mt-3 text-sm text-muted-foreground">{row.notes}</p>}

      <div className="mt-auto pt-5">
        {canFulfil ? (
          <button
            onClick={onFulfil}
            disabled={busy}
            className="btn-pill btn-primary w-full disabled:opacity-60"
          >
            <HandHeart className="h-4 w-4" /> {busy ? "Sending…" : "I can fulfil this"}
          </button>
        ) : mine && row.status === "OPEN" ? (
          <button
            onClick={onCancel}
            disabled={busy}
            className="btn-pill btn-outline w-full disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Close request
          </button>
        ) : (
          <p className="rounded-full bg-secondary py-2.5 text-center text-sm font-bold text-muted-foreground">
            {row.status === "FULFILLED"
              ? "A donor is covering this"
              : row.status === "CANCELLED"
                ? "Closed"
                : "Waiting for a donor"}
          </p>
        )}
      </div>
    </article>
  );
}

function RequestForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [meals, setMeals] = useState("25");
  const [neededBy, setNeededBy] = useState(
    toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  );
  const [address, setAddress] = useState(profile?.address ?? "");
  const [notes, setNotes] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!title.trim() || !address.trim()) {
      toast.error("Add a title and a delivery address");
      return;
    }
    const when = new Date(neededBy);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      toast.error("Pick a needed-by time in the future");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("food_requests").insert({
      receiver_id: user.id,
      title: title.trim(),
      meals_needed: Math.max(1, Number(meals) || 1),
      needed_by: when.toISOString(),
      address: address.trim(),
      notes: notes.trim() || null,
      veg_only: vegOnly,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request posted — donors can see it now.");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="card-soft my-8 w-full max-w-lg p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-extrabold leading-tight">Post a request</p>
            <p className="text-sm text-muted-foreground">
              Tell donors what you need and by when.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:border-brand"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">What do you need?</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hot dinners for our night shelter"
              className="field mt-1.5"
              maxLength={120}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold">Meals needed</span>
              <input
                type="number"
                min={1}
                value={meals}
                onChange={(e) => setMeals(e.target.value)}
                className="field mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Needed by</span>
              <input
                type="datetime-local"
                min={toLocalInput(new Date())}
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                className="field mt-1.5"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold">Delivery / collection address</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Grace Street, Kolkata"
              className="field mt-1.5"
              maxLength={200}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Notes for donors</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="We can collect ourselves, containers provided."
              className="field mt-1.5"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="h-5 w-5 rounded-md accent-brand"
            />
            Vegetarian only
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-pill btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="btn-pill btn-primary flex-1 disabled:opacity-60"
          >
            {busy ? "Posting…" : "Post request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FulfilDialog({
  request,
  donations,
  busy,
  onClose,
  onConfirm,
}: {
  request: Row;
  donations: MyDonation[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (donationId: string | null) => void;
}) {
  const [selected, setSelected] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="card-soft w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <HandHeart className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-tight">Fulfil this request</p>
            <p className="truncate text-sm text-muted-foreground">{request.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:border-brand"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          Optionally link one of your listings so the receiver knows exactly what's coming.
        </p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="field mt-2"
        >
          <option value="">No listing — I'll arrange it directly</option>
          {donations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} ({d.status.toLowerCase()})
            </option>
          ))}
        </select>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-pill btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected || null)}
            disabled={busy}
            className="btn-pill btn-primary flex-1 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
