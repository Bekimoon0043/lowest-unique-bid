/**
 * Midnight Vault — Auction Detail Page
 * Users pay entry fee then pick a number
 * Design: dark navy, gold accents, dramatic number selection UI
 */
import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { supabase, type Item, type Bid } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Trophy, AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react";

export default function AuctionDetail() {
  const [, params] = useRoute("/auction/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = params?.id ?? "";

  const [item, setItem] = useState<Item | null>(null);
  const [myBid, setMyBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  // Payment + number selection state
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [chosenNumber, setChosenNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [numberConfirmOpen, setNumberConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
    const channel = supabase
      .channel(`item-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `id=eq.${id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  async function fetchData() {
    const { data: itemData } = await supabase.from("items").select("*").eq("id", id).single();
    setItem(itemData);
    if (user) {
      const { data: bidData } = await supabase
        .from("bids")
        .select("*")
        .eq("item_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setMyBid(bidData);
    }
    setLoading(false);
  }

  // Simulate payment — in production integrate real payment gateway
  async function handlePay() {
    if (!user || !item) return;
    setPaying(true);
    // Insert bid record with paid=true (in production, only set paid=true after real payment confirmation)
    const { error } = await supabase.from("bids").insert({
      item_id: item.id,
      user_id: user.id,
      chosen_number: 0, // placeholder until they pick
      paid: true,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Payment confirmed! Now pick your number.");
      await fetchData();
    }
    setPaying(false);
    setPayConfirmOpen(false);
  }

  async function handlePickNumber() {
    const num = parseInt(chosenNumber);
    if (!num || num < 1) {
      toast.error("Please enter a valid number (minimum 1)");
      return;
    }
    if (!myBid || !item) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("bids")
      .update({ chosen_number: num })
      .eq("id", myBid.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Number ${num} locked in!`);
      await fetchData();
    }
    setSubmitting(false);
    setNumberConfirmOpen(false);
    setChosenNumber("");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-24 space-y-4">
          <Skeleton className="h-8 w-48 bg-card" />
          <Skeleton className="h-64 rounded-xl bg-card" />
          <Skeleton className="h-32 rounded-xl bg-card" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div
            className="text-9xl font-black opacity-5 select-none mb-4"
            style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
          >404</div>
          <p className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
            This vault doesn't exist.
          </p>
          <p className="text-muted-foreground mb-6 text-sm">The auction you're looking for has been removed or never existed.</p>
          <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground font-semibold hover:opacity-90">
            Back to Auctions
          </Button>
        </div>
      </div>
    );
  }

  const isActive = item.status === "active";
  const hasPaid = myBid?.paid === true;
  const hasPickedNumber = hasPaid && myBid?.chosen_number && myBid.chosen_number > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Auctions
        </button>

        {/* Item Card */}
        <div className={`rounded-2xl overflow-hidden mb-8 ${isActive ? "auction-active" : "border border-border"} bg-card`}>
          {item.image_url && (
            <img src={item.image_url} alt={item.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1
                className="text-3xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.title}
              </h1>
              <Badge className={isActive ? "bg-green-500/20 text-green-400 border-green-500/30 shrink-0" : "bg-muted text-muted-foreground border-border shrink-0"}>
                {isActive ? "Live" : "Ended"}
              </Badge>
            </div>
            {item.description && (
              <p className="text-muted-foreground leading-relaxed mb-4">{item.description}</p>
            )}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Entry Fee</p>
                <p className="text-3xl font-bold number-badge" style={{ color: "var(--gold)" }}>
                  ${item.bid_amount.toLocaleString()}
                </p>
              </div>
              {item.status === "ended" && item.winning_number && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Winning Number</p>
                  <p className="text-3xl font-bold number-badge" style={{ color: "var(--gold)" }}>
                    #{item.winning_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Winner announcement */}
        {item.status === "ended" && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-6 mb-8 text-center gold-glow">
            <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--gold)" }} />
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
              Auction Ended
            </h2>
            {item.winning_number ? (
              <p className="text-muted-foreground">
                Winning number: <span className="font-bold number-badge text-foreground">#{item.winning_number}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">No winner determined yet.</p>
            )}
            {hasPickedNumber && myBid?.chosen_number === item.winning_number && (
              <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 font-semibold">🎉 You won this auction!</p>
              </div>
            )}
          </div>
        )}

        {/* Action Area */}
        {isActive && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: "var(--font-display)" }}>
              Your Participation
            </h2>

            {!user ? (
              <div className="text-center py-6">
                <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Sign in to participate in this auction.</p>
                <Button
                  onClick={() => setAuthOpen(true)}
                  className="bg-primary text-primary-foreground font-semibold hover:opacity-90"
                >
                  Sign In to Enter
                </Button>
              </div>
            ) : !hasPaid ? (
              /* Step 1: Pay */
              <div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-5">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Non-Refundable Entry Fee</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Once you pay the entry fee of <strong className="text-foreground number-badge">${item.bid_amount}</strong>, it cannot be refunded regardless of the outcome.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 text-base"
                  onClick={() => setPayConfirmOpen(true)}
                >
                  Pay ${item.bid_amount} & Enter Auction
                </Button>
              </div>
            ) : !hasPickedNumber ? (
              /* Step 2: Pick number */
              <div>
                <div className="flex items-center gap-2 mb-4 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Entry fee paid — now pick your number!</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose any number starting from 1. The lowest <strong className="text-foreground">unique</strong> number wins. Think strategically!
                </p>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter a number (e.g. 7)"
                    value={chosenNumber}
                    onChange={(e) => setChosenNumber(e.target.value)}
                    className="bg-input border-border text-lg number-badge font-semibold"
                  />
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground font-semibold hover:opacity-90 shrink-0"
                    onClick={() => {
                      const num = parseInt(chosenNumber);
                      if (!num || num < 1) { toast.error("Enter a valid number ≥ 1"); return; }
                      setNumberConfirmOpen(true);
                    }}
                  >
                    Lock In
                  </Button>
                </div>
              </div>
            ) : (
              /* Done */
              <div className="text-center py-4">
                <div
                  className="w-24 h-24 rounded-full border-2 flex items-center justify-center mx-auto mb-4 gold-glow"
                  style={{ borderColor: "var(--gold)", background: "oklch(0.78 0.14 85 / 0.1)" }}
                >
                  <span
                    className="text-4xl font-black number-badge"
                    style={{ color: "var(--gold)" }}
                  >
                    {myBid?.chosen_number}
                  </span>
                </div>
                <p className="text-foreground font-semibold">Your number is locked in!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Good luck! Results will be announced when the auction ends.
                </p>
              </div>
            )}
          </div>
        )}

        {/* My bid summary when ended */}
        {!isActive && myBid && (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Your chosen number</p>
            <p className="text-3xl font-bold number-badge" style={{ color: "var(--gold)" }}>
              #{myBid.chosen_number || "—"}
            </p>
          </div>
        )}
      </div>

      {/* Pay confirmation dialog */}
      <Dialog open={payConfirmOpen} onOpenChange={setPayConfirmOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You are about to pay <strong className="text-foreground number-badge">${item.bid_amount}</strong> to enter this auction. This fee is <strong className="text-destructive">non-refundable</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setPayConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground font-semibold hover:opacity-90"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Pay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Number confirmation dialog */}
      <Dialog open={numberConfirmOpen} onOpenChange={setNumberConfirmOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
              Lock In Number {chosenNumber}?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Once locked, your number cannot be changed. Are you sure you want to go with <strong className="text-foreground number-badge">#{chosenNumber}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setNumberConfirmOpen(false)}>
              Change
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground font-semibold hover:opacity-90"
              onClick={handlePickNumber}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lock It In!"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
