import * as XLSX from 'xlsx';
import type { EventSalesData, CategorySales } from '@lovable/data/salesStatsData';
import { getPaymentStatusLabel, isPaymentCompleted } from '@lovable/utils/paymentStatus';

export const exportSalesExcel = (data: EventSalesData) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ventas (detailed ticket sales)
  const ventasRows: Record<string, unknown>[] = [];
  const priceMap: Record<string, number> = {};
  data.categories.forEach(cat => {
    priceMap[cat.name] = cat.sold > 0 ? Math.round(cat.revenue / cat.sold) : 0;
  });

  data.categories.forEach(cat => {
    const price = priceMap[cat.name];
    cat.seats.filter(s => s.sold).forEach(seat => {
      ventasRows.push({
        'Categoría': cat.name,
        'Fila': seat.row,
        'Columna': seat.number,
        'Asiento': `${seat.row}${seat.number}`,
        'Precio': price,
        'Moneda': data.currency,
        'Comprador': seat.buyerName ?? '',
      });
    });
  });

  const wsVentas = XLSX.utils.json_to_sheet(ventasRows);
  wsVentas['!cols'] = [
    { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 8 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');

  // Sheet 2: Resumen (summary by category)
  const resumenRows = data.categories.map(cat => ({
    'Categoría': cat.name,
    'Total asientos': cat.total,
    'Vendidos': cat.sold,
    'Disponibles': cat.available,
    'Ocupación %': cat.occupancy,
    'Neto vendido': cat.revenue,
    'Moneda': data.currency,
  }));

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  wsResumen['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 14 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const safeName = data.eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `ventas_${safeName}_${date}.xlsx`;

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    // Try standard download approach
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Fallback: open in new tab if download doesn't trigger
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    alert('No se pudo descargar el archivo. Intenta desde la URL publicada de la app.');
  }
};

export const exportCategoryBuyersExcel = (category: CategorySales, eventName: string, currency: string) => {
  const wb = XLSX.utils.book_new();

  const rows = category.seats.filter(s => s.sold).map(seat => ({
    'Asiento': `${seat.row}${seat.number}`,
    'Nombre': seat.buyerName ?? '',
    'Teléfono': seat.buyerPhone ?? '',
    'Email': seat.buyerEmail ?? '',
    'Fecha de compra': seat.purchaseDate ?? '',
    'Autorización pago': seat.paymentAuthorization === 'before' ? 'Pre-evento' : 'Post-evento',
    'Estado pago': getPaymentStatusLabel(seat.paymentAuthorization!, seat.purchaseDate),
    'Monto neto': seat.amountPaid ?? 0,
    'Comisión plataforma': seat.platformCommission ?? 0,
    'Total con comisión': seat.totalWithCommission ?? 0,
    'Moneda': currency,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 10 }, { wch: 22 }, { wch: 18 }, { wch: 28 },
    { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, `Compradores ${category.name}`);

  const safeName = eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `compradores_${category.name}_${safeName}_${date}.xlsx`;

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

export const exportAllBuyersExcel = (data: EventSalesData) => {
  const wb = XLSX.utils.book_new();

  const rows = data.categories.flatMap(cat =>
    cat.seats.filter(s => s.sold).map(seat => ({
      'Categoría': cat.name,
      'Asiento': `${seat.row}${seat.number}`,
      'Nombre': seat.buyerName ?? '',
      'Teléfono': seat.buyerPhone ?? '',
      'Email': seat.buyerEmail ?? '',
      'Fecha de compra': seat.purchaseDate ?? '',
      'Autorización pago': seat.paymentAuthorization === 'before' ? 'Pre-evento' : 'Post-evento',
      'Estado pago': getPaymentStatusLabel(seat.paymentAuthorization!, seat.purchaseDate),
      'Monto neto': seat.amountPaid ?? 0,
      'Comisión plataforma': seat.platformCommission ?? 0,
      'Total con comisión': seat.totalWithCommission ?? 0,
      'Moneda': data.currency,
    }))
  );

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 18 }, { wch: 28 },
    { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Todos los compradores');

  const safeName = data.eventName.replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `compradores_todos_${safeName}_${date}.xlsx`;

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
