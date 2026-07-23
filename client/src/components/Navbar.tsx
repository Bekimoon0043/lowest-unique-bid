/**
 * Midnight Vault — Navbar
 * Sticky top nav with gold logo, auth state, and admin link
 */
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Menu, X, List } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/manus-storage/logo-icon_1ba91cbc.png"
              alt="UniqueWin"
              className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-200"
            />
            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}
            >
              UniqueWin
            </span>
          </Link>

          {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/my-bids")}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <List className="w-4 h-4" />
                My Bids
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-destructive gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthOpen(true)}
                className="bg-primary text-primary-foreground hover:opacity-90 font-semibold"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-border/50 bg-background/95 px-4 py-3 flex flex-col gap-2">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigate("/my-bids"); setMobileOpen(false); }}
                className="justify-start gap-2"
              >
                <List className="w-4 h-4" />
                My Bids
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigate("/admin"); setMobileOpen(false); }}
                className="justify-start gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Button>
            )}
            {user ? (
              <>
                <p className="text-sm text-muted-foreground px-2">{user.email}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="justify-start text-destructive gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                className="bg-primary text-primary-foreground font-semibold"
              >
                Sign In / Register
              </Button>
            )}
          </div>
        )}
      </nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
