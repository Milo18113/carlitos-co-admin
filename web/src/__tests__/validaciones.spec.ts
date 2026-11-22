import { describe, expect, it } from 'vitest'

import {
  aEntero,
  aNumero,
  textoONull,
  validarCantidad,
  validarEmail,
  validarEnteroNoNegativo,
  validarIdentificacion,
  validarLargoMaximo,
  validarMonto,
  validarObligatorio,
} from '@/utils/validaciones'

describe('textoONull', () => {
  it('un campo opcional vacío o en blanco se manda como null, no como cadena vacía', () => {
    expect(textoONull('')).toBeNull()
    expect(textoONull('   ')).toBeNull()
  })

  it('recorta los espacios del texto que sí tiene', () => {
    expect(textoONull('  0991234567 ')).toBe('0991234567')
  })
})

describe('aNumero y aEntero', () => {
  it('aceptan coma o punto como separador decimal', () => {
    expect(aNumero('12,50')).toBe(12.5)
    expect(aNumero('12.50')).toBe(12.5)
    expect(aNumero(' 7 ')).toBe(7)
  })

  it('rechazan lo que no es un número', () => {
    expect(aNumero('')).toBeNull()
    expect(aNumero('abc')).toBeNull()
    expect(aNumero('-5')).toBeNull()
    expect(aNumero('1,2,3')).toBeNull()
    expect(aEntero('2.5')).toBeNull()
    expect(aEntero('')).toBeNull()
  })

  it('un entero es solo dígitos', () => {
    expect(aEntero('10')).toBe(10)
    expect(aEntero('0')).toBe(0)
  })
})

describe('validarIdentificacion (mismo criterio que registrar_cliente)', () => {
  it('un RUC tiene 13 dígitos', () => {
    expect(validarIdentificacion('04', '1790012345001')).toBeNull()
    expect(validarIdentificacion('04', '1790012345')).toBe('Un RUC tiene 13 dígitos')
  })

  it('una cédula tiene 10 dígitos', () => {
    expect(validarIdentificacion('05', '1712345678')).toBeNull()
    expect(validarIdentificacion('05', '171234567')).toBe('Una cédula tiene 10 dígitos')
  })

  it('exige solo dígitos y que no esté vacío', () => {
    expect(validarIdentificacion('05', '')).toBe('Escribe el número de identificación')
    expect(validarIdentificacion('05', '17-12345678')).toBe(
      'Usa solo dígitos, sin espacios ni guiones',
    )
  })

  it('no inventa reglas que la base no tiene: no revisa el dígito verificador de la cédula', () => {
    // 1712345678 no es una cédula ecuatoriana válida, pero registrar_cliente solo mira el largo.
    expect(validarIdentificacion('05', '1712345678')).toBeNull()
  })

  it('ignora los espacios de los bordes', () => {
    expect(validarIdentificacion('05', ' 1712345678 ')).toBeNull()
  })
})

describe('validarEmail', () => {
  it('es opcional: vacío está bien', () => {
    expect(validarEmail('')).toBeNull()
    expect(validarEmail('  ')).toBeNull()
  })

  it('si se escribe, tiene que parecer un email', () => {
    expect(validarEmail('cliente@taller.example')).toBeNull()
    expect(validarEmail('sin-arroba')).toBe('El email no es válido')
    expect(validarEmail('a@b')).toBe('El email no es válido')
  })
})

describe('validarCantidad y validarEnteroNoNegativo', () => {
  it('una cantidad es un entero mayor que 0', () => {
    expect(validarCantidad('5')).toBeNull()
    expect(validarCantidad('0')).not.toBeNull()
    expect(validarCantidad('')).not.toBeNull()
    expect(validarCantidad('2,5')).not.toBeNull()
    expect(validarCantidad('-1')).not.toBeNull()
  })

  it('el stock mínimo admite 0', () => {
    expect(validarEnteroNoNegativo('0', 'El stock mínimo')).toBeNull()
    expect(validarEnteroNoNegativo('x', 'El stock mínimo')).toBe(
      'El stock mínimo debe ser un número entero, 0 o más',
    )
  })
})

describe('validarMonto', () => {
  it('acepta hasta 2 decimales, con coma o con punto', () => {
    expect(validarMonto('12,50')).toBeNull()
    expect(validarMonto('12.5')).toBeNull()
    expect(validarMonto('100')).toBeNull()
  })

  it('rechaza cero, texto y más de 2 decimales', () => {
    expect(validarMonto('0', 'El precio')).toBe('El precio debe ser un número mayor que 0')
    expect(validarMonto('abc', 'El precio')).toBe('El precio debe ser un número mayor que 0')
    expect(validarMonto('1,234', 'El precio')).toBe('El precio admite hasta 2 decimales')
  })

  it('rechaza lo que no cabe en DECIMAL(10,2)', () => {
    expect(validarMonto('100000000')).toBe('El monto es demasiado grande')
    expect(validarMonto('99999999,99')).toBeNull()
  })
})

describe('validarObligatorio y validarLargoMaximo', () => {
  it('un obligatorio en blanco da el mensaje que se le pasó', () => {
    expect(validarObligatorio('  ', 'Escribe el nombre')).toBe('Escribe el nombre')
    expect(validarObligatorio('Taller', 'Escribe el nombre')).toBeNull()
  })

  it('el largo máximo cuenta sin los espacios de los bordes', () => {
    expect(validarLargoMaximo('abc', 3, 'El campo')).toBeNull()
    expect(validarLargoMaximo(' abc ', 3, 'El campo')).toBeNull()
    expect(validarLargoMaximo('abcd', 3, 'El campo')).toBe('El campo admite hasta 3 caracteres')
  })
})
