import React, { useCallback, useEffect, useState } from 'react';
import { formatRelativeTime, resolveImageUrl, uploadMediaFile } from '@doevents/shared';
import LovableCommentsSheet from '@lovable/components/feed/CommentsSheet';
import type { Comment } from '@doevents/shared';

interface ApiComment {
  id: string;
  text?: string;
  content?: string;
  createdAt?: string | number;
  author?: { id?: string; name?: string; username?: string };
  user?: { id?: string; name?: string; username?: string; avatarUrl?: string | null };
  authorId?: string;
  authorName?: string;
  images?: string[];
  media?: Array<{ url?: string }>;
}

export interface CommentSubmitPayload {
  text: string;
  parentCommentId?: string;
  mediaIds?: string[];
}

export interface LovableCommentsBridgeProps {
  open: boolean;
  onClose: () => void;
  publicationId: string | null;
  currentUserId?: string;
  loadComments: (publicationId: string) => Promise<ApiComment[]>;
  onSubmitComment: (publicationId: string, payload: CommentSubmitPayload) => Promise<void>;
  onReportComment?: (commentId: string) => Promise<void>;
}

function mapComment(item: ApiComment): Comment {
  const author = item.user || item.author;
  const name = author?.name || item.authorName || author?.username || 'Usuario';
  const images = (item.images?.length
    ? item.images
    : (item.media || []).map((m) => m.url).filter(Boolean)
  ).map((url) => resolveImageUrl(url) || url).filter(Boolean) as string[];

  return {
    id: item.id,
    user: {
      id: author?.id || item.authorId || item.id,
      name,
      initials: name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
    },
    text: item.text || item.content || '',
    timeAgo: formatRelativeTime(item.createdAt || Date.now()),
    likes: 0,
    replies: 0,
    images,
  };
}

export const LovableCommentsBridge: React.FC<LovableCommentsBridgeProps> = ({
  open,
  onClose,
  publicationId,
  currentUserId,
  loadComments,
  onSubmitComment,
  onReportComment,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicationId) return;
    const items = await loadComments(publicationId);
    setComments((items || []).map(mapComment));
  }, [loadComments, publicationId]);

  useEffect(() => {
    if (!open || !publicationId) return;
    refresh().catch(() => setComments([]));
  }, [open, publicationId, refresh]);

  return (
    <LovableCommentsSheet
      open={open}
      onOpenChange={(value) => { if (!value) onClose(); }}
      comments={comments}
      totalComments={comments.length}
      currentUserId={currentUserId}
      sending={sending}
      onAddComment={async (text, parentId, imageFiles) => {
        if (!publicationId) return;
        setSending(true);
        try {
          let mediaIds: string[] | undefined;
          if (imageFiles?.length) {
            mediaIds = await Promise.all(imageFiles.map((file) => uploadMediaFile(file)));
          }
          await onSubmitComment(publicationId, {
            text,
            parentCommentId: parentId,
            mediaIds,
          });
          await refresh();
        } finally {
          setSending(false);
        }
      }}
      onReportComment={onReportComment ? async (commentId) => {
        await onReportComment(commentId);
      } : undefined}
    />
  );
};

export default LovableCommentsBridge;
