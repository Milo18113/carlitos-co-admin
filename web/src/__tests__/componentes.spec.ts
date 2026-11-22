import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ChartCard from '@/components/common/ChartCard.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import DataTable from '@/components/common/DataTable.vue'
import KpiCard from '@/components/common/KpiCard.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import type { Notificacion } from '@/types/notificacion'
import type { ColumnaTabla } from '@/types/tabla'

interface Fila {
  id: number
  nombre: string
  total: number
  fecha: string
  nota: string | null
}

const columnas: ColumnaTabla<Fila>[] = [
  { clave: 'nombre', etiqueta: 'Cliente', principal: true },
  { clave: 'fecha', etiqueta: 'Fecha', formato: 'fecha' },
  { clave: 'total', etiqueta: 'Total', formato: 'moneda' },
  { clave: 'nota', etiqueta: 'Nota' },
]

const filas: Fila[] = [
  { id: 1, nombre: 'MECÁNICA DIESEL MANTA', fecha: '2026-11-18', total: 1240, nota: null },
  { id: 2, nombre: 'FLOTA QUITUMBE', fecha: '2026-11-19', total: 3865.5, nota: 'urgente' },
  { id: 3, nombre: 'TALLER EL PORTAL', fecha: '2026-11-20', total: 905.25, nota: null },
]

/** Espera un evento de Bootstrap (`shown.bs.modal`, `hidden.bs.modal`) en vez de adivinar tiempos. */
function esperarEvento(elemento: Element, evento: string): Promise<void> {
  return new Promise((resolver) => {
    elemento.addEventListener(evento, () => resolver(), { once: true })
  })
}

// `mount` infiere `T = object` en un componente genérico; la instanciación fija el tipo de la fila.
const TablaDeFilas = DataTable<Fila>

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DataTable', () => {
  it('muestra los encabezados y las celdas con su formato', () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas } })

    expect(tabla.findAll('thead th').map((th) => th.text())).toEqual([
      'Cliente',
      'Fecha',
      'Total',
      'Nota',
    ])
    const primera = tabla.findAll('tbody tr')[0]?.findAll('td') ?? []
    expect(primera.map((td) => td.text())).toEqual([
      'MECÁNICA DIESEL MANTA',
      '18 nov 2026',
      '$ 1.240,00',
      '—',
    ])
  })

  it('alinea a la derecha las cifras y deja el texto a la izquierda', () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas } })

    const encabezados = tabla.findAll('thead th')
    expect(encabezados[2]?.classes()).toContain('text-end')
    expect(encabezados[0]?.classes()).not.toContain('text-end')
    const celdas = tabla.findAll('tbody tr')[0]?.findAll('td') ?? []
    expect(celdas[2]?.classes()).toEqual(expect.arrayContaining(['text-end', 'tabular']))
    expect(celdas[0]?.classes()).toContain('cc-cell-main')
  })

  it('las fechas y las columnas marcadas `sinSaltos` no se parten en varias líneas', () => {
    const conSinSaltos: ColumnaTabla<Fila>[] = [
      { clave: 'nombre', etiqueta: 'Cliente' },
      { clave: 'fecha', etiqueta: 'Fecha', formato: 'fecha' },
      { clave: 'nota', etiqueta: 'Nota', sinSaltos: true },
    ]
    const tabla = mount(TablaDeFilas, { props: { columnas: conSinSaltos, filas } })

    const celdas = tabla.findAll('tbody tr')[0]?.findAll('td') ?? []

    expect(celdas[0]?.classes()).not.toContain('text-nowrap')
    expect(celdas[1]?.classes()).toContain('text-nowrap')
    expect(celdas[2]?.classes()).toContain('text-nowrap')
  })

  it('una columna de acciones lleva su encabezado solo para lectores de pantalla y no entra al buscador', async () => {
    const conAcciones: ColumnaTabla<Fila>[] = [
      { clave: 'nombre', etiqueta: 'Cliente' },
      { clave: 'nota', etiqueta: 'Acciones', acciones: true },
    ]
    const tabla = mount(TablaDeFilas, { props: { columnas: conAcciones, filas } })

    const encabezado = tabla.findAll('thead th')[1]
    expect(encabezado?.find('.visually-hidden').text()).toBe('Acciones')
    expect(encabezado?.classes()).toContain('text-end')
    expect(tabla.findAll('tbody tr')[0]?.findAll('td')[1]?.classes()).toContain('text-end')

    // La celda vacía se muestra como "—": buscar esa raya no puede traer todas las filas.
    await tabla.find('input[type="search"]').setValue('—')
    expect(tabla.findAll('tbody tr')).toHaveLength(0)
  })

  it('solo las filas clicables llevan la clase que las distingue al pasar el mouse', () => {
    const comun = mount(TablaDeFilas, { props: { columnas, filas } })
    const clicable = mount(TablaDeFilas, { props: { columnas, filas, seleccionable: true } })

    expect(comun.find('tbody tr').classes()).not.toContain('cc-row-selectable')
    expect(clicable.find('tbody tr').classes()).toContain('cc-row-selectable')
  })

  it('filtra sin importar mayúsculas ni tildes y cuenta lo que muestra', async () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas } })

    await tabla.find('input[type="search"]').setValue('mecanica')

    expect(tabla.findAll('tbody tr')).toHaveLength(1)
    expect(tabla.text()).toContain('Mostrando 1 de 3 registros')
    expect(tabla.emitted('update:filtro')?.[0]).toEqual(['mecanica'])
  })

  it('también filtra por el valor ya formateado de la celda', async () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas } })

    await tabla.find('input[type="search"]').setValue('3.865')

    expect(tabla.findAll('tbody tr')).toHaveLength(1)
    expect(tabla.text()).toContain('FLOTA QUITUMBE')
  })

  it('sin coincidencias avisa y deja limpiar la búsqueda', async () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas } })
    await tabla.find('input[type="search"]').setValue('zzz')

    expect(tabla.text()).toContain('Sin resultados')
    expect(tabla.findAll('tbody tr')).toHaveLength(0)

    await tabla.find('.cc-empty .btn').trigger('click')
    expect(tabla.findAll('tbody tr')).toHaveLength(3)
  })

  it('sin filas muestra el estado vacío con el texto indicado', () => {
    const tabla = mount(TablaDeFilas, {
      props: { columnas, filas: [], textoVacio: 'Esta factura todavía no tiene pagos.' },
    })

    expect(tabla.find('.cc-empty').text()).toContain('Esta factura todavía no tiene pagos.')
    expect(tabla.find('.cc-table-foot').exists()).toBe(false)
  })

  it('mientras carga muestra 5 filas de skeleton y no los datos', () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas, cargando: true } })

    expect(tabla.findAll('tbody tr')).toHaveLength(5)
    expect(tabla.findAll('.placeholder').length).toBeGreaterThan(0)
    expect(tabla.text()).not.toContain('FLOTA QUITUMBE')
    expect(tabla.attributes('aria-busy')).toBe('true')
  })

  it('emite `seleccionar` con la fila al hacer clic, solo si es seleccionable', async () => {
    const seleccionable = mount(TablaDeFilas, { props: { columnas, filas, seleccionable: true } })
    await seleccionable.findAll('tbody tr')[1]?.trigger('click')
    expect(seleccionable.emitted('seleccionar')?.[0]).toEqual([filas[1]])

    const comun = mount(TablaDeFilas, { props: { columnas, filas } })
    await comun.findAll('tbody tr')[1]?.trigger('click')
    expect(comun.emitted('seleccionar')).toBeUndefined()
  })

  it('se puede seleccionar con el teclado (Enter)', async () => {
    const tabla = mount(TablaDeFilas, { props: { columnas, filas, seleccionable: true } })
    const fila = tabla.findAll('tbody tr')[0]

    expect(fila?.attributes('tabindex')).toBe('0')
    await fila?.trigger('keydown.enter')

    expect(tabla.emitted('seleccionar')?.[0]).toEqual([filas[0]])
  })

  it('deja reemplazar una celda con el slot de su columna', () => {
    const tabla = mount(TablaDeFilas, {
      props: { columnas, filas },
      slots: {
        'celda-total':
          '<template #celda-total="{ valor }"><b class="a-medida">{{ valor }}</b></template>',
      },
    })

    expect(tabla.findAll('.a-medida').map((celda) => celda.text())).toEqual([
      '1240',
      '3865.5',
      '905.25',
    ])
  })
})

describe('KpiCard', () => {
  it('muestra el título, la cifra y el detalle', () => {
    const kpi = mount(KpiCard, {
      props: { titulo: 'Saldo por cobrar', valor: '$ 35.966,40', detalle: '22 facturas con saldo' },
    })

    expect(kpi.find('.cc-kpi__label').text()).toBe('Saldo por cobrar')
    expect(kpi.find('.cc-kpi__value').text()).toBe('$ 35.966,40')
    expect(kpi.find('.cc-kpi__hint').text()).toBe('22 facturas con saldo')
  })

  it('sin valor muestra una raya, y cargando muestra el skeleton sin la cifra', () => {
    const sinDato = mount(KpiCard, { props: { titulo: 'X', valor: null } })
    expect(sinDato.find('.cc-kpi__value').text()).toBe('—')

    const cargando = mount(KpiCard, { props: { titulo: 'X', valor: '$ 1,00', cargando: true } })
    expect(cargando.find('.placeholder').exists()).toBe(true)
    expect(cargando.text()).not.toContain('$ 1,00')
  })
})

describe('ChartCard', () => {
  it('dibuja la leyenda HTML con el color de cada serie y deja el gráfico en el slot', () => {
    const tarjeta = mount(ChartCard, {
      props: {
        titulo: 'Venta por marca',
        subtitulo: 'Miles de USD',
        leyenda: [
          { etiqueta: 'Frenos', color: 'rgb(0, 91, 138)' },
          { etiqueta: 'Filtros', color: 'rgb(191, 135, 58)' },
        ],
      },
      slots: { default: '<canvas class="el-grafico"></canvas>' },
    })

    expect(tarjeta.find('.cc-chart-card__title').text()).toBe('Venta por marca')
    expect(tarjeta.findAll('.cc-legend__item').map((item) => item.text())).toEqual([
      'Frenos',
      'Filtros',
    ])
    expect(tarjeta.find('.cc-legend__dot').attributes('style')).toContain('--dot: rgb(0, 91, 138)')
    expect(tarjeta.find('.cc-chart-card__plot .el-grafico').exists()).toBe(true)
  })

  it('una sola serie va sin leyenda', () => {
    const tarjeta = mount(ChartCard, { props: { titulo: 'Valor por bodega' } })

    expect(tarjeta.find('.cc-legend').exists()).toBe(false)
  })
})

describe('ToastHost', () => {
  const notificaciones: Notificacion[] = [
    { id: 1, tipo: 'exito', titulo: 'Cliente guardado', texto: 'cliente TALLER registrado' },
    { id: 2, tipo: 'error', titulo: 'No se pudo registrar' },
    { id: 3, tipo: 'info', titulo: 'Reporte listo' },
  ]

  it('cada tipo lleva su estilo, su ícono y su rol de accesibilidad', () => {
    const host = mount(ToastHost, { props: { notificaciones } })
    const toasts = host.findAll('.toast')

    expect(toasts.map((toast) => toast.classes())).toEqual([
      expect.arrayContaining(['cc-toast--success']),
      expect.arrayContaining(['cc-toast--danger']),
      expect.arrayContaining(['cc-toast--info']),
    ])
    expect(toasts.map((toast) => toast.attributes('role'))).toEqual(['status', 'alert', 'status'])
    expect(toasts[0]?.find('.bi-check-circle').exists()).toBe(true)
    expect(toasts[1]?.find('.bi-x-circle').exists()).toBe(true)
  })

  it('muestra el texto solo si lo hay', () => {
    const host = mount(ToastHost, { props: { notificaciones } })
    const toasts = host.findAll('.toast')

    expect(toasts[0]?.find('.cc-toast__text').text()).toBe('cliente TALLER registrado')
    expect(toasts[1]?.find('.cc-toast__text').exists()).toBe(false)
  })

  it('la X emite `descartar` con el id de esa notificación', async () => {
    const host = mount(ToastHost, { props: { notificaciones } })

    await host.findAll('.btn-close')[1]?.trigger('click')

    expect(host.emitted('descartar')?.[0]).toEqual([2])
  })
})

describe('ConfirmDialog', () => {
  // Bootstrap cierra el modal de forma asíncrona y la clase `modal-open` es del body, que se
  // comparte entre pruebas: se espera a que quede limpio para que una prueba no pise a la siguiente.
  afterEach(async () => {
    await vi.waitFor(() => {
      if (document.body.classList.contains('modal-open')) throw new Error('el body sigue bloqueado')
    })
  })

  // `teleport: true` deja el modal dentro del wrapper en vez de moverlo al body.
  const global = { stubs: { teleport: true } }
  const props = {
    abierto: false,
    titulo: '¿Eliminar este pago?',
    mensaje: 'Se eliminará el pago PAG-0017 de $ 300,00.',
  }

  it('muestra la pregunta, la consecuencia y los dos botones', () => {
    const dialogo = mount(ConfirmDialog, { props, global })

    expect(dialogo.find('h2').text()).toBe('¿Eliminar este pago?')
    expect(dialogo.text()).toContain('Se eliminará el pago PAG-0017 de $ 300,00.')
    expect(dialogo.findAll('.modal-footer .btn').map((boton) => boton.text())).toEqual([
      'Cancelar',
      'Eliminar',
    ])
  })

  it('el título del modal es el nombre accesible del diálogo', () => {
    const dialogo = mount(ConfirmDialog, { props, global })

    const idTitulo = dialogo.find('h2').attributes('id')
    expect(idTitulo).toBeTruthy()
    expect(dialogo.find('.modal').attributes('aria-labelledby')).toBe(idTitulo)
  })

  it('confirmar y cancelar son eventos, no efectos: el componente no decide nada', async () => {
    const dialogo = mount(ConfirmDialog, { props, global })

    await dialogo.find('.btn-danger').trigger('click')
    await dialogo.find('.btn-neutral').trigger('click')

    expect(dialogo.emitted('confirmar')).toHaveLength(1)
    expect(dialogo.emitted('cancelar')).toHaveLength(1)
  })

  it('mientras procesa deshabilita los dos botones y muestra el spinner', () => {
    const dialogo = mount(ConfirmDialog, { props: { ...props, procesando: true }, global })

    const botones = dialogo.findAll('.modal-footer .btn')
    expect(botones.every((boton) => boton.attributes('disabled') !== undefined)).toBe(true)
    expect(dialogo.find('.spinner-border').exists()).toBe(true)
  })

  it('al pasar `abierto` a true Bootstrap muestra el modal', async () => {
    const dialogo = mount(ConfirmDialog, { props, global, attachTo: document.body })
    // Se guarda el elemento antes de abrir: Bootstrap lo reubica en el DOM al mostrarlo.
    const modal = dialogo.find('.modal').element

    await dialogo.setProps({ abierto: true })
    await esperarEvento(modal, 'shown.bs.modal')

    expect(modal.classList.contains('show')).toBe(true)
    dialogo.unmount()
  })

  it('Esc lo cierra por su cuenta y avisa con `cancelar` para que el padre se entere', async () => {
    const dialogo = mount(ConfirmDialog, {
      props: { ...props, abierto: true },
      global,
      attachTo: document.body,
    })
    const modal = dialogo.find('.modal').element
    await esperarEvento(modal, 'shown.bs.modal')

    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    await vi.waitFor(() => expect(dialogo.emitted('cancelar')).toHaveLength(1))
    dialogo.unmount()
  })

  it('si el padre lo cierra (abierto=false) no emite `cancelar`', async () => {
    const dialogo = mount(ConfirmDialog, {
      props: { ...props, abierto: true },
      global,
      attachTo: document.body,
    })
    const modal = dialogo.find('.modal').element
    await esperarEvento(modal, 'shown.bs.modal')

    await dialogo.setProps({ abierto: false })
    await esperarEvento(modal, 'hidden.bs.modal')

    expect(dialogo.emitted('cancelar')).toBeUndefined()
    dialogo.unmount()
  })

  it('si el padre pide cerrar mientras se abre, termina cerrado (Bootstrap ignora el hide a mitad de la animación)', async () => {
    const dialogo = mount(ConfirmDialog, { props, global, attachTo: document.body })
    const modal = dialogo.find('.modal').element

    await dialogo.setProps({ abierto: true })
    await dialogo.setProps({ abierto: false })

    await vi.waitFor(() => expect(document.querySelector('.modal-backdrop')).toBeNull())
    expect(modal.classList.contains('show')).toBe(false)
    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(dialogo.emitted('cancelar')).toBeUndefined()
    dialogo.unmount()
  })

  it('si el padre vuelve a pedir abrir mientras se cierra, termina abierto', async () => {
    const dialogo = mount(ConfirmDialog, {
      props: { ...props, abierto: true },
      global,
      attachTo: document.body,
    })
    const modal = dialogo.find('.modal').element
    await esperarEvento(modal, 'shown.bs.modal')

    await dialogo.setProps({ abierto: false })
    await dialogo.setProps({ abierto: true })

    await vi.waitFor(() => expect(modal.classList.contains('show')).toBe(true))
    expect(dialogo.emitted('cancelar')).toBeUndefined()
    dialogo.unmount()
  })

  it('si se desmonta con el diálogo abierto no deja el fondo oscuro ni el scroll bloqueado', async () => {
    const dialogo = mount(ConfirmDialog, {
      props: { ...props, abierto: true },
      global,
      attachTo: document.body,
    })
    // Es el caso de "volver atrás con el modal abierto": primero tiene que haber terminado de abrirse.
    await esperarEvento(dialogo.find('.modal').element, 'shown.bs.modal')
    expect(document.body.classList.contains('modal-open')).toBe(true)

    dialogo.unmount()

    await vi.waitFor(() => expect(document.querySelector('.modal-backdrop')).toBeNull())
    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(document.querySelector('.modal')).toBeNull()
  })

  it('si se desmonta mientras todavía se está abriendo tampoco deja residuos ni lanza errores', async () => {
    const dialogo = mount(ConfirmDialog, {
      props: { ...props, abierto: true },
      global,
      attachTo: document.body,
    })

    dialogo.unmount() // inmediatamente, sin esperar a que termine la animación

    await vi.waitFor(() => expect(document.querySelector('.modal-backdrop')).toBeNull())
    expect(document.body.classList.contains('modal-open')).toBe(false)
    expect(document.querySelector('.modal')).toBeNull()
  })
})
