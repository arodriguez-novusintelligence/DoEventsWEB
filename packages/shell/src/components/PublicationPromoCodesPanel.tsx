import {
  getPersistedPlatformRole,
  isEntityOwner,
  isPlatformAdmin,
} from '@doevents/shared';
import PromoCodesStatsView from '@lovable/components/stats/PromoCodesStatsView';
import type { EventChatRoom } from '@lovable/data/chatData';

export type PublicationPromoEntityType = 'event' | 'venue' | 'service';

export function canViewPublicationPromoCodes(
  userId: string | undefined | null,
  ownerUserId: string | undefined | null,
  platformRole?: string | null,
): boolean {
  if (!userId) return false;
  if (isEntityOwner(userId, ownerUserId)) return true;
  return isPlatformAdmin(platformRole ?? getPersistedPlatformRole());
}

interface PublicationPromoCodesPanelProps {
  entityType: PublicationPromoEntityType;
  entityId: string;
  entityName: string;
  ownerUserId?: string | null;
  userId?: string | null;
  platformRole?: string | null;
  imageUrl?: string;
  className?: string;
}

export function PublicationPromoCodesPanel({
  entityType,
  entityId,
  entityName,
  ownerUserId,
  userId,
  platformRole,
  imageUrl,
  className,
}: PublicationPromoCodesPanelProps) {
  if (!canViewPublicationPromoCodes(userId, ownerUserId, platformRole)) {
    return null;
  }

  const sharedProps = {
    embedded: true as const,
    onBack: () => undefined,
  };

  return (
    <div className={className}>
      {entityType === 'event' && (
        <PromoCodesStatsView
          {...sharedProps}
          event={{
            id: entityId,
            eventId: entityId,
            eventName: entityName,
            eventImage: imageUrl,
            eventDate: '',
            eventStatus: 'activo',
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
            attendees: [],
            messages: [],
          } satisfies EventChatRoom}
        />
      )}
      {entityType === 'service' && (
        <PromoCodesStatsView
          {...sharedProps}
          service={{ serviceId: entityId, name: entityName, imageUrl }}
        />
      )}
      {entityType === 'venue' && (
        <PromoCodesStatsView
          {...sharedProps}
          venue={{ venueId: entityId, name: entityName, imageUrl }}
        />
      )}
    </div>
  );
}

export default PublicationPromoCodesPanel;
