import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatETB } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyBids() {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyBids();
  }, [user]);

  async function fetchMyBids() {
    const { data } = await supabase
      .from("bids")
      .select(`
        id, chosen_number, paid, created_at,
        items ( id, title, bid_amount, status, end_time, winning_number ),
        payment_verifications ( status, rejection_reason, verification_message )
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) setBids(data);
    setLoading(false);
  }

  if (loading) return <div className="p-8"><Skeleton className="h-96" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-serif font-bold text-primary-foreground mb-6">My Bids</h1>
        {bids.length === 0 ? (
          <p className="text-muted-foreground">You haven't placed any bids yet.</p>
        ) : (
          <div className="space-y-4">
            {bids.map((bid: any) => {
              const item = bid.items;
              const verification = bid.payment_verifications?.[0];
              const isWinner = item?.status === "ended" && item?.winning_number === bid.chosen_number;

              return (
                <Card key={bid.id} className="bg-surface border-border">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-primary-foreground">{item?.title}</CardTitle>
                      <Badge variant={item?.status === "active" ? "default" : "secondary"}>
                        {item?.status === "active" ? "Active" : "Ended"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Your Number:</span>
                      <span className="font-mono font-bold text-gold">#{bid.chosen_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Fee:</span>
                      <span className="text-primary-foreground">{formatETB(item?.bid_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <span className={bid.paid ? "text-green-500" : "text-yellow-500"}>
                        {bid.paid ? "Verified" : verification?.status === "pending" ? "Pending Verification" : "Unpaid"}
                      </span>
                    </div>
                    {verification?.status === "rejected" && (
                      <p className="text-sm text-destructive">Reason: {verification.rejection_reason}</p>
                    )}
                    {item?.status === "ended" && (
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span className="text-muted-foreground">Result:</span>
                        <span className="font-mono font-bold">
                          {isWinner ? (
                            <span className="text-gold">#{item.winning_number} (You Won! 🎉)</span>
                          ) : (
                            <span className="text-muted-foreground">Winning #: {item.winning_number || "None"}</span>
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
