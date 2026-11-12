// =====================================================================
// supabase.js — integração do frontend (HTML/CSS/JS puro) com o backend.
//
// Uso:  <script src="env.js"></script>                      (antes de tudo)
//       <script type="module" src="js/app.js"></script>
//       // em app.js:
//       import { auth, stock, requests } from './supabase.js'
//
// Este arquivo só usa a chave PÚBLICA (anon/publishable). A segurança dos dados
// vem do banco (RLS + funções). NUNCA coloque a service_role aqui.
// =====================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const cfg = globalThis.__ENV__ ?? {}
if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
  throw new Error('Configuração ausente: carregue o env.js antes deste módulo (veja o README).')
}

export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

// ---------------------------------------------------------------------
// Erros: transforma erros do banco/API em mensagens que o usuário entende
// ---------------------------------------------------------------------
export class ApiError extends Error {
  constructor(message, { code = null, hint = null, details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.hint = hint
    this.details = details
  }
}

// Hints enviados pelas funções do banco (as mensagens delas já estão em português).
const DB_HINTS = new Set([
  'forbidden', 'insufficient_stock', 'invalid_status', 'invalid_quantity', 'invalid_items',
  'invalid_product', 'invalid_store', 'invalid_text', 'already_received', 'not_found',
  'no_change', 'invalid_role_store', 'immutable', 'ledger_mismatch',
])

const FRIENDLY_BY_CODE = {
  '42501': 'Você não tem permissão para esta ação.',
  '23505': 'Já existe um registro com esses dados (ex.: SKU ou nome repetido).',
  '23503': 'Referência inválida ou registro em uso.',
  '23514': 'Os dados informados violam uma regra do sistema.',
  '22P02': 'Algum valor está em formato inválido.',
  PGRST116: 'Registro não encontrado.',
  PGRST301: 'Sua sessão expirou. Entre novamente.',
  PGRST302: 'Faça login para continuar.',
}

function toApiError(error) {
  const message = DB_HINTS.has(error?.hint)
    ? error.message
    : FRIENDLY_BY_CODE[error?.code] ?? error?.message ?? 'Erro inesperado. Tente novamente.'
  return new ApiError(message, { code: error?.code, hint: error?.hint, details: error?.details })
}

function unwrap({ data, error }) {
  if (error) throw toApiError(error)
  return data
}

// ---------------------------------------------------------------------
// Validação no frontend (só melhora a experiência; o banco valida de novo)
// ---------------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v)

function assertUuid(value, label) {
  if (!isUuid(value)) throw new ApiError(`${label} inválido(a).`)
}
function assertQuantity(value, { allowZero = false } = {}) {
  const ok = Number.isInteger(value) && value <= 1_000_000 && (allowZero ? value >= 0 : value > 0)
  if (!ok) throw new ApiError('Quantidade inválida: informe um número inteiro' + (allowZero ? ' maior ou igual a zero.' : ' maior que zero.'))
}
function assertText(value, min, label) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new ApiError(`${label} deve ter pelo menos ${min} caracteres.`)
  }
}

/** Gere UMA chave por tentativa de envio do formulário e reutilize-a se o usuário clicar de novo. */
export const newIdempotencyKey = () => crypto.randomUUID()

const rpc = async (fn, args = {}) => unwrap(await supabase.rpc(fn, args))

// ---------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------
export const auth = {
  async signIn(email, password) {
    if (!email || !password) throw new ApiError('Informe e-mail e senha.')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      throw new ApiError(error.status === 400 ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar. Tente novamente.')
    }
    return data.session
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw toApiError(error)
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  /** cb(session) é chamado no login, logout e renovação de sessão. Retorna uma função para cancelar. */
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session))
    return () => data.subscription.unsubscribe()
  },

  /** Envia o e-mail de recuperação. A página reset-password.html deve chamar auth.updatePassword(). */
  async requestPasswordReset(email) {
    const redirectTo = `${location.origin}/reset-password.html`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (error) throw toApiError(error)
  },

  async updatePassword(newPassword) {
    if (typeof newPassword !== 'string' || newPassword.length < 10) {
      throw new ApiError('A senha deve ter pelo menos 10 caracteres.')
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw toApiError(error)
  },

  /** Perfil do usuário logado: { id, full_name, email, role, store_id, active }. Fonte: tabela profiles. */
  async currentProfile() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return null
    return unwrap(
      await supabase.from('profiles').select('id, full_name, email, role, store_id, active').eq('id', userData.user.id).single(),
    )
  },
}

// ---------------------------------------------------------------------
// Catálogo (admin escreve; todos leem)
// ---------------------------------------------------------------------
export const catalog = {
  async listCategories() {
    return unwrap(await supabase.from('categories').select('*').order('name'))
  },

  async listProducts({ search = '', categoryId = null, onlyActive = true } = {}) {
    let q = supabase.from('products').select('*, category:categories(id, name)').order('name')
    if (onlyActive) q = q.eq('active', true)
    if (categoryId) q = q.eq('category_id', categoryId)
    if (search.trim()) {
      const term = search.trim().replace(/[%,()]/g, ' ')
      q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
    }
    return unwrap(await q)
  },

  /** Cria (sem id) ou atualiza (com id). Só administradores conseguem; o banco recusa os demais. */
  async saveProduct(p) {
    assertText(p.sku, 2, 'O SKU')
    assertText(p.name, 2, 'O nome')
    assertQuantity(Number(p.min_stock ?? 0), { allowZero: true })
    const row = {
      sku: p.sku.trim(),
      name: p.name.trim(),
      description: p.description ?? null,
      category_id: p.category_id ?? null,
      unit_of_measure: (p.unit_of_measure ?? 'un').trim(),
      min_stock: Number(p.min_stock ?? 0),
      cost_price: p.cost_price ?? null,
      sale_price: p.sale_price ?? null,
      active: p.active ?? true,
    }
    const query = p.id ? supabase.from('products').update(row).eq('id', p.id) : supabase.from('products').insert(row)
    return unwrap(await query.select().single())
  },
}

// ---------------------------------------------------------------------
// Estoque: consultas e movimentações
// ---------------------------------------------------------------------
export const stock = {
  /** Saldo atual. Sem filtros: tudo que o usuário pode ver (funcionário: só a própria unidade). */
  async balances({ storeId = null, productId = null } = {}) {
    return rpc('get_stock_balance', { p_store_id: storeId, p_product_id: productId })
  },

  async history({ storeId = null, productId = null, from = null, to = null, performedBy = null, limit = 100, offset = 0 } = {}) {
    return rpc('get_movement_history', {
      p_store_id: storeId, p_product_id: productId, p_from: from, p_to: to,
      p_performed_by: performedBy, p_limit: limit, p_offset: offset,
    })
  },

  /** Entrada (admin em qualquer unidade; responsável do central no central). */
  async registerEntry({ storeId, productId, quantity, reason = null, idempotencyKey = newIdempotencyKey() }) {
    assertUuid(storeId, 'Unidade'); assertUuid(productId, 'Produto'); assertQuantity(quantity)
    return rpc('register_entry', { p_store_id: storeId, p_product_id: productId, p_quantity: quantity, p_reason: reason, p_idempotency_key: idempotencyKey })
  },

  async registerExit({ storeId, productId, quantity, reason = null, idempotencyKey = newIdempotencyKey() }) {
    assertUuid(storeId, 'Unidade'); assertUuid(productId, 'Produto'); assertQuantity(quantity)
    return rpc('register_exit', { p_store_id: storeId, p_product_id: productId, p_quantity: quantity, p_reason: reason, p_idempotency_key: idempotencyKey })
  },

  /** Utilização de peça. Funcionário: sempre na própria unidade (storeId é ignorado/recusado se for outra). */
  async registerConsumption({ productId, quantity, reason = null, storeId = null, idempotencyKey = newIdempotencyKey() }) {
    assertUuid(productId, 'Produto'); assertQuantity(quantity)
    return rpc('register_consumption', { p_product_id: productId, p_quantity: quantity, p_reason: reason, p_idempotency_key: idempotencyKey, p_store_id: storeId })
  },

  /** Ajuste para a quantidade contada. Justificativa obrigatória. */
  async adjust({ storeId, productId, newQuantity, reason, idempotencyKey = newIdempotencyKey() }) {
    assertUuid(storeId, 'Unidade'); assertUuid(productId, 'Produto')
    assertQuantity(newQuantity, { allowZero: true }); assertText(reason, 3, 'A justificativa')
    return rpc('adjust_stock', { p_store_id: storeId, p_product_id: productId, p_new_quantity: newQuantity, p_reason: reason, p_idempotency_key: idempotencyKey })
  },
}

// ---------------------------------------------------------------------
// Solicitações
// items: [{ product_id, quantity }]
// ---------------------------------------------------------------------
function cleanItems(items, qtyKey) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError('Informe ao menos um item.')
  return items.map((i) => {
    assertUuid(i.product_id, 'Produto')
    assertQuantity(i[qtyKey], { allowZero: qtyKey === 'quantity_approved' })
    return { product_id: i.product_id, [qtyKey]: i[qtyKey] }
  })
}

export const requests = {
  create: ({ items, notes = null, idempotencyKey = newIdempotencyKey() }) =>
    rpc('create_stock_request', { p_items: cleanItems(items, 'quantity'), p_notes: notes, p_idempotency_key: idempotencyKey }),

  /** Lista com itens. A RLS decide o que cada usuário enxerga. */
  async list({ status = null } = {}) {
    let q = supabase.from('stock_requests')
      .select('*, store:stores(name), requester:profiles!stock_requests_requested_by_fkey(full_name), items:stock_request_items(*, product:products(sku, name))')
      .order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    return unwrap(await q)
  },

  approve: (id, notes = null) => rpc('approve_stock_request', { p_request_id: id, p_notes: notes }),
  /** approved: [{ product_id, quantity_approved }] (itens omitidos = 0) */
  partiallyApprove: (id, approved, notes = null) =>
    rpc('partially_approve_stock_request', { p_request_id: id, p_items: cleanItems(approved, 'quantity_approved'), p_notes: notes }),
  reject: (id, reason) => { assertText(reason, 3, 'O motivo'); return rpc('reject_stock_request', { p_request_id: id, p_reason: reason }) },
  cancel: (id) => rpc('cancel_stock_request', { p_request_id: id }),
  /** "Separar": cria a transferência com as quantidades aprovadas. Retorna o id da transferência. */
  prepareShipment: (id) => rpc('prepare_request_shipment', { p_request_id: id }),
}

// ---------------------------------------------------------------------
// Transferências
// ---------------------------------------------------------------------
export const transfers = {
  create: ({ originStoreId, destinationStoreId, items, notes = null, idempotencyKey = newIdempotencyKey() }) =>
    rpc('create_transfer', {
      p_origin_store_id: originStoreId, p_destination_store_id: destinationStoreId,
      p_items: cleanItems(items, 'quantity'), p_notes: notes, p_idempotency_key: idempotencyKey,
    }),

  async list({ status = null } = {}) {
    let q = supabase.from('stock_transfers')
      .select('*, origin:stores!stock_transfers_origin_store_id_fkey(name), destination:stores!stock_transfers_destination_store_id_fkey(name), items:stock_transfer_items(*, product:products(sku, name))')
      .order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    return unwrap(await q)
  },

  ship: (id) => rpc('ship_transfer', { p_transfer_id: id }),
  receive: (id) => rpc('receive_transfer', { p_transfer_id: id }),
  cancel: (id) => rpc('cancel_transfer', { p_transfer_id: id }),
}

// ---------------------------------------------------------------------
// Devoluções (condition: 'good' | 'defective' | 'damaged')
// ---------------------------------------------------------------------
export const returns = {
  request: ({ productId, quantity, reason, condition, idempotencyKey = newIdempotencyKey() }) => {
    assertUuid(productId, 'Produto'); assertQuantity(quantity); assertText(reason, 3, 'O motivo')
    return rpc('request_return', { p_product_id: productId, p_quantity: quantity, p_reason: reason, p_condition: condition, p_idempotency_key: idempotencyKey })
  },
  async list() {
    return unwrap(await supabase.from('stock_returns').select('*, store:stores(name), product:products(sku, name)').order('created_at', { ascending: false }))
  },
  receive: (id, notes = null) => rpc('receive_return', { p_return_id: id, p_notes: notes }),
  reject: (id, notes) => { assertText(notes, 3, 'O motivo'); return rpc('reject_return', { p_return_id: id, p_notes: notes }) },
}

// ---------------------------------------------------------------------
// Relatórios (views e consultas com período; datas em ISO, ex.: '2026-11-01T00:00:00-03:00')
// ---------------------------------------------------------------------
const VIEWS = new Set([
  'v_stock_by_store', 'v_stock_consolidated', 'v_low_stock',
  'v_movements_detailed', 'v_pending_requests', 'v_transfers_in_transit',
])

export const reports = {
  async view(name, { limit = 500 } = {}) {
    if (!VIEWS.has(name)) throw new ApiError('Relatório desconhecido.')
    return unwrap(await supabase.from(name).select('*').limit(limit))
  },
  movementsByPeriod: ({ from = null, to = null, storeId = null } = {}) =>
    rpc('report_movements_by_period', { p_from: from, p_to: to, p_store_id: storeId }),
  topUsedProducts: ({ from = null, to = null, storeId = null, limit = 10 } = {}) =>
    rpc('report_top_used_products', { p_from: from, p_to: to, p_store_id: storeId, p_limit: limit }),
  movementsByEmployee: ({ from = null, to = null, storeId = null } = {}) =>
    rpc('report_movements_by_employee', { p_from: from, p_to: to, p_store_id: storeId }),
  transfers: ({ from = null, to = null, status = null } = {}) =>
    rpc('report_transfers', { p_from: from, p_to: to, p_status: status }),
}

// ---------------------------------------------------------------------
// Administração (somente admin): usuários e unidades
// ---------------------------------------------------------------------
export const admin = {
  /** Chama a Edge Function admin-create-user (a service_role fica só no servidor). */
  async createUser({ email, password, fullName, role, storeId = null }) {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, full_name: fullName, role, store_id: storeId },
    })
    if (error) {
      let message = error.message
      try { message = (await error.context.json()).error ?? message } catch { /* mantém a mensagem padrão */ }
      throw new ApiError(message)
    }
    return data
  },

  async listUsers() {
    return unwrap(await supabase.from('profiles').select('*, store:stores(name)').order('full_name'))
  },

  /** Admin altera função/unidade/status de OUTRO usuário (o banco recusa se for você mesmo). */
  async updateUser(id, { fullName, role, storeId, active }) {
    const patch = {}
    if (fullName !== undefined) patch.full_name = fullName
    if (role !== undefined) patch.role = role
    if (storeId !== undefined) patch.store_id = storeId
    if (active !== undefined) patch.active = active
    return unwrap(await supabase.from('profiles').update(patch).eq('id', id).select().single())
  },

  async listStores() {
    return unwrap(await supabase.from('stores').select('*').order('kind').order('name'))
  },

  async activityLog({ storeId = null, tableName = null, limit = 100 } = {}) {
    let q = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(limit)
    if (storeId) q = q.eq('store_id', storeId)
    if (tableName) q = q.eq('table_name', tableName)
    return unwrap(await q)
  },
}
