'use strict';

const express = require('express');
const { createHmac, timingSafeEqual } = require('node:crypto');

const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

const SESSION_COOKIE = 'gearcore_bot_session';
const SESSION_MAX_AGE = 60 * 60 * 12;
const controlUrl = (process.env.BOT_CONTROL_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

function dashboardPassword() {
  return process.env.DASHBOARD_PASSWORD || '';
}

function sessionSecret() {
  return process.env.DASHBOARD_SESSION_SECRET || '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(payload) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function createToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function readCookies(header) {
  const result = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function isAuthed(req) {
  return verifyToken(readCookies(req.headers.cookie)[SESSION_COOKIE]);
}

function requireAuth(req, res, next) {
  if (!isAuthed(req)) {
    res.redirect('/login');
    return;
  }
  next();
}

async function controlFetch(path, init = {}) {
  const token = String(process.env.BOT_CONTROL_TOKEN || process.env.CONTROL_API_TOKEN || '').trim();
  if (!token) throw new Error('Neither BOT_CONTROL_TOKEN nor CONTROL_API_TOKEN has a value on hosting.');

  const response = await fetch(`${controlUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-control-token': token,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = null; }
  }
  if (!response.ok) {
    throw new Error((body && body.error) || `Bot API returned ${response.status}.`);
  }
  return body;
}

function layout(title, content, active = '') {
  const nav = [
    ['/', 'Status'],
    ['/announcements', 'Announcements'],
    ['/settings', 'Settings'],
    ['/support', 'Support'],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — GearCore Bot</title>
<style>
:root{--bg:#090D12;--panel:#111820;--line:#26333D;--accent:#06B6D4;--text:#F1F5F9;--muted:#94A3B8}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
a{color:var(--accent);text-decoration:none}
header{border-bottom:1px solid var(--line);background:var(--panel);padding:0 20px}
header .inner{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:56px}
.brand{font-weight:700;letter-spacing:.04em}
nav{display:flex;gap:18px;flex-wrap:wrap}
nav a{color:var(--muted);padding:18px 0;border-bottom:2px solid transparent}
nav a.active,nav a:hover{color:var(--text);border-color:var(--accent)}
main{max-width:1080px;margin:0 auto;padding:26px 20px 60px}
h1{margin:0 0 20px;font-size:24px}
h2{margin:0 0 14px;font-size:17px}
.card{background:var(--panel);border:1px solid var(--line);padding:18px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.stat{background:var(--panel);border:1px solid var(--line);padding:14px}
.stat span{display:block;color:var(--muted);font-size:12px}
.stat strong{font-size:19px;word-break:break-word}
label{display:block;color:var(--muted);margin:10px 0 5px}
input,select,textarea{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line);padding:9px 10px;font:inherit;border-radius:0}
textarea{min-height:110px;resize:vertical}
input[type=checkbox]{width:auto;margin-right:7px}
.toggle{display:block;color:var(--text);margin:8px 0}
button,.button{background:var(--accent);color:#041016;border:1px solid var(--accent);padding:9px 14px;font-weight:700;cursor:pointer;border-radius:0}
button.secondary{background:transparent;color:var(--text);border-color:var(--line)}
button.danger{background:transparent;color:#F87171;border-color:#7F1D1D}
button.small{padding:6px 10px;font-size:12px}
.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px}
.muted{color:var(--muted)}
.error{color:#F87171;border-left:3px solid #B91C1C;padding:9px 12px;background:rgba(185,28,28,.08)}
.success{color:#34D399;border-left:3px solid #047857;padding:9px 12px;background:rgba(4,120,87,.08)}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;border-bottom:1px solid var(--line);padding:9px 8px;vertical-align:top}
th{color:var(--muted);font-size:12px}
.channel-row{border-top:1px solid var(--line);padding-top:14px;margin-top:14px}
.channel-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
code{color:var(--accent)}
@media(max-width:640px){.channel-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="inner"><div class="brand">GEARCORE BOT</div><nav>${nav.map(([href, label]) => `<a href="${href}" class="${active === href ? 'active' : ''}">${label}</a>`).join('')}<a href="/logout">Sign out</a></nav></div></header>
<main>${content}</main>
</body>
</html>`;
}

function notice(query, key) {
  return query[key] ? `<p class="${key === 'err' ? 'error' : 'success'}">${escapeHtml(query[key])}</p>` : '';
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/login', (req, res) => {
  if (isAuthed(req)) {
    res.redirect('/');
    return;
  }
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in — GearCore Bot</title><style>body{margin:0;background:#090D12;color:#F1F5F9;font:14px/1.5 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}.box{width:min(420px,90vw);background:#111820;border:1px solid #26333D;padding:24px}h1{margin-top:0}input,button{width:100%;box-sizing:border-box;padding:10px;margin-top:8px;background:#090D12;color:#F1F5F9;border:1px solid #26333D;font:inherit}button{background:#06B6D4;color:#041016;border-color:#06B6D4;font-weight:700;cursor:pointer}.err{color:#F87171}</style></head><body><form class="box" method="post" action="/login"><h1>GearCore Bot</h1><p class="muted">Password required</p>${notice(req.query, 'err')}<label for="password">Dashboard password</label><input id="password" name="password" type="password" autofocus required><button type="submit">Sign in</button></form></body></html>`);
});

app.post('/login', (req, res) => {
  const password = dashboardPassword();
  if (!password || !safeEqual(String(req.body.password || ''), password)) {
    res.redirect('/login?err=' + encodeURIComponent('Incorrect password.'));
    return;
  }
  if (!sessionSecret()) {
    res.redirect('/login?err=' + encodeURIComponent('DASHBOARD_SESSION_SECRET is not configured.'));
    return;
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${createToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`);
  res.redirect('/');
});

app.get('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.redirect('/login');
});

app.get('/', requireAuth, async (req, res) => {
  try {
    const status = await controlFetch('/api/status');
    const stats = [
      ['Bot', status.online ? 'Online' : 'Offline'],
      ['Servers', status.guilds ?? 0],
      ['Ping', status.pingMs === null ? '—' : `${status.pingMs} ms`],
      ['Uptime', status.uptimeMs === null ? '—' : `${Math.floor(status.uptimeMs / 60000)} min`],
      ['Open support', status.openSupport ?? 0],
      ['Auto-post channels', status.autoChannels ?? 0],
      ['Voice channels', status.voiceChannels ?? 0],
      ['Discord status', status.settings && status.settings.statusText ? status.settings.statusText : '—'],
    ];
    const commands = (status.commands || []).map((command) => `<tr><td><code>/${escapeHtml(command.name)}</code></td><td>${escapeHtml(command.description)}</td></tr>`).join('');
    res.type('html').send(layout('Status', `${notice(req.query, 'msg')}${notice(req.query, 'err')}<h1>Status</h1><div class="grid">${stats.map(([label, value]) => `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div><div class="card"><h2>Commands</h2><table><thead><tr><th>Command</th><th>Description</th></tr></thead><tbody>${commands}</tbody></table></div>`, '/'));
  } catch (error) {
    res.type('html').send(layout('Status', `<h1>Status</h1><p class="error">${escapeHtml(error.message)}</p>`, '/'));
  }
});

app.get('/announcements', requireAuth, (req, res) => {
  res.type('html').send(layout('Announcements', `${notice(req.query, 'msg')}${notice(req.query, 'err')}<h1>Announcements</h1><form class="card" method="post" action="/announcements"><label for="message">Message</label><textarea id="message" name="message" required></textarea><label for="channelId">Override channel ID (optional)</label><input id="channelId" name="channelId" placeholder="Leave blank for saved and auto channels"><label class="toggle"><input type="checkbox" name="includeAuto" checked>Also post to configured auto channels</label><div class="actions"><button type="submit">Post announcement</button></div></form>`, '/announcements'));
});

app.post('/announcements', requireAuth, async (req, res) => {
  try {
    const results = await controlFetch('/api/announce', {
      method: 'POST',
      body: JSON.stringify({
        message: String(req.body.message || '').trim(),
        channelId: String(req.body.channelId || '').trim(),
        includeAuto: req.body.includeAuto === 'on',
      }),
    });
    const sent = (results.results || []).filter((result) => result.ok).length;
    const failed = (results.results || []).filter((result) => !result.ok).length;
    res.redirect('/announcements?msg=' + encodeURIComponent(`Announcement sent: ${sent} success, ${failed} failed.`));
  } catch (error) {
    res.redirect('/announcements?err=' + encodeURIComponent(error.message));
  }
});

function readChannels(body, prefix) {
  const count = Math.min(Math.max(Number(body[`${prefix}Count`] || 0), 0), 3);
  return Array.from({ length: count }, (_, index) => ({
    guildId: String(body[`${prefix}Guild${index}`] || '').trim(),
    channelId: String(body[`${prefix}Channel${index}`] || '').trim(),
    enabled: body[`${prefix}Enabled${index}`] === 'on',
  })).filter((entry) => entry.guildId || entry.channelId);
}

function channelEditor(prefix, title, description, values, withTest) {
  const rows = values.map((entry, index) => `<div class="channel-row"><div class="channel-grid"><div><label>Server ID</label><input name="${prefix}Guild${index}" value="${escapeHtml(entry.guildId)}" placeholder="Discord server ID"></div><div><label>Channel ID</label><input name="${prefix}Channel${index}" value="${escapeHtml(entry.channelId)}" placeholder="Discord channel ID"></div></div><div class="actions"><label class="toggle"><input type="checkbox" name="${prefix}Enabled${index}" ${entry.enabled ? 'checked' : ''}>Enabled</label>${withTest ? `<button class="secondary small" type="submit" formaction="/settings/voice-test" name="testVoiceIndex" value="${index}">Test join</button>` : ''}</div></div>`).join('');
  return `<div class="card"><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(description)}</p><input type="hidden" name="${prefix}Count" value="${values.length}">${rows}${values.length < 3 ? `<div class="actions"><button class="secondary small" type="submit" formaction="/settings/add-channel" name="addChannelPrefix" value="${prefix}">Add channel</button></div>` : ''}</div>`;
}

app.get('/settings', requireAuth, async (req, res) => {
  try {
    const data = await controlFetch('/api/settings');
    const settings = data.settings || {};
    const textFields = [
      ['supportChannelId', 'Support channel ID'],
      ['announceChannelId', 'Announcement channel ID'],
      ['welcomeChannelId', 'Welcome channel ID'],
      ['welcomeRoleId', 'Welcome role ID'],
      ['supportEmail', 'Support email'],
      ['telegramUsername', 'Telegram username'],
      ['promoCode', 'Promo code'],
      ['preorderDays', 'Preorder arrival window'],
      ['statusText', 'Discord status text'],
      ['statusUrl', 'Streaming URL (Streaming only)'],
    ];
    const toggles = [
      ['supportEnabled', 'Support requests enabled'],
      ['announcementsEnabled', 'Announcements enabled'],
      ['welcomeEnabled', 'Welcome messages and roles enabled'],
      ['productCommandsEnabled', 'Product and bundle commands enabled'],
      ['autoPostOnStart', 'Auto-post startup message on launch'],
      ['voiceAutoJoinEnabled', 'Auto-join configured voice channels'],
    ];
    const fields = textFields.map(([key, label]) => `<label for="${key}">${escapeHtml(label)}</label><input id="${key}" name="${key}" value="${escapeHtml(settings[key] || '')}">`).join('');
    const toggleFields = toggles.map(([key, label]) => `<label class="toggle"><input type="checkbox" name="${key}" ${settings[key] ? 'checked' : ''}>${escapeHtml(label)}</label>`).join('');
    const activity = ['watching', 'playing', 'listening', 'streaming', 'competing'].map((value) => `<option value="${value}" ${settings.statusType === value ? 'selected' : ''}>${value[0].toUpperCase() + value.slice(1)}</option>`).join('');
    const presence = [['online', '🟢 Online'], ['idle', '🌙 Idle'], ['dnd', '⛔ Do Not Disturb'], ['invisible', '⚪ Invisible']].map(([value, label]) => `<option value="${value}" ${settings.presenceStatus === value ? 'selected' : ''}>${label}</option>`).join('');
    const content = `${notice(req.query, 'msg')}${notice(req.query, 'err')}<h1>Settings</h1><form method="post" action="/settings"><div class="card"><h2>Channels and contacts</h2>${fields}</div><div class="card"><h2>Features</h2>${toggleFields}</div><div class="card"><h2>Discord presence</h2><label for="statusType">Activity type</label><select id="statusType" name="statusType">${activity}</select><label for="presenceStatus">Presence</label><select id="presenceStatus" name="presenceStatus">${presence}</select><p class="muted">Example status text: 🟢 Support Team Online</p></div>${channelEditor('auto', 'Auto-post channels', 'Maximum 3 servers. Announcements and startup messages post here.', settings.autoChannels || [], false)}${channelEditor('voice', 'Voice auto-join channels', 'Maximum 3 servers. Bot joins on launch and when a member enters. Use a speaker-icon voice channel.', settings.voiceChannels || [], true)}<div class="actions"><button type="submit">Save settings</button></div></form>`;
    res.type('html').send(layout('Settings', content, '/settings'));
  } catch (error) {
    res.type('html').send(layout('Settings', `<h1>Settings</h1><p class="error">${escapeHtml(error.message)}</p>`, '/settings'));
  }
});

app.post('/settings/add-channel', requireAuth, async (req, res) => {
  try {
    const data = await controlFetch('/api/settings');
    const settings = data.settings || {};
    const prefix = req.body.addChannelPrefix === 'voice' ? 'voice' : 'auto';
    const key = prefix === 'voice' ? 'voiceChannels' : 'autoChannels';
    const channels = Array.isArray(settings[key]) ? settings[key] : [];
    settings[key] = channels.length < 3 ? [...channels, { guildId: '', channelId: '', enabled: true }] : channels;
    await controlFetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
    res.redirect('/settings');
  } catch (error) {
    res.redirect('/settings?err=' + encodeURIComponent(error.message));
  }
});

app.post('/settings/voice-test', requireAuth, async (req, res) => {
  try {
    const channels = readChannels(req.body, 'voice');
    const index = Number(req.body.testVoiceIndex || 0);
    const entry = channels[index];
    if (!entry || !entry.channelId) throw new Error('Enter a channel ID first, then save settings.');
    const result = await controlFetch('/api/voice/join', {
      method: 'POST',
      body: JSON.stringify({ guildId: entry.guildId, channelId: entry.channelId }),
    });
    if (result && result.ok === false) {
      res.redirect('/settings?err=' + encodeURIComponent(result.error || 'Could not join that channel.'));
      return;
    }
    res.redirect('/settings?msg=' + encodeURIComponent('Joined the voice channel. Check Discord.'));
  } catch (error) {
    res.redirect('/settings?err=' + encodeURIComponent(error.message));
  }
});

app.post('/settings', requireAuth, async (req, res) => {
  try {
    const data = await controlFetch('/api/settings');
    const current = data.settings || {};
    const settings = {
      ...current,
      supportChannelId: String(req.body.supportChannelId || ''),
      announceChannelId: String(req.body.announceChannelId || ''),
      welcomeChannelId: String(req.body.welcomeChannelId || ''),
      welcomeRoleId: String(req.body.welcomeRoleId || ''),
      supportEmail: String(req.body.supportEmail || ''),
      telegramUsername: String(req.body.telegramUsername || ''),
      promoCode: String(req.body.promoCode || ''),
      preorderDays: String(req.body.preorderDays || ''),
      statusText: String(req.body.statusText || ''),
      statusUrl: String(req.body.statusUrl || ''),
      statusType: ['playing', 'streaming', 'listening', 'watching', 'competing'].includes(req.body.statusType) ? req.body.statusType : 'watching',
      presenceStatus: ['online', 'idle', 'dnd', 'invisible'].includes(req.body.presenceStatus) ? req.body.presenceStatus : 'online',
      supportEnabled: req.body.supportEnabled === 'on',
      announcementsEnabled: req.body.announcementsEnabled === 'on',
      welcomeEnabled: req.body.welcomeEnabled === 'on',
      productCommandsEnabled: req.body.productCommandsEnabled === 'on',
      autoPostOnStart: req.body.autoPostOnStart === 'on',
      voiceAutoJoinEnabled: req.body.voiceAutoJoinEnabled === 'on',
      autoChannels: readChannels(req.body, 'auto'),
      voiceChannels: readChannels(req.body, 'voice'),
    };
    await controlFetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
    res.redirect('/settings?msg=' + encodeURIComponent('Settings saved and applied to the bot.'));
  } catch (error) {
    res.redirect('/settings?err=' + encodeURIComponent(error.message));
  }
});

app.get('/support', requireAuth, async (req, res) => {
  try {
    const data = await controlFetch('/api/support');
    const rows = (data.requests || []).map((request) => `<tr><td>${escapeHtml(request.userTag || request.userId)}</td><td>${escapeHtml(request.guild || '—')}</td><td>${escapeHtml(request.message)}</td><td>${escapeHtml(request.createdAt)}</td><td>${escapeHtml(request.status)}</td><td><form method="post" action="/support/${encodeURIComponent(request.id)}/read"><button class="secondary small" type="submit">Read</button></form><form method="post" action="/support/${encodeURIComponent(request.id)}/delete"><button class="danger small" type="submit">Delete</button></form></td></tr>`).join('');
    res.type('html').send(layout('Support', `${notice(req.query, 'msg')}${notice(req.query, 'err')}<h1>Support inbox</h1><div class="card"><table><thead><tr><th>User</th><th>Server</th><th>Message</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="muted">No support requests.</td></tr>'}</tbody></table></div>`, '/support'));
  } catch (error) {
    res.type('html').send(layout('Support', `<h1>Support inbox</h1><p class="error">${escapeHtml(error.message)}</p>`, '/support'));
  }
});

app.post('/support/:id/read', requireAuth, async (req, res) => {
  try {
    await controlFetch(`/api/support/${encodeURIComponent(req.params.id)}/read`, { method: 'POST' });
    res.redirect('/support?msg=' + encodeURIComponent('Marked as read.'));
  } catch (error) {
    res.redirect('/support?err=' + encodeURIComponent(error.message));
  }
});

app.post('/support/:id/delete', requireAuth, async (req, res) => {
  try {
    await controlFetch(`/api/support/${encodeURIComponent(req.params.id)}`, { method: 'DELETE' });
    res.redirect('/support?msg=' + encodeURIComponent('Support request deleted.'));
  } catch (error) {
    res.redirect('/support?err=' + encodeURIComponent(error.message));
  }
});

const port = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Lite dashboard listening on 0.0.0.0:${port}`);
});
