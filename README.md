# BehanVape — کاتالوگ دیجیتال (Persian / RTL PWA)

A production-ready, Persian-language (RTL), installable **PWA** digital catalogue for a vape shop, with an admin/cashier back office.

- **Framework:** Next.js (App Router, TypeScript)
- **DB:** MongoDB + Mongoose
- **UI:** Tailwind CSS, shadcn/ui (Radix), Framer Motion — dark/moody, single **violet** accent
- **Auth:** next-auth (Credentials, JWT)
- **Storage:** S3-compatible bucket (ParsPack) via `@aws-sdk/client-s3`, server-proxied uploads
- **Push:** `web-push` (VAPID) + a hand-written service worker
- **DnD:** `@dnd-kit`

---

## 1. Setup

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
npm run seed              # creates the admin + cashier accounts
npm run dev               # http://localhost:3000
```

### Generate a VAPID key pair (Web Push)

```bash
npx web-push generate-vapid-keys
```

Put the public key in **both** `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (they must match — the browser needs the public key to subscribe), and the private key in `VAPID_PRIVATE_KEY`.

### App icons

PWA icons live in `public/icons/`. To regenerate them (violet bubble motif):

```bash
node scripts/gen-icons.mjs
```

---

## 2. Environment variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_URL` | Base URL (e.g. `https://shop.example.com`) |
| `NEXTAUTH_SECRET` | next-auth JWT secret (`openssl rand -base64 32`) |
| `S3_ENDPOINT` | S3-compatible endpoint (e.g. `https://c915814.parspack.net`) |
| `S3_REGION` | Region (`default` for generic S3) |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Bucket credentials |
| `S3_KEY_PREFIX` | Key prefix folder for all assets (`behanvape`) |
| `S3_PUBLIC_URL_BASE` | Public read base, **with trailing slash** — `getPublicUrl(key) = base + key` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | VAPID key pair |
| `VAPID_SUBJECT` | `mailto:` contact for push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Mirror of `VAPID_PUBLIC_KEY` (exposed to the browser) |

> The S3 key-prefix and public-URL logic live in exactly one place — `lib/s3.ts` (`uploadToS3` / `getPublicUrl`). Never build a bucket URL anywhere else.

---

## 3. Seeding

```bash
npm run seed
```

Idempotently creates:

| username | password | role |
| --- | --- | --- |
| `admin` | `behanadmin` | admin |
| `cashier` | `behancashier` | cashier |

There is **no admin account except the seeded one**, and no UI to create another admin. The admin can create/edit/remove **cashier** accounts only. A cashier sees only a flat product list with availability toggles.

---

## 4. Fonts

The font family is self-hosted via `next/font/local` (`lib/font.ts`) from four weight files in `app/fonts/`:
`Regular.woff2`, `Medium.woff2`, `SemiBold.woff2`, `Bold.woff2`.

These currently ship as **Vazirmatn** (SIL OFL) stand-ins so the build works out of the box. To use the real brand font, simply **overwrite those four files** with the same names — no code change needed.

---

## 5. How it fits together

- **Public catalogue:** `/` (hero + categories), `/products` (all categories), `/products/[slug]` (products in one category with per-type filters/sort/pagination + detail modal). Filters/facets are computed **server-side from real data** for that category's `productType`.
- **Products have no individual page** — they open in a modal. Deep links (restock pushes) use `/products/{categorySlug}?product={id}`.
- **Restock alerts:** an unavailable product shows "اطلاع بده موجود شد". When the admin/cashier toggles it to available, everyone who signed up gets a one-time push, then the requests are cleared.
- **Admin:** `/admin/login` then `/admin` (role-aware tabs: محصولات، دسته‌بندی‌ها، کاربران، گذرواژه، اعلان‌ها). Cashiers see only the availability board.

---

## 6. Deployment (Runflare)

Runflare runs a persistent Node process (no edge/serverless adapter needed). The app builds with `output: "standalone"`.

```bash
docker build --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key> -t behanvape .
docker run -p 3000:3000 --env-file .env behanvape
```

**Deployment checklist**

- [ ] All env vars set in Runflare (not committed). `.env*` is gitignored and dockerignored.
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is available **at build time** (it is inlined into the client bundle) — pass it as a Docker build arg / Runflare build env.
- [ ] **HTTPS is required** on the deployed domain — the service worker and Web Push do **not** work over plain HTTP (except `localhost`). Confirm SSL is active on the Runflare domain.
- [ ] MongoDB and the S3 bucket are external services (connection string / credentials only) — no persistent volume needed on the container.
- [ ] Run `npm run seed` once against the production DB.
- [ ] The container respects `PORT` (Runflare provides it).

---

## 7. Notes & deviations from the original spec

- **Age gate** — a one-time client-side 18+ confirmation modal (`components/AgeGate.tsx`) shows on first visit to the public catalogue and remembers the choice via a `localStorage` flag (`behanvape:age-verified`). It is skipped on `/admin*` routes. This is a lightweight UX gate, not a backend restriction.
- **Product `slug` removed** — there are no per-product pages, so products are identified by `_id`.
- `disposable.nicotineDensity` is kept as an optional field (spec ASSUMPTION).
- A category's `productType` is **locked after creation** in the UI (server also blocks changing it once products exist), to avoid orphaning attribute data. A product's category can only be changed among categories of the same `productType`.
- Category deletion is blocked while it still has products (non-destructive default).
