<script setup lang="ts">
// Datos del responsable: LEGAL en src/config/funnel.ts. Vacío = "[Pendiente]" visible (no pautar así).
import LegalLayout from '@/components/LegalLayout.vue'
import { BRAND_NAME, LEGAL, SITE_URL } from '@/config/funnel'

const v = (x: string) => x || '[Pendiente]'
const site = SITE_URL || window.location.origin
</script>

<template>
  <LegalLayout title="Política de privacidad" updated="[mes y año]">
    <p>
      En {{ BRAND_NAME }} cuidamos tus datos personales. Aquí te explicamos qué datos recogemos en
      <strong>{{ site }}</strong> (el "sitio"), para qué los usamos y cómo puedes ejercer tus derechos,
      conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).
    </p>

    <h2>1. Responsable del tratamiento</h2>
    <ul>
      <li><strong>Razón social:</strong> {{ v(LEGAL.razonSocial) }}</li>
      <li><strong>RUC:</strong> {{ v(LEGAL.ruc) }}</li>
      <li><strong>Ciudad:</strong> {{ v(LEGAL.ciudad) }}</li>
      <li><strong>Correo de contacto:</strong> {{ v(LEGAL.email) }}</li>
    </ul>

    <h2>2. Qué datos recogemos</h2>
    <ul>
      <li>Nombre y apellido.</li>
      <li>Correo electrónico y número de teléfono o WhatsApp.</li>
      <li>Las respuestas que nos das sobre tu caso en los formularios del sitio.</li>
      <li>Datos de navegación y de campañas (cookies del Pixel de Meta, identificadores de anuncio y parámetros UTM).</li>
    </ul>

    <h2>3. Para qué los usamos</h2>
    <ul>
      <li>Mostrarte el contenido que pediste y contactarte para agendar o preparar tu reunión.</li>
      <li>Enviarte información relacionada con lo que nos pediste.</li>
      <li>Medir y mejorar nuestras campañas publicitarias.</li>
    </ul>
    <p>
      La base legal es tu consentimiento, que nos das al enviar los formularios del sitio. Puedes
      retirarlo cuando quieras.
    </p>

    <h2>4. Con quién los compartimos</h2>
    <p>
      No vendemos tus datos. Los compartimos solo con proveedores que nos ayudan a operar: nuestro
      CRM para gestionar contactos y citas, Meta Platforms para medir campañas y el proveedor de
      alojamiento del sitio. Estos proveedores pueden estar fuera de Ecuador y tratan los datos con
      medidas de seguridad adecuadas.
    </p>

    <h2>5. Cuánto tiempo los guardamos</h2>
    <p>
      Mientras sean necesarios para atender tu solicitud y mantener la relación comercial, o hasta
      que nos pidas eliminarlos, salvo que la ley exija conservarlos más tiempo.
    </p>

    <h2>6. Tus derechos</h2>
    <p>
      Puedes pedir acceso, rectificación, actualización, eliminación, oposición, portabilidad o
      suspensión del tratamiento de tus datos escribiéndonos a <strong>{{ v(LEGAL.email) }}</strong>.
      Te responderemos en los plazos que establece la LOPDP.
    </p>

    <h2>7. Cookies</h2>
    <p>
      Usamos el Pixel de Meta y el almacenamiento local del navegador para recordar tu avance en el
      sitio y medir campañas. Puedes borrarlos o bloquearlos desde la configuración de tu navegador.
    </p>

    <h2>8. Cambios</h2>
    <p>Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha.</p>
  </LegalLayout>
</template>
