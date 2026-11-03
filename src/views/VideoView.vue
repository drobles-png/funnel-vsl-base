<script setup lang="ts">
// /ver-video: VSL completo + CTA bloqueado CTA_UNLOCK_SECONDS (3 s en localhost) que abre la
// cualificación. Sin contacto guardado (llegó directo), pide el registro antes del video.
import { onMounted, onUnmounted, ref } from 'vue'
import QualificationModal from '@/components/QualificationModal.vue'
import RegistrationModal from '@/components/RegistrationModal.vue'
import StepShell from '@/components/StepShell.vue'
import WistiaVideo from '@/components/WistiaVideo.vue'
import { CTA_UNLOCK_SECONDS, IS_LOCAL } from '@/config/funnel'
import { VIDEO } from '@/content/copy'
import { useContactStore } from '@/stores/contact'
import { sendCapiEvent } from '@/utils/capi'
import { captureFbParams } from '@/utils/fbclid'
import { fbq, generateEventId } from '@/utils/ghl'

const contactStore = useContactStore()
const registerOpen = ref(false)
const qualifyOpen = ref(false)

const secondsLeft = ref(IS_LOCAL ? Math.min(CTA_UNLOCK_SECONDS, 3) : CTA_UNLOCK_SECONDS)
const unlocked = ref(secondsLeft.value <= 0)
let timer: ReturnType<typeof setInterval> | undefined

const clock = () => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function startTimer() {
  if (unlocked.value) return
  timer = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) {
      unlocked.value = true
      clearInterval(timer)
    }
  }, 1000)
}

function trackViewContent() {
  const c = contactStore.get()
  const eventId = generateEventId('view_video')
  const custom = { content_name: 'video-vsl' }
  fbq('track', 'ViewContent', custom, { eventID: eventId })
  sendCapiEvent(
    'ViewContent',
    eventId,
    { email: c.email, phone: c.telefono, firstName: c.nombre, lastName: c.apellido },
    custom,
  )
}

const needsContact = () => !IS_LOCAL && !contactStore.has()

// Sin contacto, el CTA reabre el registro (si cerró el modal no queda atascado)
function onCta() {
  if (needsContact()) registerOpen.value = true
  else qualifyOpen.value = true
}

onMounted(() => {
  captureFbParams()
  startTimer()
  if (needsContact()) registerOpen.value = true
  else trackViewContent()
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <StepShell :step="VIDEO.step" wide>
    <section class="vv">
      <p class="eyebrow">{{ VIDEO.eyebrow }}</p>
      <h1 class="vv__title">{{ VIDEO.title }}</h1>
      <p class="vv__sub">{{ VIDEO.sub }}</p>

      <WistiaVideo class="vv__video" />

      <div class="vv__cta">
        <p v-if="!unlocked" class="vv__lock">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
          {{ VIDEO.lockText }} <strong>{{ clock() }}</strong>
        </p>
        <button
          type="button"
          class="btn btn--lg btn--block"
          data-cta="calificar"
          :disabled="!unlocked"
          @click="onCta"
        >
          <i :class="unlocked ? 'fa-regular fa-calendar-check' : 'fa-solid fa-lock'" aria-hidden="true"></i>
          {{ VIDEO.cta }}
        </button>
        <p class="vv__trust">{{ VIDEO.trust }}</p>
      </div>
    </section>

    <QualificationModal :open="qualifyOpen" @close="qualifyOpen = false" />
    <RegistrationModal
      :open="registerOpen"
      :redirect="false"
      @registered="trackViewContent"
      @close="registerOpen = false"
    />
  </StepShell>
</template>

<style scoped lang="scss">
.vv {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__title {
    margin: 8px 0 10px;
    font-size: clamp(1.6rem, 5vw, 2.5rem);
  }

  &__sub {
    max-width: 560px;
    margin-bottom: 24px;
    color: $ink-muted;
  }

  &__video {
    width: 100%;
  }

  &__cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 440px;
    margin-top: 28px;
  }

  &__lock {
    color: $ink-muted;
    font-size: 0.9rem;

    strong {
      font-family: $font-mono;
      color: $ink;
    }
  }

  &__trust {
    color: $ink-muted;
    font-size: 0.8rem;
  }
}
</style>
