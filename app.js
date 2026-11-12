const $ = (s) => document.querySelector(s);
const root = $('#root');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => new Intl.NumberFormat('pt-BR').format(n ?? 0);
const when = (s) => new Date(s).toLocaleString('pt-BR');
const alertBox = (t, ok) => `<div class="alert${ok ? ' ok' : ''}">${esc(t)}</div>`;
const ROLES = { admin: 'Administrador', stock_manager: 'Resp. estoque central', employee: 'Funcionário' };
const MOV = { entry: 'Entrada', exit: 'Saída', consumption: 'Utilização', adjustment: 'Ajuste', transfer_out: 'Transf. saída', transfer_in: 'Transf. entrada', return_out: 'Devolução saída', return_in: 'Devolução entrada' };

let api;
try { api = await import('../supabase.js'); }
catch { root.innerHTML = `<main class="auth"><div class="auth-box">${alertBox('Configuração ausente: o env.js não foi gerado. Confira as variáveis SUPABASE_URL e SUPABASE_ANON_KEY e o Build Command no Vercel.')}</div></main>`; }

function loginScreen(msg = '') {
  root.innerHTML = `<main class="auth"><form id="lf" class="auth-box"><h1>ERP Estoque</h1>
    <p class="muted">Acesse com seu login individual.</p>
    <label>E-mail<input name="email" type="email" required autocomplete="username"></label>
    <label>Senha<input name="password" type="password" required autocomplete="current-password"></label>
    <div id="lm">${msg ? alertBox(msg) : ''}</div><button class="btn">Entrar</button>
    <a href="#" id="fg" class="small">Esqueci minha senha</a></form></main>`;
  $('#lf').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target; $('#lm').innerHTML = '';
    try { await api.auth.signIn(f.email.value, f.password.value); start(); }
    catch (err) { $('#lm').innerHTML = alertBox(err.message); }
  };
  $('#fg').onclick = async (e) => {
    e.preventDefault(); const em = $('#lf').email.value;
    if (!em) return ($('#lm').innerHTML = alertBox('Digite o e-mail acima e clique de novo.'));
    try { await api.auth.requestPasswordReset(em); $('#lm').innerHTML = alertBox('Se o e-mail existir, você receberá o link.', true); }
    catch (err) { $('#lm').innerHTML = alertBox(err.message); }
  };
}

const VIEWS = {
  async dashboard(el) {
    const rows = await api.stock.balances();
    const total = rows.reduce((s, r) => s + r.quantity, 0);
    const low = rows.filter((r) => r.below_minimum);
    const byStore = [...new Map(rows.map((r) => [r.store_id, r.store_name])).entries()]
      .map(([id, name]) => ({ name, qty: rows.filter((r) => r.store_id === id).reduce((s, r) => s + r.quantity, 0) }));
    const max = Math.max(1, ...byStore.map((b) => b.qty));
    const c = (l, v) => `<div class="card"><span class="card-label">${l}</span><strong class="card-value">${num(v)}</strong></div>`;
    el.innerHTML = `<div class="cards">${c('Peças em estoque', total)}${c('Itens abaixo do mínimo', low.length)}${c('Itens esgotados', rows.filter((r) => r.quantity === 0).length)}</div>
      <section class="panel"><h2>Estoque por unidade</h2>${byStore.map((b) => `<div class="bar-row"><span>${esc(b.name)}</span><div class="bar"><i style="width:${(b.qty / max) * 100}%"></i></div><b>${num(b.qty)}</b></div>`).join('') || '<p class="muted">Sem dados.</p>'}</section>`;
  },
  async stock(el) {
    const rows = await api.stock.balances();
    const stores = [...new Map(rows.map((r) => [r.store_id, r.store_name])).entries()];
    el.innerHTML = `<div class="tools"><input id="q" placeholder="Buscar produto ou SKU"><select id="s"><option value="">Todas as unidades</option>${stores.map(([id, n]) => `<option value="${esc(id)}">${esc(n)}</option>`).join('')}</select></div><div id="t"></div>`;
    const draw = () => {
      const q = $('#q').value.toLowerCase(), s = $('#s').value;
      const list = rows.filter((r) => (!s || r.store_id === s) && (r.product_name + r.sku).toLowerCase().includes(q));
      $('#t').innerHTML = `<div class="tw"><table><thead><tr><th>Produto</th><th>SKU</th><th>Unidade</th><th class="right">Qtd</th><th>Situação</th></tr></thead><tbody>${list.map((r) => `<tr><td>${esc(r.product_name)}</td><td>${esc(r.sku)}</td><td>${esc(r.store_name)}</td><td class="right">${num(r.quantity)}</td><td><span class="bd ${r.quantity === 0 ? 'bad' : r.below_minimum ? 'warn' : 'ok'}">${r.quantity === 0 ? 'Esgotado' : r.below_minimum ? 'Baixo' : 'Normal'}</span></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Nada encontrado.</td></tr>'}</tbody></table></div>`;
    };
    $('#q').oninput = draw; $('#s').onchange = draw; draw();
  },
  async history(el) {
    const rows = await api.stock.history({ limit: 100 });
    el.innerHTML = `<div class="tw"><table><thead><tr><th>Data</th><th>Unidade</th><th>Produto</th><th>Tipo</th><th class="right">Qtd</th><th class="right">Saldo</th><th>Motivo</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(when(r.created_at))}</td><td>${esc(r.store_name)}</td><td>${esc(r.product_name)}</td><td>${esc(MOV[r.movement_type] || r.movement_type)}</td><td class="right">${r.quantity_delta > 0 ? '+' : ''}${num(r.quantity_delta)}</td><td class="right">${num(r.balance_after)}</td><td>${esc(r.reason)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sem movimentações.</td></tr>'}</tbody></table></div>`;
  },
  async products(el, me) {
    const [prods, cats] = await Promise.all([api.catalog.listProducts({ onlyActive: false }), api.catalog.listCategories()]);
    const isAdmin = me.role === 'admin';
    el.innerHTML = `${isAdmin ? `<form id="pf" class="panel"><h2>Novo produto</h2>
      <label>Nome<input name="name" required></label><label>SKU<input name="sku" required></label>
      <label>Categoria<select name="cat"><option value="">—</option>${cats.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
      <label>Estoque mínimo<input name="min" type="number" min="0" value="0"></label>
      <label>Preço de custo<input name="cost" type="number" min="0" step="0.01" value="0"></label>
      <label>Preço de venda<input name="sale" type="number" min="0" step="0.01" value="0"></label>
      <div id="pm"></div><button class="btn">Salvar produto</button></form>` : ''}
      <div class="tw"><table><thead><tr><th>Produto</th><th>SKU</th><th>Categoria</th><th class="right">Mínimo</th></tr></thead><tbody>${prods.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.sku)}</td><td>${esc(p.category?.name)}</td><td class="right">${num(p.min_stock)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nenhum produto cadastrado.</td></tr>'}</tbody></table></div>`;
    if (isAdmin) $('#pf').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target;
      try { await api.catalog.saveProduct({ name: f.name.value, sku: f.sku.value, category_id: f.cat.value || null, min_stock: +f.min.value, cost_price: +f.cost.value, sale_price: +f.sale.value }); await VIEWS.products(el, me); }
      catch (err) { $('#pm').innerHTML = alertBox(err.message); }
    };
  },
  async entry(el, me) {
    const [prods, stores] = await Promise.all([api.catalog.listProducts(), api.admin.listStores()]);
    const opts = me.role === 'admin' ? stores : stores.filter((s) => s.id === me.store_id);
    el.innerHTML = `<form id="ef" class="panel"><h2>Registrar entrada de estoque</h2>
      <label>Unidade<select name="store">${opts.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></label>
      <label>Produto<select name="prod">${prods.map((p) => `<option value="${esc(p.id)}">${esc(p.name)} (${esc(p.sku)})</option>`).join('')}</select></label>
      <label>Quantidade<input name="qty" type="number" min="1" required></label>
      <label>Motivo<input name="reason" placeholder="Ex.: contagem inicial"></label>
      <div id="em"></div><button class="btn">Registrar</button></form>`;
    $('#ef').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target; const b = f.querySelector('button'); b.disabled = true;
      try { await api.stock.registerEntry({ storeId: f.store.value, productId: f.prod.value, quantity: +f.qty.value, reason: f.reason.value || null }); $('#em').innerHTML = alertBox('Entrada registrada.', true); f.qty.value = ''; }
      catch (err) { $('#em').innerHTML = alertBox(err.message); }
      b.disabled = false;
    };
  },
  async employees(el, me) {
    const [users, stores] = await Promise.all([api.admin.listUsers(), api.admin.listStores()]);
    const so = (kind, sel) => stores.filter((x) => x.kind === kind && x.active).map((x) => `<option value="${esc(x.id)}"${x.id === sel ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
    const roleSel = (id, r) => `<select data-r="${esc(id)}"><option value="employee"${r === 'employee' ? ' selected' : ''}>Funcionário (loja)</option><option value="stock_manager"${r === 'stock_manager' ? ' selected' : ''}>Resp. estoque central</option><option value="admin"${r === 'admin' ? ' selected' : ''}>Administrador</option></select>`;
    const storeSel = (id, sid) => `<select data-s="${esc(id)}"><option value="">—</option>${so('central', sid)}${so('branch', sid)}</select>`;
    el.innerHTML = `<form id="nf" class="panel"><h2>Novo funcionário</h2>
      <label>Nome completo<input name="name" required></label><label>E-mail<input name="email" type="email" required></label>
      <label>Senha provisória (mín. 10 caracteres)<input name="pw" type="password" minlength="10" required></label>
      <label>Função<select name="role"><option value="employee">Funcionário (loja)</option><option value="stock_manager">Resp. estoque central</option><option value="admin">Administrador</option></select></label>
      <label>Unidade<select name="store"><option value="">—</option>${so('central')}${so('branch')}</select></label>
      <div id="nm"></div><button class="btn">Criar funcionário</button></form>
      <div id="um"></div><div class="tw"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Função</th><th>Unidade</th><th>Status</th><th></th></tr></thead><tbody>${users.map((u) => u.id === me.id
        ? `<tr><td>${esc(u.full_name)} (você)</td><td>${esc(u.email)}</td><td>${esc(ROLES[u.role])}</td><td>—</td><td><span class="bd ok">Ativo</span></td><td></td></tr>`
        : `<tr><td>${esc(u.full_name)}</td><td>${esc(u.email)}</td><td>${roleSel(u.id, u.role)}</td><td>${storeSel(u.id, u.store_id)}</td><td><span class="bd ${u.active ? 'ok' : 'bad'}">${u.active ? 'Ativo' : 'Inativo'}</span></td><td><button class="btn ghost" data-save="${esc(u.id)}" data-act="${u.active ? 0 : 1}">${u.active ? 'Desativar' : 'Ativar'}</button></td></tr>`).join('')}</tbody></table></div>`;
    $('#nf').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target; const b = f.querySelector('button'); b.disabled = true;
      try { await api.admin.createUser({ email: f.email.value, password: f.pw.value, fullName: f.name.value, role: f.role.value, storeId: f.role.value === 'admin' ? null : f.store.value || null }); await VIEWS.employees(el, me); }
      catch (err) { $('#nm').innerHTML = alertBox(err.message); b.disabled = false; }
    };
    el.querySelectorAll('[data-save]').forEach((btn) => (btn.onclick = async () => {
      const id = btn.dataset.save; const role = el.querySelector(`[data-r="${id}"]`).value; const store = el.querySelector(`[data-s="${id}"]`).value || null;
      try { await api.admin.updateUser(id, { role, storeId: role === 'admin' ? null : store, active: btn.dataset.act === '1' }); await VIEWS.employees(el, me); }
      catch (err) { $('#um').innerHTML = alertBox(err.message); }
    }));
  },
};
const NAV = [
  ['dashboard', 'Dashboard', ['admin', 'stock_manager', 'employee']],
  ['stock', 'Estoque', ['admin', 'stock_manager', 'employee']],
  ['products', 'Produtos', ['admin', 'stock_manager', 'employee']],
  ['entry', 'Registrar entrada', ['admin', 'stock_manager']],
  ['employees', 'Funcionários', ['admin']],
  ['history', 'Movimentações', ['admin', 'stock_manager', 'employee']],
];

async function start() {
  const session = await api.auth.getSession();
  if (!session) return loginScreen();
  let me;
  try { me = await api.auth.currentProfile(); } catch { me = null; }
  if (!me || !me.active) { await api.auth.signOut(); return loginScreen('Seu acesso não está ativo. Fale com o administrador.'); }
  const nav = NAV.filter((n) => n[2].includes(me.role));
  root.innerHTML = `<aside class="sidebar"><div class="brand">ERP Estoque</div><nav id="menu">${nav.map((n) => `<a href="#/${n[0]}" data-k="${n[0]}">${n[1]}</a>`).join('')}</nav>
    <div class="user"><strong>${esc(me.full_name)}</strong><span class="muted small">${esc(ROLES[me.role])}</span><button id="out" class="btn ghost">Sair</button></div></aside>
    <div class="main"><header class="topbar"><button id="bg" class="btn ghost">☰</button><h1 id="ttl"></h1></header><main id="view" class="content"></main></div>`;
  $('#out').onclick = async () => { await api.auth.signOut(); loginScreen(); };
  $('#bg').onclick = () => document.body.classList.toggle('menu-open');
  const route = async () => {
    const k = location.hash.replace('#/', '') || 'dashboard'; const it = nav.find((n) => n[0] === k) || nav[0];
    document.querySelectorAll('#menu a').forEach((a) => a.classList.toggle('active', a.dataset.k === it[0]));
    $('#ttl').textContent = it[1]; document.body.classList.remove('menu-open');
    const el = $('#view'); el.innerHTML = '<p class="muted">Carregando…</p>';
    try { await VIEWS[it[0]](el, me); } catch (err) { el.innerHTML = alertBox(err.message); }
  };
  window.onhashchange = route; route();
}
if (api) start();
