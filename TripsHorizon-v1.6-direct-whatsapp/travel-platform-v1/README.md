# TripsHorizon — Version 1.5

A colourful, responsive travel marketplace prototype with destination guides, sample flight/hotel/car searches, a reservation request workflow, WhatsApp human-reception handoff, a private admin dashboard and a server-side AI assistant proxy.

## What's included

- `index.html`, `styles.css`, `script.js` — public homepage, destination cards, sample services, responsive layout and floating travel assistant.
- `destination.html`, `destination.css`, `destination.js` — destination guides for Santorini, Bali, Dubai and Cinque Terre.
- `reservation.html`, `reservation.css`, `reservation.js` — sample search results and customer reservation request form.
- `payment.html`, `payment.css`, `payment.js` — booking summary and WhatsApp handoff to the number configured by the administrator. This is a human-assisted payment workflow, not an online payment gateway.
- `admin.html`, `admin.css`, `admin.js` — private dashboard to manage the official reception WhatsApp number, display name, view booking enquiries and update booking status.
- `server.mjs` — Node server, JSON booking/settings persistence, admin authentication and server-side OpenAI Responses API proxy.
- `data/bookings.json` and `data/settings.json` — created automatically at runtime; not included in the ZIP.

## Run locally

1. Install Node.js 20 or newer.
2. Extract the ZIP and open a terminal in the `travel-platform-v1` project folder.
3. Copy `.env.example` to `.env`.
4. Set `ADMIN_PASSWORD` to a unique password of at least 12 characters. This is required for admin access.
5. Optionally set `OPENAI_API_KEY` to enable live AI assistant responses. Set `OPENAI_MODEL` to a model available to your API project.
6. Run `npm start` and open `http://localhost:3000`.
7. Open `http://localhost:3000/admin.html` and sign in with `ADMIN_PASSWORD`. The demo WhatsApp number is prefilled; replace it with your official number when ready.

## WhatsApp reception setup

The demo is prefilled with `12025550147`, a reserved fictional US 555 number. It is a placeholder and is not a working reception line. To change it in code, open `server.mjs` and search for `DEMO WHATSAPP NUMBER`; replace the value of `DEMO_WHATSAPP_NUMBER` with your own international number using digits only (country code + number, no `+`, spaces or punctuation). You can also change the number from the Admin dashboard at `/admin.html`, then save the reception settings. For a Nigerian number, the format is like `2348012345678`.

When a customer submits the reservation form:

1. The server validates and stores a reservation enquiry with a unique reference and `awaiting_reception` status.
2. The customer is sent to the reservation summary page.
3. The page reads the admin-managed reception number from the server and creates a WhatsApp click-to-chat link with the booking reference and trip summary prefilled.
4. The customer opens WhatsApp and sends the message to reception.
5. Reception confirms supplier availability, final price, taxes, terms and payment instructions with the customer.
6. An authorised admin updates the booking status in the dashboard (`awaiting_reception`, `awaiting_payment`, `paid`, or `cancelled`). Mark a booking paid only after independently verifying cleared funds.

The WhatsApp number is public to the website because it must be embedded in customer click-to-chat links. Only an authenticated admin can change it. The included number is intentionally fictional for demo use; replace it before using the site with real customers.

## Admin security and deployment notes

- Admin password is read from the private `.env` file and must be at least 12 characters. No default password is provided.
- Admin sessions are HTTP-only, SameSite=Strict cookies and expire after eight hours. Sessions are held in memory and are invalidated when the server restarts.
- Booking and settings data are stored as JSON files in `data/`. This is suitable for a small local prototype, not concurrent high-volume production use. Move to a managed database (for example PostgreSQL) before launch and configure backups and access controls.
- Use HTTPS in production (`Secure` cookies are enabled when `NODE_ENV=production`), add rate limiting, stronger session persistence/rotation, audit logs, monitoring, privacy/retention controls and deployment secret management.
- Restrict admin access further (for example, MFA and role-based permissions) before handling real customer data.

## Important product limitations

- Flight, hotel and car listings/prices are demonstration data. No airline, hotel or rental supplier inventory is queried, held or booked.
- A submitted form creates a **reservation enquiry**, not a confirmed booking, ticket, hotel reservation or rental contract.
- WhatsApp is a human support handoff only. It does not collect money or verify payments. Reception must use an approved business payment process and confirm cleared payment before an admin marks a reservation paid.
- Do not ask customers to send card PINs, passwords, CVVs or one-time banking codes over WhatsApp. Any future online payment integration must be hosted by a compliant payment provider.
- The AI assistant is a planning helper only and cannot verify live travel inventory or change reservation status.

## Before public launch

Connect approved flight, hotel and car-rental suppliers; implement live price re-check and booking/ticket/voucher operations; move persistence to a managed database; add customer accounts and booking history; implement secure email notifications; review privacy, consumer protection, tax, supplier and travel-agent obligations in each target market; conduct penetration, accessibility and end-to-end tests.
