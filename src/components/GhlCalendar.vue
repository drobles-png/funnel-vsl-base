<script setup lang="ts">
/**
 * Calendario de GHL embebido, probado en producción:
 * - prellenado con first_name/last_name/email/phone + fbclid/UTMs (mismo contacto en el CRM)
 * - alto automático: carga form_embed.js (iframe-resizer) y además escucha
 *   ['highlevel.setHeight', {height}] (formato actual) y {type:'booking-app', height} (viejo)
 * - cita confirmada: ['msgsndr-booking-complete', {...}] → Pixel Schedule + CAPI + etapa en GHL
 * Uso: <GhlCalendar :contacto="contact" @booked="router.push('/cita-confirmada')" />
 *      <GhlCalendar :contacto="contact" collapsible />   (dentro de otra página, se abre con botón)
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { GHL_BOOKING_CALENDAR, GHL_BOOKING_FRAME_ID, STORAGE_PREFIX } from '@/config/funnel'
import { sendCapiEvent } from '@/utils/capi'
import { getStoredFbParams, type FbParams } from '@/utils/fbclid'
import { fbq, generateEventId, trackStage } from '@/utils/ghl'

const props = withDefaults(
  defineProps<{
    contacto: { nombre?: string; apellido?: string; email?: string; telefono?: string }
    collapsible?: boolean
    buttonLabel?: string
    title?: string
  }>(),
  { collapsible: false, buttonLabel: 'Agendar una reunión', title: '' },
)
const emit = defineEmits<{ (e: 'booked', eventId: string): void }>()

const EMBED_SCRIPT = 'https://link.msgsndr.com/js/form_embed.js'
const BOOKED_KEY = `${STORAGE_PREFIX}_booked_at`
const frameId = GHL_BOOKING_FRAME_ID || `ghl-booking-${Date.now()}`

const open = ref(!props.collapsible)
const booked = ref(false)
const iframeEl = ref<HTMLIFrameElement | null>(null)
const height = ref(760)

const src = computed(() => {
  const p = new URLSearchParams()
  const c = props.contacto
  if (c.nombre) { p.set('first_name', c.nombre); p.set('firstName', c.nombre) }
  if (c.apellido) { p.set('last_name', c.apellido); p.set('lastName', c.apellido) }
  if (c.email) p.set('email', c.email)
  if (c.telefono) p.set('phone', c.telefono)
  const fb = getStoredFbParams()
  const keys: Array<keyof FbParams> = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id']
  for (const k of keys) if (fb[k]) p.set(k, fb[k])
  const qs = p.toString()
  return qs ? `${GHL_BOOKING_CALENDAR}?${qs}` : GHL_BOOKING_CALENDAR
})

function loadEmbedScript() {
  if (document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) return
  const s = document.createElement('script')
  s.src = EMBED_SCRIPT
  s.async = true
  document.body.appendChild(s)
}

async function openCalendar() {
  open.value = true
  await nextTick()
  loadEmbedScript()
}

function onMessage(event: MessageEvent) {
  if (!event.data || event.source !== iframeEl.value?.contentWindow) return
  const data = event.data as unknown

  if (Array.isArray(data) && data[0] === 'highlevel.setHeight' && data[1]?.height) {
    height.value = Math.max(640, Number(data[1].height) + 8)
    return
  }
  if (typeof data === 'object' && !Array.isArray(data) && (data as { type?: string }).type === 'booking-app') {
    const h = (data as { height?: number }).height
    if (h) height.value = Math.max(640, h + 40)
    return
  }

  if (Array.isArray(data) && data[0] === 'msgsndr-booking-complete') {
    if (booked.value) return
    booked.value = true
    try { localStorage.setItem(BOOKED_KEY, String(Date.now())) } catch { /* ignorar */ }
    const c = props.contacto
    const eventId = generateEventId('schedule')
    const custom = { content_name: 'cita-agendada' }
    fbq('track', 'Schedule', custom, { eventID: eventId })
    sendCapiEvent('Schedule', eventId, { email: c.email, phone: c.telefono, firstName: c.nombre, lastName: c.apellido }, custom)
    trackStage('cita_agendada', c, { tags: ['step-cita-agendada'], titulo: '📅 CITA AGENDADA', eventId })
    emit('booked', eventId)
  }
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  if (open.value) loadEmbedScript()
})
onUnmounted(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <section v-if="GHL_BOOKING_CALENDAR" class="ghlcal" :aria-label="title || 'Agenda'">
    <h2 v-if="title" class="ghlcal__title">{{ title }}</h2>

    <button v-if="!open" type="button" class="btn btn--ghost btn--block" :aria-expanded="open" @click="openCalendar">
      <i class="fa-regular fa-calendar-check" aria-hidden="true"></i> {{ buttonLabel }}
    </button>

    <p v-if="booked" class="ghlcal__ok" role="status">
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i> Cita agendada. Te llega la confirmación a tu correo.
    </p>

    <div v-if="open" class="ghlcal__frame">
      <iframe
        :id="frameId"
        ref="iframeEl"
        :src="src"
        :style="{ height: height + 'px' }"
        title="Agenda tu cita"
        allow="payment"
        scrolling="no"
      ></iframe>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ghlcal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  &__ok {
    margin: 0;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    font-weight: 600;
  }

  // El widget de GHL es claro: enmarcarlo en tarjeta blanca
  &__frame {
    border-radius: 14px;
    overflow: hidden;
    background: #fff;

    iframe {
      display: block;
      width: 100%;
      border: 0;
    }
  }
}
</style>
