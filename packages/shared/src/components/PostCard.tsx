import React, { useState } from 'react';

import type { FeedPublication } from '../types/feed';

import { getEventMentionsFromFeedPublication, resolveEventIdFromFeedPublication } from '../lib/feedPublicationUtils';

import { formatRelativeTime } from '../lib/formatRelativeTime';
import { resolveDisplayLocation } from '../lib/formatMapLocation';

import { resolveImageUrl } from '../lib/resolveImageUrl';
import { UserAvatar } from './UserAvatar';

import { PostMediaCarousel } from './PostMediaCarousel';



export type PostMenuAction = 'hide' | 'save' | 'not-interested' | 'block' | 'report';



export interface PostCardProps {

  post: FeedPublication;

  onLike: () => void;

  onComment: () => void;

  onRepost?: () => void;

  onShare?: () => void;

  onDelete?: () => void;

  onFollow?: () => void;

  onMenuAction?: (action: PostMenuAction) => void;

  onOpen?: () => void;

  onAuthorClick?: () => void;

}



function resolveAuthorAvatar(post: FeedPublication): string | undefined {

  const author = post.author as { avatarUrl?: string | null; imageUrl?: string | null } | undefined;

  return resolveImageUrl(author?.avatarUrl || author?.imageUrl) || undefined;

}



function resolveMediaUrls(post: FeedPublication): string[] {

  if (post.images?.length) {

    return post.images.filter(Boolean);

  }

  if (post.imageUrl) {

    return [post.imageUrl];

  }

  return (post.media || []).map((entry) => entry.url).filter(Boolean);

}



export const PostCard: React.FC<PostCardProps> = ({

  post,

  onLike,

  onComment,

  onRepost,

  onShare,

  onDelete,

  onFollow,

  onMenuAction,

  onOpen,
  onAuthorClick,

}) => {

  const [menuOpen, setMenuOpen] = useState(false);

  const liked = post.viewerState?.liked;

  const reposted = post.viewerState?.reposted;

  const canDelete = post.viewerState?.canDelete;

  const linkedEventId = resolveEventIdFromFeedPublication(post);

  const eventMentions = getEventMentionsFromFeedPublication(post);

  const authorName = post.author?.name || 'Usuario';

  const authorAvatar = resolveAuthorAvatar(post);

  const mediaUrls = resolveMediaUrls(post);

  const badgeLabel = post.type === 'event' ? 'Evento' : 'Publicación';

  const showFollow = onFollow && post.author?.id && !post.author?.isFollowing;



  const runMenu = (action: PostMenuAction) => {

    setMenuOpen(false);

    onMenuAction?.(action);

  };



  return (

    <article className="de-post">

      <header className="de-post__header">

        <button
          type="button"
          className="de-post__avatar-btn"
          onClick={onAuthorClick}
          disabled={!onAuthorClick}
        >
          <UserAvatar name={authorName} imageUrl={authorAvatar} size={44} className="de-post__avatar" />
        </button>

        <div className="de-post__author-wrap">
          <button
            type="button"
            className="de-post__author de-post__author--link"
            onClick={onAuthorClick}
            disabled={!onAuthorClick}
          >
            {authorName}
          </button>
          <p className="de-post__time">{formatRelativeTime(post.createdAt)}</p>
        </div>

        <div className="de-post__header-end">
          {showFollow && (
            <button
              type="button"
              className="de-post__follow"
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
              }}
            >
              Seguir
            </button>
          )}

          <div className="de-post__menu-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="de-post__menu-btn"
              aria-label="Opciones"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="de-post__menu">
                <button type="button" onClick={() => runMenu('save')}>Guardar</button>
                <button type="button" onClick={() => runMenu('hide')}>Ocultar</button>
                <button type="button" onClick={() => runMenu('not-interested')}>No me interesa</button>
                <button type="button" onClick={() => runMenu('block')}>Bloquear</button>
                <button type="button" onClick={() => runMenu('report')}>Denunciar</button>
              </div>
            )}
          </div>

          {canDelete && onDelete && (
            <button type="button" className="de-post__delete" onClick={onDelete} aria-label="Eliminar">×</button>
          )}
        </div>
      </header>



      <div

        className={`de-post-card${onOpen ? ' de-post-card--clickable' : ''}`}

        onClick={onOpen ? onOpen : undefined}

        onKeyDown={onOpen ? (e) => { if (e.key === 'Enter') onOpen(); } : undefined}

        role={onOpen ? 'button' : undefined}

        tabIndex={onOpen ? 0 : undefined}

      >

        <span className="de-post-card__type-badge">{badgeLabel}</span>



        {mediaUrls.length > 0 && (

          <PostMediaCarousel images={mediaUrls} alt={post.title || authorName} />

        )}



        {post.title && <h3 className="de-post-card__title">{post.title}</h3>}

        {post.description && <p className="de-post-card__text">{post.description}</p>}



        {eventMentions.length > 0 && (

          <div className="de-post-card__mentions" onClick={(e) => e.stopPropagation()}>

            {eventMentions.map((mention, index) => {

              const label = mention.title || mention.name || mention.tag || 'Evento';

              return (

                <span key={`${mention.targetId || mention.eventId || index}`} className="de-post-card__event-mention">

                  {label}

                </span>

              );

            })}

          </div>

        )}



        {(post.locationLabel || post.dateLabel) && (

          <div className="de-post-card__meta">

            {post.dateLabel && <span>{post.dateLabel}</span>}

            {post.locationLabel && (
              <span>{resolveDisplayLocation({ label: post.locationLabel, locationLabel: post.locationLabel })}</span>
            )}

          </div>

        )}



        <div className="de-post-card__actions" onClick={(e) => e.stopPropagation()}>

          <button

            type="button"

            className={`de-post-action${liked ? ' de-post-action--active' : ''}`}

            onClick={onLike}

            aria-label="Me gusta"

          >

            <span className="de-post-action__icon" aria-hidden>♥</span>

            <span>{post.stats?.likes ?? 0}</span>

          </button>

          <button type="button" className="de-post-action" onClick={onComment} aria-label="Comentarios">

            <span className="de-post-action__icon" aria-hidden>💬</span>

            <span>{post.stats?.comments ?? 0}</span>

          </button>

          {onRepost && (

            <button

              type="button"

              className={`de-post-action${reposted ? ' de-post-action--active' : ''}`}

              onClick={onRepost}

              aria-label="Repostear"

            >

              <span className="de-post-action__icon" aria-hidden>↻</span>

              <span>{post.stats?.reposts ?? 0}</span>

            </button>

          )}

          {onShare && (

            <button type="button" className="de-post-action" onClick={onShare} aria-label="Compartir">

              <span className="de-post-action__icon" aria-hidden>↗</span>

              <span>{post.stats?.shares ?? 0}</span>

            </button>

          )}

        </div>

      </div>

    </article>

  );

};



export default PostCard;

