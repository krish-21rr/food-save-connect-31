import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, CheckCircle2, PackageCheck, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";
import {
  BUCKET,
  formatDeadline,
  statusLabel,
  timeAgo,
  timeLeft,
  useSignedUrls,
  type Donation,
} from "@/lib/food";

/** yyyy-MM-ddTHH:mm in the user's local timezone, for datetime-local inputs. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


export const Route = createFileRoute("/_authenticated/donor")({
  head: () => ({
    meta: [
      { title: "Donor Portal — Food Rescue" },
      {
        name: "description",
        content:
          "Post surplus food with photos, quantity and pickup deadline, then track every listing from claimed to picked up.",
      },
      { property: "og:title", content: "Donor Portal — Food Rescue" },
      {
        property: "og:description",
        content: "Publish surplus food and track pickups in real time.",
      },
    ],
  }),
  component: DonorPage,
});

const allergenOptions = ["Nuts", "Dairy", "Gluten", "Egg", "Soy", "Shellfish"];
const guidelines = [
  "Food must be prepared within the last 4 hours.",
  "Keep cooked items covered and above 60°C or refrigerated.",
  "Use clean, sealed containers for pickup.",
  "Label anything containing common allergens.",
  "Never list food past its safe consumption window.",
];

type Row = Donation & {
  receiver: { display_name: string; org_name: string | null; phone: string | null } | null;
};

function DonorPage() {
  const { user, profile, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("cooked");
  const [quantity, setQuantity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [notes, setNotes] = useState("");
  const [veg, setVeg] = useState(true);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const fetchRows = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const donations = (data as unknown as Donation[]) ?? [];
    const ids = [...new Set(donations.map((d) => d.claimed_by).filter(Boolean))] as string[];
    const { data: people } = ids.length
      ? await supabase.from("profiles").select("id, display_name, org_name, phone").in("id", ids)
      : { data: [] };
    const byId = new Map((people ?? []).map((p) => [p.id, p]));
    setRows(donations.map((d) => ({ ...d, receiver: (d.claimed_by && byId.get(d.claimed_by)) || null })));
  };

  useEffect(() => {
    if (!user) return;
    void fetchRows();
    const channel = supabase
      .channel("donor-donations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "donations", filter: `donor_id=eq.${user.id}` },
        () => void fetchRows(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (profile?.address && !address) setAddress(profile.address);
  }, [profile?.address]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
        if (upErr) throw upErr;
        paths.push(path);
      }

      const { error } = await supabase.from("donations").insert({
        donor_id: user.id,
        title: title.trim(),
        category,
        quantity: quantity.trim(),
        veg,
        allergens,
        deadline: new Date(deadline).toISOString(),
        address: address.trim(),
        notes: notes.trim() || null,
        image_urls: paths,
      });
      if (error) throw error;

      toast.success("Donation published — nearby receivers can see it now.");
      setTitle("");
      setQuantity("");
      setDeadline("");
      setNotes("");
      setAllergens([]);
      setFile(null);
      void fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish donation");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Listing removed");
    void fetchRows();
  };

  const markPicked = async (id: string) => {
    const { error } = await supabase.rpc("mark_picked_up", { _donation_id: id });
    if (error) toast.error(error.message);
    else toast.success("Pickup confirmed");
    void fetchRows();
  };

  if (role && role !== "donor") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader active="donor" />
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl font-extrabold">Donor portal</h1>
          <p className="mt-3 text-muted-foreground">
            Your account is registered as a receiver. Head to the live feed to claim food.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -right-24 -top-20 h-72 w-72 bg-tangerine-soft opacity-60" />
      <div className="blob -left-24 top-1/2 h-64 w-64 bg-brand-soft opacity-60" />
      <AppHeader active="donor" />

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10 pb-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Donor portal</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Donate Surplus Food</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Publish what's available and when it must be picked up. Receivers see it instantly and you get
          notified the moment someone claims it.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <form className="card-soft p-6 sm:p-8" onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Food Title" full>
                <input
                  className="field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Veg biryani & raita"
                  maxLength={120}
                  required
                />
              </Field>
              <Field label="Category">
                <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="cooked">Cooked meals</option>
                  <option value="raw">Raw produce</option>
                  <option value="bakery">Bakery</option>
                  <option value="packaged">Packaged goods</option>
                  <option value="dairy">Dairy</option>
                </select>
              </Field>
              <Field label="Quantity / Serves">
                <input
                  className="field"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Serves 40"
                  maxLength={60}
                  required
                />
              </Field>
              <Field label="Pickup Deadline" full>
                <input
                  className="field"
                  type="datetime-local"
                  min={toLocalInput(new Date(Date.now() + 5 * 60 * 1000))}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { label: "In 2 hours", h: 2 },
                    { label: "In 4 hours", h: 4 },
                    { label: "In 8 hours", h: 8 },
                    { label: "Tomorrow", h: 24 },
                  ].map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setDeadline(toLocalInput(new Date(Date.now() + q.h * 3600 * 1000)))}
                      className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                {deadline && (
                  <p
                    className={`mt-2 text-xs font-bold ${
                      new Date(deadline).getTime() > Date.now() ? "text-brand" : "text-destructive"
                    }`}
                  >
                    {new Date(deadline).getTime() > Date.now()
                      ? `Goes live now and stays visible for ${timeLeft(new Date(deadline).toISOString())}`
                      : "That time has already passed — receivers won't see this listing. Pick a future time."}
                  </p>
                )}
              </Field>

              <Field label="Pickup Address" full>
                <input
                  className="field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 Linking Road, Bandra West"
                  maxLength={200}
                  required
                />
              </Field>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">Food Type</p>
              <div className="mt-2 flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setVeg(v)}
                    className={`btn-pill px-5 py-2 text-sm ${veg === v ? "btn-primary" : "btn-outline"}`}
                  >
                    {v ? "Vegetarian" : "Non-Vegetarian"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">Allergens</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {allergenOptions.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setAllergens((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))
                    }
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                      allergens.includes(a)
                        ? "border-tangerine bg-tangerine-soft text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-tangerine"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Field label="Pickup Notes" full>
                <textarea
                  className="field min-h-28 resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  placeholder="Ring the back door bell. Ask for Ravi."
                />
              </Field>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-secondary/50 p-8 text-center transition-colors hover:border-brand">
              <Camera className="h-7 w-7 text-brand" />
              <span className="mt-3 text-sm font-bold">{file ? file.name : "Add a photo of the food"}</span>
              <span className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to 5 MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Remove photo
              </button>
            )}

            <button type="submit" disabled={busy} className="btn-pill btn-primary mt-7 w-full text-base disabled:opacity-60">
              {busy ? "Publishing…" : "Publish Food Donation"}
            </button>
          </form>

          <aside className="space-y-6">
            <section className="card-soft p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <ShieldCheck className="h-5 w-5 text-brand" /> Safety guidelines
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {guidelines.map((g) => (
                  <li key={g} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <section className="mt-14">
          <h2 className="text-3xl font-extrabold">Your listings</h2>
          <p className="mt-2 text-muted-foreground">
            Status updates live as receivers claim and collect your food.
          </p>

          {rows.length === 0 ? (
            <div className="card-soft mt-6 px-6 py-14 text-center text-muted-foreground">
              Nothing posted yet — your first donation will appear here.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <ListingCard
                  key={r.id}
                  row={r}
                  onDelete={() => void remove(r.id)}
                  onPicked={() => void markPicked(r.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ListingCard({
  row,
  onDelete,
  onPicked,
}: {
  row: Row;
  onDelete: () => void;
  onPicked: () => void;
}) {
  const images = useSignedUrls(row.image_urls ?? []);
  const receiver = row.receiver?.org_name || row.receiver?.display_name;

  return (
    <article className="card-soft overflow-hidden">
      {images[0] && <img src={images[0]} alt={row.title} loading="lazy" className="h-36 w-full object-cover" />}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-extrabold leading-snug">{row.title}</h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              row.status === "AVAILABLE"
                ? "bg-brand-soft text-brand"
                : row.status === "CLAIMED"
                  ? "bg-tangerine-soft text-accent-foreground"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {statusLabel[row.status]}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Posted {timeAgo(row.created_at)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{row.quantity}</p>
        <p className="text-sm text-muted-foreground">Pickup by {formatDeadline(row.deadline)}</p>
        {receiver && (
          <p className="mt-2 text-sm font-semibold">
            Claimed by {receiver}
            {row.receiver?.phone ? ` · ${row.receiver.phone}` : ""}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {row.status === "CLAIMED" && (
            <button onClick={onPicked} className="btn-pill btn-primary flex-1 px-4 py-2 text-sm">
              <PackageCheck className="h-4 w-4" /> Picked up
            </button>
          )}
          {row.status === "AVAILABLE" && (
            <button onClick={onDelete} className="btn-pill btn-outline flex-1 px-4 py-2 text-sm">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-bold">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
