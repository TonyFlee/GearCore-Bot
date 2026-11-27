# GearCore Bot Dashboard

Password-protected Next.js control panel for the GearCore Discord bot.

## Run locally

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:8788`.

Set `DASHBOARD_PASSWORD` to a strong password, generate a long random `DASHBOARD_SESSION_SECRET`, and copy the bot's `CONTROL_API_TOKEN` into `BOT_CONTROL_TOKEN`.

The dashboard expects the bot's control API at `http://127.0.0.1:8787` and talks to it server-side. Do not expose the bot's control API publicly.

## Checks

```powershell
npm run check
npm run build
```
