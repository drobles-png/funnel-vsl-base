/**
 * Atribución de Meta Ads: fbclid, fbc, fbp y UTMs.
 *
 * - captureFbParams(): llamar en el onMounted de CADA vista de entrada (landing, /ver-video,
 *   /calificar). Fusiona campo por campo: un valor solo se reemplaza si llega en la URL actual,
 *   así navegar sin query no borra la atribución de la llegada.
 * - getStoredFbParams(): lo que se manda a GHL y a CAPI. fbc/fbp salen PRIMERO de las cookies
 *   del Pixel (_fbc/_fbp) para que navegador, CAPI y CRM lleven exactamente el mismo valor.
 */
import { STORAGE_PREFIX } from '@/config/funnel'

const STORAGE_KEY = `${STORAGE_PREFIX}_fb`

export interface FbParams {
  fbclid: string
  fbc: string
  fbp: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  utm_id: string
}

const EMPTY: FbParams = {
  fbclid: '', fbc: '', fbp: '',
  utm_source: '', utm_medium: '', utm_campaign: '',
  utm_content: '', utm_term: '', utm_id: '',
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function readStored(): FbParams {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<FbParams>) }
  } catch { /* ignorar */ }
  return { ...EMPTY }
}

export function captureFbParams(): void {
  const params = new URLSearchParams(window.location.search)
  const stored = readStored()
  const fromUrl = (key: keyof FbParams) => params.get(key) || stored[key]
  const fbclid = params.get('fbclid') ?? ''

  const data: FbParams = {
    fbclid: fbclid || stored.fbclid,
    // Respaldo si el Pixel aún no creó _fbc (o está bloqueado)
    fbc: fbclid ? `fb.1.${Date.now()}.${fbclid}` : stored.fbc,
    fbp: stored.fbp,
    utm_source: fromUrl('utm_source'),
    utm_medium: fromUrl('utm_medium'),
    utm_campaign: fromUrl('utm_campaign'),
    utm_content: fromUrl('utm_content'),
    utm_term: fromUrl('utm_term'),
    utm_id: fromUrl('utm_id'),
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignorar */ }
}

export function getStoredFbParams(): FbParams {
  const stored = readStored()
  return {
    ...stored,
    fbp: getCookie('_fbp') || stored.fbp,
    fbc: getCookie('_fbc') || stored.fbc,
  }
}
