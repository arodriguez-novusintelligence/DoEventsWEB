import type { EventChatRoom } from '@lovable/data/chatData';
import SalesStatsView from '@lovable/components/stats/SalesStatsView';

interface EventSalesDetailProps {
  event: EventChatRoom;
  onBack: () => void;
}

/** Empalme Lovable — delega en SalesStatsView con APIs reales (`useLiveEventStats`). */
export const EventSalesDetail = ({ event, onBack }: EventSalesDetailProps) => (
  <SalesStatsView event={event} onBack={onBack} />
);

export default EventSalesDetail;
