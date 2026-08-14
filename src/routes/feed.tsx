import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Clock,
  MapPin,
  Search,
  Snowflake,
  Leaf,
  SearchX,
  UtensilsCrossed,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/feed")({
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

type Donation = {
  id: number;
  donor: string;
  posted: string;
  title: string;
  quantity: string;
  distance: string;
  deadline: string;
  veg: boolean;
  fridge: boolean;
  tags: string[];
};

const donations: Donation[] = [
  { id: 1, donor: "Green Bowl Kitchen", posted: "4 min ago", title: "Veg biryani & raita", quantity: "Serves 40", distance: "1.2 km", deadline: "Today, 9:30 PM", veg: true, fridge: false, tags: ["cooked", "veg", "soon"] },
  { id: 2, donor: "Sunrise Bakery", posted: "12 min ago", title: "Fresh breads & buns", quantity: "60 pieces", distance: "2.8 km", deadline: "Tomorrow, 8:00 AM", veg: true, fridge: false, tags: ["veg", "raw"] },
  { id: 3, donor: "Hotel Marigold", posted: "22 min ago", title: "Chicken curry & rice", quantity: "Serves 25", distance: "3.5 km", deadline: "Today, 10:00 PM", veg: false, fridge: true, tags: ["cooked", "soon"] },
  { id: 4, donor: "Farmgate Co-op", posted: "38 min ago", title: "Mixed seasonal vegetables", quantity: "35 kg", distance: "5.1 km", deadline: "Tomorrow, 11:00 AM", veg: true, fridge: true, tags: ["raw", "veg"] },
  { id: 5, donor: "Cafe Aroma", posted: "51 min ago", title: "Sandwiches & wraps", quantity: "48 packs", distance: "0.9 km", deadline: "Today, 8:45 PM", veg: false, fridge: true, tags: ["cooked", "soon"] },
  { id: 6, donor: "Wedding Hall 22", posted: "1 hr ago", title: "Paneer masala & naan", quantity: "Serves 80", distance: "6.4 km", deadline: "Today, 11:00 PM", veg: true, fridge: false, tags: ["cooked", "veg"] },
];

const filters = [
  { id: "all", label: "All" },
  { id: "veg", label: "Vegetarian" },
  { id: "cooked", label: "Cooked Meals" },
  { id: "raw", label: "Raw Produce" },
  { id: "soon", label: "Closing Soon" },
];

function FeedPage() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [claimed, setClaimed] = useState<number[]>([]);

  const visible = useMemo(
    () =>
      donations.filter((d) => {
        const matchFilter = filter === "all" || d.tags.includes(filter);
        const q = query.trim().toLowerCase();
        const matchQuery = !q || d.title.toLowerCase().includes(q) || d.donor.toLowerCase().includes(q);
        return matchFilter && matchQuery;
      }),
    [filter, query],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -left-28 -top-24 h-72 w-72 bg-brand-soft opacity-60" />
      <div className="blob -right-24 top-96 h-60 w-60 bg-sun opacity-40" />

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="truncate font-display text-xl font-extrabold">Food Rescue</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand sm:inline">
              Active Claims · {claimed.length}
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tangerine-soft font-display text-sm font-extrabold text-accent-foreground">
              KM
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Receiver view</p>
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Live Food Feed</h1>
          <span className="rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand">
            {visible.length} donation{visible.length === 1 ? "" : "s"} available
          </span>
        </div>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Fresh listings from donors near you. Claim early — most food is picked up within the hour.
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

        {visible.length === 0 ? (
          <div className="card-soft mt-10 flex flex-col items-center px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
              <SearchX className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">No donations match right now</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Try a different filter or clear your search — new listings appear here the moment donors
              publish them.
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
            {visible.map((d) => {
              const isClaimed = claimed.includes(d.id);
              return (
                <article key={d.id} className="card-soft flex flex-col p-6">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{d.donor}</p>
                      <p className="text-xs text-muted-foreground">{d.posted}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
                      {d.distance}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-extrabold leading-snug">{d.title}</h2>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-brand" /> {d.quantity}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-brand" /> {d.distance} away
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-tangerine" /> Pickup by {d.deadline}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        d.veg ? "bg-brand-soft text-brand" : "bg-tangerine-soft text-accent-foreground"
                      }`}
                    >
                      <Leaf className="h-3.5 w-3.5" /> {d.veg ? "Veg" : "Non-Veg"}
                    </span>
                    {d.fridge && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
                        <Snowflake className="h-3.5 w-3.5" /> Refrigeration
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setClaimed((c) => (c.includes(d.id) ? c : [...c, d.id]))}
                    disabled={isClaimed}
                    className={`btn-pill mt-6 w-full ${isClaimed ? "btn-outline opacity-70" : "btn-primary"}`}
                  >
                    {isClaimed ? "Claimed" : "Claim Food"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
