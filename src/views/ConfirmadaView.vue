<script setup lang="ts">
// /inscripcion-confirmada (solo si PAYMENT_ENABLED). La pasarela redirige aquí al terminar.
// Purchase (Pixel + CAPI) y etapa `pagado` en GHL, UNA vez por dispositivo. No se verifica el
// pago en servidor: esta URL solo debe conocerla la pasarela; el router exige contacto guardado.
import { computed, onMounted } from 'vue'
import GhlCalendar from '@/components/GhlCalendar.vue'
import StepShell from '@/components/StepShell.vue'
import {
  BRAND_NAME,
  CURRENCY,
  EVENT_DATE,
  EVENT_DURATION_MIN,
  GHL_BOOKING_CALENDAR,
  PRICE,
  PRODUCT_NAME,
  STORAGE_PREFIX,
  eventDateLabel,
  priceLabel,
} from '@/config/funnel'
import { CONFIRMADA } from '@/content/copy'
import { useContactStore } from '@/stores/contact'
import { sendCapiEvent } from '@/utils/capi'
import { fbq, generateEventId, trackStage } from '@/utils/ghl'

const PURCHASE_KEY = `${STORAGE_PREFIX}_purchase_at`
const c = useContactStore().get()
const product = PRODUCT_NAME || '[Nombre del producto o evento]'

const calendarHref = computed(() => {
  if (!EVENT_DATE) return ''
  const start = new Date(EVENT_DATE)
  const end = new Date(start.getTime() + EVENT_DURATION_MIN * 60_000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${product} — ${BRAND_NAME}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'El enlace de acceso llega a tu correo y WhatsApp.',
  })
  return `https://calendar.google.com/calendar/render?${params}`
})

onMounted(() => {
  try {
    if (localStorage.getItem(PURCHASE_KEY)) return
    localStorage.setItem(PURCHASE_KEY, String(Date.now()))
  } catch {
    return
  }
  const eventId = generateEventId('purchase')
  const custom = { content_name: product, value: PRICE, currency: CURRENCY }
  fbq('track', 'Purchase', custom, { eventID: eventId })
  sendCapiEvent(
    'Purchase',
    eventId,
    { email: c.email, phone: c.telefono, firstName: c.nombre, lastName: c.apellido },
    custom,
  )
  trackStage('pagado', c, {
    tags: ['step-4-pagado'],
    titulo: '💰 PAGADO',
    detalle: { Total: priceLabel(), Fecha: eventDateLabel() },
    eventId,
  })
})
</script>

<template>
  <StepShell>
    <section class="ok">
      <span class="ok__badge" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
      <h1 class="ok__title">{{ c.nombre ? `¡Listo, ${c.nombre}!` : '¡Listo!' }} {{ CONFIRMADA.title }}</h1>
      <p class="ok__date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ eventDateLabel() }}</p>

      <a v-if="calendarHref" :href="calendarHref" target="_blank" rel="noopener" class="btn btn--ghost">
        <i class="fa-regular fa-calendar-plus" aria-hidden="true"></i> Agregar a Google Calendar
      </a>

      <ol class="ok__steps" role="list">
        <li v-for="(s, i) in CONFIRMADA.steps" :key="i">
          <i :class="s.icon" aria-hidden="true"></i>
          <p>{{ s.text }}</p>
        </li>
      </ol>

      <GhlCalendar
        v-if="GHL_BOOKING_CALENDAR"
        :contacto="c"
        collapsible
        :title="CONFIRMADA.calendarTitle"
        :button-label="CONFIRMADA.calendarButton"
      />
    </section>
  </StepShell>
</template>

<style scoped lang="scss">
.ok {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;

  &__badge {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: $primary-soft;
    color: $primary;
    font-size: 1.6rem;
  }

  &__title {
    font-size: clamp(1.6rem, 5vw, 2.25rem);
  }

  &__date {
    color: $ink-muted;
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin: 8px 0;
    padding: 0;
    list-style: none;
    text-align: left;

    li {
      display: flex;
      gap: 14px;
      padding: 16px;
      border: 1px solid $line;
      border-radius: $radius-md;
      background: $raised;
    }

    i {
      margin-top: 4px;
      color: $primary;
    }
  }

  :deep(.ghlcal__title) {
    font-size: 1.15rem;
  }
}
</style>
