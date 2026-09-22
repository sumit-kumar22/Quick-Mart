# QuickMart Backend API

Express + MongoDB (Mongoose) REST API for the QuickMart quick-commerce app, with an in-memory fallback so the whole platform runs with zero external dependencies. Serves the SPA frontend with the same data shapes (`id`, `slug`, `mrp`, `sellingPrice`, etc.) used by the mock layer.

## Quick start

```bash
cd backend
npm install
npm run seed      # hydrate the database (frontend demo data)
npm run dev       # or: npm start
```

- API base: `http://localhost:5000/api/v1`
- Health check: `GET /api/v1/health`
- CORS is open to `http://localhost:5173` (the Vite dev server).

## Configuration (`backend/.env`)

The `.env` file is git-ignored; copy the keys you need from `.env.example` (create it from the values below).

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | `production` enables stricter CORS/logging |
| `CLIENT_URL` | `http://localhost:5173` | Allowed SPA origin |
| `DB_ENGINE` | `auto` | `mongo` / `memory` / `auto` (mongo first, fallback to memory) |
| `MONGODB_URI` | — | MongoDB connection string |
| `SEED_ON_START` | `true` | Auto-seed on server boot when DB is empty |
| `SEED_RESET` | — | When `true`, seed run drops all collections first |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | dev defaults | Sign/verify tokens |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `DELIVERY_FEE` | `39` | Flat delivery fee below free-delivery threshold |
| `FREE_DELIVERY_THRESHOLD` | `499` | Cart total that unlocks free delivery |
| `DEFAULT_DELIVERY_RADIUS_KM` | `8` | Store eligibility radius for mock geo |
| `REDIS_URL` | — | Optional cache (in-memory used otherwise) |
| `RAZORPAY_KEY_ID/SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | — | Real gateways when set, mock driver otherwise |
| `GOOGLE_MAPS_API_KEY` | — | Real ETA/nearest-store; static mock fallback |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` | — | Email delivery; console fallback |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | — | Image uploads; base64 fallback |

Every optional integration degrades gracefully: if a key/dependency is absent the code falls back to a mock or in-memory equivalent, so the app always works.

## Seeding

```bash
npm run seed              # insert demo data if users are missing
node src/config/seed.js --reset   # drop all collections, then reseed
```

The seeder loads the frontend's data modules (`frontend/src/data/*.js`) so catalog, orders and analytics are byte-identical to the mock app. It inserts: 5 stores, 12 categories, 49 products, 196 inventory rows, 13 users, 4 delivery partners, 5 coupons, 4 offers, 8 banners, 8 reviews, 148 orders + notifications/carts/settings/audit. Passwords are bcrypt-hashed.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer (any seeded `u-*`) | e.g. `aarav@example.com` | `customer123` |
| Admin | `admin@quickmart.co` | `admin@123` |
| Super Admin | `superadmin@quickmart.co` | `admin@123` |
| Delivery (all partners) | `ajay@quickmart.co`, `ramesh@quickmart.co`, `suresh@quickmart.co`, `dinesh@quickmart.co` | `ajay@123` |

Registering a new customer with an `address` in the payload creates a default saved address automatically.

## API overview (all under `/api/v1`)

- **Auth** — `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-otp`
- **Catalog (public)** — `GET /products`, `/products/:id|:slug`, `/products/:id/related`, `/products/:id/reviews`, `/products/suggest`, `/categories`, `/categories/:id`, `/stores`, `/stores/:id`, `/banners`, `/banners/freshness`, `/offers`
- **Coupons** — `GET /coupons`, `POST /coupons/validate`
- **Customer** — profile/addresses/wishlist/notifications under `/users/me…`
- **Cart** — `GET /cart`, `POST /cart/items`, `PATCH|DELETE /cart/items/:productId`, `DELETE /cart`, `POST /cart/coupon`
- **Orders** — `POST /orders` (stateless: send `items[]` + `addressId`/`address` + `paymentMethod` + optional `coupon`), `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `POST /orders/:id/cancel`, `POST /orders/:id/reorder`
- **Payments** — `POST /payments/create`, `/payments/verify`, `POST /payments/webhook`
- **Delivery partner** — `GET /delivery/orders`, `POST /delivery/orders/:id/accept`, `PATCH /delivery/orders/:id/status`, `POST /delivery/orders/:id/verify-otp`
- **Reviews / Support** — `POST /reviews`, `DELETE /reviews/:id`, `POST /support/tickets`, `GET /support/tickets/my`
- **Admin** — dashboard, reports, orders, users, delivery partners, reviews, tickets, settings, offers + catalog CRUD (`/admin/…`, guarded by `requireAdmin`)
- **Super Admin** — audit logs, admins, platform stats, users, security settings under `/super-admin/…`

Order status flow: `PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → (partner accept) ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → ARRIVING → DELIVERED` (COD settles to `paid` on delivery). Illegal transitions and coupon category restrictions are enforced server-side. Payment methods `RAF`/`UPI`, `CARD`, `NETBANKING`, `COD`, `RAZORPAY`, `WALLET` are canonicalized on the server.

## Example order flow

```bash
TOKEN=$(curl -s -X POST localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@quickmart.co","password":"admin@123"}' | jq -r .data.token)

curl -s -X POST localhost:5000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"addressId":"home","paymentMethod":"cod","items":[{"productId":"p020","quantity":2}],"coupon":"FRESH10"}'
```

## Architecture notes

- **Storage abstraction** — `src/data-access/repo.js` exposes one facade (`findOne/findMany/insertOne/updateById/…`) over Mongoose (`mongoRepo.js`) or the in-memory store (`memory.js`). Controllers never talk to Mongoose directly.
- **Identifiers** — all `_id`s are strings (`p001`, `ord-…`, `u-…`) so Mongo and the in-memory store behave identically and match frontend mock ids.
- **No `populate()`** — documents are denormalized (order items carry name/emoji/price, users name, etc.); analytics are computed in JS.
- **Realtime** — Socket.IO emits `order:*`, `delivery:*`, `notification:new` events (`src/sockets/index.js`).
- **Coupons & stock** — order placement re-prices from the DB, validates stock, reserves inventory (`services/stock.js`), applies coupon rules then records the order; cancellations release stock and (for online-paid orders) issue a refund reference.
- **Security** — bcrypt password hashes, short-lived JWT + refresh rotation, per-route role guards (`requireRole`/`requireAdmin`), rate limiting on auth + API, audit logs for admin actions, inputs validated per route.
- **Middleware** — `src/middleware/`: `auth`, `validate`, `error`, `rateLimit`, `upload`, `audit`.

## Project structure

```
backend/
  src/
    app.js                 # express app, middleware, routes, error handler
    server.js              # boot: connect DB -> seed -> Socket.IO
    config/                # env, constants, db connect, seed
    data-access/           # repo facade + mongo + in-memory engines
    controllers/           # route handlers (auth..superAdmin)
    middleware/            # auth, validate, errors, rateLimit, upload, audit
    models/                # Mongoose schemas
    routes/index.js        # full API surface under /api/v1
    services/              # cache, email, maps, payments, stock
    sockets/               # Socket.IO wiring + emit helpers
    utils/                 # response helpers, id generators
```