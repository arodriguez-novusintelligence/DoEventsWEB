import type { EventChatRoom } from '@lovable/data/chatData';
import SalesStatsView from '@lovable/components/stats/SalesStatsView';

export interface EventSalesDetailProps {
  event: EventChatRoom;
  onBack: () => void;
}

/**
 * Detalle de ventas por evento — empalme Lovable.
 * Delega en `SalesStatsView` con APIs reales (`useLiveEventStats`, export Excel).
 */
export const EventSalesDetail = ({ event, onBack }: EventSalesDetailProps) => (
  <SalesStatsView event={event} onBack={onBack} />
);

export default EventSalesDetail;
