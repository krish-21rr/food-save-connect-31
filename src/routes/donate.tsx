import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate Surplus Food — Food Rescue" },
      {
        name: "description",
        content:
          "List surplus food with quantity, pickup deadline and allergen details so nearby NGOs can claim it in minutes.",
      },
      { property: "og:title", content: "Donate Surplus Food — Food Rescue" },
      {
        property: "og:description",
        content: "Post surplus food in under a minute and let nearby shelters claim it.",
      },
    ],
  }),
  component: DonatePage,
});

const allergens = ["Nuts", "Dairy", "Gluten", "Egg", "Soy", "Shellfish"];
const guidelines = [
  "Food must be prepared within the last 4 hours.",
  "Keep cooked items covered and above 60°C or refrigerated.",
  "Use clean, sealed containers for pickup.",
  "Label anything containing common allergens.",
  "Never list food past its safe consumption window.",
];
const timeline = [
  { icon: Bell, title: "Instant alert", body: "Verified NGOs within your radius are notified right away." },
  { icon: CheckCircle2, title: "A claim locks it", body: "The first responder confirms and you get their contact." },
  { icon: Truck, title: "Pickup & delivery", body: "A volunteer collects before your deadline and confirms handover." },
];

function DonatePage() {
  const [diet, setDiet] = useState<"veg" | "nonveg">("veg");
  const [picked, setPicked] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (a: string) =>
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -right-24 -top-20 h-72 w-72 bg-tangerine-soft opacity-60" />
      <div className="blob -left-24 top-1/2 h-64 w-64 bg-brand-soft opacity-60" />

      <header className="relative z-10 mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="truncate font-display text-xl font-extrabold">Food Rescue</span>
        </Link>
        <Link to="/" className="btn-pill btn-outline px-5 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Donor form</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Donate Surplus Food</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Tell us what's available and when it needs to be picked up. Nearby shelters and NGOs see your
            listing the moment you publish it.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <form
            className="card-soft p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Donor Name">
                <input className="field" placeholder="Green Bowl Kitchen" required />
              </Field>
              <Field label="Phone Number">
                <input className="field" type="tel" placeholder="+91 98765 43210" required />
              </Field>
              <Field label="Food Title" full>
                <input className="field" placeholder="Veg biryani & raita" required />
              </Field>
              <Field label="Category">
                <select className="field" defaultValue="cooked">
                  <option value="cooked">Cooked meals</option>
                  <option value="raw">Raw produce</option>
                  <option value="bakery">Bakery</option>
                  <option value="packaged">Packaged goods</option>
                  <option value="dairy">Dairy</option>
                </select>
              </Field>
              <Field label="Quantity / Serves">
                <input className="field" placeholder="Serves 40" required />
              </Field>
              <Field label="Expiration / Pickup Deadline" full>
                <input className="field" type="datetime-local" required />
              </Field>
              <Field label="Pickup Address" full>
                <input className="field" placeholder="14 Linking Road, Bandra West" required />
              </Field>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">Food Type</p>
              <div className="mt-2 flex gap-2">
                {(["veg", "nonveg"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiet(d)}
                    className={`btn-pill px-5 py-2 text-sm ${diet === d ? "btn-primary" : "btn-outline"}`}
                  >
                    {d === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">Allergens</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {allergens.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggle(a)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                      picked.includes(a)
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
                  placeholder="Ring the back door bell. Ask for Ravi. Containers can be returned next day."
                />
              </Field>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-secondary/50 p-8 text-center transition-colors hover:border-brand">
              <Camera className="h-7 w-7 text-brand" />
              <span className="mt-3 text-sm font-bold">Add a photo of the food</span>
              <span className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to 5 MB</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>

            <button type="submit" className="btn-pill btn-primary mt-7 w-full text-base">
              Publish Food Donation
            </button>
            {submitted && (
              <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-center text-sm font-semibold text-brand">
                Donation published — nearby NGOs have been alerted.
              </p>
            )}
          </form>

          <aside className="space-y-6">
            <section className="card-soft p-6 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-extrabold">Safety First Guidelines</h2>
              <ul className="mt-4 space-y-3">
                {guidelines.map((g) => (
                  <li key={g} className="flex gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card-soft p-6 sm:p-7">
              <h2 className="text-2xl font-extrabold">What Happens Next?</h2>
              <ol className="mt-5 space-y-5">
                {timeline.map((t, i) => (
                  <li key={t.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-tangerine-soft text-tangerine">
                        <t.icon className="h-5 w-5" />
                      </span>
                      {i < timeline.length - 1 && <span className="mt-2 h-full w-px flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="font-bold">{t.title}</p>
                      <p className="text-sm text-muted-foreground">{t.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
