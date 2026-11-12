// Gera web/env.js com a URL e a chave PÚBLICA (anon/publishable) do Supabase.
//
// Por quê: um site HTML estático não enxerga variáveis de ambiente no navegador.
// Na Vercel, este script roda no build (Build Command: node scripts/generate-env.mjs),
// lê as variáveis que você cadastrou no painel e escreve o env.js que o frontend carrega.
//
// Local:  node --env-file=.env scripts/generate-env.mjs     (Node 20.6+)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = (process.env.SUPABASE_URL ?? '').trim()
const key = (process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? '').trim()

function fail(msg) {
  console.error(`\n[generate-env] ${msg}\n`)
  process.exit(1)
}

if (!url || !key) fail('Defina SUPABASE_URL e SUPABASE_ANON_KEY (veja .env.example).')
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
  fail('SUPABASE_URL parece inválida. Exemplo: https://abcdefghij.supabase.co')
}

// Trava de segurança: recusa chaves secretas/service_role.
function jwtRole(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role
  } catch {
    return null
  }
}
if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
  fail('Esta é uma chave SECRETA (service_role). Ela NUNCA pode ir para o frontend. Use a chave anon/publishable.')
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, 'web', 'env.js')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(
  target,
  `// Arquivo GERADO por scripts/generate-env.mjs — não edite nem versione.\n` +
    `window.__ENV__ = Object.freeze(${JSON.stringify({ SUPABASE_URL: url.replace(/\/$/, ''), SUPABASE_ANON_KEY: key })});\n`,
)
console.log(`[generate-env] ${target} gerado.`)
