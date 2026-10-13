import { DetalleValidacion } from '../../core/models/api-response';

/**
 * Extrae los detalles de validación ({ campo, mensaje }) que devuelve el
 * backend en un 400, para poder resaltarlos en el formulario.
 */
export function detallesDeError(error: unknown): DetalleValidacion[] {
  const detalles = (error as any)?.error?.details;

  if (!Array.isArray(detalles)) {
    return [];
  }

  return detalles.map((detalle) => {
    if (typeof detalle === 'string') {
      return { campo: '', mensaje: detalle };
    }

    return {
      origen: detalle.origen,
      campo: detalle.campo ?? '',
      mensaje: detalle.mensaje ?? 'Valor no válido'
    };
  });
}
