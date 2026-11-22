import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Styles } from 'jspdf-autotable'

import type { OpcionesPdf } from '@/types/pdf'

import { aFechaISO, formatearFechaHora } from './fecha'
import { esNumerico, formatearCelda } from './formatoCelda'

const MARGEN_MM = 14
const ALTO_LOGO_MM = 16
// Con más de 5 columnas (cuentas por cobrar tiene 7) la tabla no cabe de pie.
const COLUMNAS_MAXIMAS_VERTICAL = 5

function formatoDeImagen(dataUrl: string): 'PNG' | 'JPEG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
}

/**
 * Arma el documento: logo, título, fecha de generación, usuario y la tabla (CU-05). No descarga
 * nada, para poder probarlo; `descargarPdf` es el que lo guarda. jsPDF usa fuentes estándar, que
 * cubren el español (tildes y ñ) pero no emojis ni otros alfabetos.
 */
export function construirPdf(opciones: OpcionesPdf): jsPDF {
  const { columnas, filas, colores } = opciones

  const doc = new jsPDF({
    orientation: columnas.length > COLUMNAS_MAXIMAS_VERTICAL ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  const anchoPagina = doc.internal.pageSize.getWidth()
  const altoPagina = doc.internal.pageSize.getHeight()

  // --- Encabezado ---
  let xTexto = MARGEN_MM
  if (opciones.logo) {
    const { dataUrl, ancho, alto } = opciones.logo
    const anchoLogo = ALTO_LOGO_MM * (ancho / alto)
    doc.addImage(dataUrl, formatoDeImagen(dataUrl), MARGEN_MM, 10, anchoLogo, ALTO_LOGO_MM)
    xTexto = MARGEN_MM + anchoLogo + 4
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...colores.textoFuerte)
  doc.text(opciones.titulo, xTexto, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...colores.textoSecundario)
  if (opciones.descripcion) doc.text(opciones.descripcion, xTexto, 22.5)

  const meta = [
    `Generado el ${formatearFechaHora(opciones.generadoEn)}`,
    `Usuario: ${opciones.usuario}`,
  ]
  if (opciones.filtro?.trim()) meta.push(`Filtro: «${opciones.filtro.trim()}»`)
  doc.text(meta.join('  ·  '), xTexto, 27)

  const yLinea = 10 + ALTO_LOGO_MM + 3
  doc.setDrawColor(...colores.borde)
  doc.setLineWidth(0.2)
  doc.line(MARGEN_MM, yLinea, anchoPagina - MARGEN_MM, yLinea)

  // --- Tabla ---
  const estilosPorColumna: Record<number, Partial<Styles>> = {}
  columnas.forEach((columna, indice) => {
    const estilos: Partial<Styles> = {}
    if (esNumerico(columna.formato)) estilos.halign = 'right'
    if (columna.principal) estilos.fontStyle = 'bold'
    estilosPorColumna[indice] = estilos
  })

  autoTable(doc, {
    startY: yLinea + 4,
    margin: { left: MARGEN_MM, right: MARGEN_MM, bottom: 16 },
    head: [columnas.map((columna) => columna.etiqueta)],
    body: filas.map((fila) => columnas.map((c) => formatearCelda(fila[c.clave], c.formato))),
    // Sin rayado ni cuadrícula, como la tabla de la pantalla: solo un divisor entre filas.
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 2.4, bottom: 2.4, left: 2.5, right: 2.5 },
      textColor: colores.textoFuerte,
      lineColor: colores.borde,
      lineWidth: { bottom: 0.1 },
    },
    headStyles: {
      fillColor: colores.encabezadoFondo,
      textColor: colores.encabezadoTexto,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: estilosPorColumna,
    // `columnStyles` no alcanza al encabezado: sin esto las cifras quedan a la derecha y su título a la izquierda.
    didParseCell: (datos) => {
      const columna = columnas[datos.column.index]
      if (datos.section === 'head' && columna && esNumerico(columna.formato)) {
        datos.cell.styles.halign = 'right'
      }
    },
  })

  // --- Pie de cada página ---
  const paginas = doc.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...colores.textoSecundario)
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina)
    doc.text('Carlitosco Importaciones · Panel de administración', MARGEN_MM, altoPagina - 8)
    doc.text(`Página ${pagina} de ${paginas}`, anchoPagina - MARGEN_MM, altoPagina - 8, {
      align: 'right',
    })
  }

  return doc
}

/** Nombre del archivo: "cuentas-por-cobrar-2026-11-22.pdf". */
export function nombreArchivoPdf(nombreBase: string, generadoEn: Date): string {
  return `${nombreBase}-${aFechaISO(generadoEn)}.pdf`
}

/** Genera el PDF y lo descarga. Devuelve el nombre del archivo, para avisárselo al usuario. */
export function descargarPdf(opciones: OpcionesPdf): string {
  const nombre = nombreArchivoPdf(opciones.nombreBase, opciones.generadoEn)
  construirPdf(opciones).save(nombre)
  return nombre
}
