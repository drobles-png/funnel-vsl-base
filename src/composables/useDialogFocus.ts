import { nextTick, onUnmounted, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Foco accesible para modales: al abrir lleva el foco adentro, Tab/Shift+Tab
 * quedan atrapados en el modal y al cerrar el foco vuelve al botón que lo abrió.
 */
export function useDialogFocus(
  container: Ref<HTMLElement | null>,
  isOpen: () => boolean,
  initialSelector?: string,
) {
  let opener: HTMLElement | null = null

  const focusables = () =>
    Array.from(container.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !isOpen() || !container.value) return
    const items = focusables()
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (!container.value.contains(active)) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(isOpen, async (open) => {
    if (open) {
      opener = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      const initial = initialSelector
        ? container.value?.querySelector<HTMLElement>(initialSelector)
        : null
      ;(initial ?? focusables()[0])?.focus({ preventScroll: true })
    } else {
      document.removeEventListener('keydown', onKeydown)
      opener?.focus?.({ preventScroll: true })
      opener = null
    }
  })

  onUnmounted(() => document.removeEventListener('keydown', onKeydown))

  /** Enfoca el primer elemento que coincida dentro del modal (p. ej. al cambiar de paso). */
  const focusWithin = (selector: string): true | undefined => {
    const el = container.value?.querySelector<HTMLElement>(selector)
    if (!el) return undefined
    el.focus({ preventScroll: true })
    return true
  }

  return { focusWithin }
}
