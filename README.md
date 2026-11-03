# funnel-vsl-base

Base neutra para los funnels VSL de Bakano: landing → registro → video → cualificación → agenda en
el calendario de GoHighLevel, con pago opcional. Vue 3 + Vite + TypeScript, webhooks de GHL con
contrato estándar, Meta Pixel + Conversions API deduplicados y deploy en Vercel.

Es la implementación de la skill `funnel-vsl-bakano` (`~/.claude/skills/funnel-vsl-bakano`).
No tiene contenido de ningún cliente: todo texto entre `[corchetes]` es un marcador.

## Empezar un cliente

```bash
gh repo clone drobles-png/funnel-vsl-base <cliente>-landing
cd <cliente>-landing
rm -rf .git && git init -b main
git config user.name "David Robles" && git config user.email "drobles@bakano.ec"
pnpm install
pnpm dev            # http://localhost:5173 (pnpm dev --host para probar en el celular)
```

Luego, en este orden:

| Qué | Dónde |
|---|---|
| Cliente, pixel, webhooks, calendario, Wistia, pago, legales, `STORAGE_PREFIX`, `FUNNEL_TAG` | `src/config/funnel.ts` |
| Todos los textos (solo lo que dice el VSL; no inventar) | `src/content/copy.ts` |
| Preguntas de cualificación y regla `qualifies()` | `src/utils/qualification.ts` |
| Colores y tipografía | `src/styles/tokens.scss` (+ link de fuentes en `index.html`) |
| Logo | `src/components/BrandLogo.vue` (cambiar por `<img>`), `public/favicon.svg` |
| Título/OG iniciales, og:image | `index.html` |
| Token de CAPI | `.env.local` y env vars de Vercel (ver `.env.example`) |

Valor vacío = esa integración no envía nada y la página sigue funcionando (el video muestra un
marcador y `/agendar` dice "Calendario en configuración").

## Flujos

```
Agenda (por defecto)
/                 landing + RegistrationModal ─ GHL contacto (registro) · CompleteRegistration
/ver-video        VSL + CTA bloqueado N s → QualificationModal ─ GHL cualificación · Lead (si califica)
  ├ califica    → /agendar (GhlCalendar) → /cita-confirmada ─ GHL contacto (cita_agendada) · Schedule
  └ no califica → /sin-espacio (cooldown 24 h)

Pago (PAYMENT_ENABLED = true)
/ → registro → /pago (InitiateCheckout · pago-iniciado) → pasarela
  → /inscripcion-confirmada (Purchase · pagado, 1 vez por dispositivo) → calendario opcional
```

Con `PAYMENT_ENABLED = false` las rutas `/pago` e `/inscripcion-confirmada` no existen.

## Contrato con GHL (resumen)

Todos los envíos pasan por `buildPayload` / `trackStage` / `postToGhl` (`src/utils/ghl.ts`):
`nombre, apellido, email, telefono (E.164), pais, etapa, tags, nota = notas, event_id, timestamp,
url_pagina, fbclid, fbc, fbp, utm_*`. La cualificación agrega `califica` (bool), `resultado`
(`CALIFICA`/`NO_CALIFICA`), cada respuesta y su `*_label`, y `objetivo`.
Etapas: `registro`, `registro_parcial`, `cualificacion`, `cita_agendada`, `pago-iniciado`, `pagado`.
El `event_id` es el mismo que va al Pixel y a CAPI. Detalle y tabla de mapeo: `references/contrato-ghl.md` de la skill.

## Probar

```bash
pnpm type-check && pnpm build
# con pnpm dev corriendo; modo stub: nada sale a GHL ni a Meta
python ~/.claude/skills/funnel-vsl-bakano/scripts/e2e_funnel.py --base http://localhost:5173 --steps e2e/agenda.json --mode stub
python ~/.claude/skills/funnel-vsl-bakano/scripts/e2e_funnel.py --base http://localhost:5173 --steps e2e/pago.json --mode stub   # con PAYMENT_ENABLED = true
```

- `e2e/*.json` usan los `data-field` / `data-cta` y los `value` de las opciones de cualificación:
  si cambias las preguntas, actualiza los `value` en `e2e/agenda.json`.
- El paso `booking_complete` necesita el iframe real del calendario de GHL (con la URL vacía o falsa no hay frame).
- En localhost el Pixel no carga y CAPI se omite: para ver la paridad de `event_id` usa la IP de la red
  (`pnpm dev --host` → `--base http://192.168.x.x:5173`) con `CTA_UNLOCK_SECONDS = 0` temporal.
- Modos `ghl` y `full` (escriben en el CRM y el pixel del cliente): solo en producción y con permiso.

## Deploy (Vercel)

`vercel.json` ya trae framework, build y el rewrite SPA que excluye `/api/`. `api/capi.ts` es la
función serverless de CAPI. Env vars en Production y Preview: `META_PIXEL_ID`, `META_CAPI_TOKEN`
(nunca con prefijo `VITE_`). `META_CAPI_TEST_EVENT_CODE` solo mientras se usa el Probador de eventos.
Repo público en `drobles-png`, proyecto en el equipo `bakano-proyects`. Ver `references/deploy.md`.
Este repo es la plantilla: no tiene proyecto de Vercel propio.
