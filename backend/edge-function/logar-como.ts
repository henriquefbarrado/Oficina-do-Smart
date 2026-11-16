// Edge Function "logar-como" (no Supabase está publicada como "smooth-service").
// Permite que um ADMINISTRADOR entre na conta de outro usuário sem digitar a senha.
// A chave service_role fica só aqui (no servidor), nunca no site.
// Ao publicar, DESLIGUE "Verify JWT" (a função confere o administrador por conta própria).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) return reply(500, { error: 'A chave de serviço (SUPABASE_SERVICE_ROLE_KEY) não está disponível nesta função.' });
    const admin = createClient(url, serviceKey, opts);

    // 1) Quem está chamando? Precisa ser administrador ativo.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!jwt) return reply(401, { error: 'Sessão inválida: o site não enviou o login. Saia e entre de novo.' });

    let callerId: string | null = null;
    const r1 = await admin.auth.getUser(jwt);
    if (r1.data?.user) {
      callerId = r1.data.user.id;
    } else {
      // Segunda tentativa: valida o login com a chave pública que o navegador enviou.
      const pub = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const userClient = createClient(url, pub, { ...opts, global: { headers: { Authorization: `Bearer ${jwt}` } } });
      const r2 = await userClient.auth.getUser(jwt);
      if (!r2.data?.user) {
        return reply(401, { error: 'Sessão inválida: ' + (r2.error?.message ?? r1.error?.message ?? 'usuário não encontrado') });
      }
      callerId = r2.data.user.id;
    }

    const { data: me, error: e0 } = await admin.from('profiles').select('is_admin, active').eq('id', callerId).maybeSingle();
    if (e0) return reply(500, { error: 'Erro ao consultar o perfil: ' + e0.message });
    if (!me?.is_admin || !me.active) return reply(403, { error: 'Somente administradores podem usar esta função.' });

    // 2) Quem será acessado? Usuário ativo e que não seja administrador.
    const { user_id } = await req.json();
    if (!user_id) return reply(400, { error: 'Usuário não informado.' });
    if (user_id === callerId) return reply(400, { error: 'Você já está nesta conta.' });
    const { data: t, error: e3 } = await admin.from('profiles').select('email, active, is_admin').eq('id', user_id).maybeSingle();
    if (e3) return reply(500, { error: 'Erro ao consultar o usuário: ' + e3.message });
    if (!t) return reply(404, { error: 'Usuário não encontrado.' });
    if (t.is_admin) return reply(403, { error: 'Não é possível entrar como outro administrador.' });
    if (!t.active) return reply(400, { error: 'Usuário desativado. Ative-o antes de entrar na conta dele.' });

    // 3) Gera um link de acesso de uso único e devolve só o código dele.
    const { data, error: e2 } = await admin.auth.admin.generateLink({ type: 'magiclink', email: t.email });
    if (e2 || !data?.properties?.hashed_token) {
      return reply(500, { error: 'Não foi possível gerar o acesso: ' + (e2?.message ?? 'sem código retornado') });
    }
    console.log(`logar-como: admin ${callerId} entrou como ${user_id}`);
    return reply(200, { token_hash: data.properties.hashed_token });
  } catch (e) {
    return reply(500, { error: String((e as Error).message ?? e) });
  }
});
