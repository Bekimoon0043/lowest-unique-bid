/**
 * Midnight Vault — Auth Modal
 * Sign in / Sign up dialog
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

export default function AuthModal({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await signIn(phoneNumber, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Welcome back!");
        onClose();
      }
    } else {
      if (!fullName.trim()) {
        toast.error("Please enter your full name");
        setLoading(false);
        return;
      }
      const { error } = await signUp(phoneNumber, password, fullName);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Account created successfully!");
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}
          >
            {mode === "signin" ? "Welcome Back" : "Join UniqueWin"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-input border-border"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-input border-border"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary hover:underline font-medium"
          >
            {mode === "signin" ? "Register" : "Sign In"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
