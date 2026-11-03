// Modelo de cualificación del funnel: UNA sola fuente de verdad.
// Para un cliente nuevo solo se editan QUESTIONS, OBJETIVO y la regla de qualifies().
// Salen del cierre del VSL / de lo que el cliente define como "sí es cliente" (no inventar).
//
// Cada respuesta viaja a GHL como `<key>` (valor interno) y `<key>_label` (texto legible:
// es el que se mapea en los campos personalizados). Ver references/contrato-ghl.md de la skill.
// Los `value` son estables: si GHL ya está mapeado, NO renombrarlos (solo agregar).

export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  key: string
  title: string
  /** Etiqueta corta para la nota del CRM */
  noteLabel: string
  options: readonly QuestionOption[]
}

export const QUESTIONS = [
  {
    key: 'perfil',
    title: '[Pregunta 1: ¿Qué te describe mejor?]',
    noteLabel: 'Perfil',
    options: [
      { value: 'perfil_a', label: '[Perfil ideal A]' },
      { value: 'perfil_b', label: '[Perfil ideal B]' },
      { value: 'solo_info', label: '[Solo quiero informarme por ahora]' },
    ],
  },
  {
    key: 'situacion',
    title: '[Pregunta 2: ¿En qué punto estás hoy?]',
    noteLabel: 'Situación',
    options: [
      { value: 'empezando', label: '[Estoy empezando]' },
      { value: 'en_marcha', label: '[Ya lo hago y quiero crecer]' },
    ],
  },
  {
    key: 'inversion',
    title: '[Pregunta 3: ¿Cómo piensas invertir?]',
    noteLabel: 'Inversión',
    options: [
      { value: 'tengo_capital', label: '[Tengo el capital para invertir]' },
      { value: 'financiamiento', label: '[Con financiamiento o un socio]' },
      { value: 'sin_presupuesto', label: '[Por ahora no tengo cómo invertir]' },
    ],
  },
] as const satisfies readonly Question[]

/** Último paso: pregunta abierta (va a GHL como `objetivo`). */
export const OBJETIVO = {
  title: '[Pregunta abierta: ¿Qué quieres lograr?]',
  placeholder: '[Ejemplo de respuesta que oriente al lead]',
  minWords: 10,
}

export type QuestionKey = (typeof QUESTIONS)[number]['key']
export type Answers = Record<QuestionKey, string>

export const emptyAnswers = (): Answers =>
  Object.fromEntries(QUESTIONS.map((q) => [q.key, ''])) as Answers

export function labelFor(key: QuestionKey, value: string): string {
  const q = QUESTIONS.find((x) => x.key === key)
  return q?.options.find((o) => o.value === value)?.label ?? value
}

// ── Regla de cualificación ────────────────────────────────────────────────────
// Por defecto se descarta solo a quien viene "a informarse" o no tiene cómo invertir.
// El resto de respuestas no descalifica: sirven para preparar la reunión.
// Ajustar con el cliente (quién SÍ es cliente) y documentarlo en el CLAUDE.md del proyecto.
const DISQUALIFY: Partial<Record<QuestionKey, readonly string[]>> = {
  perfil: ['solo_info'],
  inversion: ['sin_presupuesto'],
}

export function qualifies(a: Answers): boolean {
  return (Object.keys(DISQUALIFY) as QuestionKey[]).every(
    (k) => !(DISQUALIFY[k] ?? []).includes(a[k]),
  )
}
