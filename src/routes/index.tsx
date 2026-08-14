import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, HeartHandshake, Sprout, Truck, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Food Rescue — Rescue Food, Feed Hope" },
      {
        name: "description",
        content:
          "List surplus food in seconds and let nearby NGOs and shelters claim it in real time. Don't waste, donate food.",
      },
      { property: "og:title", content: "Food Rescue — Rescue Food, Feed Hope" },
      {
        property: "og:description",
        content: "Connect surplus food with nearby NGOs and shelters in real time.",
      },
    ],
  }),
  component: Landing,
});

function Header() {
  return (
    <header className="relative z-10 mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-6">
      <Link to="/" className="flex min-w-0 items-center gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        <span className="truncate font-display text-xl font-extrabold">Food Rescue</span>
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5">
        <a href="#how" className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:block">
          How it works
        </a>
        <Link to="/feed" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          Log In
        </Link>
        <Link to="/donate" className="btn-pill btn-primary px-5 py-2.5 text-sm">
          Sign Up
        </Link>
      </nav>
    </header>
  );
}

const steps = [
  {
    icon: Sprout,
    eyebrow: "Step 01",
    title: "List Surplus Food",
    body: "Restaurants, caterers and households post leftover meals with quantity, pickup window and photos in under a minute.",
    tint: "bg-brand-soft text-brand",
  },
  {
    icon: Bell,
    eyebrow: "Step 02",
    title: "Real-Time Alerts",
    body: "Nearby NGOs, shelters and volunteers get an instant alert the moment food is listed within their pickup radius.",
    tint: "bg-tangerine-soft text-tangerine",
  },
  {
    icon: Truck,
    eyebrow: "Step 03",
    title: "Rescue & Deliver",
    body: "A claim locks the donation, a volunteer collects it before the deadline, and the meal reaches a plate the same day.",
    tint: "bg-accent text-accent-foreground",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -left-24 -top-24 h-72 w-72 bg-brand-soft opacity-70" />
      <div className="blob -right-20 top-40 h-64 w-64 bg-tangerine-soft opacity-70" />

      <Header />

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand">
              Don't waste, donate food
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              Rescue Food,
              <br />
              <span className="text-brand">Feed Hope.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Food Rescue connects donors with NGOs, shelters and volunteers in real time — so surplus
              meals travel to people who need them instead of the bin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/donate" className="btn-pill btn-primary text-base">
                I Want to Donate
              </Link>
              <Link to="/feed" className="btn-pill btn-outline text-base">
                I Need Food
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ["12.4k", "Meals rescued"],
                ["340", "Partner NGOs"],
                ["18 min", "Avg. claim time"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-extrabold text-foreground">{n}</dt>
                  <dd className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="card-soft relative z-10 p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live nearby</p>
                <span className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                  <span className="h-2 w-2 rounded-full bg-brand" /> 6 open
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Green Bowl Kitchen", "Veg biryani · Serves 40", "1.2 km"],
                  ["Sunrise Bakery", "Fresh breads · 60 pcs", "2.8 km"],
                  ["Hotel Marigold", "Cooked curry · Serves 25", "3.5 km"],
                ].map(([donor, food, dist]) => (
                  <div
                    key={donor}
                    className="flex items-center gap-3 rounded-3xl border border-border bg-secondary/50 p-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun/60">
                      <HeartHandshake className="h-5 w-5 text-accent-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{donor}</p>
                      <p className="truncate text-sm text-muted-foreground">{food}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-sm font-bold text-brand">{dist}</span>
                  </div>
                ))}
              </div>
              <Link to="/feed" className="btn-pill btn-primary mt-5 w-full">
                Open live feed
              </Link>
            </div>
            <div className="blob -bottom-10 -right-8 h-40 w-40 bg-sun opacity-60" />
          </div>
        </section>

        <section id="how" className="relative bg-secondary/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-tangerine">
              The rescue loop
            </p>
            <h2 className="mt-3 text-center text-4xl font-extrabold sm:text-5xl">How Food Rescue Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Three simple steps between surplus on a counter and a warm meal in someone's hands.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <article key={s.title} className="card-soft p-7">
                  <span className={`grid h-14 w-14 place-items-center rounded-3xl ${s.tint}`}>
                    <s.icon className="h-7 w-7" />
                  </span>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {s.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="card-soft grid items-center gap-8 bg-brand p-10 text-brand-foreground md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold sm:text-4xl">Got food left over tonight?</h2>
              <p className="mt-3 max-w-xl opacity-90">
                It takes about 60 seconds to list. A nearby shelter could be on the way before you finish
                cleaning up.
              </p>
            </div>
            <Link
              to="/donate"
              className="btn-pill shrink-0 bg-card text-base text-foreground hover:bg-secondary"
            >
              Donate Surplus Food
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-secondary/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold">Food Rescue</p>
            <p className="text-sm text-muted-foreground">© 2026 Food Rescue. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
            <a href="#how" className="hover:text-brand">About</a>
            <a href="#how" className="hover:text-brand">Partners</a>
            <a href="#how" className="hover:text-brand">Privacy</a>
            <a href="#how" className="hover:text-brand">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
