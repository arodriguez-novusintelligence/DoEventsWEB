import * as XLSX from 'xlsx';
import type { EventRefundsData, RefundRequest, RefundStatus, RefundSource, RefundPayer, PaymentTiming } from '@lovable/data/refundsData';

const statusLabel: Record<RefundStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  processed: 'Procesado',
};

const sourceLabel: Record<RefundSource, string> = {
  user_request: 'Solicitud de usuario',
  event_cancellation: 'Cancelación de evento',
};

const payerLabel: Record<RefundPayer, string> = {
  platform: 'Plataforma',
  organizer: 'Organizador',
};

const timingLabel: Record<PaymentTiming, string> = {
  pre_event: 'Pre-evento',
  post_event: 'Post-evento',
};

export const exportRefundsExcel = (data: EventRefundsData, requests: RefundRequest[]) => {
  const wb = XLSX.utils.book_new();

  // Resumen
  const totalApprovedProcessed = requests.filter(r => r.status === 'approved' || r.status === 'processed');
  const resumenRows = [
    { 'Métrica': 'Evento', 'Valor': data.eventName },
    { 'Métrica': 'Política', 'Valor': data.policyLabel },
    { 'Métrica': 'Moneda', 'Valor': data.currency },
    { 'Métrica': 'Total solicitudes', 'Valor': requests.length },
    { 'Métrica': 'Pendientes', 'Valor': requests.filter(r => r.status === 'pending').length },
    { 'Métrica': 'Aprobadas', 'Valor': requests.filter(r => r.status === 'approved').length },
    { 'Métrica': 'Procesadas', 'Valor': requests.filter(r => r.status === 'processed').length },
    { 'Métrica': 'Rechazadas', 'Valor': requests.filter(r => r.status === 'rejected').length },
    { 'Métrica': 'Por solicitud de usuario', 'Valor': requests.filter(r => r.source === 'user_request').length },
    { 'Métrica': 'Por cancelación de evento', 'Valor': requests.filter(r => r.source === 'event_cancellation').length },
    { 'Métrica': 'Total reembolsado (aprobado + procesado)', 'Valor': totalApprovedProcessed.reduce((s, r) => s + r.totalAmount, 0) },
    { 'Métrica': 'Asume Plataforma', 'Valor': totalApprovedProcessed.filter(r => r.payer === 'platform').reduce((s, r) => s + r.totalAmount, 0) },
    { 'Métrica': 'Asume Organizador', 'Valor': totalApprovedProcessed.filter(r => r.payer === 'organizer').reduce((s, r) => s + r.totalAmount, 0) },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 42 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Solicitudes
  const reqRows = requests.map(r => ({
    'ID Solicitud': r.id,
    'ID Orden': r.orderId,
    'Comprador': r.buyerName,
    'Email': r.buyerEmail,
    'Teléfono': r.buyerPhone,
    'Fecha solicitud': r.requestDate,
    'Fecha evento': r.eventDate,
    'Días al evento': r.daysBeforeEvent,
    'Boletas': r.tickets.length,
    'Monto total': r.totalAmount,
    'Moneda': data.currency,
    'Motivo': r.reason,
    'Comentario': r.comment ?? '',
    'Estado': statusLabel[r.status],
    'Fuente': sourceLabel[r.source],
    'Dentro de política': r.withinPolicy ? 'Sí' : 'No',
    'Límite política (días)': r.policyLimitDays,
    'Pago': timingLabel[r.paymentTiming],
    'Asume': payerLabel[r.payer],
    'Requiere revisión organizador': r.requiresOrganizerReview ? 'Sí' : 'No',
    'Fecha límite resolución': r.resolutionDeadline,
    'Días hábiles restantes': r.businessDaysRemaining,
    'Vencida': r.isOverdue ? 'Sí' : 'No',
  }));
  const wsReq = XLSX.utils.json_to_sheet(reqRows);
  wsReq['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 26 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 9 }, { wch: 14 }, { wch: 8 },
    { wch: 28 }, { wch: 32 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReq, 'Solicitudes');

  // Boletas detalladas
  const ticketRows: Record<string, unknown>[] = [];
  requests.forEach(r => {
    r.tickets.forEach(t => {
      ticketRows.push({
        'ID Solicitud': r.id,
        'Comprador': r.buyerName,
        'Estado': statusLabel[r.status],
        'Fuente': sourceLabel[r.source],
        'Categoría': t.category,
        'Fila': t.row,
        'Asiento': t.seat,
        'Monto': t.amount,
        'Moneda': data.currency,
      });
    });
  });
  const wsTickets = XLSX.utils.json_to_sheet(ticketRows);
  wsTickets['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 22 },
    { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Boletas');

  const safeName = data.eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `reembolsos_${safeName}_${date}.xlsx`;

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
