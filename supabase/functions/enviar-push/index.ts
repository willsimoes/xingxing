import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.49.8'

type Pedido = {
  destinatarios?: unknown
  titulo?: unknown
  corpo?: unknown
  url?: unknown
}

type Inscricao = {
  id: string
  endpoint: string
  p256dh: string
  chave_auth: string
}

const json = { 'Content-Type': 'application/json' }

function texto(valor: unknown, limite: number, reserva: string): string {
  const limpo = typeof valor === 'string' ? valor.trim() : ''
  return (limpo || reserva).slice(0, limite)
}

function ids(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((item): item is string => typeof item === 'string' && /^[0-9a-f-]{36}$/i.test(item)).slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ erro: 'Use POST.' }), { status: 405, headers: json })
  }

  const esperado = Deno.env.get('NOTIFICACAO_SEGREDO') ?? ''
  const recebido = req.headers.get('x-xingxing-segredo') ?? ''
  if (!esperado || recebido !== esperado) {
    return new Response(JSON.stringify({ erro: 'Não autorizado.' }), { status: 401, headers: json })
  }

  const publica = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
  const privada = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
  const assunto = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:teste.cursor.xingxing@example.com'
  if (!publica || !privada) {
    return new Response(JSON.stringify({ erro: 'Faltam as chaves VAPID.' }), { status: 500, headers: json })
  }

  let pedido: Pedido
  try {
    pedido = (await req.json()) as Pedido
  } catch {
    return new Response(JSON.stringify({ erro: 'JSON inválido.' }), { status: 400, headers: json })
  }

  const destinatarios = ids(pedido.destinatarios)
  if (destinatarios.length === 0) {
    return new Response(JSON.stringify({ enviados: 0 }), { headers: json })
  }

  const titulo = texto(pedido.titulo, 80, 'Xingxing')
  const corpo = texto(pedido.corpo, 240, '')
  const url = texto(pedido.url, 200, '/')
  const destino = url.startsWith('/') ? url : '/'

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ erro: 'Função sem acesso ao banco.' }), { status: 500, headers: json })
  }

  webpush.setVapidDetails(assunto, publica, privada)
  const banco = createClient(supabaseUrl, serviceRole)
  const { data, error } = await banco
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, chave_auth')
    .in('usuario_id', destinatarios)

  if (error) {
    return new Response(JSON.stringify({ erro: 'Não li as inscrições.' }), { status: 500, headers: json })
  }

  const inscricoes = (data ?? []) as Inscricao[]
  let enviados = 0
  const payload = JSON.stringify({ title: titulo, body: corpo, url: destino })

  for (const inscricao of inscricoes) {
    try {
      await webpush.sendNotification(
        {
          endpoint: inscricao.endpoint,
          keys: { p256dh: inscricao.p256dh, auth: inscricao.chave_auth },
        },
        payload,
      )
      enviados += 1
    } catch (falha) {
      const status = typeof falha === 'object' && falha && 'statusCode' in falha ? Number(falha.statusCode) : 0
      if (status === 404 || status === 410) {
        await banco.from('push_subscriptions').delete().eq('id', inscricao.id)
      }
    }
  }

  return new Response(JSON.stringify({ enviados }), { headers: json })
})
