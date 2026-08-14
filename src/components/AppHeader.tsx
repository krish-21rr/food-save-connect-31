import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/food";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function AppHeader({ active }: { active?: "feed" | "donor" }) {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const fetchItems = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, message, read, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (active) setItems((data as Notification[]) ?? []);
    };
    void fetchItems();

    const channel = supabase
      .channel("notifications-header")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void fetchItems(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = items.filter((i) => !i.read).length;

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      const ids = items.filter((i) => !i.read).map((i) => i.id);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      await supabase.from("notifications").update({ read: true }).in("id", ids);
    }
  };

  const initials = (profile?.org_name || profile?.display_name || "FR")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="hidden truncate font-display text-xl font-extrabold sm:inline">
            Food Rescue
          </span>
        </Link>

        <nav className="ml-2 flex items-center gap-1 text-sm font-semibold">
          <Link
            to="/feed"
            className={`rounded-full px-3 py-1.5 ${active === "feed" ? "bg-brand-soft text-brand" : "text-muted-foreground hover:text-foreground"}`}
          >
            Live Feed
          </Link>
          {role === "donor" && (
            <Link
              to="/donor"
              className={`rounded-full px-3 py-1.5 ${active === "donor" ? "bg-brand-soft text-brand" : "text-muted-foreground hover:text-foreground"}`}
            >
              Donor Portal
            </Link>
          )}
        </nav>

        <div className="relative ml-auto flex items-center gap-2">
          <button
            onClick={() => void openPanel()}
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:border-brand"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-tangerine px-1 text-[11px] font-bold text-accent-foreground">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <div className="card-soft absolute right-0 top-12 z-40 max-h-96 w-80 overflow-y-auto p-3">
              <p className="px-2 py-1 text-sm font-bold">Notifications</p>
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Nothing yet — you'll hear from us when something happens.
                </p>
              ) : (
                items.map((n) => (
                  <div key={n.id} className="rounded-2xl px-2 py-2 hover:bg-secondary">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          <span
            title={profile?.display_name ?? ""}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tangerine-soft font-display text-sm font-extrabold text-accent-foreground"
          >
            {initials}
          </span>
          <button
            onClick={async () => {
              await signOut();
              void navigate({ to: "/auth", replace: true });
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:border-brand hover:text-brand"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
