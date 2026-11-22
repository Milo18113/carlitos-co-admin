/**
 * IVA que se aplica a una factura nueva. Todavía no se sabe qué porcentaje maneja Carlitosco (en
 * Ecuador es 15 %): es el valor que usan el formulario de la factura y los mocks, y se manda al API
 * como `porcentaje_iva` (columna de `tFactura`). Si es otro, este es el único lugar que se cambia.
 */
export const IVA_POR_DEFECTO = 15
