<script setup lang="ts">
// Marco común de los pasos privados del funnel (/ver-video, /agendar, /cita-confirmada, …)
import BrandLogo from '@/components/BrandLogo.vue'
import SiteFooter from '@/components/SiteFooter.vue'

withDefaults(defineProps<{ step?: string; wide?: boolean }>(), { step: '', wide: false })
</script>

<template>
  <div class="shell">
    <header class="shell__head">
      <RouterLink to="/" class="shell__home" aria-label="Volver al inicio">
        <BrandLogo />
      </RouterLink>
      <p v-if="step" class="shell__step">{{ step }}</p>
    </header>
    <main class="shell__main" :class="{ 'shell__main--wide': wide }">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped lang="scss">
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 16px 8px;
  }

  &__home {
    text-decoration: none;
  }

  &__step {
    @include eyebrow;
    color: $ink-muted;
  }

  &__main {
    flex: 1;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 16px 16px 48px;

    &--wide {
      max-width: 880px;
    }
  }
}
</style>
