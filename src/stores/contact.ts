import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_PREFIX } from '@/config/funnel'

export interface Contact {
  nombre: string
  apellido: string
  email: string
  /** E.164: +593991112233 */
  telefono: string
  pais: string
  ciudad: string
  timestamp?: number
}

const STORAGE_KEY = `${STORAGE_PREFIX}_contact`
const empty = (): Contact => ({ nombre: '', apellido: '', email: '', telefono: '', pais: '', ciudad: '' })

export const useContactStore = defineStore('contact', () => {
  const contact = ref<Contact>(empty())

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) Object.assign(contact.value, JSON.parse(stored))
  } catch {
    /* ignorar */
  }

  function save(data: Partial<Contact>) {
    Object.assign(contact.value, data, { timestamp: Date.now() })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contact.value))
    } catch {
      /* ignorar */
    }
  }

  const get = (): Contact => ({ ...contact.value })
  const has = () => !!contact.value.email && !!contact.value.nombre

  return { contact, save, get, has }
})
