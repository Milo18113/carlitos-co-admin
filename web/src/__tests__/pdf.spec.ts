import { describe, expect, it } from 'vitest'

import { definicionDe } from '@/types/reportes'
import type { ColoresPdf, OpcionesPdf } from '@/types/pdf'
import { construirPdf, nombreArchivoPdf } from '@/utils/exportarPdf'
import { filtrarFilas } from '@/utils/filtrarFilas'

const colores: ColoresPdf = {
  textoFuerte: [20, 27, 36],
  textoSecundario: [76, 90, 105],
  encabezadoFondo: [240, 244, 247],
  encabezadoTexto: [76, 90, 105],
  borde: [225, 231, 237],
}

// PNG de 1×1 píxel: lo mínimo para comprobar que el logo se incrusta.
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const generadoEn = new Date(2026, 10, 22, 13, 5)

function opciones(cambios: Partial<OpcionesPdf> = {}): OpcionesPdf {
  const definicion = definicionDe('cuentas-por-cobrar')
  return {
    nombreBase: 'cuentas-por-cobrar',
    titulo: definicion.titulo,
    descripcion: definicion.descripcion,
    columnas: definicion.columnas,
    filas: [
      {
        seriefactura: '001-001-000000102',
        Nombre_Cliente: 'REPUESTOS ANDINOS',
        fechafactura: '2026-11-18',
        Total: 1240,
        pagado: 300,
        devolucion: 0,
        Saldo: 940,
      },
    ],
    usuario: 'Maria Salazar',
    generadoEn,
    colores,
    ...cambios,
  }
}

/** El texto del PDF sin comprimir: jsPDF escribe las cadenas tal cual, con las tildes en octal. */
function textoDe(opcionesPdf: OpcionesPdf): string {
  return construirPdf(opcionesPdf).output()
}

describe('construirPdf', () => {
  it('lleva el título, la descripción, la fecha de generación y el usuario', () => {
    const texto = textoDe(opciones())

    expect(texto).toContain('Cuentas por cobrar')
    expect(texto).toContain('Generado el 22 nov 2026, 13:05')
    expect(texto).toContain('Usuario: Maria Salazar')
  })

  it('escribe la tabla con las cifras formateadas, como en pantalla', () => {
    const texto = textoDe(opciones())

    expect(texto).toContain('001-001-000000102')
    expect(texto).toContain('$ 1.240,00')
    expect(texto).toContain('$ 940,00')
    expect(texto).toContain('18 nov 2026')
  })

  it('usa las etiquetas legibles y no los alias de la vista SQL en el encabezado', () => {
    const texto = textoDe(opciones())

    expect(texto).toContain('Factura')
    expect(texto).toContain('Devoluciones')
    expect(texto).not.toContain('seriefactura)')
  })

  it('con un filtro activo lo deja anotado en el encabezado', () => {
    const texto = textoDe(opciones({ filtro: 'andinos' }))

    // Las comillas « » se escriben en octal dentro del PDF: se comprueba lo que no depende de eso.
    expect(texto).toContain('Filtro: ')
    expect(texto).toContain('andinos')
  })

  it('sin filtro no escribe la línea de filtro', () => {
    expect(textoDe(opciones({ filtro: '   ' }))).not.toContain('Filtro:')
  })

  it('pone el número de página en el pie', () => {
    // "Página" lleva tilde, que jsPDF escribe en octal: se busca desde "gina".
    expect(textoDe(opciones())).toContain('gina 1 de 1')
  })

  it('con muchas filas la tabla sigue en más páginas y el pie las cuenta', () => {
    const filas = Array.from({ length: 80 }, (_, i) => ({
      seriefactura: `001-001-${String(i).padStart(9, '0')}`,
      Nombre_Cliente: 'CLIENTE',
      fechafactura: '2026-11-18',
      Total: 100,
      pagado: 0,
      devolucion: 0,
      Saldo: 100,
    }))

    const doc = construirPdf(opciones({ filas }))

    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
  })

  it('un reporte con muchas columnas sale en horizontal y uno corto de pie', () => {
    const ancho = (doc: ReturnType<typeof construirPdf>) => doc.internal.pageSize.getWidth()
    const alto = (doc: ReturnType<typeof construirPdf>) => doc.internal.pageSize.getHeight()

    const cuentas = construirPdf(opciones()) // 7 columnas
    const marcas = definicionDe('desempeno-marca')
    const corto = construirPdf(opciones({ columnas: marcas.columnas, filas: [] })) // 3 columnas

    expect(ancho(cuentas)).toBeGreaterThan(alto(cuentas))
    expect(ancho(corto)).toBeLessThan(alto(corto))
  })

  it('incrusta el logo si se lo pasan, y se genera igual si no', () => {
    const conLogo = textoDe(opciones({ logo: { dataUrl: PNG_1X1, ancho: 1, alto: 1 } }))
    const sinLogo = textoDe(opciones({ logo: null }))

    expect(conLogo).toContain('/Subtype /Image')
    expect(sinLogo).not.toContain('/Subtype /Image')
  })

  it('exporta lo que se ve en pantalla: solo las filas que pasan el filtro', () => {
    const definicion = definicionDe('cuentas-por-cobrar')
    const todas = [
      {
        seriefactura: 'F-1',
        Nombre_Cliente: 'ANDINOS',
        fechafactura: '2026-11-18',
        Total: 10,
        pagado: 0,
        devolucion: 0,
        Saldo: 10,
      },
      {
        seriefactura: 'F-2',
        Nombre_Cliente: 'QUITUMBE',
        fechafactura: '2026-11-19',
        Total: 20,
        pagado: 0,
        devolucion: 0,
        Saldo: 20,
      },
    ]

    const filas = filtrarFilas(todas, definicion.columnas, 'quitumbe')
    const texto = textoDe(opciones({ filas, filtro: 'quitumbe' }))

    expect(texto).toContain('QUITUMBE')
    expect(texto).not.toContain('ANDINOS')
  })
})

describe('nombreArchivoPdf', () => {
  it('une el reporte con la fecha de generación', () => {
    expect(nombreArchivoPdf('cuentas-por-cobrar', generadoEn)).toBe(
      'cuentas-por-cobrar-2026-11-22.pdf',
    )
  })
})
