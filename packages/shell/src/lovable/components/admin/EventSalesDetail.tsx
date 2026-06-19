import type { EventChatRoom } from '@lovable/data/chatData';
import SalesStatsView from '@lovable/components/stats/SalesStatsView';

interface EventSalesDetailProps {
  event: EventChatRoom;
  onBack: () => void;
}

export const EventSalesDetail = ({ event, onBack }: EventSalesDetailProps) => (
  <SalesStatsView event={event} onBack={onBack} />
);

export default EventSalesDetail;
