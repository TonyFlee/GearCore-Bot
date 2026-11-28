# GearCore Discord Bot

Standalone Discord bot for `gearcore.store`. It reads only the public product catalog from Supabase. It does **not** read orders, invoices, customer emails, or payment data.

## Features

### Storefront and catalog

- `/product` — autocomplete search across live products, with paginated results, similar items, and a Save button.
- `/search` — search all live products by name or keyword, with category filtering and pagination.
- `/catalog` — browse the live catalog by category and availability, with autocomplete and pagination.
- `/featured` — show featured products from the public catalog.
- `/new` — show the newest published products.
- `/bundle` — show live bundle prices and savings with direct site buttons.
- `/random` — show a random live product.
- `/wishlist` — per-user saved products. Only the owner can see their list.

### Orders and support

- `/order` — privacy-safe guidance to the customer's own account/invoice. Never reads private orders.
- `/support` — send a help request to the support inbox and a configured Discord channel.
- `/ticket` — post a support panel; customers get private threads with a close button. Closed tickets are archived as transcripts in the dashboard.
- `/announce` — post to the saved channel and all enabled auto-post channels, optionally mentioning `@everyone` outside the embed.
- `/schedule` — queue announcements for later with optional `@everyone`; restored after restart.

### Community and engagement

- `/poll` — create a timed poll with up to four options and live vote counts.
- `/giveaway` — timed giveaway with entry button, entrant tracking, and automatic winner draw.
- `/remind` — private reminder delivered by DM, restored after restart.
- `/sound` — soundboard with bundled sounds, autocomplete, voice-channel playback, and staff-only upload/delete.
- `/invite` — generate an official invite link with the permissions the bot needs.
- `/help` — delivery, payment, preorder, warranty, and contact information with quick links.
- `/ping` — bot latency check.

### Automation

- New members — optional welcome message and role assignment.
- Auto-post — post a startup message and dashboard announcements to up to 3 configured servers/channels.
- Voice auto-join — join up to 3 configured voice channels on launch, and follow members into them.
- Discord presence — dashboard-controlled status text, activity type, and online/idle/dnd/invisible state.
- Web dashboard — password-protected status, announcements, scheduled announcements, ticket transcripts, full settings, support inbox, and voice Test join.

Sound files live in `sounds/`. Add `.opus`, `.ogg`, `.mp3`, or `.wav`; `.opus` is recommended for low-memory hosts. Staff can also upload from Discord with `/sound upload`; `.mp3`/`.wav` conversion requires `ffmpeg` on the host. See `sounds/README.md`.

### Permissions

Commands that change server state require **Manage Server**:

```txt
/announce
/schedule
/ticket
/poll
/giveaway
/sound upload
/sound delete
```

Runtime checks are enforced even if Discord hides the command from the command menu.

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

There are two dashboards:

- `dashboard/` — Next.js version for local development.
- `dashboard-lite/` — lightweight Express version used by `start-host.sh` on low-memory hosts. It needs no build step and has the same core controls.

Both talk to the bot's local control API.

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

For production bot only:

```powershell
npm run build
npm run start:bot
```

For bot plus dashboard, use `sh start-host.sh` or `npm start`.

### Dashboard controls

| Page | What it does |
| --- | --- |
| Status | Live bot health, servers, latency, uptime, command list, open support count, configured auto/voice channel counts |
| Announcements | Post to the saved channel, an override, and/or up to 3 auto-post channels |
| Settings | Channels, roles, contacts, promo code, preorder window, Discord status, feature toggles, auto-post channels, voice auto-join channels |
| Support inbox | Read, mark resolved, and delete `/support` requests |

Settings are stored in `data/settings.json`. Support requests are stored in `data/support.json`.

## Auto channels

The dashboard supports up to 3 entries for each list:

- **Auto-post channels**: server ID + channel ID. Used for startup messages and announcements.
- **Voice auto-join channels**: server ID + channel ID. The bot joins on launch and when a member enters the channel.

Use numeric Discord IDs. Leave a feature disabled with its toggle or the per-row checkbox.

## Hosting

### Recommended: bot + dashboard together on bot-hosting.net

Bot-Hosting supports Node.js apps and HTTP subdomains. Use **one Node.js deployment** running the bot plus `dashboard-lite/server.js`. The lightweight dashboard needs no build step and works within the free plan's memory limit. The Next.js dashboard is kept for local development.

Start command — either of these works:

```sh
npm start
```

```sh
sh start-host.sh
```

Set these environment variables in the hosting panel, not only in local `.env` files:

```env
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
CONTROL_HOST=127.0.0.1
CONTROL_PORT=8787
CONTROL_API_TOKEN=...
BOT_CONTROL_URL=http://127.0.0.1:8787
BOT_CONTROL_TOKEN=same_as_CONTROL_API_TOKEN
DASHBOARD_PASSWORD=...
DASHBOARD_SESSION_SECRET=...
```

Do not hard-code the public web port. `start-host.sh` reads Bot-Hosting's `SERVER_PORT` and binds the lightweight dashboard to `0.0.0.0`. If `SERVER_PORT` is absent, it falls back to `PORT`, then `3000`.

Activate the HTTPS subdomain on the deployment’s **Domains** tab. Bot-Hosting points it at the `SERVER_PORT` it gave your app. The dashboard is password-protected.

The free plan's 256 MB is enough for the bot plus the lightweight dashboard because nothing builds Next.js at startup.

### Alternative: dashboard on Vercel

Vercel cannot reach `127.0.0.1:8787` on another host. To use Vercel:

1. Host the bot on bot-hosting.net.
2. Set `CONTROL_HOST=0.0.0.0` on the bot.
3. Activate an HTTPS subdomain for the control API port.
4. Set Vercel `BOT_CONTROL_URL` to that HTTPS URL.
5. Set Vercel `BOT_CONTROL_TOKEN` to the same `CONTROL_API_TOKEN`.

Only do this behind HTTPS. Never expose the control API without the token.

## Environment notes

- `CONTROL_API_TOKEN` protects the bot's local control API. Do not expose port `8787` publicly.
- `CONTROL_PORT` defaults to `8787`.
- `DASHBOARD_SESSION_SECRET` signs the dashboard cookie. Use a long random value.
- Channel and role IDs in the bot's `.env` are initial defaults. Values saved in the dashboard override them at runtime.

## Privacy

The bot uses the Supabase anon key and only queries public, non-archived products. `/order` is ephemeral and never queries private order tables.
