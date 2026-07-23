import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Upload } from "lucide-react";
import { CURRENCY } from "@/const";

interface Props {
  open: boolean;
  onClose: () => void;
  bidId: string;
  amount: number;
  itemTitle: string;
}

export default function PaymentVerificationModal({ open, onClose, bidId, amount, itemTitle }: Props) {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!screenshot && !message.trim()) {
      toast.error("Please upload screenshot or enter verification message");
      return;
    }
    setUploading(true);

    let proofUrl = "";
    if (screenshot) {
      const fileExt = screenshot.name.split('.').pop();
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(`bids/${bidId}.${fileExt}`, screenshot);
      if (error) {
        toast.error("Screenshot upload failed: " + error.message);
        setUploading(false);
        return;
      }
      proofUrl = supabase.storage.from('payment-proofs').getPublicUrl(data.path).data.publicUrl;
    }

    const { error } = await supabase
      .from('bids')
      .update({ 
        payment_proof: proofUrl,
        verification_message: message,
        paid: false 
      })
      .eq('id', bidId);

    if (error) toast.error(error.message);
    else {
      toast.success("Payment verification submitted! Admin will approve soon.");
      onClose();
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay {CURRENCY.symbol}{amount} - Verification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded">
            <p><strong>Instructions:</strong></p>
            <p>Send {CURRENCY.symbol}{amount} via Telebirr/Bank. Upload screenshot or paste transaction ID.</p>
          </div>
          <div>
            <Label>Screenshot (Proof)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label>Message / Transaction ID</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Transaction ref..." />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
            {uploading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
