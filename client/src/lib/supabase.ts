/**
 * Midnight Vault — Supabase client
 * Deep navy + gold auction platform
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fiiqyhgzubmrnyubuzcq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXF5aGd6dWJtcm55dWJ1emNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MjQ2MjksImV4cCI6MjEwMDMwMDYyOX0.m-7GXRLBkvJ-KLkI3FlN14zwHVvg7k7HxNNYy3s7764";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Item = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  bid_amount: number;
  status: "active" | "ended";
  winner_id: string | null;
  winning_number: number | null;
  end_time: string;
  created_at: string;
};

export type Bid = {
  id: string;
  item_id: string;
  user_id: string;
  chosen_number: number;
  paid: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
};
