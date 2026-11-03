import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'crypto'

// Conversions API server-side de Meta — espeja los eventos del Pixel del navegador
// para mejorar el match rate y sobrevivir a bloqueadores de anuncios / ITP.
// El pixel id y el access token viven solo en env vars de Vercel (META_PIXEL_ID, META_CAPI_TOKEN),
// nunca en el bundle del cliente. Si falta alguno, el envío se omite sin error.
const GRAPH_VERSION = 'v23.0'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

interface CapiRequestBody {
  event_name?: string
  event_id?: string
  event_source_url?: string
  user_data?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    fbc?: string
    fbp?: string
  }
  custom_data?: Record<string, unknown>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) {
    // Pixel o token no configurados todavía — no bloquear al cliente, solo omitir el envío.
    res.status(200).json({ skipped: true })
    return
  }

  const { event_name, event_id, event_source_url, user_data = {}, custom_data = {} } =
    (req.body ?? {}) as CapiRequestBody

  if (!event_name || !event_id) {
    res.status(400).json({ error: 'event_name y event_id son requeridos' })
    return
  }

  const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)
    ?.split(',')[0]
    ?.trim()

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        event_source_url,
        action_source: 'website',
        user_data: {
          em: user_data.email ? [sha256(user_data.email)] : undefined,
          ph: user_data.phone ? [sha256(normalizePhone(user_data.phone))] : undefined,
          fn: user_data.firstName ? [sha256(user_data.firstName)] : undefined,
          ln: user_data.lastName ? [sha256(user_data.lastName)] : undefined,
          fbc: user_data.fbc || undefined,
          fbp: user_data.fbp || undefined,
          client_ip_address: forwardedFor,
          client_user_agent: req.headers['user-agent'],
        },
        custom_data,
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE }
      : {}),
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    const json = await metaRes.json()
    res.status(metaRes.ok ? 200 : 502).json(json)
  } catch {
    res.status(502).json({ error: 'CAPI request failed' })
  }
}
