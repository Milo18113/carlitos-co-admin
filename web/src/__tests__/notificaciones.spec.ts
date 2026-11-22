import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotificacionesStore } from '@/stores/notificaciones'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.useRealTimers()
})

describe('store notificaciones', () => {
  it('un aviso de éxito se quita solo a los 5 segundos', () => {
    const notificaciones = useNotificacionesStore()

    notificaciones.exito('Cliente guardado')
    expect(notificaciones.items).toHaveLength(1)

    vi.advanceTimersByTime(4999)
    expect(notificaciones.items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(notificaciones.items).toHaveLength(0)
  })

  it('un error dura más que un éxito, para alcanzar a leerlo', () => {
    const notificaciones = useNotificacionesStore()

    notificaciones.error('No se puede eliminar', 'solo se eliminan pagos registrados hoy')
    vi.advanceTimersByTime(5000)
    expect(notificaciones.items).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(notificaciones.items).toHaveLength(0)
  })

  it('guarda el tipo, el título y el texto del procedure', () => {
    const notificaciones = useNotificacionesStore()

    notificaciones.error(
      'No se pudo registrar',
      'el pago de 600.00 supera el saldo pendiente de 592.35',
    )

    expect(notificaciones.items[0]).toMatchObject({
      tipo: 'error',
      titulo: 'No se pudo registrar',
      texto: 'el pago de 600.00 supera el saldo pendiente de 592.35',
    })
  })

  it('descartar quita solo la notificación indicada', () => {
    const notificaciones = useNotificacionesStore()
    const primera = notificaciones.info('Primera')
    notificaciones.info('Segunda')

    notificaciones.descartar(primera)

    expect(notificaciones.items.map((n) => n.titulo)).toEqual(['Segunda'])
  })

  it('con más de 4 en pantalla descarta las más viejas', () => {
    const notificaciones = useNotificacionesStore()

    for (let numero = 1; numero <= 6; numero++) notificaciones.info(`Aviso ${numero}`)

    expect(notificaciones.items.map((n) => n.titulo)).toEqual([
      'Aviso 3',
      'Aviso 4',
      'Aviso 5',
      'Aviso 6',
    ])
  })
})
