import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor } from '@/services/errores'
import { empleadosMock } from '@/services/mocks/empleadosMock'
import { reportesMock } from '@/services/mocks/reportesMock'

import { botonConTexto, desmontarApp, filasDeDatos, montarApp, prepararMocks } from './montarApp'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

type App = Awaited<ReturnType<typeof montarEmpleados>>

const RUTA = '/administracion-empleados'

beforeEach(() => prepararMocks('admin'))
afterEach(desmontarApp)

/** Monta la pantalla y espera la lista (10 empleados en las fixtures). */
async function montarEmpleados() {
  const app = await montarApp(RUTA)
  await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(10))
  return app
}

async function abrirPanel(app: App) {
  await botonConTexto(app.wrapper, 'Contratar empleado').trigger('click')
  await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).not.toBeNull())
  // Los roles llegan aparte de la lista: las opciones tienen que estar completas.
  await vi.waitFor(() =>
    expect(app.wrapper.findAll('#empleado-rol option').length).toBeGreaterThan(1),
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

/** Un empleado válido; cada prueba cambia lo que necesita. */
const EMPLEADO_NUEVO = {
  'empleado-codigo': 'E011',
  'empleado-cedula': '1712340110',
  'empleado-nombres': 'Nuevo',
  'empleado-apellidos': 'Empleado',
  'empleado-rol': '2',
  'empleado-usuario': 'nempleado',
  'empleado-contrasena': 'clave-secreta',
  'empleado-repetir-contrasena': 'clave-secreta',
}

describe('administrar empleados · lista', () => {
  it('muestra el título "Administrar empleados" y los empleados con su estado como badge', async () => {
    const app = await montarEmpleados()

    expect(app.wrapper.find('.cc-topbar').text()).toContain('Administrar empleados')
    const estados = app.wrapper.findAll('tbody .badge').map((badge) => badge.text())
    expect(estados.filter((texto) => texto === 'Inactivo')).toHaveLength(1)
    expect(estados.filter((texto) => texto === 'Activo')).toHaveLength(9)
  })

  it('comparte la lista con el reporte de empleados: mismas filas y mismas columnas', async () => {
    const app = await montarEmpleados()

    const encabezados = app.wrapper.findAll('thead th').map((th) => th.text())

    expect(encabezados).toEqual([
      'Cédula',
      'Nombres',
      'Apellidos',
      'Rol',
      'Estado',
      'Facturas emitidas',
      'Acciones',
    ])
  })

  it('"Dar de baja" (CU-13) existe pero deshabilitado y con el tooltip "Pendiente"', async () => {
    const app = await montarEmpleados()

    const boton = app.wrapper.find('[aria-label^="Dar de baja a Javier Pérez"]')

    expect(boton.attributes('disabled')).toBeDefined()
    // Un botón deshabilitado no muestra tooltip: el `title` va en el contenedor.
    expect(boton.element.parentElement?.getAttribute('title')).toBe('Pendiente')
  })

  it('si la carga falla muestra el error con "Reintentar"', async () => {
    vi.spyOn(reportesMock, 'obtener').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const app = await montarApp(RUTA)

    await vi.waitFor(() => expect(app.wrapper.find('[role="alert"]').exists()).toBe(true))
    await app.wrapper.find('[role="alert"] .btn-primary').trigger('click')

    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(10))
  })
})

describe('administrar empleados · contratar (CU-12)', () => {
  it('el formulario ofrece los roles por nombre', async () => {
    const app = await montarEmpleados()

    await abrirPanel(app)

    const roles = app.wrapper.findAll('#empleado-rol option').map((opcion) => opcion.text())
    expect(roles).toEqual(['Elige un rol', 'Administrador', 'Vendedor'])
  })

  it('un formulario vacío muestra los errores y no llama al API', async () => {
    const contratar = vi.spyOn(empleadosMock, 'contratar')
    const app = await montarEmpleados()
    await abrirPanel(app)

    await enviar(app)

    const panel = app.wrapper.find('.cc-sidepanel').text()
    expect(panel).toContain('Escribe el código del empleado')
    expect(panel).toContain('La cédula tiene 10 dígitos')
    expect(panel).toContain('Escribe los nombres')
    expect(panel).toContain('Elige el rol')
    expect(panel).toContain('Escribe el usuario')
    expect(panel).toContain('Escribe una contraseña')
    expect(contratar).not.toHaveBeenCalled()
  })

  it('una cédula con 9 dígitos se rechaza antes de enviar', async () => {
    const contratar = vi.spyOn(empleadosMock, 'contratar')
    const app = await montarEmpleados()
    await abrirPanel(app)

    await llenar(app, { ...EMPLEADO_NUEVO, 'empleado-cedula': '171234011' })
    await enviar(app)

    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('La cédula tiene 10 dígitos')
    expect(contratar).not.toHaveBeenCalled()
  })

  it('si las dos contraseñas no coinciden no se envía', async () => {
    const contratar = vi.spyOn(empleadosMock, 'contratar')
    const app = await montarEmpleados()
    await abrirPanel(app)

    await llenar(app, { ...EMPLEADO_NUEVO, 'empleado-repetir-contrasena': 'otra-clave' })
    await enviar(app)

    expect(app.wrapper.find('.cc-sidepanel').text()).toContain('Las contraseñas no coinciden')
    expect(contratar).not.toHaveBeenCalled()
  })

  it('la contraseña se escribe oculta y los campos no ofrecen autocompletar la clave vieja', async () => {
    const app = await montarEmpleados()
    await abrirPanel(app)

    const contrasena = app.wrapper.find('#empleado-contrasena')

    expect(contrasena.attributes('type')).toBe('password')
    expect(contrasena.attributes('autocomplete')).toBe('new-password')
  })

  it('un empleado nuevo se contrata: toast con el mensaje, panel cerrado y aparece en la lista', async () => {
    const app = await montarEmpleados()
    await abrirPanel(app)

    await llenar(app, EMPLEADO_NUEVO)
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'Nuevo Empleado contratado con el codigo E011',
      ),
    )
    expect(app.wrapper.find('.toast').text()).toContain('Empleado contratado')
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    await vi.waitFor(() => expect(filasDeDatos(app.wrapper)).toBe(11))
    expect(app.wrapper.text()).toContain('1712340110')
  })

  it('manda la contraseña en texto plano (la hashea el API) y el rol como número', async () => {
    const contratar = vi.spyOn(empleadosMock, 'contratar')
    const app = await montarEmpleados()
    await abrirPanel(app)

    await llenar(app, EMPLEADO_NUEVO)
    await enviar(app)

    await vi.waitFor(() => expect(contratar).toHaveBeenCalledOnce())
    expect(contratar.mock.calls[0]?.[0]).toEqual({
      codigo_empleado: 'E011',
      cedula: '1712340110',
      nombres: 'Nuevo',
      apellidos: 'Empleado',
      codigo_rol: 2,
      usuario: 'nempleado',
      contrasena: 'clave-secreta',
    })
  })

  it('un usuario que ya usa otro empleado lo rechaza la base: toast con su texto y el panel sigue abierto', async () => {
    const app = await montarEmpleados()
    await abrirPanel(app)

    await llenar(app, { ...EMPLEADO_NUEVO, 'empleado-usuario': 'vendedor' })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'el usuario vendedor ya lo usa otro empleado',
      ),
    )
    expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
      'No se pudo contratar al empleado',
    )
    expect(document.querySelector('.cc-sidepanel')).not.toBeNull()
    expect((app.wrapper.find('#empleado-nombres').element as HTMLInputElement).value).toBe('Nuevo')
    expect(filasDeDatos(app.wrapper)).toBe(10)
  })

  it('la cédula de un empleado que sigue activo la rechaza la base', async () => {
    const app = await montarEmpleados()
    await abrirPanel(app)

    await llenar(app, { ...EMPLEADO_NUEVO, 'empleado-cedula': '1712340011' })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.cc-toast--danger').text()).toContain(
        'la cedula 1712340011 ya pertenece a un empleado activo (E001)',
      ),
    )
  })

  it('la cédula de un empleado dado de baja lo recontrata y conserva su código', async () => {
    const app = await montarEmpleados()
    await abrirPanel(app)

    // 1712340086 es Javier Pérez (E008), inactivo.
    await llenar(app, {
      ...EMPLEADO_NUEVO,
      'empleado-codigo': 'E099',
      'empleado-cedula': '1712340086',
      'empleado-nombres': 'Javier',
      'empleado-apellidos': 'Pérez',
      'empleado-usuario': 'jperez2',
    })
    await enviar(app)

    await vi.waitFor(() =>
      expect(app.wrapper.find('.toast').text()).toContain(
        'Javier Pérez recontratado, conserva el codigo E008',
      ),
    )
    await vi.waitFor(() => expect(document.querySelector('.cc-sidepanel')).toBeNull())
    // Sigue habiendo 10 filas (no se creó otro) y ya no queda ninguno inactivo.
    await vi.waitFor(() => {
      const estados = app.wrapper.findAll('tbody .badge').map((badge) => badge.text())
      expect(estados.filter((texto) => texto === 'Inactivo')).toHaveLength(0)
    })
    expect(filasDeDatos(app.wrapper)).toBe(10)
  })
})
