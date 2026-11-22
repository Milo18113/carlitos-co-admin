import type { ImagenCargada } from '@/types/pdf'

function leerComoDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result))
    lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'))
    lector.readAsDataURL(blob)
  })
}

function medir(dataUrl: string): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image()
    imagen.onload = () => resolver({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight })
    imagen.onerror = () => rechazar(new Error('No se pudo decodificar la imagen.'))
    imagen.src = dataUrl
  })
}

/** Descarga una imagen y la deja como data URL con su tamaño, para incrustarla en el PDF sin deformarla. */
export async function cargarImagen(url: string): Promise<ImagenCargada> {
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`No se pudo descargar la imagen (${respuesta.status}).`)
  const dataUrl = await leerComoDataUrl(await respuesta.blob())
  return { dataUrl, ...(await medir(dataUrl)) }
}
