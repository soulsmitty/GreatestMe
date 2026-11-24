// Stand-in for Supabase: auth by email, docs/shares/partner_links/invites tables with per-user access rules.
const http = require('http'); const T = { docs: [], shares: [], partner_links: [], invites: [] }; const users = {}; let clock = Date.now();
const stamp = () => new Date(++clock).toISOString();
const match = (row, f) => f.every(([op, k, v]) => op === 'eq' ? row[k] === v : op === 'gt' ? row[k] > v : op === 'in' ? v.includes(row[k]) :
  op === 'like' ? new RegExp('^' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$').test(row[k]) : op === 'notlike' ? !new RegExp('^' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$').test(row[k]) : true);
const visible = (t, r, uid) => t === 'shares' ? (r.user_id === uid || T.partner_links.some(l => l.user_id === uid && l.partner_id === r.user_id)) : t === 'invites' ? r.owner_id === uid : r.user_id === uid;
const pk = { docs: r => r.user_id + '|' + r.key, shares: r => r.user_id, invites: r => r.code, partner_links: r => r.user_id + '|' + r.partner_id };
function op(b){ const t = T[b.table]; const uid = b.uid; if (!uid) return { error: { message: 'not signed in' } };
  if (b.op === 'select') { let rows = t.filter(r => visible(b.table, r, uid) && match(r, b.f || [])); if (b.range) rows = rows.slice(b.range[0], b.range[1] + 1); return { data: rows }; }
  if (b.op === 'upsert' || b.op === 'insert') { for (const r of b.rows) { const owner = r.user_id || r.owner_id; if (owner !== uid) return { error: { message: 'row-level security' } };
      const i = t.findIndex(x => pk[b.table](x) === pk[b.table](r)); const row = { ...r, updated_at: stamp(), created_at: new Date().toISOString() };
      if (i >= 0) { if (b.op === 'insert') return { error: { message: 'duplicate' } }; t[i] = row; } else t.push(row); } return { data: null }; }
  if (b.op === 'delete') { for (let i = t.length - 1; i >= 0; i--) if (visible(b.table, t[i], uid) && match(t[i], b.f || [])) t.splice(i, 1); return { data: null }; } }
function rpc(b){ const uid = b.uid;
  if (b.fn === 'accept_invite') { const c = String(b.args.invite_code).trim().toUpperCase(); const inv = T.invites.find(i => i.code === c); if (!inv) return { error: { message: 'That invite code is not valid or has expired.' } };
    if (inv.owner_id === uid) return { error: { message: 'That is your own invite code. Send it to your partner.' } };
    T.partner_links.push({ user_id: uid, partner_id: inv.owner_id }, { user_id: inv.owner_id, partner_id: uid }); T.invites = T.invites.filter(i => i !== inv); return { data: inv.owner_id }; }
  if (b.fn === 'unlink_partner') { T.partner_links = T.partner_links.filter(l => !((l.user_id === uid && l.partner_id === b.args.other) || (l.user_id === b.args.other && l.partner_id === uid))); return { data: null }; } }
function auth(b){ const u = users[b.email];
  if (b.a === 'up') { if (u) return { error: { message: 'User already registered' } }; users[b.email] = { id: 'u-' + Math.random().toString(36).slice(2, 10), email: b.email, password: b.password }; return { user: { id: users[b.email].id, email: b.email } }; }
  if (b.a === 'in') { if (!u || u.password !== b.password) return { error: { message: 'Invalid login credentials' } }; return { user: { id: u.id, email: u.email } }; } }
http.createServer((req, res) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); if (req.method === 'OPTIONS') return res.end();
  let body = ''; req.on('data', d => body += d); req.on('end', () => { const b = JSON.parse(body || '{}'); const out = req.url === '/op' ? op(b) : req.url === '/rpc' ? rpc(b) : auth(b); res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(out)); }); })
  .listen(+process.argv[2], '127.0.0.1');
