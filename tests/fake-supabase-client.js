window.GM_CONFIG = { supabaseUrl: 'http://fake', supabaseAnonKey: 'anon' };
window.supabase = { createClient(){
  const S = 'http://127.0.0.1:' + window.__FAKE_PORT; const post = (p, b) => fetch(S + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
  let session = JSON.parse(localStorage.getItem('gm-auth') || 'null'); const subs = []; const keep = () => session ? localStorage.setItem('gm-auth', JSON.stringify(session)) : localStorage.removeItem('gm-auth');
  const auth = { async getSession(){ return { data: { session } }; }, onAuthStateChange(cb){ subs.push(cb); return { data: { subscription: { unsubscribe(){} } } }; },
    async signUp({ email, password }){ const r = await post('/auth', { a: 'up', email, password }); if (r.error) return { data: {}, error: r.error }; session = { user: r.user }; keep(); return { data: { session, user: r.user }, error: null }; },
    async signInWithPassword({ email, password }){ const r = await post('/auth', { a: 'in', email, password }); if (r.error) return { data: {}, error: r.error }; session = { user: r.user }; keep(); return { data: { session, user: r.user }, error: null }; },
    async signOut(){ session = null; keep(); return { error: null }; }, async updateUser(){ return { data: { user: session.user }, error: null }; }, async resetPasswordForEmail(){ return { error: null }; } };
  const from = table => { const st = { table, f: [], op: 'select' }; const b = { select(){ return b; }, eq(k, v){ st.f.push(['eq', k, v]); return b; }, not(k, o, v){ st.f.push(['notlike', k, v]); return b; }, like(k, v){ st.f.push(['like', k, v]); return b; },
    gt(k, v){ st.f.push(['gt', k, v]); return b; }, in(k, v){ st.f.push(['in', k, v]); return b; }, range(a, z){ st.range = [a, z]; return b; }, upsert(r){ st.op = 'upsert'; st.rows = [].concat(r); return b; }, insert(r){ st.op = 'insert'; st.rows = [].concat(r); return b; }, delete(){ st.op = 'delete'; return b; },
    then(ok, bad){ return post('/op', { ...st, uid: session && session.user.id }).then(r => ok({ data: r.data, error: r.error || null }), bad); } }; return b; };
  const channel = () => { const ch = { on(ev, filter, cb){ ch.filter = filter; ch.cb = cb; return ch; }, subscribe(){ let since = new Date(0).toISOString(), first = true;
    setInterval(async () => { if (!session) return; const r = await post('/op', { table: ch.filter.table, op: 'select', f: ch.filter.table === 'docs' ? [['eq', 'user_id', session.user.id], ['gt', 'updated_at', since]] : [['gt', 'updated_at', since]], uid: session.user.id });
      (r.data || []).forEach(row => { if (row.updated_at > since) since = row.updated_at; if (!first) ch.cb({ eventType: 'UPDATE', new: row }); }); first = false; }, 600); return ch; } }; return ch; };
  return { auth, from, rpc: (fn, args) => post('/rpc', { fn, args, uid: session && session.user.id }).then(r => ({ data: r.data, error: r.error || null })), channel };
} };
