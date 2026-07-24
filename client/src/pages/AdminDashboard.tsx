/**
 * Midnight Vault — Admin Dashboard
 * Post items, manage auctions, determine winners
 * Design: sidebar layout, dark navy, gold accents
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase, type Item, type Bid } from "@/lib/supabase";
import { formatETB } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trophy, Users, Eye, CheckCircle2, Loader2, ShieldAlert, Wallet, Pencil, Trash2, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewBidsItem, setViewBidsItem] = useState<Item | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);

  // Verifications state
  const [activeTab, setActiveTab] = useState<"auctions" | "verifications" | "payments">("auctions");
  const [verifications, setVerifications] = useState<any[]>([]);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [methodName, setMethodName] = useState("");
  const [methodHolder, setMethodHolder] = useState("");
  const [methodNumber, setMethodNumber] = useState("");
  const [methodInstructions, setMethodInstructions] = useState("");
  const [savingMethod, setSavingMethod] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && activeTab === "verifications") fetchVerifications();
    if (isAdmin && activeTab === "payments") fetchPaymentMethods();
  }, [isAdmin, activeTab]);

  async function fetchPaymentMethods() {
    setMethodsLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) toast.error("Failed to load payment methods: " + error.message);
    setPaymentMethods(data ?? []);
    setMethodsLoading(false);
  }

  function openCreateMethod() {
    setEditingMethod(null);
    setMethodName("");
    setMethodHolder("");
    setMethodNumber("");
    setMethodInstructions("");
    setMethodDialogOpen(true);
  }

  function openEditMethod(method: any) {
    setEditingMethod(method);
    setMethodName(method.method_name ?? "");
    setMethodHolder(method.account_holder ?? "");
    setMethodNumber(method.account_number ?? "");
    setMethodInstructions(method.instructions ?? "");
    setMethodDialogOpen(true);
  }

  async function handleSaveMethod(e: React.FormEvent) {
    e.preventDefault();
    if (!methodName.trim() || !methodHolder.trim() || !methodNumber.trim()) {
      toast.error("Method name, account holder, and account number are required.");
      return;
    }
    setSavingMethod(true);
    const payload = {
      method_name: methodName.trim(),
      account_holder: methodHolder.trim(),
      account_number: methodNumber.trim(),
      instructions: methodInstructions.trim() || null,
    };
    const { error } = editingMethod
      ? await supabase.from("payment_methods").update(payload).eq("id", editingMethod.id)
      : await supabase.from("payment_methods").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingMethod ? "Payment method updated!" : "Payment method added!");
      setMethodDialogOpen(false);
      fetchPaymentMethods();
    }
    setSavingMethod(false);
  }

  async function handleDeleteMethod(id: string) {
    setDeletingMethodId(id);
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Payment method removed.");
      fetchPaymentMethods();
    }
    setDeletingMethodId(null);
  }

  async function fetchVerifications() {
    const { data } = await supabase
      .from("payment_verifications")
      .select(`
        id, status, screenshot_url, verification_message, created_at,
        bids ( chosen_number, id, items (title) ),
        payment_methods (method_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setVerifications(data ?? []);
  }

  async function handleVerify(verificationId: string, bidId: string, approve: boolean) {
    const { error } = await supabase
      .from("payment_verifications")
      .update({ 
        status: approve ? "verified" : "rejected",
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        rejection_reason: approve ? null : "Invalid screenshot"
      })
      .eq("id", verificationId);

    if (!error && approve) {
      await supabase.from("bids").update({ paid: true }).eq("id", bidId);
      toast.success("Payment verified and bid marked as paid!");
    } else if (!error) {
      toast.success("Payment rejected.");
    }
    fetchVerifications();
  }

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (isAdmin) fetchItems();
  }, [isAdmin]);

  async function fetchItems() {
    const { data } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !bidAmount) { toast.error("Title and bid amount are required"); return; }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid bid amount"); return; }
    setCreating(true);
    const { error } = await supabase.from("items").insert({
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      bid_amount: amount,
      end_time: endTime || new Date(Date.now() + 86400000).toISOString(),
      status: "active",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Auction created!");
      setTitle(""); setDescription(""); setImageUrl(""); setBidAmount("");
      setCreateOpen(false);
      setEndTime("");
      fetchItems();
    }
    setCreating(false);
  }

  async function handleViewBids(item: Item) {
    setViewBidsItem(item);
    setBidsLoading(true);
    const { data } = await supabase
      .from("bids")
      .select("*")
      .eq("item_id", item.id)
      .eq("paid", true)
      .order("chosen_number", { ascending: true });
    setBids(data ?? []);
    setBidsLoading(false);
  }

  async function handleEndAuction(item: Item) {
    setEndingId(item.id);
    // Call the determine_winner function
    const { data, error } = await supabase.rpc("determine_winner", { p_item_id: item.id });
    if (error) {
      toast.error("Error determining winner: " + error.message);
      setEndingId(null);
      return;
    }
    const winner = data?.[0];
    const { error: updateError } = await supabase
      .from("items")
      .update({
        status: "ended",
        winner_id: winner?.winner_user_id ?? null,
        winning_number: winner?.winning_number ?? null,
      })
      .eq("id", item.id);
    if (updateError) {
      toast.error(updateError.message);
    } else {
      if (winner) {
        toast.success(`Auction ended! Winning number: #${winner.winning_number}`);
      } else {
        toast.success("Auction ended. No unique number found — no winner.");
      }
      fetchItems();
    }
    setEndingId(null);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Navbar />
        <ShieldAlert className="w-10 h-10 text-destructive" />
        <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Access Restricted</p>
        <p className="text-sm text-muted-foreground">Admin credentials required to enter this vault.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="bg-transparent mt-2">Return to Auctions</Button>
      </div>
    );
  }

  const activeCount = items.filter((i) => i.status === "active").length;
  const endedCount = items.filter((i) => i.status === "ended").length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col fixed top-0 left-0 h-full z-40">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-border/50">
          <img src="/manus-storage/logo-icon_1ba91cbc.png" alt="UniqueWin" className="w-7 h-7 object-contain" />
          <span className="font-bold text-base" style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>UniqueWin</span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">Admin</div>
          <button
            onClick={() => setActiveTab("auctions")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "auctions" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
          >
            <Trophy className="w-4 h-4" style={{ color: activeTab === "auctions" ? "var(--gold)" : "currentColor" }} />
            Auctions
          </button>
          <button
            onClick={() => setActiveTab("verifications")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "verifications" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: activeTab === "verifications" ? "var(--gold)" : "currentColor" }} />
            Verifications
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "payments" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
          >
            <Wallet className="w-4 h-4" style={{ color: activeTab === "payments" ? "var(--gold)" : "currentColor" }} />
            Payment Methods
          </button>
        </nav>
        <div className="px-5 py-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--gold)" }}>Administrator</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-56 min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-background/90 backdrop-blur-xl z-30">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {activeTab === "auctions" ? "Auction Management" : activeTab === "verifications" ? "Payment Verifications" : "Payment Methods"}
          </h1>
          {activeTab === "auctions" && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-primary-foreground font-semibold hover:opacity-90 gap-2 h-8 text-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Auction
            </Button>
          )}
          {activeTab === "payments" && (
            <Button
              onClick={openCreateMethod}
              className="bg-primary text-primary-foreground font-semibold hover:opacity-90 gap-2 h-8 text-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Payment Method
            </Button>
          )}
        </header>

        <div className="p-6">
          {activeTab === "auctions" && (
            <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total", value: items.length },
              { label: "Live", value: activeCount },
              { label: "Ended", value: endedCount },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-3xl font-bold number-badge text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Items Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg bg-card" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="border border-border/50 rounded-xl p-12 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>No auctions in the vault.</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first auction to get started.</p>
              <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground font-semibold hover:opacity-90 gap-2">
                <Plus className="w-4 h-4" /> Create First Auction
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Item</TableHead>
                    <TableHead className="text-muted-foreground">Entry Fee</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Winner #</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-border hover:bg-secondary/30">
                      <TableCell>
                        <div className="font-medium text-foreground">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="number-badge font-semibold" style={{ color: "var(--gold)" }}>
                          {formatETB(item.bid_amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.status === "active" ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-border">Ended</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.winning_number ? (
                          <span className="number-badge font-bold" style={{ color: "var(--gold)" }}>
                            #{item.winning_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewBids(item)}
                            className="text-muted-foreground hover:text-foreground gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Bids
                          </Button>
                          {item.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEndAuction(item)}
                              disabled={endingId === item.id}
                              className="bg-transparent border-destructive/50 text-destructive hover:bg-destructive/10 gap-1.5"
                            >
                              {endingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trophy className="w-3.5 h-3.5" />
                              )}
                              End & Pick Winner
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          </>
          )}
          {activeTab === "verifications" && (
            <div className="space-y-4">
              {verifications.length === 0 ? (
                <div className="border border-border/50 rounded-xl p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>No pending verifications.</p>
                  <p className="text-sm text-muted-foreground">All payments have been processed.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {verifications.map((v: any) => (
                    <div key={v.id} className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-6 items-start">
                      {v.screenshot_url ? (
                        <a href={v.screenshot_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <img src={v.screenshot_url} alt="Proof" className="w-32 h-32 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity" />
                        </a>
                      ) : (
                        <div className="w-32 h-32 shrink-0 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                          <MessageSquare className="w-6 h-6" />
                          <span className="text-[10px] uppercase tracking-wide">No screenshot</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-foreground truncate">{v.bids?.items?.title}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                          <p className="text-muted-foreground">Number: <span className="text-gold font-mono font-bold">#{v.bids?.chosen_number}</span></p>
                          <p className="text-muted-foreground">Method: <span className="text-foreground font-medium">{v.payment_methods?.method_name}</span></p>
                          <p className="text-muted-foreground">Date: <span className="text-foreground font-medium">{new Date(v.created_at).toLocaleString()}</span></p>
                        </div>
                        {v.verification_message && (
                          <div className="mt-2 p-2.5 rounded-lg bg-input border border-border text-sm">
                            <p className="text-xs text-muted-foreground mb-0.5">User's verification message</p>
                            <p className="text-foreground">{v.verification_message}</p>
                          </div>
                        )}
                        <div className="flex gap-3 mt-4">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6" onClick={() => handleVerify(v.id, v.bids.id, true)}>Approve</Button>
                          <Button size="sm" variant="destructive" className="font-semibold px-6" onClick={() => handleVerify(v.id, v.bids.id, false)}>Reject</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground -mt-2 mb-2">
                These are the accounts users see when they pay their entry fee (e.g. Telebirr, CBE, Awash Bank). Users transfer money here, then upload a screenshot or send a verification message.
              </p>
              {methodsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-card" />)}
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="border border-border/50 rounded-xl p-12 text-center">
                  <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>No payment methods yet.</p>
                  <p className="text-sm text-muted-foreground mb-4">Add a bank account or mobile money method (e.g. Telebirr, CBE) so users can pay.</p>
                  <Button onClick={openCreateMethod} className="bg-primary text-primary-foreground font-semibold hover:opacity-90 gap-2">
                    <Plus className="w-4 h-4" /> Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {paymentMethods.map((m: any) => (
                    <div key={m.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground">{m.method_name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                          <span>Holder: <span className="text-foreground">{m.account_holder}</span></span>
                          <span>Account #: <span className="text-gold font-mono">{m.account_number}</span></span>
                        </div>
                        {m.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{m.instructions}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="bg-transparent gap-1.5" onClick={() => openEditMethod(m)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-destructive/50 text-destructive hover:bg-destructive/10 gap-1.5"
                          onClick={() => handleDeleteMethod(m.id)}
                          disabled={deletingMethodId === m.id}
                        >
                          {deletingMethodId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Payment Method Dialog */}
      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMethod} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Method Name *</Label>
              <Input
                placeholder="e.g. Telebirr, CBE, Awash Bank"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account Holder Name *</Label>
              <Input
                placeholder="e.g. Bereket Amare"
                value={methodHolder}
                onChange={(e) => setMethodHolder(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account / Phone Number *</Label>
              <Input
                placeholder="e.g. 0912345678"
                value={methodNumber}
                onChange={(e) => setMethodNumber(e.target.value)}
                className="bg-input border-border font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions (optional)</Label>
              <Textarea
                placeholder="e.g. Include your name as the transfer reference."
                value={methodInstructions}
                onChange={(e) => setMethodInstructions(e.target.value)}
                className="bg-input border-border resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setMethodDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold hover:opacity-90" disabled={savingMethod}>
                {savingMethod ? <Loader2 className="w-4 h-4 animate-spin" /> : editingMethod ? "Save Changes" : "Add Method"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Auction Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
              Create New Auction
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Item Title *</Label>
              <Input
                placeholder="e.g. iPhone 16 Pro Max"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Entry Fee (ETB) *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="e.g. 5.00"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="bg-input border-border number-badge font-semibold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground font-semibold hover:opacity-90"
                disabled={creating}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Auction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Bids Dialog */}
      <Dialog open={!!viewBidsItem} onOpenChange={(v) => !v && setViewBidsItem(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
              Bids — {viewBidsItem?.title}
            </DialogTitle>
          </DialogHeader>
          {bidsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold)" }} />
            </div>
          ) : bids.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No paid bids yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {bids.map((bid) => {
                const isWinner = viewBidsItem?.winning_number === bid.chosen_number && viewBidsItem?.winner_id === bid.user_id;
                return (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${isWinner ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"}`}
                  >
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {bid.user_id.slice(0, 16)}...
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="number-badge font-bold text-lg" style={{ color: isWinner ? "var(--gold)" : "var(--foreground)" }}>
                        #{bid.chosen_number}
                      </span>
                      {isWinner && <Trophy className="w-4 h-4" style={{ color: "var(--gold)" }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
