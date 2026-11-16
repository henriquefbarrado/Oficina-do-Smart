// =====================================================================
// Edge Function: admin-create-user
// Cria um usuário (Auth + perfil) a pedido de um ADMINISTRADOR.
//
// Por que existe: criar usuário no Auth exige a SERVICE_ROLE_KEY, que
// jamais pode ir para o navegador. Aqui ela fica só no servidor do Supabase
// (a variável SUPABASE_SERVICE_ROLE_KEY já é injetada automaticamente).
//
// Fluxo: 1) valida o JWT de quem chamou  2) confere NO BANCO se é admin ativo
//        3) valida os dados e a combinação função x unidade
//        4) cria o usuário no Auth  5) completa o perfil (role, unidade, ativo)
//
// Chamada pelo frontend:
//   supabase.functions.invoke('admin-create-user', { body: {
//     email, password, full_name, role: 'employee', store_id: '<uuid da loja>' } })
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const ROLES = ['admin', 'stock_manager', 'employee'] as const
type Role = (typeof ROLES)[number]

const corsHeaders = {
  // Em produção, defina o segredo ALLOWED_ORIGIN com o domínio da Vercel.
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return json({ error: 'Função mal configurada no servidor.' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401)

  // 1) Quem está chamando? (o Auth valida a assinatura do JWT)
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: callerData, error: callerErr } = await caller.auth.getUser()
  if (callerErr || !callerData.user) return json({ error: 'Sessão inválida ou expirada.' }, 401)

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 2) É administrador ATIVO? Conferimos no banco, não no conteúdo do token.
  const { data: me, error: meErr } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', callerData.user.id)
    .maybeSingle()
  if (meErr || !me || me.role !== 'admin' || !me.active) {
    return json({ error: 'Apenas administradores ativos podem criar usuários.' }, 403)
  }

  // 3) Validação dos dados
  // deno-lint-ignore no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corpo da requisição inválido (esperado JSON).' }, 400)
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  const fullName = String(body?.full_name ?? '').trim()
  const password = String(body?.password ?? '')
  const role = body?.role as Role
  const storeId = body?.store_id ? String(body.store_id) : null

  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'E-mail inválido.' }, 400)
  if (fullName.length < 2 || fullName.length > 120) return json({ error: 'Nome deve ter de 2 a 120 caracteres.' }, 400)
  if (password.length < 10 || password.length > 72) {
    return json({ error: 'A senha deve ter de 10 a 72 caracteres.' }, 400)
  }
  if (!ROLES.includes(role)) return json({ error: 'Função inválida.' }, 400)
  if (storeId !== null && !UUID_RE.test(storeId)) return json({ error: 'Unidade inválida.' }, 400)

  if (role !== 'admin') {
    if (!storeId) return json({ error: 'Informe a unidade do usuário.' }, 400)
    const { data: store } = await admin
      .from('stores')
      .select('id, kind, active')
      .eq('id', storeId)
      .maybeSingle()
    if (!store || !store.active) return json({ error: 'Unidade inexistente ou inativa.' }, 400)
    if (role === 'stock_manager' && store.kind !== 'central') {
      return json({ error: 'O responsável pelo estoque deve ser vinculado ao Estoque Central.' }, 400)
    }
    if (role === 'employee' && store.kind !== 'branch') {
      return json({ error: 'Funcionário de loja deve ser vinculado a uma loja.' }, 400)
    }
  }

  // 4) Cria o usuário no Auth (e-mail já confirmado; ele troca a senha em "Esqueci minha senha")
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createErr || !created.user) {
    return json({ error: createErr?.message ?? 'Não foi possível criar o usuário.' }, 400)
  }

  // 5) O trigger do banco criou um perfil INATIVO; aqui o admin libera com função e unidade.
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ full_name: fullName, role, store_id: storeId, active: true })
    .eq('id', created.user.id)
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id) // desfaz para não deixar usuário "pela metade"
    return json({ error: `Não foi possível configurar o perfil: ${profileErr.message}` }, 400)
  }

  return json({ id: created.user.id, email, role, store_id: storeId }, 201)
})
