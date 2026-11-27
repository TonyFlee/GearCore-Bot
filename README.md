# GearCore Discord Bot

Standalone Discord bot for `gearcore.store`. It reads only the public product catalog from Supabase. It does **not** read orders, invoices, customer emails, or payment data.

## Features

- `/product` — autocomplete search across live products, with paginated results and product buttons.
- `/catalog` — browse the live catalog by category with autocomplete and pagination.
- `/random` — show a random live product.
- `/bundle` — show live bundle prices and savings with direct site buttons.
- `/order` — privacy-safe guidance to the customer's own account/invoice. Never reads private orders.
- `/support` — send a help request to the support inbox and a configured Discord channel.
- `/announce` — post to the saved channel and all enabled auto-post channels.
- `/invite` — generate an official invite link with the permissions the bot needs.
- `/help` — delivery, payment, preorder, warranty, and contact information with quick links.
- `/ping` — bot latency check.
- New members — optional welcome message and role assignment.
- Auto-post — post a startup message and dashboard announcements to up to 3 configured servers/channels.
- Voice auto-join — join up to 3 configured voice channels on launch, and follow members into them.
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
   - For voice auto-join, grant **Connect** and **Speak** permissions. `/invite` includes these.

4. Register **global/public** slash commands:

```powershell
npm run deploy:commands
```

Global commands can take up to an hour to appear in every server. For instant updates in one test server, set `DISCORD_GUILD_ID` and run:

```powershell
npm run deploy:commands -- --guild
```

### Duplicate commands

If Discord shows every command twice, the same command exists as both a guild command and a global command. To keep only the global/public set:

```powershell
npm run clear:guild
```

`DISCORD_GUILD_ID` or `DISCORD_GUILD_IDS` must contain the server ID(s). Future `npm run deploy:commands` runs clear those guild commands automatically. For several test servers, use a comma-separated `DISCORD_GUILD_IDS`.

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
| Status | Live bot health, servers, latency, uptime, command list, open support count, configured auto/voice channel counts |
| Announcements | Post to the saved channel, an override, and/or up to 3 auto-post channels |
| Settings | Channels, roles, contacts, promo code, preorder window, feature toggles, auto-post channels, voice auto-join channels |
| Support inbox | Read, mark resolved, and delete `/support` requests |

Settings are stored in `data/settings.json`. Support requests are stored in `data/support.json`.

## Auto channels

The dashboard supports up to 3 entries for each list:

- **Auto-post channels**: server ID + channel ID. Used for startup messages and announcements.
- **Voice auto-join channels**: server ID + channel ID. The bot joins on launch and when a member enters the channel.

Use numeric Discord IDs. Leave a feature disabled with its toggle or the per-row checkbox.

## Environment notes

- `CONTROL_API_TOKEN` protects the bot's local control API. Do not expose port `8787` publicly.
- `CONTROL_PORT` defaults to `8787`.
- `DASHBOARD_SESSION_SECRET` signs the dashboard cookie. Use a long random value.
- Channel and role IDs in the bot's `.env` are initial defaults. Values saved in the dashboard override them at runtime.

## Privacy

The bot uses the Supabase anon key and only queries public, non-archived products. `/order` is ephemeral and never queries private order tables.
