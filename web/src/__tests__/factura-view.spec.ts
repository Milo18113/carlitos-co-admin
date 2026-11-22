import type { DOMWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor, ReglaNegocioError } from '@/services/errores'
import { baseMock } from '@/services/mocks/estado'
import { clientesMock } from '@/services/mocks/clientesMock'
import { facturasMock } from '@/services/mocks/facturasMock'
import { useReportesStore } from '@/stores/reportes'

import { botonConTexto, desmontarApp, montarApp, prepararMocks } from './montarApp'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

type App = Awaited<ReturnType<typeof montarFactura>>

beforeEach(() => prepararMocks('admin'))
afterEach(desmontarApp)

/** Monta `/facturas/nueva` y espera a que lleguen los clientes y los repuestos de los `<select>`. */
async function montarFactura() {
  const app = await montarApp('/facturas/nueva')
  await vi.waitFor(() =>
    expect(app.wrapper.findAll('#factura-cliente option').length).toBeGreaterThan(1),
  )
  await vi.waitFor(() =>
    expect(app.wrapper.findAll('[aria-label="Línea 1"] select option').length).toBeGreaterThan(1),
  )
  // Las formas de pago llegan aparte.
  await vi.waitFor(() =>
    expect(app.wrapper.findAll('#factura-forma option').length).toBeGreaterThan(1),
  )
  return app
}

/** Una línea del formulario (1, 2…): su `<select>` de repuesto, cantidad, descuento y botón de quitar. */
function linea(app: App, numero: number) {
  // Todo se busca al momento de usarlo: la línea 2, por ejemplo, no existe hasta que se agrega, y
  // el DOM cambia entre un `await` y otro.
  const grupo = () => app.wrapper.find(`[role="group"][aria-label="Línea ${numero}"]`)
  return {
    get existe() {
      return grupo().exists()
    },
    get repuesto() {
      return grupo().find('select')
    },
    get cantidad() {
      return grupo().findAll('input')[0] as DOMWrapper<HTMLInputElement>
    },
    get descuento() {
      return grupo().findAll('input')[1] as DOMWrapper<HTMLInputElement>
    },
    get quitar() {
      return grupo().find('button')
    },
    texto: () => grupo().text(),
  }
}

function resumen(app: App): string {
  return app.wrapper.find('aside[aria-label="Resumen de la factura"]').text()
}

async function enviar(app: App) {
  await app.wrapper.find('form').trigger('submit')
}

/** Una factura válida: cliente y una línea de 2 amortiguadores G7345 con 10 % de descuento. */
async function llenarFacturaValida(app: App) {
  await app.wrapper.find('#factura-cliente').setValue('1790012345001')
  const primera = linea(app, 1)
  await primera.repuesto.setValue('G7345')
  await primera.cantidad.setValue('2')
  await primera.descuento.setValue('10')
}

describe('/facturas/nueva · formulario', () => {
  it('arranca con una línea vacía, el total en cero y el IVA a la vista', async () => {
    const app = await montarFactura()

    expect(app.wrapper.find('.cc-topbar').text()).toContain('Nueva factura')
    expect(app.wrapper.text()).toContain('IVA del 15 %')
    expect(linea(app, 1).existe).toBe(true)
    expect(linea(app, 2).existe).toBe(false)
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 0,00')
  })

  it('ofrece a todos los clientes (el consumidor final también factura) y a los repuestos con su código', async () => {
    const app = await montarFactura()

    const clientes = app.wrapper.findAll('#factura-cliente option').map((o) => o.text())
    expect(clientes).toHaveLength(1 + 15)
    expect(clientes.some((texto) => texto.includes('CONSUMIDOR FINAL'))).toBe(true)
    const repuestos = linea(app, 1)
      .repuesto.findAll('option')
      .map((o) => o.text())
    expect(repuestos).toHaveLength(1 + 24)
    expect(repuestos.some((texto) => texto.startsWith('G7345 · Amortiguador delantero'))).toBe(true)
  })

  it('al elegir un repuesto muestra su precio', async () => {
    const app = await montarFactura()

    await linea(app, 1).repuesto.setValue('G7345')

    expect(linea(app, 1).texto()).toContain('Precio: $ 94,00')
  })

  it('calcula en vivo el valor de la línea y el resumen: subtotal, descuento, IVA y total', async () => {
    const app = await montarFactura()

    await llenarFacturaValida(app)

    expect(linea(app, 1).texto()).toContain('$ 169,20')
    const texto = resumen(app)
    expect(texto).toContain('$ 188,00') // subtotal
    expect(texto).toContain('-$ 18,80') // descuento
    expect(texto).toContain('IVA 15 %')
    expect(texto).toContain('$ 25,38')
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 194,58')
  })

  it('agregar un repuesto suma otra línea al total, y quitarla lo devuelve', async () => {
    const app = await montarFactura()
    await llenarFacturaValida(app)

    await botonConTexto(app.wrapper, 'Agregar repuesto').trigger('click')
    expect(linea(app, 2).existe).toBe(true)
    await linea(app, 2).repuesto.setValue('G8021') // $ 88,40
    await linea(app, 2).descuento.setValue('0')
    // (169,20 + 88,40) × 1,15 = 296,24
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 296,24')

    await linea(app, 2).quitar.trigger('click')

    expect(linea(app, 2).existe).toBe(false)
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 194,58')
  })

  it('no se puede quitar la única línea que queda', async () => {
    const app = await montarFactura()

    expect(linea(app, 1).quitar.attributes('disabled')).toBeDefined()
  })

  it('"Limpiar" deja el formulario vacío', async () => {
    const app = await montarFactura()
    await llenarFacturaValida(app)

    await botonConTexto(app.wrapper, 'Limpiar').trigger('click')

    expect((app.wrapper.find('#factura-cliente').element as HTMLSelectElement).value).toBe('')
    expect((linea(app, 1).repuesto.element as HTMLSelectElement).value).toBe('')
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 0,00')
  })
})

describe('/facturas/nueva · validación', () => {
  it('un formulario vacío muestra los errores y no llama al API', async () => {
    const emitir = vi.spyOn(facturasMock, 'emitir')
    const app = await montarFactura()

    await enviar(app)

    const texto = app.wrapper.text()
    expect(texto).toContain('Elige el cliente')
    expect(texto).toContain('Elige el repuesto')
    expect(emitir).not.toHaveBeenCalled()
  })

  it('el mismo repuesto en dos líneas se rechaza (la clave de tDetalleFactura es repuesto + factura)', async () => {
    const emitir = vi.spyOn(facturasMock, 'emitir')
    const app = await montarFactura()
    await llenarFacturaValida(app)
    await botonConTexto(app.wrapper, 'Agregar repuesto').trigger('click')
    await linea(app, 2).repuesto.setValue('G7345')

    await enviar(app)

    expect(linea(app, 2).texto()).toContain('Este repuesto ya está en otra línea')
    expect(emitir).not.toHaveBeenCalled()
  })

  it('una cantidad de 0 y un descuento de más de 100 se rechazan antes de enviar', async () => {
    const emitir = vi.spyOn(facturasMock, 'emitir')
    const app = await montarFactura()
    await llenarFacturaValida(app)
    await linea(app, 1).cantidad.setValue('0')
    await linea(app, 1).descuento.setValue('150')

    await enviar(app)

    expect(linea(app, 1).texto()).toContain('La cantidad debe ser un número entero mayor que 0')
    expect(linea(app, 1).texto()).toContain('El descuento va de 0 a 100')
    expect(emitir).not.toHaveBeenCalled()
  })
})

describe('/facturas/nueva · emitir (CU-09, propuesta)', () => {
  it('una factura a crédito se emite: toast con el número, formulario vacío y cuentas por cobrar actualizadas', async () => {
    const app = await montarFactura()
    const facturasAntes = baseMock.facturas.length
    await llenarFacturaValida(app)

    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'factura 001-001-000000126 emitida. Total: 194.58',
      ),
    )
    expect(app.wrapper.find('.toast').text()).toContain('Factura emitida')
    // El formulario queda listo para la siguiente factura.
    await vi.waitFor(() =>
      expect((app.wrapper.find('#factura-cliente').element as HTMLSelectElement).value).toBe(''),
    )
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 0,00')
    expect(baseMock.facturas).toHaveLength(facturasAntes + 1)
    // La factura nueva ya está en cuentas por cobrar, con todo su total como saldo.
    const reportes = useReportesStore(app.pinia)
    await reportes.cargar('cuentas-por-cobrar')
    expect(
      reportes.filasDe('cuentas-por-cobrar')?.find((f) => f.seriefactura === '001-001-000000126')
        ?.Saldo,
    ).toBe(194.58)
  })

  it('manda al API la cabecera, el IVA y las líneas, sin precios ni número (los decide el servidor)', async () => {
    const emitir = vi.spyOn(facturasMock, 'emitir')
    const app = await montarFactura()
    await llenarFacturaValida(app)

    await enviar(app)

    await vi.waitFor(() => expect(emitir).toHaveBeenCalledOnce())
    expect(emitir.mock.calls[0]?.[0]).toEqual({
      numero_identificacion: '1790012345001',
      porcentaje_iva: 15,
      forma_pago: null,
      lineas: [{ codigo_oe: 'G7345', cantidad: 2, porcentaje_descuento: 10 }],
    })
  })

  it('al contado, elegir una forma de pago registra además el pago y la factura no queda con saldo', async () => {
    const app = await montarFactura()
    const pagosAntes = baseMock.pagos.length
    await llenarFacturaValida(app)

    await app.wrapper.find('#factura-forma').setValue('01')
    expect(app.wrapper.text()).toContain('Se registra un pago por el total al emitir la factura.')
    await enviar(app)

    await vi.waitFor(() => expect(app.wrapper.find('.toast').text()).toContain('Pagada al contado'))
    expect(baseMock.pagos).toHaveLength(pagosAntes + 1)
    const reportes = useReportesStore(app.pinia)
    await reportes.cargar('cuentas-por-cobrar')
    expect(
      reportes.filasDe('cuentas-por-cobrar')?.some((f) => f.seriefactura === '001-001-000000126'),
    ).toBe(false)
  })

  it('sin forma de pago explica que la factura queda con saldo por cobrar', async () => {
    const app = await montarFactura()

    expect(app.wrapper.text()).toContain(
      'Sin forma de pago, la factura queda con saldo por cobrar.',
    )
  })

  it('si el servidor rechaza (422) el toast muestra su texto y el formulario conserva lo escrito', async () => {
    vi.spyOn(facturasMock, 'emitir').mockRejectedValueOnce(
      new ReglaNegocioError('el cliente 1790012345001 no existe'),
    )
    const app = await montarFactura()
    await llenarFacturaValida(app)

    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'el cliente 1790012345001 no existe',
      ),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain('No se pudo emitir la factura')
    expect((app.wrapper.find('#factura-cliente').element as HTMLSelectElement).value).toBe(
      '1790012345001',
    )
    expect(app.wrapper.find('[data-testid="total"]').text()).toBe('$ 194,58')
  })

  it('mientras emite, el botón queda deshabilitado', async () => {
    vi.spyOn(facturasMock, 'emitir').mockImplementationOnce(
      () => new Promise(() => undefined), // nunca responde
    )
    const app = await montarFactura()
    await llenarFacturaValida(app)

    await enviar(app)

    await vi.waitFor(() =>
      expect(botonConTexto(app.wrapper, 'Emitir factura').attributes('disabled')).toBeDefined(),
    )
  })
})

describe('/facturas/nueva · carga', () => {
  it('si no cargan los clientes muestra el error y "Reintentar" vuelve a pedirlos', async () => {
    vi.spyOn(clientesMock, 'listar').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const app = await montarApp('/facturas/nueva')

    await vi.waitFor(() => expect(app.wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(app.wrapper.find('[role="alert"]').text()).toContain('Sin conexión')

    await app.wrapper.find('[role="alert"] .btn-primary').trigger('click')

    await vi.waitFor(() =>
      expect(app.wrapper.findAll('#factura-cliente option').length).toBeGreaterThan(1),
    )
  })
})
