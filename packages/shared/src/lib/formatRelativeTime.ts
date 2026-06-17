export function formatRelativeTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'hace un momento';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin === 1 ? 'hace 1 minuto' : `hace ${diffMin} minutos`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return diffHour === 1 ? 'hace 1 hora' : `hace ${diffHour} horas`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return diffDay === 1 ? 'hace 1 día' : `hace ${diffDay} días`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return diffWeek === 1 ? 'hace 1 semana' : `hace ${diffWeek} semanas`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return diffMonth === 1 ? 'hace 1 mes' : `hace ${diffMonth} meses`;

  const diffYear = Math.floor(diffDay / 365);
  return diffYear === 1 ? 'hace 1 año' : `hace ${diffYear} años`;
}
