import { useEffect, useState } from 'react';
import {
  extractVenueImageUrls,
  fetchEventDetail,
  getVenueById,
  resolveImageUrl,
} from '@doevents/shared';
import type { InvitationEvent } from '@lovable/data/invitationsData';
import { eventDetailToInvitationEvent, type EventDetailViewOptions } from './eventDetailAdapter';

export function useInvitationEventDetail(resolvedId?: string) {
  const [loading, setLoading] = useState(Boolean(resolvedId));
  const [invitationEvent, setInvitationEvent] = useState<InvitationEvent | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!resolvedId) {
      setLoading(false);
      setInvitationEvent(null);
      setError('');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const detail = await fetchEventDetail(resolvedId);
        let venueOptions: EventDetailViewOptions['venue'];
        const venueId = detail?.event?.venueId;
        if (venueId) {
          try {
            const venue = await getVenueById(venueId);
            const images = extractVenueImageUrls(venue as Record<string, unknown>)
              .map((url) => resolveImageUrl(url) || url)
              .filter(Boolean);
            venueOptions = {
              name: venue.name,
              address: venue.address || undefined,
              images,
            };
          } catch {
            /* venue opcional */
          }
        }
        if (!cancelled) {
          setInvitationEvent(
            detail
              ? (eventDetailToInvitationEvent(detail, venueOptions))
              : null,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el evento');
          setInvitationEvent(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [resolvedId, reloadKey]);

  return {
    loading,
    invitationEvent,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}
