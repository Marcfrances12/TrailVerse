const fmtKm = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const fmtM = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const fmtHoras = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export const formatKm = (km: number): string => `${fmtKm.format(km)} km`;

export const formatMetros = (metros: number): string => `${fmtM.format(metros)} m`;

export const formatDuracion = (horas: number): string => {
  const horasEnteras = Math.floor(horas);
  const minutos = Math.round((horas - horasEnteras) * 60);

  if (horasEnteras === 0) return `${minutos} min`;
  if (minutos === 0) return `${horasEnteras} h`;
  return `${horasEnteras} h ${minutos} min`;
};

export const formatHoras = (horas: number): string => `${fmtHoras.format(horas)} h`;

export const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

export const capitalizar = (texto: string): string =>
  texto.length === 0 ? texto : texto.charAt(0).toUpperCase() + texto.slice(1);
