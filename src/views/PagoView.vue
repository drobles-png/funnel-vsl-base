<script setup lang="ts">
// /pago (solo si PAYMENT_ENABLED): resumen + botón a la pasarela. InitiateCheckout (Pixel + CAPI)
// y etapa `pago-iniciado` en GHL con el mismo event_id. Sin PAYMENT_URL: WhatsApp de respaldo.
// El router exige contacto guardado (en localhost se puede abrir directo para diseñar).
import { computed, onMounted } from 'vue'
import StepShell from '@/components/StepShell.vue'
import {
  CLIENT,
  CURRENCY,
  PAYMENT_URL,
  PRICE,
  PRODUCT_NAME,
  eventDateLabel,
  priceLabel,
  whatsappLink,
} from '@/config/funnel'
import { PAGO } from '@/content/copy'
import { useContactStore } from '@/stores/contact'
import { sendCapiEvent } from '@/utils/capi'
import { fbq, generateEventId, trackStage } from '@/utils/ghl'

const c = useContactStore().get()
const product = PRODUCT_NAME || '[Nombre del producto o evento]'

// Prellena la pasarela con los datos del registro (si la pasarela acepta estos parámetros)
const payHref = computed(() => {
  if (!PAYMENT_URL) return ''
  const url = new URL(PAYMENT_URL)
  if (c.email) url.searchParams.set('email', c.email)
  if (c.nombre) url.searchParams.set('name', `${c.nombre} ${c.apellido}`.trim())
  if (c.telefono) url.searchParams.set('phone', c.telefono)
  return url.toString()
})
const waHref = whatsappLink(PAGO.whatsappMsg(`${c.nombre} ${c.apellido}`.trim()))

onMounted(() => {
  const eventId = generateEventId('checkout')
  const custom = { content_name: product, value: PRICE, currency: CURRENCY }
  fbq('track', 'InitiateCheckout', custom, { eventID: eventId })
  sendCapiEvent(
    'InitiateCheckout',
    eventId,
    { email: c.email, phone: c.telefono, firstName: c.nombre, lastName: c.apellido },
    custom,
  )
  trackStage('pago-iniciado', c, {
    tags: ['step-3-pago-iniciado'],
    titulo: '💳 PAGO INICIADO',
    detalle: {
      Total: priceLabel(),
      Pasarela: PAYMENT_URL ? 'Enlace de pago' : 'Sin enlace: se cobra por WhatsApp/correo',
    },
    eventId,
  })
})
</script>

<template>
  <StepShell :step="PAGO.step">
    <section class="pago">
      <h1 class="pago__title">{{ c.nombre ? `${c.nombre}, te` : 'Te' }} {{ PAGO.title }}</h1>
      <p class="pago__sub">{{ PAGO.sub }}</p>

      <div class="summary">
        <strong class="summary__name">{{ product }}</strong>
        <ul role="list">
          <li><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ eventDateLabel() }}</li>
          <li v-for="b in PAGO.bullets" :key="b"><i class="fa-solid fa-check" aria-hidden="true"></i> {{ b }}</li>
        </ul>
        <div class="summary__total">
          <span>Total</span>
          <strong>{{ priceLabel() }}</strong>
        </div>
      </div>

      <a v-if="payHref" :href="payHref" class="btn btn--lg btn--block">
        <i class="fa-solid fa-lock" aria-hidden="true"></i> Pagar {{ priceLabel() }} de forma segura
      </a>
      <template v-else>
        <p class="pago__notice" role="status">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i> {{ PAGO.noLink }}
        </p>
        <a v-if="waHref" :href="waHref" target="_blank" rel="noopener" class="btn btn--lg btn--block">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Pagar por WhatsApp
        </a>
        <a v-else-if="CLIENT.instagram" :href="CLIENT.instagram" target="_blank" rel="noopener" class="btn btn--ghost btn--block">
          <i class="fa-brands fa-instagram" aria-hidden="true"></i> Escríbenos por Instagram
        </a>
      </template>

      <RouterLink :to="{ path: '/', query: { editar: '1' } }" class="pago__edit">
        <i class="fa-solid fa-pen" aria-hidden="true"></i> Corregir mis datos
      </RouterLink>
    </section>
  </StepShell>
</template>

<style scoped lang="scss">
.pago {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    font-size: clamp(1.5rem, 5vw, 2rem);
    text-align: center;
  }

  &__sub {
    color: $ink-muted;
    text-align: center;
  }

  &__notice {
    display: flex;
    gap: 10px;
    padding: 14px;
    border-radius: $radius-md;
    background: $primary-soft;
    font-size: 0.9rem;

    i {
      margin-top: 4px;
      color: $primary;
    }
  }

  &__edit {
    align-self: center;
    padding: 8px;
    color: $ink-muted;
    font-size: 0.875rem;
  }
}

.summary {
  padding: 20px;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: $raised;

  &__name {
    font-size: 1.1rem;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 14px 0;
    padding: 0;
    list-style: none;
    color: $ink-muted;
    font-size: 0.9rem;
  }

  i {
    width: 18px;
    color: $primary;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 1px solid $line;

    strong {
      font-family: $font-mono;
      font-size: 1.15rem;
    }
  }
}
</style>
