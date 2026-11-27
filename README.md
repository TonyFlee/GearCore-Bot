# GearCore Discord Bot

Standalone Discord bot for `gearcore.store`. It reads only the public product catalog from Supabase. It does **not** read orders, invoices, customer emails, or payment data.

## Features

- `/product` — search live GearCore products by name, slug, or category.
- `/bundle` — show live bundle prices and savings.
- `/order` — privacy-safe guidance to the customer's own account/invoice.
- `/support` — send a help request to the support inbox and a configured Discord channel.
- `/announce` — post a store announcement to a chosen channel (Manage Server permission required).
- `/help` — delivery, payment, preorder, warranty, and contact information.
- `/ping` — bot latency check.
- New members — optional welcome message and role assignment.
- Web dashboard — password-protected status, announcements, full settings, and support inbox.

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

3. In the Discord Developer Portal:
   - Create an application and bot.
   - Copy the bot token to `DISCORD_TOKEN`.
   - Copy the application ID to `DISCORD_CLIENT_ID`.
   - Enable **Server Members Intent** under Bot → Privileged Gateway Intents.
   - Invite the bot with scopes `bot` and `applications.commands`.

4. Register **global/public** slash commands:

```powershell
npm run deploy:commands
```

Global commands can take up to an hour to appear in every server. For instant updates in one test server, set `DISCORD_GUILD_ID` and run:

```powershell
npm run deploy:commands -- --guild
```

5. Run the bot:

```powershell
npm run dev
```

For production:

```powershell
npm run build
npm start
```

The local control API starts with the bot on `http://127.0.0.1:8787`.

## Web dashboard

The dashboard is a separate Next.js app in `dashboard/`. It is intended to run on the same machine as the bot.

1. Install dashboard dependencies:

```powershell
cd dashboard
npm install
```

2. Copy `dashboard/.env.example` to `dashboard/.env.local`.

3. Set a strong `DASHBOARD_PASSWORD`.

4. Copy `CONTROL_API_TOKEN` from the bot's `.env` into `dashboard/.env.local` as `BOT_CONTROL_TOKEN`. Both values must match.

5. Start the dashboard:

```powershell
npm run dev
```

Open `http://localhost:8788` and sign in.

For production:

```powershell
npm run build
npm start
```

### Dashboard controls

| Page | What it does |
| --- | --- |
| Status | Live bot health, servers, latency, uptime, command list, open support count |
| Announcements | Post a message through the bot to the saved or overridden channel |
| Settings | Channels, roles, support email, Telegram, promo code, preorder window, feature toggles |
| Support inbox | Read, mark resolved, and delete `/support` requests |

Settings are stored in `data/settings.json`. Support requests are stored in `data/support.json`.

## Environment notes

- `CONTROL_API_TOKEN` protects the bot's local control API. Do not expose port `8787` publicly.
- `CONTROL_PORT` defaults to `8787`.
- `DASHBOARD_SESSION_SECRET` signs the dashboard cookie. Use a long random value.
- Channel and role IDs in the bot's `.env` are initial defaults. Values saved in the dashboard override them at runtime.

## Privacy

The bot uses the Supabase anon key and only queries public, non-archived products. `/order` is ephemeral and never queries private order tables.
