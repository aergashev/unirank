# UniRank

A live ranking of Uzbekistan's universities where the order is decided by
supporters: anyone can give a university **POWER** (10 000 soʻm each, any
amount, no account), and the board re-sorts the moment a payment settles.

Uzbek / Russian / English. Admin panel at `/admin`.

## Run it locally

```bash
docker compose up -d db     # Postgres on 127.0.0.1:5439
npm install
npm run db:migrate          # apply migrations
npm run db:seed             # 42 universities at 0 POWER + the first admin
npm run dev                 # http://localhost:3300
```

Admin sign-in uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The seed syncs that
account's password to the variable on every run, so rotating it is: change the
variable, run the seed (on Vercel: redeploy).

`.env` is committed and this repository is public, so those values are for
local development only. On Vercel, set `SESSION_SECRET`, `ADMIN_PASSWORD`,
`TEST_GATEWAY_SECRET` and `NEXT_PUBLIC_SITE_URL` as project environment
variables — until `SESSION_SECRET` differs from the committed one, the build
locks the admin panel.

Everything in Docker instead: `docker compose --profile web up -d --build`.

## Payments

There is no real payment provider yet. `PAYMENT_PROVIDER=test` enables a
sandbox gateway that behaves like a hosted payment page — redirect out, approve
or decline, signed callback back — so the whole order lifecycle is real:

`PENDING → PAID | FAILED | EXPIRED`, and `PAID → REFUNDED` from the admin panel.

**While the sandbox is on, anyone can add POWER for free.** Do not treat a
public deployment's board or sums as real until a provider is connected.

Adding Payme or Click:

1. `lib/payments/<name>.ts` — implement `PaymentProvider.checkoutUrl(order)`.
2. `app/api/payments/<name>/…/route.ts` — verify the provider's signature, then
   call `settleOrder({ publicId, providerRef, amountUzs })` or `failOrder()`.
3. Register it in `lib/payments/index.ts`, set `PAYMENT_PROVIDER=<name>`.

`settleOrder` is the only code that adds POWER. It is idempotent (providers
retry callbacks), refuses a sum that differs from the order, and records the
rank change and feed events in the same transaction.

## Where things are

| | |
|---|---|
| `app/[lang]/` | public site: board, university page, receipt, suggest, how it works |
| `app/(gateway)/pay/test/` | the sandbox payment page |
| `app/admin/` | admin panel; all mutations in `(panel)/actions.ts`, each one audit-logged |
| `lib/orders.ts` | order lifecycle: create, settle, fail, refund, expire |
| `lib/ranking.ts` | board order, ranks, stats, activity feed |
| `lib/i18n/` | copy. `uz.ts` defines the shape; `ru.ts` and `en.ts` must match it |
| `prisma/universities.ts` | the seed list |
| `docs/reference-mockup.jpeg` | the visual reference the design system started from |

Rules the data model keeps: `University.power` is only changed inside
`settleOrder` / `refundOrder`; a university with orders can be hidden but never
deleted; the board is never seeded with invented numbers.

## Not done yet

- A real payment provider (see above).
- Terms of use and a privacy policy — these need real legal text, so no
  placeholder pages were written.
- University logos: the seed has none; upload them per university in the admin
  panel. Until then a monogram is shown.
