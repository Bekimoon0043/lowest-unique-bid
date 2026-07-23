/**
 * Midnight Vault — Home Page
 * Lists all active auctions with hero banner
 * Design: dark navy bg, gold accents, Playfair Display headings
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase, type Item } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Trophy, Users, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import CountdownTimer from "@/components/CountdownTimer";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetchItems();
    // Real-time subscription
    const channel = supabase
      .channel("items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        fetchItems();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load auctions");
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }

  const activeItems = items.filter((i) => i.status === "active");
  const endedItems = items.filter((i) => i.status === "ended");

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/manus-storage/hero-banner_ef046864.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-36">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: "var(--gold)" }} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: "var(--gold)" }}>
                The Strategic Auction
              </span>
            </div>
            <h1
              className="text-5xl sm:text-6xl font-black leading-tight mb-5"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              One Number.<br />
              <span style={{ color: "var(--gold)" }}>One Winner.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Pay the entry fee, pick your number. The lowest <strong className="text-foreground">unique</strong> number wins the prize. Strategy beats luck every time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground font-semibold hover:opacity-90 gap-2"
                onClick={() => document.getElementById("auctions")?.scrollIntoView({ behavior: "smooth" })}
              >
                Browse Auctions <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2
          className="text-2xl font-bold mb-8 text-center"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Users className="w-6 h-6" />, step: "01", title: "Pay to Enter", desc: "Pay the fixed bid amount to join an auction. This fee is non-refundable." },
            { icon: <Trophy className="w-6 h-6" />, step: "02", title: "Pick Your Number", desc: "Choose any number starting from 1. Think strategically — others are choosing too." },
            { icon: <Sparkles className="w-6 h-6" />, step: "03", title: "Lowest Unique Wins", desc: "The winner is whoever picked the lowest number that nobody else picked." },
          ].map((item) => (
            <div
              key={item.step}
              className="relative bg-card border border-border rounded-xl p-6 overflow-hidden group hover:border-primary/40 transition-all duration-200"
            >
              <div
                className="text-5xl font-black absolute top-4 right-5 opacity-10 select-none"
                style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
              >
                {item.step}
              </div>
              <div className="mb-3 text-muted-foreground">{item.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Auctions */}
      <section id="auctions" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Live Auctions
          </h2>
          {activeItems.length > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {activeItems.length} Active
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-card" />
            ))}
          </div>
        ) : activeItems.length === 0 ? (
          <div className="relative border border-border/50 rounded-2xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60" />
            <div className="relative">
              <div
                className="text-8xl font-black opacity-5 select-none absolute -top-4 left-1/2 -translate-x-1/2"
                style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
              >?</div>
              <Trophy className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                The vault is empty.
              </p>
              <p className="text-sm text-muted-foreground">
                No auctions are live right now. The next one could be yours to win.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeItems.map((item) => (
              <AuctionCard key={item.id} item={item} onClick={() => navigate(`/auction/${item.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* Ended Auctions */}
      {endedItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <h2
            className="text-2xl font-bold mb-6 text-muted-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Past Auctions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
            {endedItems.map((item) => (
              <AuctionCard key={item.id} item={item} onClick={() => navigate(`/auction/${item.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AuctionCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const isActive = item.status === "active";
  return (
    <div
      onClick={onClick}
      className={`relative bg-card rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl ${isActive ? "auction-active" : "border border-border"}`}
    >
      {/* Image */}
      <div className="h-44 bg-secondary overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="absolute top-3 right-3">
        {isActive ? (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block mr-1.5 animate-pulse" />
            Live
          </Badge>
        ) : (
          <Badge className="bg-muted text-muted-foreground border-border text-xs">Ended</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Entry Fee</p>
            <p
              className="text-xl font-bold number-badge"
              style={{ color: "var(--gold)" }}
            >
              ${item.bid_amount.toLocaleString()}
            </p>
          </div>
          {item.status === "ended" && item.winning_number && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Winning #</p>
              <p className="text-xl font-bold number-badge" style={{ color: "var(--gold)" }}>
                {item.winning_number}
              </p>
            </div>
          )}
          {isActive && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Time Left</p>
              <CountdownTimer endTime={item.end_time} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
