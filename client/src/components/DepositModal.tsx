import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Image as ImageIcon, MessageSquare } from "lucide-react";

export default function DepositModal({ isOpen, onClose, bidId }: { isOpen: boolean; onClose: () => void; bidId: string }) {
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [proofType, setProofType] = useState<"screenshot" | "message">("screenshot");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchMethods() {
      if (isOpen) {
        console.log("Fetching payment methods...");
        const { data, error } = await supabase.from("payment_methods").select("*");
        if (error) {
          console.error("Error fetching payment methods:", error);
          toast.error("Could not load payment methods.");
        } else if (data) {
          console.log("Payment methods loaded:", data);
          setMethods(data);
        }
      }
    }
    fetchMethods();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // reset state whenever the modal closes so the next deposit starts fresh
      setSelectedMethod(null);
      setProofType("screenshot");
      setFile(null);
      setMessage("");
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Account number copied!");
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }
    if (proofType === "screenshot" && !file) {
      toast.error("Please upload a screenshot of your transfer.");
      return;
    }
    if (proofType === "message" && !message.trim()) {
      toast.error("Please describe your payment (e.g. sender name, transaction ID, amount, time sent).");
      return;
    }

    setUploading(true);

    let screenshotUrl: string | null = null;

    if (proofType === "screenshot" && file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, file);

      if (uploadError) {
        toast.error("Upload failed: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("payment-screenshots").getPublicUrl(fileName);
      screenshotUrl = publicUrl;
    }

    const { error: dbError } = await supabase.from("payment_verifications").insert({
      bid_id: bidId,
      payment_method_id: selectedMethod.id,
      screenshot_url: screenshotUrl,
      verification_message: proofType === "message" ? message.trim() : null,
      status: "pending",
    });

    if (dbError) {
      toast.error("Failed to submit verification: " + dbError.message);
    } else {
      toast.success("Submitted! The admin will verify your payment shortly.");
      onClose();
    }
    setUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Complete Your Deposit
            </DialogTitle>
          </DialogHeader>

          {!selectedMethod ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">Choose your payment method to see account details:</p>
              {methods.length === 0 ? (
                <div className="py-12 px-6 text-center border border-dashed border-border rounded-xl bg-muted/5">
                  <p className="text-sm text-muted-foreground">
                    No payment methods have been set up yet. 
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Please contact the admin to complete your entry.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {methods.map((method) => (
                    <Button
                      key={method.id}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-1 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      onClick={() => setSelectedMethod(method)}
                    >
                      <span className="font-bold text-base group-hover:text-primary">{method.method_name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Select Method</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
          <div className="space-y-6">
            <div className="bg-input p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Account Holder</p>
              <p className="font-semibold">{selectedMethod.account_holder}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                  <p className="font-mono text-lg text-gold">{selectedMethod.account_number}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleCopy(selectedMethod.account_number)}>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>
              {selectedMethod.instructions && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{selectedMethod.instructions}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">How would you like to verify your payment?</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-16 flex flex-col gap-1 ${proofType === "screenshot" ? "border-gold bg-gold/10 text-gold" : "border-border"}`}
                  onClick={() => setProofType("screenshot")}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Upload Screenshot</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-16 flex flex-col gap-1 ${proofType === "message" ? "border-gold bg-gold/10 text-gold" : "border-border"}`}
                  onClick={() => setProofType("message")}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-semibold">Send a Message</span>
                </Button>
              </div>
            </div>

            {proofType === "screenshot" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Transfer Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold/10 file:text-gold hover:file:bg-gold/20"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Message</label>
                <Textarea
                  placeholder="e.g. Sent from 09xx-xxx-xxx, transaction ref ABC123, at 3:45 PM today."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="bg-input border-border resize-none"
                />
                <p className="text-xs text-muted-foreground">Include the sender's name/phone, the transaction reference, and the time you sent it so the admin can confirm it quickly.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedMethod(null)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={uploading} className="flex-1 bg-primary text-primary-foreground font-semibold hover:opacity-90">
                {uploading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
