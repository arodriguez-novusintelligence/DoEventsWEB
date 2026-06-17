import * as XLSX from 'xlsx';
import type { GuestStatsData, GuestInfo } from '@lovable/data/guestStatsData';
import { getPaymentStatusLabel } from '@lovable/utils/paymentStatus';

export const exportGuestExcel = (data: GuestStatsData, eventName: string) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Embudo por Canal
  const funnelRows: Record<string, unknown>[] = [];
  data.channels.forEach(ch => {
    ch.funnel.forEach(step => {
      funnelRows.push({
        'Canal': ch.name.replace('\n', ' '),
        'Etapa': step.label,
        'Cantidad': step.value,
        'Porcentaje': `${step.percentage}%`,
      });
    });
  });
  const wsFunnel = XLSX.utils.json_to_sheet(funnelRows);
  wsFunnel['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsFunnel, 'Embudo por Canal');

  // Sheet 2: Invitados por Canal
  const guestRows: Record<string, unknown>[] = [];
  data.channels.forEach(ch => {
    ch.guests.forEach(g => {
      guestRows.push({
        'Canal': ch.name.replace('\n', ' '),
        'Nombre': g.name,
        'Confirmado': g.confirmed ? 'Sí' : 'No',
      });
    });
  });
  const wsGuests = XLSX.utils.json_to_sheet(guestRows);
  wsGuests['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsGuests, 'Invitados');

  // Sheet 3: Resumen
  const resumenRows = [
    { 'Métrica': 'Tasa de Entrega Promedio', 'Valor': `${data.avgDeliveryRate}%` },
    { 'Métrica': 'Tasa de Apertura Promedio', 'Valor': `${data.avgOpenRate}%` },
    { 'Métrica': 'Tasa de Conversión Promedio', 'Valor': `${data.avgConversionRate}%` },
    { 'Métrica': 'Total Confirmaciones', 'Valor': data.totalConfirmations.toString() },
  ];
  data.channels.forEach(ch => {
    resumenRows.push({
      'Métrica': `${ch.name.replace('\n', ' ')} - Enviados`,
      'Valor': ch.sent.toLocaleString('es-CO'),
    });
    resumenRows.push({
      'Métrica': `${ch.name.replace('\n', ' ')} - Conversión`,
      'Valor': `${ch.conversionRate}%`,
    });
  });
  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 32 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const safeName = eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `invitados_${safeName}_${date}.xlsx`;

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    alert('No se pudo descargar el archivo. Intenta desde la URL publicada de la app.');
  }
};

export const exportGuestBuyersExcel = (guests: GuestInfo[], eventName: string, currency: string) => {
  const wb = XLSX.utils.book_new();
  const buyers = guests.filter(g => g.confirmed);

  const rows = buyers.map(g => ({
    'Nombre': g.name,
    'Teléfono': g.phone ?? '',
    'Email': g.email ?? '',
    'Categoría': g.category ?? '',
    'Fecha de compra': g.purchaseDate ?? '',
    'Autorización pago': g.paymentAuthorization === 'before' ? 'Pre-evento' : 'Post-evento',
    'Estado pago': getPaymentStatusLabel(g.paymentAuthorization!, g.purchaseDate),
    'Monto neto': g.amountPaid ?? 0,
    'Comisión plataforma': g.platformCommission ?? 0,
    'Total con comisión': g.totalWithCommission ?? 0,
    'Moneda': currency,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, { wch: 18 }, { wch: 28 }, { wch: 12 },
    { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Compradores');

  const safeName = eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `compradores_invitados_${safeName}_${date}.xlsx`;

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    alert('No se pudo descargar el archivo. Intenta desde la URL publicada de la app.');
  }
};
