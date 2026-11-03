<script setup lang="ts">
// Datos del titular: LEGAL en src/config/funnel.ts. Vacío = "[Pendiente]" visible (no pautar así).
import LegalLayout from '@/components/LegalLayout.vue'
import { BRAND_NAME, LEGAL, SITE_URL } from '@/config/funnel'

const v = (x: string) => x || '[Pendiente]'
const site = SITE_URL || window.location.origin
</script>

<template>
  <LegalLayout title="Aviso legal" updated="[mes y año]">
    <h2>1. Titular del sitio</h2>
    <ul>
      <li><strong>Razón social:</strong> {{ v(LEGAL.razonSocial) }}</li>
      <li><strong>RUC:</strong> {{ v(LEGAL.ruc) }}</li>
      <li><strong>Ciudad:</strong> {{ v(LEGAL.ciudad) }}</li>
      <li><strong>Correo de contacto:</strong> {{ v(LEGAL.email) }}</li>
    </ul>

    <h2>2. Objeto</h2>
    <p>
      El sitio <strong>{{ site }}</strong> informa sobre [qué ofrece {{ BRAND_NAME }}] y permite
      registrarse y agendar una reunión con su equipo.
    </p>

    <h2>3. Uso del sitio</h2>
    <p>
      Al usar el sitio te comprometes a darnos información real y a no usarlo para fines ilícitos o
      que perjudiquen a {{ BRAND_NAME }} o a terceros.
    </p>

    <h2>4. Sobre los resultados</h2>
    <p>
      La información del sitio y del video es orientativa. Los resultados dependen de cada caso.
      {{ BRAND_NAME }} no garantiza ingresos ni resultados específicos.
    </p>

    <h2>5. Propiedad intelectual</h2>
    <p>
      Los textos, videos, logotipos y diseño del sitio son de {{ BRAND_NAME }} o se usan con
      autorización. Las marcas de terceros pertenecen a sus respectivos titulares.
    </p>

    <h2>6. Enlaces a terceros</h2>
    <p>
      El sitio puede enlazar a redes sociales u otros sitios. {{ BRAND_NAME }} no se hace responsable
      de su contenido ni de sus políticas.
    </p>

    <h2>7. Ley aplicable</h2>
    <p>
      Este aviso se rige por las leyes de la República del Ecuador. Cualquier controversia se
      someterá a los jueces competentes del domicilio del titular.
    </p>
  </LegalLayout>
</template>
