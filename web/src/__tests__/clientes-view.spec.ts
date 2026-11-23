import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor } from '@/services/errores'
import { clientesMock } from '@/services/mocks/clientesMock'
import { useReportesStore } from '@/stores/reportes'

import { botonConTexto, desmontarApp, filasDeDatos, montarApp, prepararMocks } from './montarApp'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

beforeEach(() => prepararMocks('vendedor'))
afterEach(desmontarApp)

/** Monta `/clientes` y espera a que la lista y los catálogos de los `<select>` estén cargados. */
async function montarClientes() {
  const app = await montarApp('/clientes')
  await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(15))
  // Los catálogos llegan aparte de la lista: con el tipo ya traducido a su nombre, ya están.
  await vi.waitFor(() => expect(app.wrapper.text()).toContain('RUC'))
  return app
}

async function abrirPanelNuevo(app: Awaited<ReturnType<typeof montarClientes>>) {
  await botonConTexto(app.wrapper, 'Nuevo cliente').trigger('click')
  await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
}

async function llenar(
  app: Awaited<ReturnType<typeof montarClientes>>,
  campos: Record<string, string>,
) {
  for (const [id, valor] of Object.entries(campos)) {
    await app.wrapper.find(`#${id}`).setValue(valor)
  }
}

async function enviarFormulario(app: Awaited<ReturnType<typeof montarClientes>>) {
  await app.wrapper.find('.cc-sidepanel form').trigger('submit')
}

describe('/clientes · lista', () => {
  it('muestra los clientes con el tipo y la ciudad por nombre, no por código', async () => {
    const app = await montarClientes()

    const fila = app.wrapper.findAll('tbody tr').find((tr) => tr.text().includes('1790012345001'))
    expect(fila?.text()).toContain('RUC')
    expect(fila?.text()).toContain('Quito')
    expect(fila?.text()).not.toContain('UIO')
  })

  it('el buscador filtra y deja la búsqueda en la URL', async () => {
    const app = await montarClientes()

    await app.wrapper.find('input[type="search"]').setValue('andinos')

    await vi.waitFor(() => expect(app.router.currentRoute.value.query.q).toBe('andinos'))
    expect(filasDeDatos(app.wrapper)).toBe(1)
  })

  it('si la carga falla muestra el error y "Reintentar" vuelve a pedir', async () => {
    vi.spyOn(clientesMock, 'listar').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const app = await montarApp('/clientes')

    await vi.waitFor(() => expect(app.wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(app.wrapper.find('[role="alert"]').text()).toContain('Sin conexión')

    await app.wrapper.find('[role="alert"] .btn-primary').trigger('click')

    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(15))
  })
})

describe('/clientes · panel lateral', () => {
  it('"Nuevo cliente" abre el panel como overlay, con el foco en el primer campo', async () => {
    const app = await montarClientes()

    await abrirPanelNuevo(app)

    const panel = document.querySelector('.cc-sidepanel')
    // Flota sobre la página (`position: fixed`): no está metido en la tabla ni le quita ancho. Se dibuja
    // en el destino de App.vue, que sigue colgando de `.cc-shell__body`.
    expect(panel?.classList.contains('cc-sidepanel--overlay')).toBe(true)
    const destino = panel?.closest('#panel-lateral')
    expect(destino?.parentElement?.classList.contains('cc-shell__body')).toBe(true)
    expect(panel?.querySelector('.cc-sidepanel__title')?.textContent).toBe('Nuevo cliente')
    expect(document.activeElement?.id).toBe('cliente-tipo')
  })

  it('el panel tiene nombre accesible', async () => {
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    const panel = document.querySelector('.cc-sidepanel')
    const idTitulo = panel?.getAttribute('aria-labelledby')

    expect(idTitulo).toBeTruthy()
    expect(document.getElementById(idTitulo ?? '')?.textContent).toBe('Nuevo cliente')
  })

  it('Esc cierra el panel y el foco vuelve al botón que lo abrió', async () => {
    const app = await montarClientes()
    const boton = botonConTexto(app.wrapper, 'Nuevo cliente')
    ;(boton.element as HTMLElement).focus()
    await boton.trigger('click')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())

    document
      .querySelector('.cc-sidepanel')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    expect(document.activeElement).toBe(boton.element)
  })

  it('la X y "Cancelar" también cierran el panel', async () => {
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    await app.wrapper.find('.cc-sidepanel [aria-label="Cerrar panel"]').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())

    await abrirPanelNuevo(app)
    await app.wrapper.find('.cc-form-actions .btn-neutral').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
  })

  it('el tipo "Consumidor final" no se ofrece: registrar_cliente lo rechaza', async () => {
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    const opciones = app.wrapper.findAll('#cliente-tipo option').map((opcion) => opcion.text())

    expect(opciones).toContain('RUC')
    expect(opciones).toContain('Cédula')
    expect(opciones).not.toContain('Consumidor final')
  })
})

describe('/clientes · crear (CU-06)', () => {
  it('un formulario vacío muestra los errores y no llama al API', async () => {
    const registrar = vi.spyOn(clientesMock, 'registrar')
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    await enviarFormulario(app)

    const panel = app.wrapper.find('.cc-sidepanel').text()
    expect(panel).toContain('Elige el tipo de identificación')
    expect(panel).toContain('Escribe el número de identificación')
    expect(panel).toContain('Escribe el nombre o la razón social')
    expect(registrar).not.toHaveBeenCalled()
  })

  it('un RUC con 10 dígitos se rechaza antes de enviar, con el mismo criterio de la base', async () => {
    const registrar = vi.spyOn(clientesMock, 'registrar')
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    await llenar(app, {
      'cliente-tipo': '04',
      'cliente-numero': '1790012345',
      'cliente-razon-social': 'Taller Nuevo',
    })
    await enviarFormulario(app)

    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('Un RUC tiene 13 dígitos')
    expect(registrar).not.toHaveBeenCalled()
  })

  it('un email mal escrito se rechaza antes de enviar', async () => {
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    await llenar(app, {
      'cliente-tipo': '05',
      'cliente-numero': '1750000011',
      'cliente-razon-social': 'Lucía Mora',
      'cliente-email': 'sin-arroba',
    })
    await enviarFormulario(app)

    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('El email no es válido')
  })

  it('un cliente nuevo se guarda: toast con el mensaje del procedure, panel cerrado y aparece en la lista', async () => {
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    await llenar(app, {
      'cliente-tipo': '05',
      'cliente-numero': '1750000011',
      'cliente-razon-social': 'Lucía Mora',
      'cliente-email': 'lucia@example.com',
      'cliente-ciudad': 'UIO',
    })
    await enviarFormulario(app)

    await vi.waitFor(() => expect(app.wrapper.find('.toast').text()).toContain('LUCÍA MORA'))
    expect(app.wrapper.find('.toast').text()).toContain('Cliente guardado')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(16))
    expect(app.wrapper.text()).toContain('1750000011')
  })

  it('los campos opcionales vacíos viajan como null, nunca como cadena vacía', async () => {
    const registrar = vi.spyOn(clientesMock, 'registrar')
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    await llenar(app, {
      'cliente-tipo': '05',
      'cliente-numero': '1750000011',
      'cliente-razon-social': '  Lucía Mora  ',
    })
    await enviarFormulario(app)

    await vi.waitFor(() => expect(registrar).toHaveBeenCalledOnce())
    expect(registrar.mock.calls[0]?.[0]).toEqual({
      numero_identificacion: '1750000011',
      codigo_tipo: '05',
      razon_social: 'Lucía Mora',
      telefono: null,
      email: null,
      direccion: null,
      codigo_ciudad: null,
    })
  })

  it('si la base rechaza (422) el toast muestra su texto y el panel sigue abierto con lo escrito', async () => {
    const app = await montarClientes()
    await abrirPanelNuevo(app)

    // Pasa la validación del formulario (13 dígitos) pero es el número del consumidor final.
    await llenar(app, {
      'cliente-tipo': '04',
      'cliente-numero': '9999999999999',
      'cliente-razon-social': 'Alguien',
    })
    await enviarFormulario(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'el consumidor final ya existe y no se modifica',
      ),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain('No se pudo guardar el cliente')
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
    expect((app.wrapper.find('#cliente-razon-social').element as HTMLInputElement).value).toBe(
      'Alguien',
    )
    expect(filasDeDatos(app.wrapper)).toBe(15)
  })

  it('mientras guarda, los botones quedan deshabilitados y Esc no cierra el panel', async () => {
    vi.spyOn(clientesMock, 'registrar').mockImplementationOnce(
      () => new Promise(() => undefined), // nunca responde
    )
    const app = await montarClientes()
    await abrirPanelNuevo(app)
    await llenar(app, {
      'cliente-tipo': '05',
      'cliente-numero': '1750000011',
      'cliente-razon-social': 'Lucía Mora',
    })

    await enviarFormulario(app)

    await vi.waitFor(() =>
      expect(
        app.wrapper.find('.cc-form-actions .btn-primary').attributes('disabled'),
      ).toBeDefined(),
    )
    document
      .querySelector('.cc-sidepanel')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
  })

  it('guardar invalida la caché de reportes: el siguiente reporte trae datos nuevos', async () => {
    const app = await montarClientes()
    const reportes = useReportesStore(app.pinia)
    await reportes.cargar('cuentas-por-cobrar')
    expect(reportes.filasDe('cuentas-por-cobrar')).toBeDefined()
    await abrirPanelNuevo(app)

    await llenar(app, {
      'cliente-tipo': '05',
      'cliente-numero': '1750000011',
      'cliente-razon-social': 'Lucía Mora',
    })
    await enviarFormulario(app)

    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    expect(reportes.filasDe('cuentas-por-cobrar')).toBeUndefined()
  })
})

describe('/clientes · editar', () => {
  async function abrirEdicionDe(app: Awaited<ReturnType<typeof montarClientes>>, texto: string) {
    const fila = app.wrapper.findAll('tbody tr').find((tr) => tr.text().includes(texto))
    await fila?.trigger('click')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
  }

  it('un clic en la fila abre el panel con los datos, y el tipo y el número quedan bloqueados', async () => {
    const app = await montarClientes()

    await abrirEdicionDe(app, 'JUAN CARLOS PAREDES')

    expect(document.querySelector('.cc-sidepanel__title')?.textContent).toBe('Editar cliente')
    const numero = app.wrapper.find('#cliente-numero').element as HTMLInputElement
    expect(numero.value).toBe('1712345678')
    expect(numero.disabled).toBe(true)
    expect((app.wrapper.find('#cliente-tipo').element as HTMLSelectElement).disabled).toBe(true)
    expect((app.wrapper.find('#cliente-razon-social').element as HTMLInputElement).value).toBe(
      'JUAN CARLOS PAREDES LOOR',
    )
  })

  it('guardar actualiza al cliente y lo avisa con el mensaje del procedure', async () => {
    const app = await montarClientes()
    await abrirEdicionDe(app, 'JUAN CARLOS PAREDES')

    await app.wrapper.find('#cliente-telefono').setValue('0999999999')
    await enviarFormulario(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain('ya existia, se actualizaron sus datos'),
    )
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    expect(app.wrapper.text()).toContain('0999999999')
    expect(filasDeDatos(app.wrapper)).toBe(15) // se actualizó, no se creó otro
  })

  it('el consumidor final no se edita: avisa con un toast y no abre el panel', async () => {
    const app = await montarClientes()

    const fila = app.wrapper
      .findAll('tbody tr')
      .find((tr) => tr.text().includes('CONSUMIDOR FINAL'))
    await fila?.trigger('click')

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain('no se puede modificar'),
    )
    expect(document.querySelector('.cc-sidepanel')).toBeNull()
  })

  it('con el teclado: Enter sobre una fila la abre', async () => {
    const app = await montarClientes()
    const fila = app.wrapper.findAll('tbody tr').find((tr) => tr.text().includes('ROBERTO XAVIER'))

    await fila?.trigger('keydown.enter')

    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
  })
})
