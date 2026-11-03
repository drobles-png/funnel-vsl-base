import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * Meta Pixel: lee META_PIXEL_ID de src/config/funnel.ts (única fuente) y lo inyecta en index.html.
 * - Vacío → no se inyecta nada (la página funciona sin pixel).
 * - El snippet no carga en localhost/127.0.0.1 (las pruebas locales no ensucian el dataset).
 * - El PageView de las navegaciones SPA lo manda el router (solo desde la 2.ª navegación).
 */
function metaPixel(): Plugin {
  const configFile = fileURLToPath(new URL('./src/config/funnel.ts', import.meta.url))
  return {
    name: 'meta-pixel',
    transformIndexHtml() {
      const src = readFileSync(configFile, 'utf8')
      const id = src.match(/export const META_PIXEL_ID\s*=\s*['"](\d*)['"]/)?.[1] ?? ''
      if (!id) return []
      return [
        {
          tag: 'script',
          injectTo: 'head',
          children: `if (!/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) {
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
}`,
        },
        {
          tag: 'noscript',
          injectTo: 'body-prepend',
          children: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1" alt="" />`,
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Web component de Wistia: no tratarlo como componente Vue
          isCustomElement: (tag) => tag === 'wistia-player',
        },
      },
    }),
    vueDevTools(),
    metaPixel(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/tokens.scss" as *;\n`,
      },
    },
  },
})
