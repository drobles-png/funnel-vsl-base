<script setup lang="ts">
// /agendar: calendario de GHL (GhlCalendar: alto automático, prefill y Schedule + etapa
// cita_agendada). Solo para quien calificó (en localhost se puede abrir directo para diseñar).
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GhlCalendar from '@/components/GhlCalendar.vue'
import StepShell from '@/components/StepShell.vue'
import { GHL_BOOKING_CALENDAR, IS_LOCAL, STORAGE_PREFIX } from '@/config/funnel'
import { BOOKING } from '@/content/copy'
import { useContactStore } from '@/stores/contact'

const router = useRouter()
const contact = useContactStore().get()

onMounted(() => {
  if (IS_LOCAL) return
  try {
    const q = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}_qualification`) ?? '{}')
    if (!q.califica) router.replace('/')
  } catch {
    router.replace('/')
  }
})
</script>

<template>
  <StepShell :step="BOOKING.step" wide>
    <section class="booking">
      <h1 class="booking__title">{{ BOOKING.title }}</h1>
      <p class="booking__sub">{{ BOOKING.sub }}</p>

      <GhlCalendar
        v-if="GHL_BOOKING_CALENDAR"
        :contacto="contact"
        @booked="router.push('/cita-confirmada')"
      />
      <div v-else class="booking__pending" role="status">
        <i class="fa-regular fa-calendar" aria-hidden="true"></i>
        <strong>Calendario en configuración</strong>
        <p>{{ BOOKING.pending }}</p>
      </div>
    </section>
  </StepShell>
</template>

<style scoped lang="scss">
.booking {
  text-align: center;

  &__title {
    font-size: clamp(1.6rem, 5vw, 2.25rem);
  }

  &__sub {
    max-width: 560px;
    margin: 10px auto 24px;
    color: $ink-muted;
  }

  &__pending {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 24px;
    border: 1px dashed $line;
    border-radius: $radius-md;
    background: $raised;

    i {
      color: $primary;
      font-size: 2rem;
    }

    p {
      max-width: 440px;
      color: $ink-muted;
    }
  }
}
</style>
