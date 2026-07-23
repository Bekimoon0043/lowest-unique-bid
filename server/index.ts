import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use service role key to bypass RLS for automated tasks
const supabaseAdmin = createClient(
  "https://fiiqyhgzubmrnyubuzcq.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("Checking for ended auctions...");
  const { data: items, error } = await supabaseAdmin
    .from("items")
    .select("id")
    .eq("status", "active")
    .lte("end_time", new Date().toISOString());

  if (error || !items) return;

  for (const item of items) {
    console.log(`Auto-ending auction ${item.id}`);
    const { data, error: rpcError } = await supabaseAdmin.rpc("determine_winner", { p_item_id: item.id });
    
    if (!rpcError) {
      const winner = data?.[0];
      await supabaseAdmin.from("items").update({
        status: "ended",
        winner_id: winner?.winner_user_id ?? null,
        winning_number: winner?.winning_number ?? null,
      }).eq("id", item.id);
    }
  }
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
