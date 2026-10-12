import type { SupabaseClient } from '@supabase/supabase-js'
import { CHAVE_PUBLICA_VAPID } from './vapid'

type Cliente = SupabaseClient

export type PreferenciasNotificacao = {
  avisarConclusao: boolean
  avisarCompras: boolean
  receberResumo: boolean
}

export type SuportePush = 'pronto' | 'iphone' | 'desenvolvimento' | 'sem-suporte'

function iphone() {
  const ua = navigator.userAgent
  return (
    /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function instalado() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export function suportePush(): SuportePush {
  if (iphone() && !instalado()) return 'iphone'
  if (import.meta.env.DEV) return 'desenvolvimento'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'sem-suporte'
  }
  return 'pronto'
}

function chaveAplicacao(base64url: string): Uint8Array<ArrayBuffer> {
  const sobra = (4 - (base64url.length % 4)) % 4
  const base64 = (base64url + '='.repeat(sobra)).replace(/-/g, '+').replace(/_/g, '/')
  const bruto = atob(base64)
  const bytes = new Uint8Array(bruto.length)
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i)
  return bytes
}

export function lerPreferencias(valor: unknown): PreferenciasNotificacao | null {
  if (!valor || typeof valor !== 'object') return null
  const linha = valor as Record<string, unknown>
  if (typeof linha.avisar_conclusao !== 'boolean') return null
  if (typeof linha.avisar_compras !== 'boolean') return null
  if (typeof linha.receber_resumo !== 'boolean') return null
  return {
    avisarConclusao: linha.avisar_conclusao,
    avisarCompras: linha.avisar_compras,
    receberResumo: linha.receber_resumo,
  }
}

export function lerHorario(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const hora = /^(\d{2}):(\d{2})/.exec(valor)
  if (!hora) return null
  const horas = Number(hora[1])
  const minutos = Number(hora[2])
  if (horas > 23 || minutos > 59) return null
  return `${hora[1]}:${hora[2]}`
}

export async function lerAjustesNotificacao(
  cliente: Cliente,
  usuarioId: string,
): Promise<{ preferencias: PreferenciasNotificacao | null; horario: string | null; erro: string | null }> {
  const [preferencias, casa] = await Promise.all([
    cliente
      .from('preferencias_notificacao')
      .select('avisar_conclusao, avisar_compras, receber_resumo')
      .eq('usuario_id', usuarioId)
      .maybeSingle(),
    cliente.from('casa').select('horario_resumo').eq('id', 1).maybeSingle(),
  ])

  if (preferencias.error || casa.error) {
    return { preferencias: null, horario: null, erro: 'Não consegui ler as notificações. Confira a conexão.' }
  }

  const lidas = lerPreferencias(preferencias.data)
  if (!lidas) {
    return {
      preferencias: null,
      horario: null,
      erro: 'Não achei as preferências desta conta. A migration inicial cria essa linha junto com o usuário.',
    }
  }

  return {
    preferencias: lidas,
    horario: lerHorario((casa.data as { horario_resumo?: unknown } | null)?.horario_resumo),
    erro: null,
  }
}

export async function salvarPreferencia(
  cliente: Cliente,
  usuarioId: string,
  campo: 'avisar_conclusao' | 'avisar_compras' | 'receber_resumo',
  ligado: boolean,
): Promise<string | null> {
  const { data, error } = await cliente
    .from('preferencias_notificacao')
    .update({ [campo]: ligado })
    .eq('usuario_id', usuarioId)
    .select('usuario_id')
    .maybeSingle()
  if (error || !data) return 'Não consegui salvar essa preferência.'
  return null
}

export async function salvarHorarioResumo(cliente: Cliente, horario: string): Promise<string | null> {
  if (!lerHorario(horario)) return 'Escolha um horário válido.'
  const { data, error } = await cliente
    .from('casa')
    .update({ horario_resumo: `${horario}:00` })
    .eq('id', 1)
    .select('id')
    .maybeSingle()
  if (error || !data) return 'Não consegui salvar o horário do resumo.'
  return null
}

export async function inscricaoDesteAparelho(cliente: Cliente, usuarioId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const registro = await navigator.serviceWorker.ready
  const inscricao = await registro.pushManager.getSubscription()
  if (!inscricao) return false
  const { data, error } = await cliente
    .from('push_subscriptions')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('endpoint', inscricao.endpoint)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

export async function ligarNotificacoes(cliente: Cliente, usuarioId: string): Promise<string | null> {
  const suporte = suportePush()
  if (suporte === 'iphone') {
    return 'No iPhone, abra o Xingxing pelo ícone da Tela de Início e toque de novo. No Safari, o aviso não existe.'
  }
  if (suporte === 'desenvolvimento') {
    return 'No npm run dev o aviso ainda não instala. Use o site publicado, ou rode npm run build e npm run preview.'
  }
  if (suporte === 'sem-suporte') return 'Este navegador não recebe aviso do Xingxing.'
  if (Notification.permission === 'denied') {
    return 'O aparelho bloqueou o aviso. Libere o Xingxing nos ajustes de notificação do sistema e toque de novo.'
  }

  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') return 'Sem a permissão, o Xingxing não consegue avisar.'

  const registro = await navigator.serviceWorker.ready
  let inscricao: PushSubscription
  try {
    inscricao = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveAplicacao(CHAVE_PUBLICA_VAPID),
    })
  } catch {
    return 'Este navegador não conseguiu ligar o aviso. No computador, use o Chrome. No iPhone, abra o Xingxing pelo ícone da Tela de Início.'
  }
  const json = inscricao.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    return 'O aparelho não entregou a inscrição completa.'
  }

  const { error } = await cliente.from('push_subscriptions').upsert(
    {
      usuario_id: usuarioId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      chave_auth: json.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) {
    if (/duplicate|row-level|permission|42501|23505/i.test(error.message)) {
      return 'Este aparelho já está inscrito com a outra pessoa. Saia daquela conta aqui, ou use o celular dela.'
    }
    return 'Não consegui guardar a inscrição.'
  }
  return null
}

export type Aviso = {
  id: string
  titulo: string
  corpo: string
  criadaEm: string
  lida: boolean
}

export function lerAviso(valor: unknown): Aviso | null {
  if (!valor || typeof valor !== 'object') return null
  const linha = valor as Record<string, unknown>
  if (typeof linha.id !== 'string' || typeof linha.titulo !== 'string' || typeof linha.corpo !== 'string') return null
  if (typeof linha.criada_em !== 'string' || typeof linha.lida !== 'boolean') return null
  return {
    id: linha.id,
    titulo: linha.titulo,
    corpo: linha.corpo,
    criadaEm: linha.criada_em,
    lida: linha.lida,
  }
}

export async function lerAvisos(
  cliente: Cliente,
  usuarioId: string,
): Promise<{ avisos: Aviso[]; erro: string | null }> {
  const { data, error } = await cliente
    .from('notificacoes')
    .select('id, titulo, corpo, criada_em, lida')
    .eq('usuario_id', usuarioId)
    .order('criada_em', { ascending: false })
    .limit(20)
  if (error) {
    if (/schema cache|does not exist|42P01/i.test(error.message)) {
      return {
        avisos: [],
        erro: 'A caixa de avisos ainda não existe. No SQL Editor, rode supabase/migrations/20261012180000_username_e_caixa.sql.',
      }
    }
    return { avisos: [], erro: 'Não consegui ler os avisos.' }
  }
  const avisos = (Array.isArray(data) ? data : [])
    .map(lerAviso)
    .filter((item): item is Aviso => item !== null)
  return { avisos, erro: null }
}

export async function marcarAvisosLidos(cliente: Cliente): Promise<string | null> {
  const { error } = await cliente.rpc('marcar_notificacoes_lidas')
  if (error) return 'Não consegui marcar os avisos como lidos.'
  return null
}

export function textoQuando(iso: string, agora = new Date()): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  const minutos = Math.round((agora.getTime() - data.getTime()) / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return horas === 1 ? 'há 1 h' : `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export async function desligarNotificacoes(cliente: Cliente, usuarioId: string): Promise<string | null> {
  if (!('serviceWorker' in navigator)) return null
  const registro = await navigator.serviceWorker.ready
  const inscricao = await registro.pushManager.getSubscription()
  if (!inscricao) return null
  const endpoint = inscricao.endpoint
  await inscricao.unsubscribe()
  const { error } = await cliente
    .from('push_subscriptions')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('endpoint', endpoint)
  if (error) return 'Desliguei no aparelho, mas a inscrição continuou no banco. Tente de novo.'
  return null
}
