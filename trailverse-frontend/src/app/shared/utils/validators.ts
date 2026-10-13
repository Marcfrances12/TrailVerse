import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que el valor (si tiene) sea una URL http(s) válida. */
export const urlValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const valor: string = control.value;

  if (!valor || valor.trim() === '') {
    return null;
  }

  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? null
      : { urlInvalida: true };
  } catch {
    return { urlInvalida: true };
  }
};

/** Número entero o decimal positivo (con hasta 2 decimales). */
export const numeroPositivoPattern = /^\d+(\.\d{1,2})?$/;
