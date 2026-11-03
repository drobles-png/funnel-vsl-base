<script setup lang="ts">
import BrandLogo from '@/components/BrandLogo.vue'
import SiteFooter from '@/components/SiteFooter.vue'

defineProps<{ title: string; updated: string }>()
</script>

<template>
  <div class="legal">
    <header class="legal__top">
      <RouterLink to="/" aria-label="Volver al inicio"><BrandLogo /></RouterLink>
    </header>
    <main class="legal__main">
      <h1 class="legal__title">{{ title }}</h1>
      <p class="legal__updated">Última actualización: {{ updated }}</p>
      <div class="legal__body"><slot /></div>
      <RouterLink to="/" class="legal__back">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver al inicio
      </RouterLink>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped lang="scss">
.legal {
  &__top {
    padding: 24px 16px;
    text-align: center;

    a {
      text-decoration: none;
    }
  }

  &__main {
    max-width: 720px;
    margin: 0 auto;
    padding: 16px 16px 64px;
  }

  &__title {
    font-size: clamp(1.75rem, 5vw, 2.5rem);
  }

  &__updated {
    margin: 8px 0 32px;
    color: $ink-muted;
    font-size: 0.875rem;
  }

  &__body {
    :deep(h2) {
      margin: 32px 0 12px;
      font-size: 1.25rem;
    }
    :deep(p),
    :deep(li) {
      color: $ink-muted;
    }
    :deep(p) {
      margin-bottom: 12px;
    }
    :deep(ul) {
      padding-left: 20px;
    }
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 40px;
    text-decoration: none;
  }
}
</style>
