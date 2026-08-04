<<<<<<< HEAD
# Ramatechcode Lab & Tech — School Partnership Portal

A full website + portal for Ramatechcode Lab & Tech: a public landing page, a
school registration/login portal (student management, flexible Flutterwave
payments with references, complaints, location sharing), and an admin
dashboard (schools overview, live location map, all payments, complaint
replies).

## Stack

- **Frontend:** plain HTML, CSS, JavaScript (no build step) — `/public`
- **Backend:** Node.js + Express — `/server`
- **Database:** MongoDB (Atlas recommended) via Mongoose
- **Payments:** Flutterwave inline checkout + server-side verification + webhook
- **Map:** Leaflet.js + OpenStreetMap (no API key required)

> Note: the original brief mentioned both MongoDB and Firebase. This build
> uses MongoDB only, since running two databases side by side would just be
> duplicate plumbing for the same data. Swap in Firebase later if you prefer —
> the routes are isolated in `/server/routes` so only the model layer would change.

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any long random string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Whatever you want the first admin login to be — created automatically on first boot |
| `FLW_PUBLIC_KEY` / `FLW_SECRET_KEY` | Flutterwave Dashboard → Settings → API Keys |
| `FLW_SECRET_HASH` | Flutterwave Dashboard → Settings → Webhooks (set your own secret hash there, then paste it here) |
| `CLIENT_URL` | Where your frontend is hosted, for CORS |

Run it:

```bash
npm run dev      # with nodemon
# or
npm start
```

The API runs on `http://localhost:5000/api`. On first boot it automatically
creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` — log in at
`admin-login.html` with those credentials, then change the password by
updating the database directly (no "change password" UI is included yet).

## 2. Flutterwave webhook

In your Flutterwave dashboard, set the webhook URL to:

```
https://your-backend-domain.com/api/payments/webhook
```

and set a secret hash there that matches `FLW_SECRET_HASH` in `.env`. The
webhook is a backup confirmation path — the primary confirmation happens
immediately in-browser via `/api/payments/verify`, which re-checks the
transaction with Flutterwave's servers before marking it successful (the
frontend's word alone is never trusted).

## 3. Frontend setup

The frontend is static — no build step. Open `/public` with any static file
server, e.g.:

```bash
cd public
npx serve .
```

`public/js/config.js` points at `http://localhost:5000/api` automatically
when running on `localhost`; update the fallback in that file to your
deployed backend URL for production.

## 4. How the pieces fit together

- **`index.html`** — public landing page, built from the proposal's curriculum,
  objectives, requirements and pricing.
- **`register.html` / `login.html`** — school account creation and login.
- **`dashboard.html`** — school portal:
  - **Students** — add, edit, delete students interested in the programme.
  - **Payments** — enter *any* amount (not fixed to a per-student fee), pay via
    Flutterwave inline checkout, and get a unique reference (`RTC-...`) for
    every payment, verified server-side.
  - **Complaints** — file and track complaints.
  - **School profile** — edit school info and share exact GPS location via the
    browser's Geolocation API (one tap, asks for permission).
- **`admin-login.html` / `admin.html`** — admin console:
  - Overview stats across every school.
  - A live Leaflet map plotting every school that has shared its location,
    with a popup linking straight to Google Maps.
  - Full schools table with approve/suspend controls.
  - All payments across all schools.
  - All complaints, with a reply + status workflow.

## 5. Data model

- `School` — registration info, hashed password, status, GPS location, editable monthly fee reference.
- `Student` — belongs to a school; full CRUD from the school dashboard.
- `Payment` — belongs to a school; any amount, a generated reference, Flutterwave transaction id, status.
- `Complaint` — belongs to a school; subject/message, status, admin reply.
- `Admin` — created automatically from `.env` on first boot.

## 6. Security notes for production

- Passwords are hashed with bcrypt; never stored in plain text.
- JWTs are used for both school and admin sessions, checked on every protected route.
- Payments are verified server-side against Flutterwave's API — the amount,
  currency and reference are all cross-checked before a payment is marked successful.
- Swap `FLW_PUBLIC_KEY`/`FLW_SECRET_KEY` for live keys only once you've tested
  fully with Flutterwave's test keys and test cards.
- Put the backend behind HTTPS before going live; browsers block Geolocation
  access on plain HTTP for any origin other than `localhost`.
=======
# ramatechcodeshoolportal.ng
>>>>>>> 49c066a49c3cb7ba17353b193cd95feecc3786c2
