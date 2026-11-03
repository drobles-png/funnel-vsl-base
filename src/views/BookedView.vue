<script setup lang="ts">
// /cita-confirmada: solo si agendó en las últimas 24 h (GhlCalendar guarda <prefijo>_booked_at).
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StepShell from '@/components/StepShell.vue'
import { IS_LOCAL, STORAGE_PREFIX } from '@/config/funnel'
import { BOOKED } from '@/content/copy'
import { useContactStore } from '@/stores/contact'

const router = useRouter()
const nombre = useContactStore().get().nombre

onMounted(() => {
  const bookedAt = Number(localStorage.getItem(`${STORAGE_PREFIX}_booked_at`))
  const recent = bookedAt > 0 && Date.now() - bookedAt < 24 * 60 * 60 * 1000
  if (!IS_LOCAL && !recent) router.replace('/')
})
</script>

<template>
  <StepShell>
    <section class="done">
      <span class="done__badge" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
      <h1 class="done__title">{{ nombre ? `¡Listo, ${nombre}!` : '¡Listo!' }} {{ BOOKED.title }}</h1>
      <p class="done__sub">{{ BOOKED.sub }}</p>

      <ol class="done__steps" role="list">
        <li v-for="s in BOOKED.steps" :key="s.title">
          <i :class="s.icon" aria-hidden="true"></i>
          <div>
            <strong>{{ s.title }}</strong>
            <p>{{ s.text }}</p>
          </div>
        </li>
      </ol>
    </section>
  </StepShell>
</template>

<style scoped lang="scss">
.done {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__badge {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    border-radius: 50%;
    background: $primary-soft;
    color: $primary;
    font-size: 1.6rem;
  }

  &__title {
    font-size: clamp(1.6rem, 5vw, 2.25rem);
  }

  &__sub {
    margin: 10px 0 28px;
    color: $ink-muted;
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: left;

    li {
      display: flex;
      gap: 14px;
      padding: 18px;
      border: 1px solid $line;
      border-radius: $radius-md;
      background: $raised;
    }

    i {
      margin-top: 4px;
      color: $primary;
      font-size: 1.15rem;
    }

    p {
      color: $ink-muted;
      font-size: 0.9rem;
    }
  }
}
</style>
