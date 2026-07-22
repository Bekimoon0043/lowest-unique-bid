# Lowest Unique Bid — Design Brainstorm

## Three Stylistic Approaches

### 1. Midnight Vault (probability: 0.07)
Dark, premium, financial-safe aesthetic. Deep navy + gold accents. Think private banking meets online gaming.

### 2. Kinetic Marketplace (probability: 0.06)
Energetic, editorial layout. Bold typography, stark contrast, asymmetric grid. Think Bloomberg meets Hypebeast.

### 3. Warm Auction House (probability: 0.08)
Rich amber/cream palette, serif headings, textured backgrounds. Traditional auction house meets modern SaaS.

---

## Chosen Approach: **Midnight Vault**

### Design Movement
Dark Luxury / Fintech Premium — inspired by private banking interfaces, high-stakes gaming platforms, and premium auction houses.

### Core Principles
1. **Depth over flatness** — layered dark surfaces, glowing accents, subtle grain texture
2. **Gold as the signal color** — amber/gold used exclusively for CTAs, winners, and key numbers
3. **Numbers as heroes** — bid numbers are large, bold, and treated as primary visual elements
4. **Trust through restraint** — no clutter; generous whitespace on dark backgrounds signals confidence

### Color Philosophy
- Background: Deep navy `oklch(0.13 0.025 260)` — conveys security and exclusivity
- Surface: Slightly lighter `oklch(0.18 0.02 260)` — card surfaces
- Gold Accent: `oklch(0.78 0.14 85)` — winner highlights, CTAs, key numbers
- Muted text: `oklch(0.55 0.015 260)` — secondary information
- Danger/Alert: `oklch(0.65 0.2 25)` — errors, non-refundable warnings

### Layout Paradigm
Asymmetric split-panel layout. Auction cards use a left-heavy grid. Hero uses a diagonal cut dividing text from visual. Admin dashboard uses a persistent left sidebar with content on the right.

### Signature Elements
1. **Gold number badge** — the chosen number displayed in a large circular gold badge
2. **Grain texture overlay** — subtle noise on dark backgrounds for depth
3. **Glowing border on active items** — active auctions have a faint gold border glow

### Interaction Philosophy
Every action feels deliberate and weighty. Paying is a moment of commitment — confirmed with a modal. Picking a number has a satisfying click animation. Winners are revealed with a dramatic fade-in.

### Animation
- Page transitions: 200ms fade + 8px upward translate
- Card hover: 150ms scale(1.02) + shadow intensification
- Number selection: 120ms scale(0.95) on press, 180ms spring back
- Winner reveal: 400ms fade + gold glow pulse
- Modal open: 250ms scale(0.96→1) + opacity

### Typography System
- Display: **Playfair Display** (serif) — headings, item titles, winner announcements
- Body: **DM Sans** (sans-serif) — all UI text, labels, descriptions
- Mono: **JetBrains Mono** — numbers, prices, bid amounts

### Brand Essence
**UniqueWin** — The only auction where the smartest number wins. For strategic thinkers who hate overpaying.
Personality: **Exclusive · Strategic · Transparent**

### Brand Voice
- Headlines sound like a challenge: "One number. One winner. Will it be yours?"
- CTAs are direct and confident: "Claim Your Spot" / "Lock In Your Number"
- No filler. No "Welcome to our platform." Every word earns its place.

### Wordmark & Logo
A bold diamond/gem icon (representing uniqueness and value) with sharp geometric cuts. No text in the icon — the name "UniqueWin" sits beside it in Playfair Display.

### Signature Brand Color
**Auction Gold** — `oklch(0.78 0.14 85)` — unmistakably this brand's.

## Style Decisions
- Dark theme is default; no light mode toggle to maintain brand integrity
- Gold is used ONLY for interactive/winner elements — never decoratively
- All prices displayed in JetBrains Mono for legibility and trust
