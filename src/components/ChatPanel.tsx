import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/food";

type Message = {
  id: string;
  donation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** Chat between the donor, the receiver who claimed, and the assigned volunteer. */
export function ChatPanel({
  donationId,
  title,
  onClose,
}: {
  donationId: string;
  title: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("donation_id", donationId)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = (data as Message[]) ?? [];
    setMessages(rows);
    setLoading(false);

    const ids = [...new Set(rows.map((m) => m.sender_id))];
    if (ids.length) {
      const { data: people } = await supabase
        .from("profiles")
        .select("id, display_name, org_name")
        .in("id", ids);
      setNames(
        Object.fromEntries(
          (people ?? []).map((p) => [p.id, p.org_name || p.display_name || "Member"]),
        ),
      );
    }
  };

  useEffect(() => {
    void fetchAll();
    const channel = supabase
      .channel(`messages-${donationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `donation_id=eq.${donationId}`,
        },
        () => void fetchAll(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [donationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    setBusy(true);
    const { error } = await supabase
      .from("messages")
      .insert({ donation_id: donationId, sender_id: user.id, body });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    void fetchAll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6">
      <div className="card-soft flex h-[85vh] w-full max-w-lg flex-col overflow-hidden sm:h-[70vh]">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-extrabold">{title}</p>
            <p className="text-xs text-muted-foreground">Donor · receiver · volunteer</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-border hover:border-brand"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <p className="mx-auto max-w-xs pt-10 text-center text-sm text-muted-foreground">
              No messages yet — say hello and agree on the pickup time.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    {!mine && (
                      <p className="mb-1 px-1 text-xs font-bold text-muted-foreground">
                        {names[m.sender_id] ?? "Member"}
                      </p>
                    )}
                    <div
                      className={`rounded-3xl px-4 py-2.5 text-sm ${
                        mine ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      {m.body}
                    </div>
                    <p className={`mt-1 px-1 text-[11px] text-muted-foreground ${mine ? "text-right" : ""}`}>
                      {timeAgo(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-border px-4 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="field py-2.5"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            aria-label="Send message"
            className="btn-pill btn-primary grid h-11 w-11 shrink-0 place-items-center p-0 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
