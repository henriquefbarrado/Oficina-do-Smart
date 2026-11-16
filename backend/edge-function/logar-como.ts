// Edge Function "logar-como" - permite que um ADMINISTRADOR entre na conta de outro usuário
// sem digitar a senha. Nome da função no Supabase: logar-como
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Quem está chamando? Precisa ser administrador ativo.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: caller, error: e1 } = await admin.auth.getUser(jwt);
    if (e1 || !caller?.user) return reply(401, { error: 'Sessão inválida. Entre novamente.' });
    const { data: me } = await admin.from('profiles').select('is_admin, active').eq('id', caller.user.id).maybeSingle();
    if (!me?.is_admin || !me.active) return reply(403, { error: 'Somente administradores podem usar esta função.' });

    // 2) Quem será acessado? Usuário ativo e que não seja administrador.
    const { user_id } = await req.json();
    if (!user_id) return reply(400, { error: 'Usuário não informado.' });
    if (user_id === caller.user.id) return reply(400, { error: 'Você já está nesta conta.' });
    const { data: t } = await admin.from('profiles').select('email, active, is_admin').eq('id', user_id).maybeSingle();
    if (!t) return reply(404, { error: 'Usuário não encontrado.' });
    if (t.is_admin) return reply(403, { error: 'Não é possível entrar como outro administrador.' });
    if (!t.active) return reply(400, { error: 'Usuário desativado. Ative-o antes de entrar na conta dele.' });

    // 3) Gera um link de acesso de uso único e devolve só o código dele.
    const { data, error: e2 } = await admin.auth.admin.generateLink({ type: 'magiclink', email: t.email });
    if (e2 || !data?.properties?.hashed_token) return reply(500, { error: 'Não foi possível gerar o acesso.' });
    console.log(`logar-como: admin ${caller.user.id} entrou como ${user_id}`);
    return reply(200, { token_hash: data.properties.hashed_token });
  } catch (e) {
    return reply(500, { error: String((e as Error).message ?? e) });
  }
});
