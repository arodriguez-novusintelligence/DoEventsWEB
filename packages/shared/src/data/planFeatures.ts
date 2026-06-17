export interface PlanFeature {
  id: string;
  title: string;
  summary: string;
  detail: string;
}

export const PLATFORM_PRICING = {
  feeLabel: '8% + $1.500 COP + IVA',
  summary:
    'Esta es la tarifa de intermediación que cobraría la plataforma de eventos por ticket o boleta vendida. Sin costos ocultos.',
  includes: [
    'Servicio de plataforma DoEvents',
    'Pasarela de pagos',
    'Gastos bancarios',
  ],
  ivaNote:
    'Es importante anotar que el IVA (19%) en esta plataforma se calcula sobre el valor de la tarifa.',
  detailUrl: 'https://www.doeventsapp.com/products',
  detailLinkLabel: 'Tarifas DoEvents',
};

export const FREE_PLAN_FEATURES: PlanFeature[] = [
  {
    id: 'platform-fee',
    title: 'Costos de la plataforma',
    summary: PLATFORM_PRICING.feeLabel,
    detail: `${PLATFORM_PRICING.summary} ${PLATFORM_PRICING.ivaNote} Incluye: ${PLATFORM_PRICING.includes.join(', ')}.`,
  },
  {
    id: 'feed',
    title: 'Feed social y publicaciones',
    summary: 'Publica y descubre contenido en la red DoEvents.',
    detail: 'Comparte fotos, videos y publicaciones con la comunidad. Interactúa con likes y comentarios.',
  },
  {
    id: 'events-basic',
    title: 'Creación básica de eventos',
    summary: 'Publica eventos con información esencial.',
    detail: 'Define nombre, fecha, lugar, descripción e imagen de portada para tus eventos.',
  },
  {
    id: 'tickets-basic',
    title: 'Venta de boletas estándar',
    summary: 'Vende entradas con checkout integrado.',
    detail: 'Configura tipos de boleta, precios y capacidad con el flujo de compra de DoEvents.',
  },
];

export const PRO_PLAN_FEATURES: PlanFeature[] = [
  {
    id: 'access',
    title: 'Control de accesos',
    summary: 'Validación de ingreso con QR y control en puerta.',
    detail: 'Escanea boletas, registra accesos en tiempo real y evita duplicados en la entrada del evento.',
  },
  {
    id: 'promo',
    title: 'Creación de código promocional',
    summary: 'Descuentos y campañas con códigos personalizados.',
    detail: 'Genera códigos promocionales por porcentaje o valor fijo, con límites de uso y vigencia.',
  },
  {
    id: 'agenda',
    title: 'Agenda del evento',
    summary: 'Programación detallada por día y actividad.',
    detail: 'Organiza la agenda con horarios, responsables y descripción de cada actividad del evento.',
  },
  {
    id: 'crm',
    title: 'Gestión de invitados CRM',
    summary: 'Base de invitados, estados y seguimiento.',
    detail: 'Administra invitados, confirma asistencia, segmenta contactos y lleva control de tu audiencia.',
  },
  {
    id: 'marketing',
    title: 'Marketing digital y notificaciones',
    summary: 'Campañas push, email y recordatorios automáticos.',
    detail: 'Envía notificaciones a asistentes, promociona tu evento y automatiza comunicaciones clave.',
  },
  {
    id: 'transfer',
    title: 'Transferencia de boletos',
    summary: 'Tus asistentes pueden transferir entradas.',
    detail: 'Permite reasignar boletas de forma segura entre usuarios registrados en la plataforma.',
  },
];

export const PLAN_TERMS = [
  'La suscripción PRO se factura de forma mensual y se renueva automáticamente salvo cancelación.',
  'Puedes cancelar en cualquier momento desde tu perfil; el acceso PRO continúa hasta el fin del periodo pagado.',
  'Los beneficios PRO aplican a la cuenta titular y no son transferibles a otros perfiles.',
  'DoEvents puede actualizar funcionalidades incluidas en cada plan notificando por la app o correo.',
  'El uso de herramientas de marketing y notificaciones debe cumplir las políticas anti-spam vigentes.',
  'Los reembolsos de suscripción siguen la política comercial publicada en doeventsapp.com.',
];
