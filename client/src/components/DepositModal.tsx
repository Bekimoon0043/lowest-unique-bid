import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function DepositModal({ isOpen, onClose, bidId }: { isOpen: boolean; onClose: () => void; bidId: string }) {
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      supabase.from("payment_methods").select("*").then(({ data }) => {
        if (data) setMethods(data);
      });
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Account number copied!");
  };

  const handleSubmit = async () => {
    if (!file || !selectedMethod) {
      toast.error("Please select a payment method and upload a screenshot.");
      return;
    }
    setUploading(true);
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

    const { error: dbError } = await supabase.from("payment_verifications").insert({
      bid_id: bidId,
      payment_method_id: selectedMethod.id,
      screenshot_url: publicUrl,
      status: "pending",
    });

    if (dbError) {
      toast.error("Failed to submit verification: " + dbError.message);
    } else {
      toast.success("Screenshot submitted! Admin will verify shortly.");
      onClose();
    }
    setUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-border text-primary-foreground">
        <DialogHeader>
          <DialogTitle>Complete Your Deposit</DialogTitle>
        </DialogHeader>
        
        {!selectedMethod ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">Choose your payment method:</p>
            <div className="grid grid-cols-2 gap-4">
              {methods.map((method) => (
                <Button
                  key={method.id}
                  variant="outline"
                  className="h-24 flex flex-col gap-2 border-gold/30 hover:border-gold hover:bg-gold/10"
                  onClick={() => setSelectedMethod(method)}
                >
                  <span className="font-bold text-lg">{method.method_name}</span>
                </Button>
              ))}
            </div>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Transfer Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold/10 file:text-gold hover:file:bg-gold/20"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedMethod(null)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={uploading} className="flex-1 bg-gold text-primary font-semibold hover:bg-gold/90">
                {uploading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
