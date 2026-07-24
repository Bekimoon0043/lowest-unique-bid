# UniqueWin — Lowest Unique Bid Auctions (ETB)

A "Midnight Vault"-themed auction platform: an admin posts an item with a fixed
**entry fee**, users pay that fee and pick a number, and when the auction ends
the **lowest number that only one person picked** wins the item. All prices
are in **Ethiopian Birr (ETB)**.

## How the money side works

1. **Admin** adds one or more payment methods under **Admin → Payment
   Methods** (e.g. Telebirr, CBE, Awash Bank) — name, account holder,
   account/phone number, and optional instructions.
2. A **user** opens an auction, clicks *Pay & Enter Auction*, picks a payment
   method, and sends the money outside the app (mobile money / bank
   transfer).
3. To prove it, the user picks **one** of two options:
   - **Upload a screenshot** of the transfer, or
   - **Send a verification message** (a typed note with the sender's
     name/phone, transaction reference, amount, and time).
4. This creates a **pending** row in `payment_verifications`. The user can't
   pick their number yet.
5. **Admin → Verifications** shows every pending submission (screenshot or
   message) with **Approve** / **Reject** buttons. Approving marks the bid as
   `paid = true`, which unlocks number selection for that user.
6. When the admin clicks **End & Pick Winner** on an auction, the
   `determine_winner` database function finds the lowest chosen number that
   exactly one paid user picked.

## First-time setup

### 1. Database
Open your Supabase project → **SQL Editor** → paste in the contents of
[`supabase/schema.sql`](./supabase/schema.sql) → **Run**. It's idempotent, so
it's safe even if some of these tables already exist — it only adds what's
missing (like the `verification_message` column and the storage bucket).

### 2. Make sure you can log in as admin
The app already treats `bereketamare0043@gmail.com` as an admin (see
`client/src/contexts/AuthContext.tsx`, `ADMIN_EMAILS`). Sign up with that
email in the app, then visit `/admin`. To add more admins, add their email to
**both** `ADMIN_EMAILS` in `AuthContext.tsx` and the array inside
`public.is_admin()` in `supabase/schema.sql`, then re-run the SQL file.

### 3. Add your payment methods
Go to **Admin → Payment Methods → Add Payment Method** and enter your
Telebirr / CBE / bank details. Until at least one exists, users will see a
"no payment methods yet" message instead of a deposit screen.

### 4. Run it
```bash
pnpm install   # or: npm install --legacy-peer-deps
pnpm dev       # local dev server
pnpm build     # production build
```

## What changed in this pass
- All prices display in **ETB** instead of `$` (Home, Auction Detail, My
  Bids, Admin Dashboard).
- Payment verification now supports **either** a screenshot **or** a typed
  message, not just a screenshot.
- New **Admin → Payment Methods** tab: add / edit / delete the accounts users
  pay into, instead of requiring a database edit.
- Admin's pending-verification list now shows the user's typed message when
  there's no screenshot.
- `supabase/schema.sql` added: one idempotent file with every table, RLS
  policy, storage bucket, and function this app needs.
