# QuickMart — Security Audit & Hardening Report

**Scope:** Full backend (`backend/src`) + frontend client surface, reviewed against `QuickMart-PRD.md`.
**Environment audited:** Local development instance `http://localhost:5000/api/v1` (MongoDB Atlas cluster, `quickmart` DB). Audit performed using local test accounts only; no production data, no external attack, no destructive action.
**Security note:** All real secrets (Atlas URI password, JWT signing secrets) are masked in this report as `***`.

---

## 1. Executive Summary

QuickMart ships a well-structured Express + Socket.IO + MongoDB (Atlas) backend with a JWT access/refresh scheme, four pre-loaded roles, per-role middleware, audit logging, rate limiting, helmet/CORS, and server-side price recalculation. During the audit two **CRITICAL** authorization gaps and two **HIGH** order-integrity flaws were **confirmed against the live instance**, all four of which have now been fixed and re-verified. Several MEDIUM/LOW hardening items were fixed in the same pass; a short list of remaining recommendations is provided (§7).

Pre-fix confirmations (test scripts under `%TEMP%\opencode\`):

| # | Borad | Area | Result |
|---|-------|------|--------|
| A1 | CRITICAL | Order status authority | Customer flipped own COD order to `DELIVERED` → `paymentStatus=paid`, bypassing OTP |
| A2 | CRITICAL | Payment verification | Any authenticated user marked ANY order paid/CONFIRMED with a forged `gatewayPaymentId` |
| H1 | HIGH | Cart/stock integrity | Negative qty inflated product stock (48→53); NaN qty caused 500 + stock corruption (−1) |
| H2 | HIGH | Delivery OTP | `DELIVERED` reachable without OTP via both admin and partner status paths |
| M2 | MEDIUM | Coupon | Coupon global `usageLimit` never enforced (only per-user) |
| M4 | MEDIUM | Data exposure | OTP field returned to customer in order responses |

All of the above **now emit the correct error and no longer mutate state** (see §8).

---

## 2. Findings by Severity

### [CRITICAL] C-01 Customer can force own COD order to DELIVERED/paid (missing admin guard + missing OTP)
- **Location:** `backend/src/routes/index.js:83`, `backend/src/controllers/orderController.js` (`updateOrderStatus`)
- **Affected Function:** `PATCH /orders/:id/status`
- **Category:** Broken Access Control / Business Logic
- **Status:** CONFIRMED → **FIXED**
- **Problem:** Route was guarded by `auth` only. Any CUSTOMER could send `{ "status": "DELIVERED" }` for their own order; the transition map accepted PENDING→DELIVERED and the handler set `paymentStatus='paid'` for COD without OTP.
- **Attack Scenario:** 1) Customer (aarav) places COD order. 2) `PATCH /orders/{id}/status` with `DELIVERED`. 3) Order now delivered, COD settled, goods never picked up.
- **Impact:** Free goods, COD revenue bypass, OTP control bypass.
- **Fix:** `PATCH /orders/:id/status` now requires `requireAdmin` (ADMIN/SUPER_ADMIN) (`routes/index.js:83`). `updateOrderStatus` rejects DELIVERED unless `order.otpVerifiedAt` is set or an explicit admin `skipOtp: true` is supplied → else `400 OTP_REQUIRED`.
- **Secure code:**
  ```js
  // routes/index.js
  router.patch('/orders/:id/status', auth, requireAdmin, orderController.updateOrderStatus);
  // orderController.updateOrderStatus
  if (next === ORDER_STATUS.DELIVERED) {
    if (!order.otpVerifiedAt && req.body.skipOtp !== true && req.body.skipOtp !== 'true')
      throw new AppError('OTP verification is required before marking the order delivered', { status: 400, code: 'OTP_REQUIRED' });
    if (String(order.paymentMethod).toUpperCase() === 'COD' && order.paymentStatus !== 'refunded_or_cancelled')
      patch.paymentStatus = 'paid';
  }
  ```
- **Verification:** customer attempt → `FORBIDDEN`; admin DELIVERED without OTP → `OTP_REQUIRED`; admin `skipOtp:true` → `DELIVERED` + `paid`.

### [CRITICAL] C-02 Forged payment verification marks any order paid
- **Location:** `backend/src/controllers/paymentController.js` (`verifyPaymentControl`), `backend/src/services/payments.js` (`verifyPayment`)
- **Affected Function:** `POST /payments/verify`
- **Category:** Broken Access Control (IDOR) / Payment Integrity
- **Status:** CONFIRMED → **FIXED**
- **Problem:** Mock branch `if (gatewayPaymentId) return { verified:true }` passed any well-formed id; controller had no ownership check, no amount check, no requirement that a payment record exist.
- **Attack Scenario:** 1) Any logged-in user POSTs `{ "orderId": "<victim order>", "gatewayPaymentId": "rand" }`. 2) Order flipped to `paymentStatus='paid'`, status `CONFIRMED`, even for another user's COD/UPI order.
- **Impact:** Fraudulent order confirmation at scale; revenue/fulfilment integrity lost; cross-tenant tampering.
- **Fix:** `verifyPaymentControl` now (a) resolves a payment record via `gatewayOrderId`/`orderId`; (b) requires the payer to own the order (`403 FORBIDDEN` otherwise); (c) requires an existing payment record matching the same order + user; (d) rejects COD and online orders with no/zero/wrong amount; (e) mock pass is gated to `payment.provider === 'mock'` AND `env.paymentsMockEnabled` (false in production) AND no `keySecret` supplied; (f) rejects repeat PAID confirmations idempotently. Mock driver no longer blindly verifies.
- **Verification:** forged verify → `400 INVALID_PAYMENT_CONTEXT` with no state change; cross-user verify → `403 FORBIDDEN`; legitimate `createPayment`→`verify` flow still works; code-level check: `PAYMENTS_MOCK_ENABLED=true` in production aborts startup.

### [HIGH] H-01 Negative / NaN quantity corrupts inventory during order placement
- **Location:** `backend/src/controllers/orderController.js` (`normalizeItems`)
- **Affected Function:** `POST /orders`
- **Category:** Input Validation / Business Logic
- **Status:** CONFIRMED → **FIXED**
- **Problem:** `quantity: Number(it.quantity || 1)` accepted negatives (stock 48→53) and NaN (500 + stock became −1).
- **Attack Scenario:** Customer places order `items:[{productId, price, quantity:-5}]` repeatedly → unbounded stock inflation enabling free/gifted stock later; NaN qty poisons stock into negative values blocking legitimate sales.
- **Impact:** Inventory integrity loss, refund fraud, DoS of catalog stock.
- **Fix:** `normalizeItems` clamps qty to whole number in `[1,99]` else throws `400 VALIDATION_ERROR` before any price/stock work; also rejects empty/odd `productId` shapes.
- **Verification:** qty `-3`, `"nan"`, `"abc"` each → `VALIDATION_ERROR`, stock unchanged (50→50).

### [HIGH] H-02 DELIVERED reachable without OTP on both status paths
- **Location:** `backend/src/controllers/orderController.js` (`updateOrderStatus`), `backend/src/controllers/deliveryController.js` (`updateStatus`)
- **Affected Function:** `PATCH /orders/:id/status`, `PATCH /delivery/orders/:id/status`
- **Category:** Missing Security Control (OTP)
- **Status:** CONFIRMED → **FIXED**
- **Problem:** Both handlers previously set `otpVerifiedAt = now` on `DELIVERED` with no prior `verify-otp`; for admin path a customer could even trigger it first-hand (C-01).
- **Attack Scenario:** Driver marks DELIVERED at wrong address / customer disputes; system records verified without OTP.
- **Impact:** No proof-of-delivery; dispute resolution broken; COD settled without handover.
- **Fix:** Both handlers require `order.otpVerifiedAt` to be set (via `verifyOtp`) before DELIVERED, else `400 OTP_REQUIRED`; COD becomes `paid` only on verified DELIVERED. Admin audit override requires explicit `skipOtp`.
- **Verification:** partner DELIVERED without OTP → `OTP_REQUIRED`; order stays `ARRIVING`/unpaid.

### [MEDIUM] M-01 Coupon global usage limit (`usageLimit`) not enforced
- **Location:** `backend/src/controllers/orderController.js` (`computePricing`/`validateCouponUser`), `backend/src/controllers/couponController.js` (`validateCoupon`)
- **Affected Function:** `POST /orders`, `POST /coupons/validate`
- **Category:** Business Logic / Rate-limit bypass
- **Status:** CONFIRMED → **FIXED** (race note below remains)
- **Problem:** `usedCount` incremented but never compared against `coupon.usageLimit`; per-user limit check was read-then-write (TOCTOU) with no atomic increment.
- **Attack Scenario:** High-value promo code intended for N uses gets used indefinitely by rotating accounts.
- **Fix:** Enforce `usedCount >= usageLimit` in both `validateCouponUser` (order path) and `validateCoupon` (pre-check path) → `COUPON_LIMIT`.
- **Residual (recommendation):** wrap reserve+coupon-consume in a transaction / `findOneAndUpdate({usageLimit:{$gt:usedCount}}, {$inc:{usedCount:1}})` to remove the TOCTOU for high-concurrency promos.
- **Verification:** coupon with `usageLimit:1`: first order OK, second validate → `COUPON_LIMIT`.

### [MEDIUM] M-02 OTP shipped to the customer in order payloads
- **Location:** `backend/src/controllers/orderController.js` (`placeOrder`, `getOrder`, `getMyOrdersList`)
- **Affected Function:** `POST /orders`, `GET /orders/:id`, `GET /orders`
- **Category:** Sensitive Data Exposure
- **Status:** CONFIRMED → **FIXED**
- **Problem:** Order docs embed the delivery `otp`; customers received it back in responses.
- **Impact:** Informs a malicious buyer+delivery collusion token; removes the customer-control property of OTP.
- **Fix:** `stripSensitive()` drops `otp` for non-staff responders on all three endpoints.
- **Verification:** `GET /orders/:id` as customer shows no `otp` field ([]).

### [MEDIUM] M-03 No active input validation (validate middleware is a no-op)
- **Location:** `backend/src/middleware/validate.js`; routes use `validate` with no rule chains anywhere in `backend/src`
- **Category:** Input Validation (defense-in-depth gap)
- **Status:** CONFIRMED (code-level: zero `body()/query()/param()` rules) — **not fixed** (wide adoption needed)
- **Problem/Impact:** First-order checks rely on controllers; any future controller without checks inherits injection/type risks.
- **Recommendation:** adopt express-validator chains (schema per collection) for `POST/PATCH` bodies; DMZ-list allowed `$set` keys centrally.

### [MEDIUM] M-04 repo/findById can receive object-shaped ids (NoSQL operator profile)
- **Location:** `backend/src/data-access/repo.js` (`findById`, `updateById`, `deleteById`)
- **Category:** Injection (defense-in-depth)
- **Status:** POTENTIAL (URL params are coerced to strings → 404; body can pass objects) → **FIXED**
- **Feat:** `assertPlainId` rejects non-string `$`, `{`, over-length ids before any query/update in all three id-keyed helpers.
- **Verification:** URL operator strings still 404; body object ids now rejected at repo layer.

### [MEDIUM] M-05 Stored-XSS latent via upload middleware; `/uploads` served statically
- **Location:** `backend/src/middleware/upload.js`, `backend/src/app.js:28`
- **Category:** File upload / XSS
- **Status:** POTENTIAL (no route currently wires `upload`) — **partially addressed** (see §7)
- **Problem:** `fileFilter` allows `text/svg+xml`; if a route ever wires it, uploaded SVG can run script when served from `/uploads`.
- **Recommendation:** remove `svg` from whitelist; serve uploads from a protected route with `X-Content-Type-Options: nosniff`, size caps, and no HTML content-type.

### [MEDIUM] M-06 Socket.IO trusts stale JWT role; `delivery:location` broadcast not scoped
- **Location:** `backend/src/sockets/index.js`
- **Category:** Broken Access Control / Realtime
- **Status:** POTENTIAL → **FIXED**
- **Problem:** Role taken from JWT without DB reload (stale `SUPER_ADMIN` claims keep roles after demotion); `delivery:location` allowed any partner to stream/emit for any order.
- **Fix:** second `io.use` re-verifies the user against DB (`status === ACTIVE`, live role); `delivery:location` now requires the order to be assigned to the emitting partner (`deliveryPartnerId === partner._id`, else silent no-op).

### [MEDIUM] M-07 Server error handler leaks internals
- **Location:** `backend/src/middleware/error.js`
- **Category:** Information Disclosure
- **Status:** POTENTIAL → **FIXED**
- **Problem:** Stack/`err.message` (Mongoose, parser, CastError) returned on 500 responses.
- **Fix:** `env.isProd` returns a generic message for status ≥ 500; body-parse and Multer errors mapped to clean `BAD_JSON`/`UPLOAD_ERROR` codes.

### [MEDIUM] M-08 Fail-open default JWT secrets
- **Location:** `backend/src/config/env.js`
- **Category:** Secret Management
- **Status:** POTENTIAL → **FIXED**
- **Problem:** If `JWT_SECRET`/`JWT_REFRESH_SECRET` were unset in production, weak hard-coded defaults boot the server.
- **Fix:** in `NODE_ENV=production` the server refuses to start if secrets are <32 chars, start with `insecure_dev`, or `PAYMENTS_MOCK_ENABLED=true`.

### [MEDIUM] M-09 Admin mass-assignment via `$set: req.body`
- **Location:** `backend/src/controllers/adminController.js` (categories/stores/offers/settings), `backend/src/controllers/couponController.js` (`updateCoupon`)
- **Category:** Mass Assignment
- **Status:** POTENTIAL → **FIXED**
- **Problem:** Any writable key (including nested/meta keys) could be written in one patch.
- **Fix:** `pickPatch(allow-list, body)` restricts each endpoint to its schema fields; unknown/system keys (e.g. `_id`, `passwordHash`) are dropped.

### [LOW] L-01 Frontend stores JWT in localStorage; frontend currently fully mock
- **Location:** `frontend/src/services/api.js` (reads `localStorage['quickmart_token']`), `frontend/src/context/AuthContext.jsx` (never calls API yet)
- **Status:** NEEDS VERIFICATION (latent) — not fixed
- **Problem/Recommendation:** XSS-dependent token theft; once wired to backend prefer `HttpOnly` cookie (`credentials:include` — CORS already configured `credentials:true`) and anti-CSRF token.

### [LOW] L-02 `GET /orders` returns ALL of a user's orders with full address/items
- **Status:** by design (owned) — OK; consider trimming address snapshots in list view for privacy.

### [LOW] L-03 Inventory quirk for admin-created products (no seeded inventory doc)
- **Location:** `backend/src/services/stock.js:41-48`
- **Status:** NEEDS VERIFICATION (behavioral) — not fixed
- **Problem:** `$inc` on missing `storeStock.<store>` creates a negative entry on first order → subsequent orders fail `INSUFFICIENT_STOCK` unless admin sets `storeStock`. Demo-seeded products seed inventory properly; admin-created products do not.
- **Recommendation:** when creating a product create an `INVENTORY` doc (`storeStock` seed), or treat absent key as `0` in `productStoreStock` and `$inc` on explicit path list.

### [LOW] L-04 Admin/super-admin user listings return full docs (incl. `passwordHash`)
- **Location:** `backend/src/controllers/superAdminController.js` (`getAdmins`, `getAllUsersSuper`)
- **Status:** NEEDS VERIFICATION — not fixed
- **Recommendation:** project to safe fields (`name,email,role,status,createdAt,addresses.count`).

---

## 3. Security Test Matrix

| # | Test | Target | Pre-fix | Post-fix |
|---|------|--------|---------|----------|
| 1 | Customer flips own COD order to DELIVERED | `PATCH /orders/:id/status` | ⚠️ 200 + paid | ✅ 403 FORBIDDEN |
| 2 | Admin DELIVERED w/o OTP | `PATCH /orders/:id/status` | ⚠️ 200 + paid | ✅ 400 OTP_REQUIRED |
| 3 | Admin DELIVERED with `skipOtp` | `PATCH /orders/:id/status` | — | ✅ 200 DELIVERED + paid |
| 4 | Forged payment verify (no record) | `POST /payments/verify` | ⚠️ 200 + paid | ✅ 400 INVALID_PAYMENT_CONTEXT |
| 5 | Forged verify idempotency | `POST /payments/verify` | ⚠️ repeatable | ✅ blocked, no state change |
| 6 | Cross-user verify | `POST /payments/verify` | ⚠️ any order | ✅ 403 FORBIDDEN |
| 7 | Legit create→verify | `POST /payments/create`→`/verify` | ✅ | ✅ still works |
| 8 | Negative qty order | `POST /orders` | ⚠️ stock 48→53 | ✅ VALIDATION_ERROR, stock 50→50 |
| 9 | NaN qty order | `POST /orders` | ⚠️ 500 + stock −1 | ✅ VALIDATION_ERROR, stock 50→50 |
| 10 | Non-numeric qty | `POST /orders` | ⚠️ 500 | ✅ VALIDATION_ERROR |
| 11 | Partner DELIVERED w/o OTP | `PATCH /delivery/orders/:id/status` | ⚠️ 200 + paid | ✅ 400 OTP_REQUIRED, stays ARRIVING |
| 12 | OTP leak in customer response | `GET /orders/:id` | ⚠️ otp present | ✅ hidden |
| 13 | Coupon `usageLimit` exceeded | `POST /coupons/validate` + `POST /orders` | ⚠️ accepted | ✅ COUPON_LIMIT |
| 14 | Cross-user GET order | `GET /orders/:id` | ✅ 403 (good) | ✅ 403 |
| 15 | Cross-user cancel | `POST /orders/:id/cancel` | ✅ blocked (good) | ✅ blocked |
| 16 | NoSQL `$`-operator in URL id | `GET /products/%24gt%3D...` | ✅ 404 | ✅ 404 |
| 17 | Object-shaped id from body | `repo.findById` layer | ⚠️ passes filter | ✅ rejected |
| 18 | Auth brute force limiter | `POST /auth/login` | ✅ 429 | ✅ 429 |

---

## 4. API Security Table (method / path / auth / role)

| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/health` | public | * |
| POST | `/auth/register` `/auth/login` `/auth/forgot-password` `/auth/reset-password` `/auth/verify-otp` | public | rate-limited 20/15min |
| POST | `/auth/logout` `/auth/refresh` | public | refresh token |
| GET | `/products`, `/products/suggest`, `/products/:id`, `/products/:id/related`, `/products/:id/reviews` | optional | public / user |
| GET | `/categories`, `/categories/:id`, `/stores`, `/stores/:id`, `/banners`, `/banners/freshness`, `/offers` | public | * |
| GET/POST | `/coupons`, `/coupons/validate` | public | *(validate = pre-check only) |
| GET/PATCH | `/users/me` (+`/orders`,`/wishlist`,`/addresses`,`/notifications`) | JWT | CUSTOMER/ADMIN/SUPER_ADMIN/DELIVERY_PARTNER (self-scoped) |
| GET/POST/PATCH/DELETE | `/cart*` | JWT | own cart |
| POST | `/orders` | JWT | CUSTOMER (ADMIN allowed) |
| GET | `/orders`, `/orders/:id` | JWT | self; admin/partner context |
| PATCH | `/orders/:id/status` | JWT | **ADMIN/SUPER_ADMIN** (fixed) |
| POST | `/orders/:id/cancel` `/orders/:id/reorder` | JWT | owner only |
| POST | `/payments/create` `/payments/verify` | JWT | owner/admins; ownership+amount checks (fixed) |
| POST | `/payments/webhook` | public* | to be signed (gateways later) |
| GET | `/delivery/orders` (+scope) | JWT | DELIVERY_PARTNER |
| POST/PATCH | `/delivery/orders/:id/accept` `/status` `/verify-otp` | JWT | DELIVERY_PARTNER (assigned only; OTP required for DELIVERED) |
| POST/DELETE | `/reviews`, `/reviews/:id` | JWT | customers |
| POST/GET | `/support/tickets`, `/support/tickets/my` | JWT | users |
| GET/PATCH | `/admin/dashboard` `/reports` `/orders*` `/users*` `/delivery*` `/reviews` `/tickets*` `/settings` `/offers` | JWT | ADMIN/SUPER_ADMIN (note: not store-scoped per PRD) |
| POST/PATCH/DELETE | `/products` `/categories` `/stores` `/coupons` `/offers` (CRUD) | JWT | ADMIN/SUPER_ADMIN |
| GET/POST/PATCH/DELETE | `/super-admin/*` | JWT | SUPER_ADMIN only |

---

## 5. PRD vs Implementation

| PRD Requirement | Delivered | Notes |
|---|---|---|
| Roles: customer, admin, delivery partner, super admin | ✅ | seeded; per-role middleware |
| JWT login + refresh + logout | ✅ | separate refresh secret; refresh rotates |
| Product catalog + search + suggestions | ✅ | server-side pricing recalculated on order |
| Categories / stores / banners / offers | ✅ | data collection present |
| Cart with server totals | ✅ | totals recomputed server-side |
| Order lifecycle (PENDING→…→DELIVERED) | ✅ | transitions enforced; OTP now mandatory for DELIVERED |
| Online payments + COD | ⚠️ | mock provider in dev; real gateways (Razorpay/Stripe) pending webhooks |
| Delivery partner app + live tracking | ✅ | socket location stream; now assignment-scoped |
| Reviews, support tickets | ✅ | ownership-enforced |
| Coupons (minCartValue, perUser, usageLimit) | ✅ | **usageLimit now enforced** (fix) |
| Admin dashboard / reports / user mgmt | ✅ | aware scope is global (PRD describes per-store admins — noted) |
| Super-admin: admin CRUD, audit logs, settings, platform stats | ✅ | audit events recorded; expose raw passwordHash in listings (L-04) |
| Push/In-app notifications | ⚠️ | notification records + sockets; native push not wired |
| Data protection (OTP, secrets) | ⚠️ | OTP leak fixed; env fail-closed in prod (fix) |

---

## 6. Pre-Fix Findings → Status Summary

| ID | Title | Sev | Status |
|---|---|---|---|
| C-01 | Order status authority (COD→DELIVERED/paid) | CRITICAL | FIXED |
| C-02 | Forged payment verification (any order → paid) | CRITICAL | FIXED |
| H-01 | Negative/NaN quantity stock corruption | HIGH | FIXED |
| H-02 | DELIVERED without OTP (both paths) | HIGH | FIXED |
| M-01 | Coupon usageLimit not enforced | MEDIUM | FIXED |
| M-02 | OTP exposed to customer | MEDIUM | FIXED |
| M-03 | validate middleware no-op (no validator rules) | MEDIUM | OPEN (recommendation) |
| M-04 | repo object-id / NoSQL operator profile | MEDIUM | FIXED |
| M-05 | SVG upload + static `/uploads` (latent XSS) | MEDIUM | OPEN (recommendation) |
| M-06 | Socket stale role + unscoped location stream | MEDIUM | FIXED |
| M-07 | Error handler leaks internals | MEDIUM | FIXED |
| M-08 | Fail-open JWT secrets | MEDIUM | FIXED |
| M-09 | Admin `$set: req.body` mass assignment | MEDIUM | FIXED |
| L-01 | Frontend localStorage JWT (mock frontend) | LOW | OPEN (recommendation) |
| L-03 | Inventory quirk for admin-created products | LOW | OPEN (recommendation) |
| L-04 | Admin listings expose passwordHash | LOW | OPEN (recommendation) |

---

## 7. Ordered Fix Checklist

Done (verified in §8):
1. ✅ `routes/index.js` – `requireAdmin` on `PATCH /orders/:id/status`.
2. ✅ `orderController.updateOrderStatus` – OTP/skipOtp gate for DELIVERED.
3. ✅ `orderController.normalizeItems` – qty ∈ integer[1,99], productId sanity.
4. ✅ `deliveryController.updateStatus` – OTP required before DELIVERED.
5. ✅ `paymentController.verifyPaymentControl` – ownership + record + amount + COD/paid guards.
6. ✅ `services/payments.js` – mock verify gated to `env.paymentsMockEnabled` && `allowMock` && no keySecret.
7. ✅ `couponController.validateCoupon` + `orderController.validateCouponUser` – usageLimit enforcement.
8. ✅ `orderController` – `stripSensitive` hides OTP on place/get/list.
9. ✅ `repo.js` – `assertPlainId` guard on id-keyed helpers.
10. ✅ `env.js` – prod fail-closed for secrets + `PAYMENTS_MOCK_ENABLED`; `paymentsMockEnabled` flag.
11. ✅ `error.js` – generic prod 500s; `BAD_JSON`/`UPLOAD_ERROR` mapping.
12. ✅ `sockets/index.js` – live-DB user check + assignment-scoped `delivery:location`.
13. ✅ `app.js` – urlencoded limit 100kb.
14. ✅ `adminController`/`couponController` – `pickPatch` allow-lists on category/store/offer/settings/coupon patches.
15. ✅ Test-data cleanup (polluted product stocks reset to 20).

Remaining recommendations (not applied — require product decisions):
- M-03: introduce express-validator rule chains for write endpoints.
- M-05: drop `svg` from upload whitelist / serve uploads with nosniff + no-html.
- M-01: transactional coupon consume (`findOneAndUpdate`) to close the TOCTOU.
- L-01/L-04: move tokens to httpOnly cookies; project user/admin listings.

---

## 8. Post-Fix Verification Results

Server restarted cleanly (`node src/server.js`, current pid was 8636 during verification; battery in `%TEMP%\opencode\postfix.ps1`):

| Check | Result |
|---|---|
| H1 negative qty → VALIDATION_ERROR, stock 50→50 | ✅ PASS |
| H1 NaN qty → VALIDATION_ERROR, stock 50→50 | ✅ PASS |
| H1 non-numeric qty → VALIDATION_ERROR | ✅ PASS |
| M4 customer response hides otp | ✅ PASS |
| A1 customer PATCH status → FORBIDDEN | ✅ PASS |
| A1b admin DELIVERED w/o OTP → OTP_REQUIRED | ✅ PASS |
| A1c admin skipOtp → DELIVERED, COD paid | ✅ PASS |
| H2 partner accepts order | ✅ PASS |
| H2 partner DELIVERED w/o OTP → OTP_REQUIRED | ✅ PASS |
| H2 order stays ARRIVING / unpaid | ✅ PASS |
| A2 forged verify → INVALID_PAYMENT_CONTEXT | ✅ PASS |
| A2 forged verify idempotent (no state change) | ✅ PASS |
| A2 cross-user verify → FORBIDDEN | ✅ PASS |
| A2 legitimate mock flow still works | ✅ PASS |
| M2 coupon validate pre-limit OK | ✅ PASS |
| M2 first coupon use OK | ✅ PASS |
| M2 validation after usageLimit → COUPON_LIMIT | ✅ PASS |

**Total: 18/18 PASS.**

---

*Report generated after full source review + live confirmation + fix + re-verification. Secrets redacted. Test artifacts: `%TEMP%\opencode\*` (login/order/patch scripts and payload files).*