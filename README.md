# Cooper's Bar – Quakers Road

This is the **Quakers Road** copy of Cooper's Bar, built from the same
codebase as the original app but pointed at its own separate Supabase
project so the two locations don't share data.

A mobile-first drink ordering app for a holiday bar. No accounts, no payments —
pick a name from a dropdown and order. Built with React + Vite + Tailwind,
Supabase (Postgres + Realtime) as the backend, deployed to Netlify.

## 1. Set up Supabase (do this first)

1. Go to [supabase.com](https://supabase.com), sign up for a free account, and
   create a new project (any name/region/password is fine — just save the
   database password somewhere).
2. Once the project has finished provisioning, open **SQL Editor** in the left
   sidebar, click **New query**, paste in the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
   This creates the `drinks` and `orders` tables, opens up access (no
   login, so both tables allow anyone with your Supabase keys to read/write —
   fine since this link is only going to your friends), turns on Realtime for
   both tables, and seeds the starting drinks list.
3. Go to **Project Settings -> API**. You need two values from that page:
   - **Project URL**
   - **anon public** key (under "Project API keys" — *not* the `service_role`
     key, that one must never be exposed to the browser)

**Already ran `schema.sql` before and have a live project?** Don't re-run
`schema.sql` — it'll fail trying to recreate tables that already exist.
Instead run these once, in order, in the SQL Editor:
1. [`supabase/002_tips_categories_siesta.sql`](./supabase/002_tips_categories_siesta.sql) —
   tips, the Snacks/Ice Cream categories, and siesta mode.
2. [`supabase/003_custom_categories.sql`](./supabase/003_custom_categories.sql) —
   turns categories from a fixed list into a table the bartender can manage.
3. [`supabase/004_announcements.sql`](./supabase/004_announcements.sql) —
   adds barman announcements shown on the Home screen.
4. [`supabase/005_location.sql`](./supabase/005_location.sql) —
   adds a location field to orders.
5. [`supabase/006_drink_options.sql`](./supabase/006_drink_options.sql) —
   lets the bartender attach a choice (e.g. flavour) to a drink, and adds
   a demo "Ice Pop" so you can see it working right away.

All are safe to run against a database that already has drinks/orders in it.

## 2. Configure environment variables

**Locally:**

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**On Netlify** (for the deployed site): Site settings -> Environment
variables -> Add a variable, and add the same two:
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, with the same values.
Netlify won't have access to your `.env` file (it's gitignored on purpose),
so this step is required for the live site to work.

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. On an iPhone, use your computer's LAN IP
(`npm run dev -- --host`) so Safari on the phone can reach it.

## 4. Deploy to Netlify

1. Push this repo to GitHub (already done if you're reading this from the
   repo).
2. In Netlify: **Add new site -> Import an existing project**, connect the
   GitHub repo, and deploy from `main`.
3. Build settings (Netlify should auto-detect these from `netlify.toml`, but
   just in case):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add the two environment variables from step 2 above in Netlify's site
   settings, then trigger a deploy (or push a commit).
5. The `public/_redirects` file (`/* /index.html 200`) is already included so
   refreshing on any route (e.g. `/bartender/orders`) won't 404.

## App structure

- **Customer flow**: Home -> Categories -> Drink List (per category) ->
  Checkout. Each order is built from one category visit — ice and comments
  apply to that whole order, matching the single `ice`/`comment` column on
  the `orders` table. If someone wants drinks from two categories, they
  submit two quick orders. Checkout also asks **where** the drink should go
  (pool, poolside, kitchen, etc., with an "Other — please specify" option),
  required just like the name field, shown to the bartender on every order
  card so they know where to deliver it.
- **Bartender flow**: only reachable via the small logo in the top-left
  corner of the Home screen (deliberately unstyled so it doesn't look like a
  button), and gated behind a passcode (**6767**) the first time on a given
  device/browser — after that it's remembered (stored in `localStorage`), so
  the barman isn't asked again. Anyone who lands there by accident gets a
  big "Back to Home Screen" button. This is a lightweight deterrent, not
  real security — the passcode lives in the client-side source code, same
  as everything else in this no-accounts app. A **Siesta mode** toggle sits
  at the top of every bartender screen.
  From there: **Orders** (live, sorted by priority then oldest first,
  red-tinted "Immediate death" orders, sound + vibration on new orders,
  badge with pending count, Edit/Delete on every order), **Drinks**
  (add/edit/delete/sold-out, reflected live on customer screens, plus a
  "Manage categories" screen to add/rename/delete categories), **Tips**
  (total + per-person leaderboard), **History** (completed orders with
  tips/comments/timings + average completion time, Edit/Delete on every
  order too).
- **Categories are fully barman-managed**, not a fixed list — add, rename,
  or delete them from Drinks -> Manage categories. A category with drinks
  still in it can't be deleted (you'll get a message telling you how many
  are in the way) — move or delete those first.
- **Editing an order** (pending or in History) lets the bartender rename a
  drink, change quantities, remove an item, add a different drink from the
  current menu, or edit the comment. Deleting an order removes it entirely —
  handy for an accidental duplicate order. Both are live everywhere, same as
  everything else in the app.
- Order `items` are stored as a snapshot (`name`, `category`, `quantity`) at
  submit time, so editing or deleting a drink or category later doesn't
  change what past orders show.
- **Per-drink customer choices**: from Drinks -> add/edit a drink, toggle
  "Customer picks an option", give it a name (e.g. "flavour" or "size"),
  and list the choices one per line. Customers then get a required "Select
  your flavour" dropdown before they can tick that drink into an order. The
  chosen option is baked into the order's item name (e.g.
  "Ice Pop — Strawberry"), so it shows up correctly everywhere an order's
  items are already displayed, no separate field to look for. A demo
  "Ice Pop" (under Ice Cream, flavours: Strawberry/Orange/Cola/Lemon) gets
  added by migration 006 so you can see it working immediately — edit or
  delete it once you've tried it.
- **Tips** are entirely theoretical — nobody is charged anything. It's a fun
  number attached to the order, shown on the bartender's Tips leaderboard.
  I used € as the currency; easy to change (search for `€` in
  `src/pages/Checkout.jsx` and `src/pages/bartender/Tips.jsx`).
- **Announcements**: next to the Siesta toggle, the bartender can type a
  message and hit Send — it appears live in a box on the Home screen for
  every customer. Hitting Remove clears it. Sending a new one while one's
  already showing just replaces it.
- **Siesta mode**: when the bartender toggles it on, a warning banner
  appears on Home and Checkout. Orders can still be placed during a siesta,
  but their wait-time clock doesn't start until siesta ends — this is
  enforced in the database itself (see `confirmed_at` / `bar_status` /
  triggers in the schema), not just in the app, so it's correct regardless
  of which device toggles siesta or places an order. Order History shows
  "Ordered", "Confirmed", and "Completed" times for every order so you can
  see exactly when a siesta pushed a confirmation back.

## Notes / assumptions made while building

- **App name**: I used "Cooper's Bar", taken from the logo you attached
  ("Team Cat / Cooper's Bar"). Easy to rename — it only appears in
  `src/pages/Home.jsx` and the `<title>` in `index.html`.
- **Sound on the bartender's Orders screen**: a loud, synthesized two-note
  chime (no audio file needed) that repeats 3 times so it cuts through a
  noisy party. iOS Safari doesn't support the Vibration API at all, so on
  iPhone you'll only get the sound; vibration works on Android too. The
  first tap anywhere on the bartender screens "unlocks" audio playback,
  which iOS Safari requires before letting a page play sound without a
  fresh tap. The loudest this can go is capped by the phone's own volume —
  make sure the bartender's phone isn't on silent/low volume.
- **Images**: `public/barman.jpg` and `public/logo.png` are the photos you
  attached, used as-is (not compressed/resized) — swap the files if you want
  to update them later, no code changes needed.
