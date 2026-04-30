# Liquidation Nation DC

Inventory showcase website for in-store purchases.

No online checkout.  
No cart.  
Fast admin updates for stock and quantity.

## Stack

- Next.js (App Router)
- Supabase Postgres
- Supabase Storage (`product-images` bucket)
- Supabase Auth (admin login)
- Client-side search via Fuse.js
- Cloudflare Pages hosting

## Routes

Public:

- `/` homepage (hero, contact info, categories, featured, FAQ)
- `/catalog` searchable/filterable inventory showcase

Admin:

- `/admin/login`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]/edit`
- `/admin/categories`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

3. In Supabase SQL Editor run:

- `supabase/schema.sql`
- `supabase/seed.sql`

4. Start local dev:

```bash
npm run dev
```

## Supabase schema

Tables:

- `categories`
- `products`
- `product_images`

Includes:

- enums for product `status` and `condition`
- indexes
- `updated_at` trigger
- RLS policies for public storefront reads and authenticated admin writes
- storage bucket/policies for `product-images`

## Notes

- Product cards intentionally show only `Available in store only`.
- Mobile catalog uses a `Filters` toggle button instead of persistent left sidebar.
- Quick stock actions are available in admin products table:
  - `Mark as Sold`
  - `Back in Stock`
  - `Hide`
  - quantity edit

## Cloudflare Pages

Use framework preset `Next.js` in Cloudflare Pages and set the same env vars there.

Build command:

```bash
npm run build
```

Output directory:

`(auto-managed by the Next.js preset)`