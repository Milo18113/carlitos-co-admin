import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor } from '@/services/errores'
import { baseMock } from '@/services/mocks/estado'
import { pagosMock } from '@/services/mocks/pagosMock'
import { useReportesStore } from '@/stores/reportes'

import {
  botonConTexto,
  desmontarApp,
  dialogoAbierto,
  filasDeDatos,
  montarApp,
  prepararMocks,
  pulsarEnElDialogo,
} from './montarApp'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

type App = Awaited<ReturnType<typeof montarPagos>>

// 19 pagos en las fixtures; 3 son de hoy (PAG-0017 a PAG-0019) y se pueden eliminar.
let totalPagos = 0

beforeEach(async () => {
  await prepararMocks('vendedor')
  totalPagos = baseMock.pagos.length
})
afterEach(desmontarApp)

/** Monta `/pagos` y espera la lista y el catálogo de formas de pago. */
async function montarPagos() {
  const app = await montarApp('/pagos')
  await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(totalPagos))
  // Con la forma de pago ya por nombre, el catálogo llegó.
  await vi.waitFor(() => expect(app.wrapper.text()).toContain('Transferencia'))
  return app
}

function filaDe(app: App, codigo: string) {
  return app.wrapper.findAll('tbody tr').find((tr) => tr.find('td').text() === codigo)
}

async function abrirRegistro(app: App) {
  await botonConTexto(app.wrapper, 'Registrar pago').trigger('click')
  await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
  // Las facturas con saldo llegan del reporte: la lista de opciones tiene que estar completa.
  await vi.waitFor(() =>
    expect(app.wrapper.findAll('#pago-factura option').length).toBeGreaterThan(1),
  )
}

async function llenar(app: App, campos: Record<string, string>) {
  for (const [id, valor] of Object.entries(campos)) {
    await app.wrapper.find(`#${id}`).setValue(valor)
  }
}

async function enviar(app: App) {
  await app.wrapper.find('.cc-sidepanel form').trigger('submit')
}

async function pedirEliminar(app: App, codigo: string) {
  await app.wrapper.find(`[aria-label="Eliminar el pago ${codigo}"]`).trigger('click')
  await vi.waitFor(() => expect(dialogoAbierto()).not.toBeNull())
}

describe('/pagos · lista', () => {
  it('muestra los pagos con los más recientes primero, la forma de pago por nombre y el monto formateado', async () => {
    const app = await montarPagos()

    const primera = app.wrapper.find('tbody tr').findAll('td')
    // PAG-0019 es de hoy, igual que 0017 y 0018: entre los de hoy, el código más alto va primero.
    expect(primera[0]?.text()).toBe('PAG-0019')
    expect(primera[3]?.text()).toBe('Tarjeta de débito')
    expect(primera[5]?.text()).toBe('$ 100,00')
  })

  it('cada fila tiene un botón de eliminar de ícono pequeño con nombre accesible', async () => {
    const app = await montarPagos()

    const boton = app.wrapper.find('[aria-label="Eliminar el pago PAG-0001"]')

    expect(boton.exists()).toBe(true)
    expect(boton.classes()).toEqual(
      expect.arrayContaining(['btn', 'btn-neutral', 'btn-icon', 'btn-sm', 'text-danger']),
    )
  })

  it('el buscador filtra por factura', async () => {
    const app = await montarPagos()

    await app.wrapper.find('input[type="search"]').setValue('000000122')

    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(1))
    expect(app.wrapper.find('tbody tr').text()).toContain('PAG-0017')
  })

  it('si la carga falla muestra el error con "Reintentar"', async () => {
    vi.spyOn(pagosMock, 'listar').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const app = await montarApp('/pagos')

    await vi.waitFor(() => expect(app.wrapper.find('[role="alert"]').exists()).toBe(true))
    await app.wrapper.find('[role="alert"] .btn-primary').trigger('click')

    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(totalPagos))
  })
})

describe('/pagos · registrar (CU-10)', () => {
  it('ofrece solo las facturas con saldo pendiente, con su saldo a la vista', async () => {
    const app = await montarPagos()

    await abrirRegistro(app)

    const opciones = app.wrapper.findAll('#pago-factura option').map((opcion) => opcion.text())
    // 25 facturas en las fixtures; 3 están pagadas por completo (101, 105 y 112).
    expect(opciones).toHaveLength(1 + 22)
    expect(
      opciones.some((texto) => texto.includes('001-001-000000102') && texto.includes('$ 592,35')),
    ).toBe(true)
    expect(opciones.join(' ')).not.toContain('001-001-000000101')
  })

  it('al elegir una factura muestra su saldo y permite pagarlo completo', async () => {
    const app = await montarPagos()
    await abrirRegistro(app)

    await app.wrapper.find('#pago-factura').setValue('001-001-000000102')

    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('Saldo pendiente: $ 592,35')
    await botonConTexto(app.wrapper, 'Pagar el saldo completo').trigger('click')
    expect((app.wrapper.find('#pago-monto').element as HTMLInputElement).value).toBe('592,35')
  })

  it('el código del pago viene precargado y se puede cambiar', async () => {
    const app = await montarPagos()
    await abrirRegistro(app)

    const codigo = app.wrapper.find('#pago-codigo').element as HTMLInputElement

    expect(codigo.value).toMatch(/^PAG-\d{8}-\d{6}$/)
  })

  it('un formulario vacío muestra los errores y no llama al API', async () => {
    const registrar = vi.spyOn(pagosMock, 'registrar')
    const app = await montarPagos()
    await abrirRegistro(app)

    await enviar(app)

    const panel = app.wrapper.find('.cc-sidepanel').text()
    expect(panel).toContain('Elige la factura')
    expect(panel).toContain('El monto debe ser un número mayor que 0')
    expect(panel).toContain('Elige la forma de pago')
    expect(registrar).not.toHaveBeenCalled()
  })

  it('un pago válido sale bien: toast con el saldo restante, panel cerrado, lista y saldos actualizados', async () => {
    const app = await montarPagos()
    const reportes = useReportesStore(app.pinia)
    await abrirRegistro(app)

    await llenar(app, {
      'pago-factura': '001-001-000000102',
      'pago-monto': '92,35',
      'pago-forma': '01',
      'pago-codigo': 'PAG-X1',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'pago PAG-X1 de 92.35 registrado. Saldo pendiente: 500.00',
      ),
    )
    expect(app.wrapper.find('.toast').text()).toContain('Pago registrado')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(totalPagos + 1))
    // El saldo de la factura bajó: el reporte se volvió a pedir (no quedó la caché vieja).
    await vi.waitFor(() =>
      expect(
        reportes.filasDe('cuentas-por-cobrar')?.find((f) => f.seriefactura === '001-001-000000102')
          ?.Saldo,
      ).toBe(500),
    )
  })

  it('manda el monto como número y la referencia vacía como null', async () => {
    const registrar = vi.spyOn(pagosMock, 'registrar')
    const app = await montarPagos()
    await abrirRegistro(app)

    await llenar(app, {
      'pago-factura': '001-001-000000102',
      'pago-monto': '92,35',
      'pago-forma': '01',
      'pago-codigo': 'PAG-X1',
    })
    await enviar(app)

    await vi.waitFor(() => expect(registrar).toHaveBeenCalledOnce())
    expect(registrar.mock.calls[0]?.[0]).toEqual({
      codigo_pago: 'PAG-X1',
      numero_factura: '001-001-000000102',
      monto: 92.35,
      forma_pago: '01',
      referencia: null,
    })
  })

  it('un monto mayor al saldo lo rechaza la base: toast con su texto y el panel sigue abierto', async () => {
    const app = await montarPagos()
    await abrirRegistro(app)

    // El formulario no compara con el saldo: el mensaje tiene que ser el de la base.
    await llenar(app, {
      'pago-factura': '001-001-000000102',
      'pago-monto': '600',
      'pago-forma': '01',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'el pago de 600.00 supera el saldo pendiente de 592.35',
      ),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain('No se pudo registrar el pago')
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
    expect((app.wrapper.find('#pago-monto').element as HTMLInputElement).value).toBe('600')
    expect(filasDeDatos(app.wrapper)).toBe(totalPagos)
  })

  it('un código de pago repetido también lo rechaza la base', async () => {
    const app = await montarPagos()
    await abrirRegistro(app)

    await llenar(app, {
      'pago-factura': '001-001-000000102',
      'pago-monto': '10',
      'pago-forma': '01',
      'pago-codigo': 'PAG-0001',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'codigo de pago repetido o dato invalido',
      ),
    )
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
  })
})

describe('/pagos · eliminar (CU-11)', () => {
  it('eliminar pide confirmación y el mensaje dice qué se va a borrar y qué pasa con la factura', async () => {
    const app = await montarPagos()

    await pedirEliminar(app, 'PAG-0001')

    const dialogo = dialogoAbierto()
    expect(dialogo?.querySelector('h2')?.textContent).toBe('¿Eliminar este pago?')
    expect(dialogo?.textContent).toContain('PAG-0001')
    expect(dialogo?.textContent).toContain('$ 600,00')
    expect(dialogo?.textContent).toContain('001-001-000000101')
    expect(dialogo?.textContent).toContain('no se puede deshacer')
    // Todavía no se borró nada.
    expect(filasDeDatos(app.wrapper)).toBe(totalPagos)
  })

  it('"Cancelar" cierra el diálogo y no llama al API', async () => {
    const eliminar = vi.spyOn(pagosMock, 'eliminar')
    const app = await montarPagos()
    await pedirEliminar(app, 'PAG-0017')

    pulsarEnElDialogo('cancelar')

    await vi.waitFor(() => expect(dialogoAbierto()).toBeNull())
    expect(eliminar).not.toHaveBeenCalled()
    expect(filasDeDatos(app.wrapper)).toBe(totalPagos)
  })

  it('un pago de otro día se rechaza: toast con el texto de la base, el diálogo se cierra y el pago sigue', async () => {
    const app = await montarPagos()
    await pedirEliminar(app, 'PAG-0001')

    pulsarEnElDialogo('confirmar')

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'solo se eliminan pagos registrados hoy',
      ),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain('No se pudo eliminar el pago')
    await vi.waitFor(() => expect(dialogoAbierto()).toBeNull())
    expect(filaDe(app, 'PAG-0001')).toBeDefined()
    expect(filasDeDatos(app.wrapper)).toBe(totalPagos)
  })

  it('un pago de hoy se elimina después de confirmar: toast, fila fuera y saldo de la factura restituido', async () => {
    const app = await montarPagos()
    const reportes = useReportesStore(app.pinia)
    await pedirEliminar(app, 'PAG-0017')

    pulsarEnElDialogo('confirmar')

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'se elimino el pago PAG-0017 de 300.00; la factura 001-001-000000122 vuelve a deber ese monto',
      ),
    )
    expect(app.wrapper.find('.toast').text()).toContain('Pago eliminado')
    await vi.waitFor(() => expect(dialogoAbierto()).toBeNull())
    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(totalPagos - 1))
    expect(filaDe(app, 'PAG-0017')).toBeUndefined()
    // La factura vuelve a deber lo que ese pago había cubierto (698,90 en total, 300 pagados).
    await vi.waitFor(() =>
      expect(
        reportes.filasDe('cuentas-por-cobrar')?.find((f) => f.seriefactura === '001-001-000000122')
          ?.Saldo,
      ).toBe(698.9),
    )
  })

  it('mientras elimina, el diálogo deshabilita sus botones', async () => {
    vi.spyOn(pagosMock, 'eliminar').mockImplementationOnce(
      () => new Promise(() => undefined), // nunca responde
    )
    const app = await montarPagos()
    await pedirEliminar(app, 'PAG-0017')

    pulsarEnElDialogo('confirmar')

    await vi.waitFor(() =>
      expect(
        dialogoAbierto()?.querySelector('.modal-footer .btn-danger')?.hasAttribute('disabled'),
      ).toBe(true),
    )
    expect(dialogoAbierto()?.querySelector('.spinner-border')).not.toBeNull()
  })
})
