import React, { useEffect, useMemo, useState } from 'react';

import type { FeedStoryRing } from '@doevents/shared';

import {

  fetchNearbyStories,

  getStoredUserLocation,

  resolveImageUrl,

  UserAvatar,

} from '@doevents/shared';



export interface FeedStoriesSectionProps {

  refreshKey?: number;

  currentUserId?: string | null;

  currentUserName?: string;

  currentUserAvatar?: string;

  onCreateStory?: () => void;

  onOpenStory?: (authorUserId: string) => void;

}



export const FeedStoriesSection: React.FC<FeedStoriesSectionProps> = ({

  refreshKey = 0,

  currentUserId,

  currentUserName,

  currentUserAvatar,

  onCreateStory,

  onOpenStory,

}) => {

  const [rings, setRings] = useState<FeedStoryRing[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    let cancelled = false;

    setLoading(true);

    const location = getStoredUserLocation();

    fetchNearbyStories({

      lat: location?.lat,

      lng: location?.lng,

      radiusKm: 80,

      limit: 20,

    })

      .then((items) => {

        if (cancelled) return;

        setRings(items);

      })

      .catch(() => {

        if (!cancelled) setRings([]);

      })

      .finally(() => {

        if (!cancelled) setLoading(false);

      });

    return () => { cancelled = true; };

  }, [refreshKey]);



  const stories = useMemo(() => {

    const result: FeedStoryRing[] = [];

    const seen = new Set<string>();



    const hasActiveStories = (ring?: FeedStoryRing) => Boolean(
      ring && (
        ring.live
        || (ring.storyCount != null && ring.storyCount > 0)
        || Boolean(ring.previewUrl)
      ),
    );

    if (currentUserId) {

      const ownRing = rings.find((r) => r.authorId === currentUserId);

      result.push({

        id: `own-${currentUserId}`,

        authorId: currentUserId,

        name: 'Tu historia',

        avatarUrl: resolveImageUrl(currentUserAvatar),

        previewUrl: ownRing?.previewUrl,

        live: ownRing?.live,

        isOwn: true,

        storyCount: ownRing?.storyCount,

        hasStory: hasActiveStories(ownRing),

      });

      seen.add(currentUserId);

    }



    rings.forEach((ring) => {

      if (!ring.authorId || seen.has(ring.authorId)) return;

      seen.add(ring.authorId);

      result.push(ring);

    });



    return result.slice(0, 14);

  }, [rings, currentUserId, currentUserAvatar]);



  if (!loading && !stories.length) return null;



  return (

    <section className="de-feed-stories">

      <div className="de-feed-stories__header">

        <h2>En vivo &amp; Historias</h2>

        <span className="de-feed-stories__live">

          <span className="de-feed-stories__live-dot" aria-hidden="true" />

          Cerca de ti

        </span>

      </div>

      <div className="de-feed-stories__scroll">

        {loading && <p className="de-feed-stories__loading">Cargando historias…</p>}

        {!loading && stories.map((story) => (

          <button

            key={story.id}

            type="button"

            className="de-feed-stories__item"

            onClick={() => {

              if (story.isOwn) {

                if (story.hasStory && story.authorId) {

                  onOpenStory?.(story.authorId);

                  return;

                }

                onCreateStory?.();

                return;

              }

              if (story.authorId) onOpenStory?.(story.authorId);

            }}

          >

            <span className={[
              'de-feed-stories__ring',
              story.live ? 'de-feed-stories__ring--live' : '',
              story.isOwn && !story.hasStory ? 'de-feed-stories__ring--own-idle' : '',
            ].filter(Boolean).join(' ')}>

              <UserAvatar name={story.name} imageUrl={story.avatarUrl} size={56} />

              {story.live && <span className="de-feed-stories__badge">Live</span>}

              {story.isOwn && (
                <span
                  className="de-feed-stories__add"
                  role="button"
                  tabIndex={0}
                  aria-label="Agregar historia"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateStory?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onCreateStory?.();
                    }
                  }}
                >
                  +
                </span>
              )}

              {!story.isOwn && (story.storyCount || 0) > 1 && (

                <span className="de-feed-stories__count">{story.storyCount}</span>

              )}

            </span>

            <span className="de-feed-stories__label">{story.name}</span>

          </button>

        ))}

      </div>

    </section>

  );

};



export default FeedStoriesSection;


