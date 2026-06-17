import * as XLSX from 'xlsx';
import type { AccessControlData } from '@lovable/data/accessControlData';

export const exportAccessExcel = (data: AccessControlData, eventName: string) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen
  const resumenRows = [
    { 'Métrica': 'Total Boletos', 'Valor': data.totalTickets },
    { 'Métrica': 'Accesos Concedidos', 'Valor': data.accessGranted },
    { 'Métrica': 'Asistencia', 'Valor': `${data.attendance}%` },
    { 'Métrica': 'Denegaciones', 'Valor': data.denials },
    { 'Métrica': 'Dentro Actual', 'Valor': data.currentInside },
    { 'Métrica': 'Escaneos Válidos', 'Valor': data.accessStatus.valid },
    { 'Métrica': 'Escaneos Inválidos', 'Valor': data.accessStatus.invalid },
    { 'Métrica': 'Escaneos Duplicados', 'Valor': data.accessStatus.duplicate },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 24 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Sheet 2: Puertas
  const gateRows = data.gates.map(g => ({
    'Puerta': g.name,
    'Total Intentos': g.totalAttempts,
    'Concedidos': g.granted,
    'Denegados': g.denied,
    'Porcentaje': `${g.percentage}%`,
    'Estado': g.status,
  }));
  const wsGates = XLSX.utils.json_to_sheet(gateRows);
  wsGates['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsGates, 'Puertas');

  // Sheet 3: Tráfico por Tipo
  const trafficRows = data.trafficByType.map(t => ({
    'Tipo de Boleta': t.type,
    'Concedidos': t.granted,
    'Denegados': t.denied,
  }));
  const wsTraffic = XLSX.utils.json_to_sheet(trafficRows);
  wsTraffic['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTraffic, 'Tráfico');

  // Sheet 4: Asistentes
  const attendeeRows: Record<string, unknown>[] = [];
  data.attendeesByType.forEach(group => {
    group.attendees.forEach(a => {
      attendeeRows.push({
        'Tipo': group.type,
        'Nombre': a.name,
        'Estado': a.status === 'granted' ? 'Concedido' : a.status === 'denied' ? 'Denegado' : 'Pendiente',
      });
    });
  });
  const wsAttendees = XLSX.utils.json_to_sheet(attendeeRows);
  wsAttendees['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsAttendees, 'Asistentes');

  const safeName = eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `accesos_${safeName}_${date}.xlsx`;

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
