import React from 'react';
import type { FeedPublication } from '@doevents/shared';
import LovablePostCard from '@lovable/components/feed/PostCard';
import type { User } from '@lovable/data/mockData';
import { feedPublicationToLovablePost } from './feedAdapter';

export interface LovablePostCardBridgeProps {
  post: FeedPublication;
  liked?: boolean;
  followed?: boolean;
  isOwner?: boolean;
  onLike: () => void;
  onComment: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onFollow?: () => void;
  onAuthorClick?: () => void;
  onOpen?: () => void;
  onMentionClick?: (mention: string) => void;
  onMenuAction?: (action: 'hide' | 'save' | 'not-interested' | 'block' | 'report') => void;
  onOpenStory?: (userId: string) => void;
}

export const LovablePostCardBridge: React.FC<LovablePostCardBridgeProps> = ({
  post,
  liked = Boolean(post.viewerState?.liked),
  followed = Boolean(post.author?.isFollowing),
  isOwner = Boolean(post.viewerState?.canDelete),
  onLike,
  onComment,
  onRepost,
  onShare,
  onDelete,
  onEdit,
  onFollow,
  onAuthorClick,
  onOpen,
  onMentionClick,
  onMenuAction,
  onOpenStory,
}) => {
  const lovablePost = feedPublicationToLovablePost(post);

  return (
    <LovablePostCard
      post={lovablePost}
      liked={liked}
      followed={followed}
      isOwner={isOwner}
      onLike={onLike}
      onFollow={onFollow || (() => undefined)}
      onComment={onComment}
      onRepost={onRepost || (() => undefined)}
      onShare={onShare || (() => undefined)}
      onHide={() => onMenuAction?.('hide')}
      onNotInterested={() => onMenuAction?.('not-interested')}
      onBlock={() => onMenuAction?.('block')}
      onReport={() => onMenuAction?.('report')}
      onDelete={onDelete}
      onEdit={onEdit}
      onViewProfile={(user: User) => {
        if (onAuthorClick) onAuthorClick();
        else if (user.id) window.location.assign(`/users/${user.id}`);
      }}
      onOpenDetail={onOpen ? () => onOpen() : undefined}
      onMentionClick={onMentionClick}
      onOpenStory={onOpenStory}
    />
  );
};

export default LovablePostCardBridge;
