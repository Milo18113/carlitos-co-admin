import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor, ReglaNegocioError } from '@/services/errores'
import { baseMock } from '@/services/mocks/estado'
import { repuestosMock } from '@/services/mocks/repuestosMock'
import { useReportesStore } from '@/stores/reportes'

import { botonConTexto, desmontarApp, filasDeDatos, montarApp, prepararMocks } from './montarApp'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

type App = Awaited<ReturnType<typeof montarRepuestos>>

beforeEach(() => prepararMocks('vendedor'))
afterEach(desmontarApp)

/** Monta `/repuestos` y espera la lista, el stock y los catálogos. */
async function montarRepuestos() {
  const app = await montarApp('/repuestos')
  await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(24))
  // Con la marca ya por nombre y el stock calculado, los catálogos y el reporte ya llegaron.
  await vi.waitFor(() => expect(app.wrapper.text()).toContain('Monroe'))
  await vi.waitFor(() => expect(celdasDe(app, 'G7345')[6]).toBe('9'))
  return app
}

/** El texto de cada celda de la fila de ese repuesto. */
function celdasDe(app: App, codigo: string): string[] {
  const fila = app.wrapper.findAll('tbody tr').find((tr) => tr.find('td').text() === codigo)
  return fila?.findAll('td').map((td) => td.text()) ?? []
}

async function abrirIngreso(app: App) {
  await botonConTexto(app.wrapper, 'Ingresar repuesto').trigger('click')
  await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
}

async function abrirTraslado(app: App) {
  await botonConTexto(app.wrapper, 'Trasladar entre bodegas').trigger('click')
  await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
}

async function llenar(app: App, campos: Record<string, string>) {
  for (const [id, valor] of Object.entries(campos)) {
    await app.wrapper.find(`#${id}`).setValue(valor)
  }
}

async function enviar(app: App) {
  await app.wrapper.find('.cc-sidepanel form').trigger('submit')
}

describe('/repuestos · lista', () => {
  it('muestra los repuestos con marca y categoría por nombre, su stock total y su estado', async () => {
    const app = await montarRepuestos()

    const celdas = celdasDe(app, 'G7345')

    expect(celdas[1]).toBe('Amortiguador delantero Hilux 4x4')
    expect(celdas[2]).toBe('Monroe')
    expect(celdas[3]).toBe('Suspensión')
    expect(celdas[4]).toBe('$ 94,00')
    expect(celdas[5]).toBe('4')
    expect(celdas[6]).toBe('9')
    expect(celdas[7]).toContain('Disponible')
  })

  it('un repuesto por debajo de su stock mínimo sale como "Stock bajo" y sin unidades como "Sin stock"', async () => {
    // G7345 tiene stock mínimo 4: con 2 unidades está bajo. DR-3210 queda sin inventario.
    const g7345 = baseMock.inventario.find((fila) => fila.tProducto_codigo_oe === 'G7345')
    if (g7345) g7345.cantidad = 2
    baseMock.inventario = baseMock.inventario.filter(
      (fila) => fila.tProducto_codigo_oe !== 'DR-3210',
    )
    const app = await montarApp('/repuestos')

    await vi.waitFor(() => expect(celdasDe(app, 'G7345')[6]).toBe('2'))
    expect(celdasDe(app, 'G7345')[7]).toContain('Stock bajo')
    expect(celdasDe(app, 'DR-3210')[6]).toBe('0')
    expect(celdasDe(app, 'DR-3210')[7]).toContain('Sin stock')
  })

  it('cada fila tiene botones de ingresar y de trasladar con nombre accesible', async () => {
    const app = await montarRepuestos()

    expect(app.wrapper.find('[aria-label="Ingresar stock de G7345"]').exists()).toBe(true)
    expect(app.wrapper.find('[aria-label="Trasladar G7345 entre bodegas"]').exists()).toBe(true)
  })

  it('los botones de las filas son los de ícono pequeño (btn-icon btn-sm)', async () => {
    const app = await montarRepuestos()

    const boton = app.wrapper.find('[aria-label="Ingresar stock de G7345"]')

    expect(boton.classes()).toEqual(
      expect.arrayContaining(['btn', 'btn-neutral', 'btn-icon', 'btn-sm']),
    )
  })

  it('el buscador ignora la columna de botones y filtra por lo que se ve', async () => {
    const app = await montarRepuestos()

    await app.wrapper.find('input[type="search"]').setValue('monroe')

    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(2))
  })

  it('si falla la carga muestra el error con "Reintentar"', async () => {
    vi.spyOn(repuestosMock, 'listar').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const app = await montarApp('/repuestos')

    await vi.waitFor(() => expect(app.wrapper.find('[role="alert"]').exists()).toBe(true))
    await app.wrapper.find('[role="alert"] .btn-primary').trigger('click')

    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(24))
  })
})

describe('/repuestos · ingresar (CU-07)', () => {
  it('un formulario vacío muestra los errores y no llama al API', async () => {
    const ingresar = vi.spyOn(repuestosMock, 'ingresar')
    const app = await montarRepuestos()
    await abrirIngreso(app)

    await enviar(app)

    const panel = app.wrapper.find('.cc-sidepanel').text()
    expect(panel).toContain('Escribe el código OE')
    expect(panel).toContain('Escribe la descripción')
    expect(panel).toContain('Elige la marca')
    expect(panel).toContain('Elige la bodega')
    expect(panel).toContain('La cantidad debe ser un número entero mayor que 0')
    expect(ingresar).not.toHaveBeenCalled()
  })

  it('un precio con más de 2 decimales se rechaza antes de enviar', async () => {
    const app = await montarRepuestos()
    await abrirIngreso(app)

    await llenar(app, { 'repuesto-codigo': 'NUEVO-001', 'repuesto-precio': '12,345' })
    await enviar(app)

    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('El precio admite hasta 2 decimales')
  })

  it('un repuesto nuevo se crea: toast con el mensaje, panel cerrado, y la lista y el stock se actualizan', async () => {
    const app = await montarRepuestos()
    const reportes = useReportesStore(app.pinia)
    await reportes.cargar('bodegas')
    await abrirIngreso(app)

    await llenar(app, {
      'repuesto-codigo': 'NUEVO-001',
      'repuesto-descripcion': 'Filtro de prueba',
      'repuesto-precio': '12,50',
      'repuesto-stock-minimo': '3',
      'repuesto-marca': 'TOY',
      'repuesto-categoria': 'FIL',
      'repuesto-bodega': 'B1',
      'repuesto-cantidad': '10',
      'repuesto-ubicacion': 'Z-01-1',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'repuesto nuevo creado. Stock de NUEVO-001 en B1: 10',
      ),
    )
    expect(app.wrapper.find('.toast').text()).toContain('Repuesto ingresado')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(25))
    await vi.waitFor(() => expect(celdasDe(app, 'NUEVO-001')[6]).toBe('10'))
    expect(celdasDe(app, 'NUEVO-001')[2]).toBe('Toyota')
    // Cambió el stock: los reportes cacheados ya no sirven.
    expect(reportes.filasDe('bodegas')).toBeUndefined()
  })

  it('un código que ya existe solo suma stock: no pide sus datos y avisa que no cambian', async () => {
    const app = await montarRepuestos()
    await abrirIngreso(app)

    // En minúsculas: la base compara los códigos sin distinguir mayúsculas.
    await app.wrapper.find('#repuesto-codigo').setValue('g7345')

    expect(app.wrapper.find('.cc-sidepanel .alert-info').text()).toContain(
      'Este repuesto ya existe',
    )
    expect(app.wrapper.find('.cc-sidepanel .alert-info').text()).toContain(
      'Amortiguador delantero Hilux 4x4',
    )
    expect(app.wrapper.find('#repuesto-descripcion').exists()).toBe(false)
    expect(app.wrapper.find('#repuesto-precio').exists()).toBe(false)
    expect(app.wrapper.find('#repuesto-marca').exists()).toBe(false)
  })

  it('al sumar stock a uno existente usa su código real y no crea un duplicado', async () => {
    const app = await montarRepuestos()
    await abrirIngreso(app)

    await llenar(app, {
      'repuesto-codigo': 'g7345',
      'repuesto-bodega': 'B1',
      'repuesto-cantidad': '10',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'el repuesto ya existia (solo se sumo stock). Stock de G7345 en B1: 19',
      ),
    )
    await vi.waitFor(() => expect(celdasDe(app, 'G7345')[6]).toBe('19'))
    expect(filasDeDatos(app.wrapper)).toBe(24)
  })

  it('el botón de una fila abre el formulario con ese repuesto ya elegido y bloqueado', async () => {
    const app = await montarRepuestos()

    await app.wrapper.find('[aria-label="Ingresar stock de G7345"]').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())

    const codigo = app.wrapper.find('#repuesto-codigo').element as HTMLInputElement
    expect(codigo.value).toBe('G7345')
    expect(codigo.disabled).toBe(true)
    expect(app.wrapper.find('.cc-sidepanel .alert-info').exists()).toBe(true)
  })

  it('si la base rechaza (422) el toast muestra su texto y el panel sigue abierto', async () => {
    const app = await montarRepuestos()
    await abrirIngreso(app)

    await llenar(app, {
      'repuesto-codigo': 'G7345',
      'repuesto-bodega': 'B1',
      'repuesto-cantidad': '5',
    })
    // Desde este formulario no se puede provocar un rechazo real (los `<select>` solo ofrecen bodegas
    // que existen), así que se simula el 422 que daría `ingresar_repuesto`.
    vi.spyOn(repuestosMock, 'ingresar').mockRejectedValueOnce(
      new ReglaNegocioError('la bodega B9 no existe'),
    )
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain('la bodega B9 no existe'),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
      'No se pudo ingresar el repuesto',
    )
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
    expect((app.wrapper.find('#repuesto-cantidad').element as HTMLInputElement).value).toBe('5')
  })
})

describe('/repuestos · trasladar (CU-08)', () => {
  /** Elige el repuesto y espera a que se ofrezcan las bodegas que lo tienen. */
  async function elegirRepuesto(app: App, codigo: string, bodegasEsperadas: number) {
    await app.wrapper.find('#traslado-codigo').setValue(codigo)
    await vi.waitFor(() =>
      expect(app.wrapper.findAll('#traslado-origen option')).toHaveLength(bodegasEsperadas + 1),
    )
  }

  it('el origen solo ofrece las bodegas que tienen el repuesto, y dice cuánto hay', async () => {
    const app = await montarRepuestos()
    await abrirTraslado(app)

    // G7345 solo está en la Bodega Central (B1) con 9 unidades.
    await elegirRepuesto(app, 'G7345', 1)
    await app.wrapper.find('#traslado-origen').setValue('B1')

    const origenes = app.wrapper.findAll('#traslado-origen option').map((o) => o.text())
    expect(origenes).toEqual(['Elige la bodega', 'Bodega Central'])
    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('Hay 9 unidades en esta bodega')
  })

  it('el destino no ofrece la bodega de origen', async () => {
    const app = await montarRepuestos()
    await abrirTraslado(app)
    await elegirRepuesto(app, 'G7345', 1)

    await app.wrapper.find('#traslado-origen').setValue('B1')

    const destinos = app.wrapper.findAll('#traslado-destino option').map((o) => o.text())
    expect(destinos).not.toContain('Bodega Central')
    expect(destinos).toContain('Bodega Norte')
  })

  it('un formulario vacío muestra los errores y no llama al API', async () => {
    const trasladar = vi.spyOn(repuestosMock, 'trasladar')
    const app = await montarRepuestos()
    await abrirTraslado(app)

    await enviar(app)

    const panel = app.wrapper.find('.cc-sidepanel').text()
    expect(panel).toContain('Elige el repuesto')
    expect(panel).toContain('Elige la bodega de origen')
    expect(panel).toContain('Elige la bodega de destino')
    expect(trasladar).not.toHaveBeenCalled()
  })

  it('un traslado válido sale bien: toast con el resultado, panel cerrado y reportes invalidados', async () => {
    const app = await montarRepuestos()
    const reportes = useReportesStore(app.pinia)
    await reportes.cargar('bodegas')
    await abrirTraslado(app)
    await elegirRepuesto(app, 'G7345', 1)

    await llenar(app, {
      'traslado-origen': 'B1',
      'traslado-destino': 'B2',
      'traslado-cantidad': '4',
      'traslado-ubicacion': 'C-09-1',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain('Quedan 5 en B1 y 4 en B2'),
    )
    expect(app.wrapper.find('.toast').text()).toContain('Traslado registrado')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    expect(reportes.filasDe('bodegas')).toBeUndefined()
    // El stock total del repuesto no cambia: solo se movió de bodega.
    expect(celdasDe(app, 'G7345')[6]).toBe('9')
  })

  it('pedir más unidades de las que hay lo rechaza la base: toast con su texto y el panel sigue abierto', async () => {
    const app = await montarRepuestos()
    await abrirTraslado(app)
    await elegirRepuesto(app, 'G7345', 1)

    await llenar(app, {
      'traslado-origen': 'B1',
      'traslado-destino': 'B2',
      'traslado-cantidad': '10',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'la bodega B1 solo tiene 9 unidad(es) de G7345',
      ),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
      'No se pudo trasladar el repuesto',
    )
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
    expect((app.wrapper.find('#traslado-cantidad').element as HTMLInputElement).value).toBe('10')
  })

  it('el botón de una fila abre el traslado con ese repuesto ya elegido y bloqueado', async () => {
    const app = await montarRepuestos()

    await app.wrapper.find('[aria-label="Trasladar G7345 entre bodegas"]').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())

    const repuesto = app.wrapper.find('#traslado-codigo').element as HTMLSelectElement
    expect(repuesto.value).toBe('G7345')
    expect(repuesto.disabled).toBe(true)
  })

  it('abrir el traslado cierra el formulario de ingreso: solo hay un panel a la vez', async () => {
    const app = await montarRepuestos()
    await abrirIngreso(app)

    await botonConTexto(app.wrapper, 'Trasladar entre bodegas').trigger('click')

    await vi.waitFor(() => expect(document.querySelectorAll('.cc-sidepanel')).toHaveLength(1))
    expect(document.querySelector('.cc-sidepanel__title')?.textContent).toBe(
      'Trasladar entre bodegas',
    )
  })
})
