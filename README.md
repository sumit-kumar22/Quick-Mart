https://frontend-eta-two-prpvck7g1w.vercel.app/login
🛒 QuickMart

A production-oriented full-stack quick-commerce grocery and essentials
delivery platform.

QuickMart is a modern quick-commerce platform where customers can
discover groceries and daily essentials, select a serviceable location,
add products to cart, apply coupons, checkout, make payments, track
orders in real time, and communicate with support.

The project is designed as an original implementation inspired by common
quick-commerce product patterns. It does not copy third-party
branding, logos, copyrighted assets, text, or source code.

✨ Project Highlights

Customer grocery shopping experience

Location-based store selection

Product search, filters and sorting

Product variants and store-specific inventory

Cart, wishlist and checkout

Coupon and offer system

Razorpay / Stripe payment support

COD support

Real-time order tracking

Delivery partner dashboard

OTP-based delivery confirmation

Admin dashboard

Super Admin dashboard

Multi-store / dark-store architecture

Inventory management

Reviews and ratings

Notifications

Support tickets

Analytics and reports

Redis caching and rate limiting

Socket.IO real-time communication

JWT authentication and role-based authorization

Google Maps integration

Responsive mobile-first UI

Production-oriented security practices

👥 User Roles

Customer

Customers can register/login, manage their profile and addresses, browse
products, search and filter products, manage cart/wishlist, apply
coupons, checkout, pay online or by COD, track orders, cancel eligible
orders, request supported refunds/returns, reorder products, review
products and contact support.

Delivery Partner

Delivery partners can securely log in, receive assignments, accept
eligible orders, navigate to stores/customers, update delivery status,
complete OTP verification, upload delivery proof when required, view
earnings/history and manage online availability.

Admin

Admins manage their assigned stores, including products, categories,
inventory, customers, delivery partners, orders, coupons, offers,
banners, reviews, reports and store settings.

Super Admin

Super Admin has platform-wide control over stores, admins, customers,
delivery partners, products, categories, orders, global settings,
security, permissions, analytics, audit logs and feature flags.

🧰 Technology Stack

Layer               Technology

Markup              HTML5
Styling             CSS3, Tailwind CSS
Frontend            React.js, JavaScript
Routing             React Router
HTTP Client         Axios
Forms               React Hook Form
State               Context API / Redux Toolkit
Charts              Recharts
Icons               Lucide React
Backend             Node.js, Express.js
API                 REST API
Database            MongoDB, Mongoose
Authentication      JWT
Password Security   bcrypt/bcryptjs
Real-Time           Socket.IO
Cache               Redis
Payments            Razorpay / Stripe
Maps                Google Maps API
Image Storage       Cloudinary / object storage
Testing             Postman / Thunder Client
Version Control     Git, GitHub

📁 Project Structure

quickmart/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── sections/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── sockets/
│   │   ├── validators/
│   │   ├── uploads/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── README.md
├── .gitignore
└── .env.example

🛍️ Customer Features

Homepage

Promotional hero banners

Configurable category shortcuts

Top deals

Daily essentials

Promotional sections

Benefits strip

Responsive mobile navigation

Product System

Products support: - Product ID and SKU - Name, slug and descriptions -
Brand/category/subcategory - Images and thumbnails - Variants - Unit and
weight - MRP and selling price - Discount and tax - Stock and quantity
limits - Search keywords and tags - Nutritional/ingredient information
where applicable - Delivery eligibility - Featured, bestseller and
new-arrival flags - Ratings and review count

Search & Discovery

Product name search

Brand/category/SKU search

Tags and keywords

Search suggestions

Recent searches

Popular searches

Typo-tolerant search where feasible

No-result recommendations

Filters & Sorting

Filters: - Category - Brand - Price - Discount - Rating - Availability -
Weight/size - Store - Dietary attributes where applicable

Sorting: - Relevance - Price low to high - Price high to low -
Discount - Rating - Newest - Popularity

🛒 Cart & Checkout

Cart supports: - Quantity updates - Remove item - Save for later -
Coupons - Item subtotal - Discount - Delivery fee - Taxes - Platform fee
where configured - Final total

Checkout flow:

Cart
  ↓
Address
  ↓
Delivery Slot / ETA
  ↓
Coupon
  ↓
Payment Method
  ↓
Order Review
  ↓
Payment
  ↓
Order Confirmation

Supported payment options include Razorpay, Stripe and COD where
configured.

Payment success must always be verified by the backend. The frontend
callback alone must never be treated as proof of payment.

📦 Order Management

Order statuses include:

PENDING
CONFIRMED
PAYMENT_PENDING
PAYMENT_CONFIRMED
PREPARING
READY_FOR_PICKUP
ASSIGNED
PICKED_UP
OUT_FOR_DELIVERY
ARRIVING
DELIVERED
CANCELLED
REFUND_REQUESTED
REFUNDED
FAILED

Customers get a visual order timeline and real-time status updates.

🚚 Delivery System

Delivery flow:

Assignment received
       ↓
Accept assignment
       ↓
Navigate to store
       ↓
Pickup order
       ↓
Navigate to customer
       ↓
OTP verification
       ↓
Complete delivery

Delivery partner features: - Online/offline status - Assigned orders -
Pickup information - Google Maps navigation - Delivery status updates -
OTP verification - Earnings - Delivery history - Real-time assignment
notifications

📍 Location & Multi-Store

QuickMart supports multiple stores/dark stores.

When a customer selects a location, the platform should:

Obtain coordinates through browser permission or address search.

Convert addresses to coordinates when required.

Find eligible stores.

Check delivery radius.

Select the appropriate store.

Show store-specific inventory.

Calculate delivery estimates.

Google Maps can be used for: - Address autocomplete - Geocoding -
Reverse geocoding - Distance calculation - Route display

Secret API keys must never be exposed in frontend code.

📦 Inventory

Inventory is store-specific.

The system supports: - Add stock - Reduce stock - Stock adjustments -
Low-stock alerts - Out-of-stock state - Reserved stock - Available
stock - Inventory history - Store-wise inventory - Product-wise
inventory

The backend must validate inventory again during checkout.

🎟️ Coupons & Offers

Coupon configuration supports: - Percentage discounts - Fixed
discounts - Maximum discount - Minimum cart value - Start/end dates -
Usage limits - Per-user limits - Product/category/store restrictions -
Active/inactive state

Offer types include: - Percentage discount - Flat discount - Buy X Get
Y - Category offer - Product offer - Free delivery - First-order offer -
Bank/payment offer

❤️ Wishlist, Reviews & Ratings

Wishlist: - Add/remove products - Move to cart - Stock status - Current
price

Reviews: - Rating 1--5 - Title - Review - Images where enabled -
Verified purchase status - Created date

Customers should only review eligible purchased products.

🔐 Authentication & Security

Authentication uses JWT with role-based authorization.

Roles:

CUSTOMER
DELIVERY_PARTNER
ADMIN
SUPER_ADMIN

Security requirements include: - Password hashing - JWT and
refresh-token strategy - Role-based access control - Request
validation - Rate limiting - Helmet - CORS configuration - Secure
cookies where used - Input sanitization - MongoDB query safety - File
upload validation - MIME/type validation - File-size limits -
Authentication middleware - Authorization middleware - Audit logs for
sensitive admin actions - Environment-based secrets

Never commit:

.env
JWT_SECRET
RAZORPAY_SECRET
STRIPE_SECRET
GOOGLE_MAPS_SECRET
MONGODB_PASSWORD

🧑‍💼 Admin Dashboard

Admin modules: - Dashboard - Orders - Products - Categories -
Inventory - Users - Delivery partners - Stores - Offers - Coupons -
Reports - Settings

Analytics can include: - Sales overview - Orders by day - Revenue by
day - Order status distribution - Top products - Top categories - Store
performance - Delivery performance

👑 Super Admin Dashboard

Super Admin modules: - All stores - All orders - Delivery partners -
Admins - Users - Products - Categories - Reports - System settings -
Security - Audit logs

Super Admin can configure global platform settings, permissions and
feature flags.

🔔 Notifications

Notification types include: - Welcome - Login - OTP - Order placed -
Order confirmed - Order preparing - Delivery assigned - Out for
delivery - Delivered - Cancelled - Refund - Offer - Coupon - Low stock -
New order - New delivery assignment

Channels can include in-app notifications and configured email/SMS/push
services.

💬 Support

Support includes: - FAQ - Contact support - Order-specific support -
Issue categories - Ticket creation - Ticket status - Chat where
implemented

Example issues: - Missing item - Wrong item - Damaged item - Late
delivery - Payment issue - Refund issue - Account issue - Other

⚡ Redis & Real-Time

Redis can be used for: - API caching - Product/category caching - Rate
limiting - OTP temporary storage - Session/refresh-token support -
Temporary cart data where appropriate - Store/location caching -
Distributed locks - Presence/availability

Redis must not be the permanent source of truth for orders or payments.

Socket.IO handles real-time events such as:

order:confirmed
order:preparing
order:assigned
order:picked_up
order:out_for_delivery
order:arriving
order:delivered

🔌 API

Base URL:

/api/v1

Authentication

POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-otp

Products

GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id

Categories

GET    /categories
GET    /categories/:id
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id

Cart

GET    /cart
POST   /cart/items
PATCH  /cart/items/:productId
DELETE /cart/items/:productId
DELETE /cart

Orders

POST  /orders
GET   /orders
GET   /orders/:id
PATCH /orders/:id/status
POST  /orders/:id/cancel
POST  /orders/:id/reorder

Payments

POST /payments/create
POST /payments/verify
POST /payments/webhook

Stores

GET    /stores
GET    /stores/:id
POST   /stores
PATCH  /stores/:id
DELETE /stores/:id

Delivery

GET   /delivery/orders
POST  /delivery/orders/:id/accept
PATCH /delivery/orders/:id/status
POST  /delivery/orders/:id/verify-otp

Coupons

GET    /coupons
POST   /coupons
PATCH  /coupons/:id
DELETE /coupons/:id
POST   /coupons/validate

🗄️ MongoDB Collections

Recommended collections:

users
roles
permissions
stores
storeAdmins
products
productVariants
categories
subcategories
inventory
carts
cartItems
wishlists
orders
orderItems
payments
deliveryPartners
deliveryAssignments
addresses
coupons
offers
reviews
notifications
supportTickets
banners
settings
auditLogs

⚙️ Environment Variables

Frontend

VITE_API_BASE_URL=
VITE_GOOGLE_MAPS_KEY=
VITE_RAZORPAY_KEY=

Backend

PORT=
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

GOOGLE_MAPS_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Create .env.example with variable names only. Keep real secrets inside
local environment configuration.

🚀 Installation

Prerequisites

Install:

Node.js

npm

MongoDB / MongoDB Atlas

Redis for Redis-enabled features

Git

Clone

git clone https://github.com/sumit-kumar22/QuickMart.git
cd QuickMart

Frontend

cd frontend
npm install
npm run dev

Backend

Open another terminal:

cd backend
npm install
npm run dev

Example local services:

Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api/v1

Use the ports configured in your environment if they differ.

🧪 Testing

Frontend testing should cover: - Login - Search - Filters - Add to
cart - Quantity updates - Checkout - Order tracking - Responsive
behavior

Backend testing should cover: - Authentication - Permissions - Product
APIs - Cart - Orders - Payment - Coupons - Inventory - Delivery

Security testing should cover: - Invalid/expired JWT - Unauthorized
roles - Invalid input - Rate limits - File uploads - Payment signature
verification - Webhook verification

End-to-end flow:

Customer
   ↓
Product
   ↓
Cart
   ↓
Checkout
   ↓
Payment
   ↓
Order
   ↓
Store
   ↓
Delivery Partner
   ↓
Customer

📱 Responsive UI

The application is designed for: - Mobile - Tablet - Laptop - Desktop -
Large desktop

Mobile UX includes: - Bottom navigation - Touch-friendly controls -
Compact product cards - Horizontal category scrolling - Mobile search -
Mobile filters - Mobile order tracking - Responsive admin tables

Desktop UX includes: - Sidebar navigation - Multi-column product grids -
Large dashboards - Data tables - Analytics charts

🎨 UI/UX Principles

QuickMart uses: - Modern quick-commerce visual language - Clean content
surfaces - Rounded cards - Soft shadows - Clear typography - Product
image cards - Promotional banners - Responsive layouts - Mobile-first
behavior - Sticky mobile navigation - Desktop sidebar navigation -
Loading skeletons - Toast notifications - Empty/error states -
Confirmation modals

Interactive controls should provide subtle hover and click/press
feedback.

♿ Accessibility

The interface should support: - Semantic HTML - Keyboard navigation -
Visible focus states - Accessible labels - Alt text - Adequate color
contrast - Screen-reader-friendly controls - Error messages associated
with form fields - Reduced-motion consideration

⚡ Performance

Recommended practices: - Lazy-load images - Compress images - Use
responsive image sizes - Paginate large lists - Cache frequently
accessed data - Avoid unnecessary API requests - Debounce search - Use
MongoDB indexes - Use Redis where useful - Use CDN/object storage for
images - Avoid loading the complete catalog at once

🔎 SEO

Public customer pages should support: - Page titles - Meta
descriptions - Semantic headings - Product structured data where
appropriate - SEO-friendly URLs - Canonical URLs - Open Graph metadata -
Sitemap - Robots configuration

Admin pages do not require public search indexing.

🌿 Git & GitHub Workflow

Recommended branches:

main
develop
feature/frontend-home
feature/frontend-product
feature/backend-auth
feature/backend-orders
feature/admin-dashboard

Example commits:

feat: add customer homepage
feat: add product search
feat: add cart system
feat: add JWT authentication
feat: add order API
feat: add admin dashboard
fix: prevent duplicate order creation
fix: validate payment webhook

Basic Git commands:

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/QuickMart.git
git push -u origin main

For later updates:

git add .
git commit -m "Update QuickMart features"
git push

🏗️ Development Roadmap

Phase 1 --- Setup

Git repository

Frontend

Backend

Tailwind

Express

MongoDB

Environment configuration

API structure

Phase 2 --- Frontend Foundation

Navbar

Footer

Responsive layout

Homepage

Categories

Product cards

Product listing

Product details

Phase 3 --- Customer Commerce

Authentication UI

Search

Filters

Cart

Wishlist

Address

Checkout

Order history

Phase 4 --- Backend

Auth APIs

User APIs

Product APIs

Category APIs

Store APIs

Cart APIs

Order APIs

Coupon APIs

Review APIs

Phase 5 --- Payments

Razorpay

Stripe where required

Payment verification

Webhooks

Refund handling

Phase 6 --- Delivery

Delivery login

Assignment

Pickup

Delivery status

OTP

Maps

Real-time tracking

Phase 7 --- Admin

Admin login

Dashboard

Orders

Products

Categories

Inventory

Users

Delivery

Offers

Reports

Settings

Phase 8 --- Super Admin

Multi-store

Admin management

Global settings

Permissions

Audit logs

System analytics

Phase 9 --- Redis & Real-Time

Redis caching

Rate limiting

OTP storage

Socket.IO events

Live order status

Delivery availability

Phase 10 --- Testing

Authentication

Cart

Inventory

Coupons

Checkout

Payments

Orders

Cancellation

Refunds

Delivery OTP

Admin permissions

Super Admin permissions

Phase 11 --- Production

Build and deploy frontend

Deploy backend

MongoDB Atlas

Redis

Payment webhooks

Google Maps

Image storage

Domain

HTTPS

Monitoring

🧭 Recommended Build Order

1.  PRD
2.  Database schema
3.  Backend structure
4.  Frontend structure
5.  Design system
6.  Frontend static UI
7.  Responsive UI
8.  Mock-data integration
9.  Backend authentication
10. Product/category APIs
11. Store/inventory APIs
12. Cart APIs
13. Order APIs
14. Frontend API integration
15. Payment
16. Delivery
17. Maps
18. Socket.IO
19. Redis
20. Admin
21. Super Admin
22. Security hardening
23. Testing
24. Deployment

🧩 MVP Scope

Customer

Registration/login

Homepage

Categories

Product listing

Product details

Search

Cart

Address

Checkout

Razorpay/COD

Orders

Order tracking

Profile

Admin

Login

Dashboard

Product CRUD

Category CRUD

Inventory

Order management

Customer management

Delivery partner management

Backend

MongoDB

JWT

REST API

Order system

Payment verification

After MVP, add Redis, Socket.IO, multi-store support, Super Admin,
advanced analytics, coupons, reviews, support and advanced delivery
tracking.

✅ Definition of Done

A feature is complete when: - UI is responsive - API is connected -
Validation exists - Loading state exists - Error state exists - Empty
state exists - Authentication is respected - Authorization is
respected - Database operation works - Mobile layout works - Desktop
layout works - Security considerations are implemented - Relevant tests
pass

📜 Business Rules

Customers can order only from serviceable locations.

Products must respect store availability.

Inventory is validated server-side.

Product prices are recalculated server-side at checkout.

Coupon validity is checked server-side.

Payments are verified server-side.

Delivery requires the configured verification process.

Customers cannot modify another user's order.

Admin access is scoped by store/role permissions.

Super Admin has global control.

Referenced products should preferably be soft-deleted/deactivated.

Historical order prices remain unchanged after product price
changes.

Refunds remain linked to the original payment/order.

Inventory changes are auditable.

Sensitive admin actions are recorded in audit logs.

🛣️ Future Features

Potential future modules: - Subscription orders - Scheduled delivery -
Smart recommendations - AI shopping assistant - Personalized offers -
Voice search - Multilingual UI - Loyalty points - Membership - Referral
program - Wallet - Gift cards - Corporate orders - Restaurant/food
expansion - Pharmacy category where legally and operationally
appropriate - Advanced route optimization - Demand forecasting -
Automated replenishment - AI-based customer support

These features are not required to block the initial MVP.

🎯 Project Goal

QuickMart aims to demonstrate a complete, scalable, responsive and
real-time quick-commerce architecture while keeping the implementation
and branding original.

The project demonstrates:

Frontend development

Responsive UI/UX

React.js

Tailwind CSS

REST API development

Node.js

Express.js

MongoDB

JWT authentication

Role-based authorization

Payment integration

Google Maps integration

Redis

Socket.IO

Inventory management

Order management

Delivery management

Admin dashboard

Super Admin dashboard

Analytics

Production-oriented security and architecture

📄 Project Documentation

The complete functional specification is maintained in the project PRD:

QuickMart-PRD.md

QuickMart --- Quick-Commerce Grocery & Essentials Platform

Built as an original full-stack portfolio/project implementation.



https://frontend-eta-two-prpvck7g1w.vercel.app/login
