<script setup lang="ts">
// Logo neutro (wordmark de texto + marca SVG). Para un cliente: reemplazar el contenido por
// <img src="@/assets/logos/<cliente>-logo.webp" :alt="BRAND_NAME" /> (PNG/WebP con fondo transparente).
import { BRAND_NAME } from '@/config/funnel'

defineProps<{ light?: boolean }>()
</script>

<template>
  <span class="logo" :class="{ 'logo--light': light }" role="img" :aria-label="BRAND_NAME">
    <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect class="logo__bg" x="1" y="1" width="30" height="30" rx="8" />
      <rect x="9" y="9" width="14" height="14" rx="3" fill="none" class="logo__inner" stroke-width="3" />
    </svg>
    <span class="logo__text" aria-hidden="true">{{ BRAND_NAME }}</span>
  </span>
</template>

<style scoped lang="scss">
.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: $ink;

  &__mark {
    width: 28px;
    height: 28px;
  }
  &__bg {
    fill: $ink;
  }
  &__inner {
    stroke: $primary;
  }

  &__text {
    font-weight: 600;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
  }

  &--light {
    color: $ink-on-dark;
    .logo__bg {
      fill: $raised;
    }
  }
}
</style>
