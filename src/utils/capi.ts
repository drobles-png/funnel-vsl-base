import { getStoredFbParams } from './fbclid'

/**
 * Envía el mismo evento a la Conversions API de Meta (server-side) que ya se
 * disparó al navegador con fbq(). Comparte event_id con el Pixel para que Meta
 * deduplique correctamente. El access token nunca sale del servidor — este
 * helper solo llama a /api/capi (función serverless de Vercel).
 */
export async function sendCapiEvent(
  eventName: string,
  eventId: string,
  userData: { email?: string; phone?: string; firstName?: string; lastName?: string } = {},
  customData: Record<string, unknown> = {},
) {
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return
  try {
    const { fbc, fbp } = getStoredFbParams()
    await fetch('/api/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: { ...userData, fbc, fbp },
        custom_data: customData,
      }),
    })
  } catch {
    // silencioso — nunca bloquear la UX por un fallo de tracking
  }
}
