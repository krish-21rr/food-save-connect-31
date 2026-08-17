import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bike, HeartHandshake, Store, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AccountRole } from "@/lib/auth";

type Search = { role?: AccountRole; mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const role = search["role"];
    const mode = search["mode"];
    return {
      ...(role === "donor" || role === "receiver" || role === "volunteer" ? { role } : {}),
      ...(mode === "signin" || mode === "signup" ? { mode } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in or Join — Food Rescue" },
      {
        name: "description",
        content:
          "Create a Food Rescue account as a donor restaurant or a receiving NGO and start rescuing surplus food today.",
      },
      { property: "og:title", content: "Sign in or Join — Food Rescue" },
      {
        property: "og:description",
        content: "Donor and receiver accounts for the Food Rescue network.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { session, role: myRole, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [role, setRole] = useState<AccountRole>(search.role ?? "receiver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !session || !myRole) return;
    void navigate({ to: myRole === "donor" ? "/donor" : myRole === "volunteer" ? "/volunteer" : "/feed", replace: true });
  }, [loading, session, myRole, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              role,
              display_name: displayName || email.split("@")[0],
              org_name: orgName,
              phone,
              address,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to Food Rescue!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="blob -left-24 -top-20 h-72 w-72 bg-brand-soft opacity-60" />
      <div className="blob -right-24 bottom-10 h-64 w-64 bg-tangerine-soft opacity-60" />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="truncate font-display text-xl font-extrabold">Food Rescue</span>
        </Link>
        <Link to="/" className="btn-pill btn-outline px-5 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-xl px-5 pb-20">
        <h1 className="text-4xl font-extrabold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "signup"
            ? "Pick how you'll use Food Rescue. You can post surplus food or claim it."
            : "Sign in to post or claim surplus food."}
        </p>

        <form className="card-soft mt-8 p-6 sm:p-8" onSubmit={submit}>
          {mode === "signup" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  { id: "donor", label: "I'm a Donor", sub: "Restaurant, hotel, individual", icon: Store },
                  { id: "receiver", label: "I'm a Receiver", sub: "NGO, shelter, individual", icon: HeartHandshake },
                  { id: "volunteer", label: "I'm a Volunteer", sub: "Driver for pickup & delivery", icon: Bike },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={`rounded-3xl border-2 p-4 text-left transition-colors ${
                    role === opt.id ? "border-brand bg-brand-soft" : "border-border hover:border-brand"
                  }`}
                >
                  <opt.icon className="h-5 w-5 text-brand" />
                  <p className="mt-2 font-bold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.sub}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {mode === "signup" && (
              <>
                <Field label="Your Name">
                  <input
                    className="field"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ravi Menon"
                    required
                  />
                </Field>
                <Field label={role === "donor" ? "Business Name" : "Organisation (optional)"}>
                  <input
                    className="field"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={role === "donor" ? "Green Bowl Kitchen" : "Hope Shelter"}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className="field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </Field>
                <Field label="Address">
                  <input
                    className="field"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="14 Linking Road, Bandra West"
                  />
                </Field>
              </>
            )}
            <Field label="Email" full>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password" full>
              <input
                className="field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </Field>
          </div>

          <button type="submit" disabled={busy} className="btn-pill btn-primary mt-7 w-full disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to Food Rescue?"}{" "}
            <button
              type="button"
              className="font-bold text-brand"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </main>
    </div>
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
