<script setup lang="ts">
/**
 * Registro (paso 1). Envía a GHL (webhook contacto, etapa `registro`) con el contrato estándar y
 * dispara CompleteRegistration en Pixel + CAPI con el MISMO event_id.
 * Si la persona abandona con email o teléfono válido, se envía igual como `registro_parcial`.
 * Al terminar: /pago si PAYMENT_ENABLED, si no /ver-video (o se queda, con redirect=false).
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'
import { ASK_CITY, DEFAULT_COUNTRY, GHL_CONTACT_WEBHOOK, PAYMENT_ENABLED } from '@/config/funnel'
import { REGISTRO } from '@/content/copy'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { useContactStore } from '@/stores/contact'
import { sendCapiEvent } from '@/utils/capi'
import { buildPayload, fbq, generateEventId, postToGhl, type ContactoNota } from '@/utils/ghl'

const props = withDefaults(defineProps<{ open: boolean; redirect?: boolean }>(), { redirect: true })
const emit = defineEmits<{ (e: 'close'): void; (e: 'registered'): void }>()

const router = useRouter()
const contactStore = useContactStore()
const modalEl = ref<HTMLElement | null>(null)
useDialogFocus(modalEl, () => props.open, '#r-nombre')

// ── Países (LATAM primero) ────────────────────────────────────────────────────
const PRIORITY = ['EC', 'CO', 'PE', 'MX', 'AR', 'CL', 'VE', 'BO', 'PY', 'UY', 'GT', 'HN', 'SV', 'CR', 'PA', 'DO', 'US', 'ES']
const names = new Intl.DisplayNames(['es'], { type: 'region' })
const toCountry = (code: CountryCode) => ({
  code,
  name: names.of(code) ?? code,
  dial: `+${getCountryCallingCode(code)}`,
})
const all = getCountries()
const priority = PRIORITY.filter((c): c is CountryCode => all.includes(c as CountryCode)).map(
  (c) => toCountry(c as CountryCode),
)
const others = all
  .filter((c) => !PRIORITY.includes(c))
  .map(toCountry)
  .sort((a, b) => a.name.localeCompare(b.name, 'es'))

// ── Formulario ────────────────────────────────────────────────────────────────
const form = ref({
  nombre: '',
  apellido: '',
  email: '',
  country: DEFAULT_COUNTRY as CountryCode,
  phone: '',
  ciudad: '',
})
const touched = ref<Record<string, boolean>>({})
const submitting = ref(false)

const parsedPhone = computed(() => {
  const raw = form.value.phone.trim()
  if (!raw) return undefined
  return raw.startsWith('+')
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, form.value.country)
})
const phoneE164 = computed(() => (parsedPhone.value?.isValid() ? parsedPhone.value.format('E.164') : ''))
const countryName = computed(() => names.of(parsedPhone.value?.country ?? form.value.country) ?? '')

const errors = computed(() => {
  const e: Record<string, string> = {}
  const f = form.value
  if (f.nombre.trim().length < 2) e.nombre = 'Ingresa tu nombre'
  if (f.apellido.trim().length < 2) e.apellido = 'Ingresa tu apellido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Revisa tu correo'
  if (!phoneE164.value) e.phone = 'Número inválido para el país elegido'
  if (ASK_CITY && f.ciudad.trim().length < 2) e.ciudad = 'Ingresa tu ciudad'
  return e
})
const showError = (field: string) => (touched.value[field] ? errors.value[field] : '')

function contacto(): ContactoNota {
  const f = form.value
  const emailOk = !errors.value.email
  return {
    nombre: f.nombre.trim(),
    apellido: f.apellido.trim(),
    email: emailOk ? f.email.trim().toLowerCase() : '',
    telefono: phoneE164.value,
    pais: countryName.value,
    ...(ASK_CITY ? { ciudad: f.ciudad.trim() } : {}),
  }
}

// ── Captura parcial: al abandonar con email o teléfono válido ─────────────────
let completed = false
let lastPartialKey = ''

function capturePartial() {
  if (completed) return
  const c = contacto()
  if (!c.email && !c.telefono) return
  const key = Object.values(c).join('|')
  if (key === lastPartialKey) return
  lastPartialKey = key
  postToGhl(
    GHL_CONTACT_WEBHOOK,
    buildPayload('registro_parcial', c, {
      tags: ['step-1-registro-parcial'],
      titulo: '⏸️ REGISTRO INCOMPLETO (abandonó el formulario)',
    }),
  )
}

const onVisibility = () => document.visibilityState === 'hidden' && capturePartial()

// ── Envío ─────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  touched.value = { nombre: true, apellido: true, email: true, phone: true, ciudad: true }
  if (Object.keys(errors.value).length) {
    modalEl.value?.querySelector<HTMLElement>('.has-error input')?.focus()
    return
  }
  submitting.value = true
  completed = true

  const c = contacto()
  const eventId = generateEventId('registro')
  await postToGhl(
    GHL_CONTACT_WEBHOOK,
    buildPayload('registro', c, {
      tags: ['step-1-registro'],
      titulo: '📝 NUEVO REGISTRO',
      eventId,
      extra: { codigo_pais: `+${getCountryCallingCode(form.value.country)}` },
    }),
  )

  const custom = { content_name: 'registro' }
  fbq('track', 'CompleteRegistration', custom, { eventID: eventId })
  sendCapiEvent(
    'CompleteRegistration',
    eventId,
    { email: c.email, phone: c.telefono, firstName: c.nombre, lastName: c.apellido },
    custom,
  )

  contactStore.save({
    nombre: c.nombre ?? '',
    apellido: c.apellido ?? '',
    email: c.email ?? '',
    telefono: c.telefono ?? '',
    pais: c.pais ?? '',
    ciudad: c.ciudad ?? '',
  })
  submitting.value = false
  emit('registered')
  emit('close')
  if (props.redirect) router.push(PAYMENT_ENABLED ? '/pago' : '/ver-video')
}

// ── Apertura / cierre ─────────────────────────────────────────────────────────
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      // Reabrir ("Corregir mis datos") trae lo que ya había guardado
      const s = contactStore.get()
      if (s.email) {
        completed = false
        form.value.nombre = s.nombre
        form.value.apellido = s.apellido
        form.value.email = s.email
        form.value.ciudad = s.ciudad
        const p = s.telefono ? parsePhoneNumberFromString(s.telefono) : undefined
        if (p?.country) form.value.country = p.country
        form.value.phone = p ? p.formatNational() : ''
      }
    } else {
      capturePartial()
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', capturePartial)
  document.addEventListener('visibilitychange', onVisibility)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', capturePartial)
  document.removeEventListener('visibilitychange', onVisibility)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="r-title"
        @click.self="emit('close')"
      >
        <div ref="modalEl" class="modal">
          <button type="button" class="modal__close" aria-label="Cerrar" @click="emit('close')">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>

          <p class="eyebrow">{{ REGISTRO.eyebrow }}</p>
          <h2 id="r-title" class="modal__title">{{ REGISTRO.title }}</h2>
          <p class="modal__sub">{{ REGISTRO.sub }}</p>

          <form class="reg" novalidate @submit.prevent="handleSubmit">
            <div class="reg__row">
              <div class="field" :class="{ 'has-error': showError('nombre') }">
                <label for="r-nombre">Nombre</label>
                <input
                  id="r-nombre"
                  v-model="form.nombre"
                  data-field="nombre"
                  type="text"
                  autocomplete="given-name"
                  :aria-invalid="!!showError('nombre')"
                  aria-describedby="r-nombre-err"
                  @blur="touched.nombre = true"
                />
                <span id="r-nombre-err" class="field__error">{{ showError('nombre') }}</span>
              </div>
              <div class="field" :class="{ 'has-error': showError('apellido') }">
                <label for="r-apellido">Apellido</label>
                <input
                  id="r-apellido"
                  v-model="form.apellido"
                  data-field="apellido"
                  type="text"
                  autocomplete="family-name"
                  :aria-invalid="!!showError('apellido')"
                  aria-describedby="r-apellido-err"
                  @blur="touched.apellido = true"
                />
                <span id="r-apellido-err" class="field__error">{{ showError('apellido') }}</span>
              </div>
            </div>

            <div class="field" :class="{ 'has-error': showError('email') }">
              <label for="r-email">Correo electrónico</label>
              <input
                id="r-email"
                v-model="form.email"
                data-field="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                autocapitalize="off"
                :aria-invalid="!!showError('email')"
                aria-describedby="r-email-err"
                @blur="touched.email = true"
              />
              <span id="r-email-err" class="field__error">{{ showError('email') }}</span>
            </div>

            <div class="field" :class="{ 'has-error': showError('phone') }">
              <label for="r-phone">WhatsApp</label>
              <div class="reg__phone">
                <select v-model="form.country" data-field="pais" aria-label="País del teléfono">
                  <option v-for="c in priority" :key="c.code" :value="c.code">{{ c.dial }} {{ c.name }}</option>
                  <option disabled>──────────</option>
                  <option v-for="c in others" :key="c.code" :value="c.code">{{ c.dial }} {{ c.name }}</option>
                </select>
                <input
                  id="r-phone"
                  v-model="form.phone"
                  data-field="phone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel-national"
                  placeholder="99 999 9999"
                  :aria-invalid="!!showError('phone')"
                  aria-describedby="r-phone-err"
                  @blur="touched.phone = true"
                />
              </div>
              <span id="r-phone-err" class="field__error">{{ showError('phone') }}</span>
            </div>

            <div v-if="ASK_CITY" class="field" :class="{ 'has-error': showError('ciudad') }">
              <label for="r-ciudad">Ciudad</label>
              <input
                id="r-ciudad"
                v-model="form.ciudad"
                data-field="ciudad"
                type="text"
                autocomplete="address-level2"
                :aria-invalid="!!showError('ciudad')"
                aria-describedby="r-ciudad-err"
                @blur="touched.ciudad = true"
              />
              <span id="r-ciudad-err" class="field__error">{{ showError('ciudad') }}</span>
            </div>

            <button class="btn btn--lg btn--block" type="submit" :disabled="submitting">
              <i
                :class="submitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-play'"
                aria-hidden="true"
              ></i>
              {{ submitting ? 'Enviando…' : PAYMENT_ENABLED ? REGISTRO.submitPago : REGISTRO.submit }}
            </button>

            <p class="reg__legal">
              <i class="fa-solid fa-lock" aria-hidden="true"></i> {{ REGISTRO.legal }} ·
              <RouterLink to="/politicas-privacidad" target="_blank">Privacidad</RouterLink>
            </p>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.reg {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 380px) {
      grid-template-columns: 1fr;
    }
  }

  &__phone {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 8px;
  }

  .field__error:empty {
    display: none;
  }

  &__legal {
    color: $ink-muted;
    font-size: 0.8rem;
    text-align: center;

    a {
      color: inherit;
    }
  }
}
</style>
