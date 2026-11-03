<script setup lang="ts">
import { BRAND_NAME, CLIENT } from '@/config/funnel'

defineProps<{ disclaimer?: string }>()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="wrap">
      <nav class="site-footer__links" aria-label="Redes y legal">
        <a v-if="CLIENT.instagram" :href="CLIENT.instagram" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-instagram" aria-hidden="true"></i> Instagram
        </a>
        <a v-if="CLIENT.facebook" :href="CLIENT.facebook" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-facebook" aria-hidden="true"></i> Facebook
        </a>
        <RouterLink to="/politicas-privacidad">Política de privacidad</RouterLink>
        <RouterLink to="/aviso-legal">Aviso legal</RouterLink>
      </nav>
      <p class="site-footer__copy">© {{ year }} {{ BRAND_NAME }}. Todos los derechos reservados.</p>
      <p v-if="disclaimer" class="site-footer__disclaimer">{{ disclaimer }}</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.site-footer {
  padding: 32px 0 calc(32px + env(safe-area-inset-bottom));
  border-top: 1px solid $line;
  color: $ink-muted;
  font-size: 0.85rem;
  text-align: center;

  &__links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 20px;
    margin-bottom: 12px;

    a {
      padding: 8px 0;
      color: $ink-muted;
      text-decoration: none;

      &:hover {
        color: $ink;
      }
    }
  }

  &__disclaimer {
    max-width: 640px;
    margin: 12px auto 0;
    font-size: 0.75rem;
  }
}
</style>
