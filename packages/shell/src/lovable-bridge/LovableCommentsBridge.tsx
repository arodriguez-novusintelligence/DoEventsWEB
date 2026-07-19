import React, { useCallback, useEffect, useState } from 'react';
import {
  formatRelativeTime,
  resolveImageUrl,
  toggleCommentLike,
  uploadMediaFile,
  fetchPublicationComments,
} from '@doevents/shared';
import LovableCommentsSheet from '@lovable/components/feed/CommentsSheet';
import type { Comment } from '@doevents/shared';

interface ApiComment {
  id: string;
  text?: string;
  content?: string;
  createdAt?: string | number;
  parentCommentId?: string | null;
  author?: { id?: string; name?: string; username?: string; avatarUrl?: string | null };
  user?: { id?: string; name?: string; username?: string; avatarUrl?: string | null };
  authorId?: string;
  authorName?: string;
  images?: string[];
  media?: Array<{ url?: string }>;
  stats?: { likes?: number; replies?: number };
  viewerState?: { liked?: boolean };
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
      avatarUrl: author?.avatarUrl || undefined,
    },
    text: item.text || item.content || '',
    timeAgo: formatRelativeTime(item.createdAt ? String(item.createdAt) : undefined),
    likes: Number(item.stats?.likes ?? 0),
    liked: Boolean(item.viewerState?.liked),
    replies: Number(item.stats?.replies ?? 0),
    images,
  };
}

/** Anida respuestas bajo su comentario padre; roots sin parent o con parent huérfano. */
function nestComments(items: ApiComment[]): Comment[] {
  const mapped = new Map<string, Comment>();
  for (const item of items) {
    mapped.set(item.id, mapComment(item));
  }

  const roots: Comment[] = [];
  for (const item of items) {
    const comment = mapped.get(item.id);
    if (!comment) continue;
    const parentId = item.parentCommentId ? String(item.parentCommentId) : '';
    if (parentId && mapped.has(parentId)) {
      const parent = mapped.get(parentId)!;
      parent.repliesData = parent.repliesData || [];
      parent.repliesData.push(comment);
    } else if (!parentId) {
      roots.push(comment);
    } else {
      // parent missing in page → treat as root so it remains visible
      roots.push(comment);
    }
  }

  for (const root of roots) {
    if (root.repliesData?.length) {
      root.replies = root.repliesData.length;
    }
  }
  return roots;
}

function findComment(comments: Comment[], commentId: string): Comment | undefined {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    if (comment.repliesData?.length) {
      const nested = findComment(comment.repliesData, commentId);
      if (nested) return nested;
    }
  }
  return undefined;
}

function updateCommentLike(
  comments: Comment[],
  commentId: string,
  liked: boolean,
  likes: number,
): Comment[] {
  return comments.map((comment) => ({
    ...comment,
    ...(comment.id === commentId ? { liked, likes } : {}),
    ...(comment.repliesData
      ? { repliesData: updateCommentLike(comment.repliesData, commentId, liked, likes) }
      : {}),
  }));
}

function setRepliesData(
  comments: Comment[],
  parentId: string,
  replies: Comment[],
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        repliesData: replies,
        replies: replies.length || comment.replies,
      };
    }
    if (comment.repliesData?.length) {
      return {
        ...comment,
        repliesData: setRepliesData(comment.repliesData, parentId, replies),
      };
    }
    return comment;
  });
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
    setComments(nestComments(items || []));
  }, [loadComments, publicationId]);

  useEffect(() => {
    if (!open || !publicationId) return;
    refresh().catch(() => setComments([]));
  }, [open, publicationId, refresh]);

  const handleToggleLike = useCallback(async (commentId: string, liked: boolean) => {
    let previousLiked = false;
    let previousLikes = 0;
    setComments((current) => {
      const comment = findComment(current, commentId);
      previousLiked = Boolean(comment?.liked);
      previousLikes = Number(comment?.likes ?? 0);
      const optimisticLikes = Math.max(0, previousLikes + (liked ? 1 : -1));
      return updateCommentLike(current, commentId, liked, optimisticLikes);
    });

    try {
      const result = await toggleCommentLike(commentId, liked);
      setComments((current) => updateCommentLike(
        current,
        commentId,
        result.viewerState?.liked ?? liked,
        Number(result.stats?.likes ?? Math.max(0, previousLikes + (liked ? 1 : -1))),
      ));
    } catch {
      setComments((current) => updateCommentLike(
        current,
        commentId,
        previousLiked,
        previousLikes,
      ));
    }
  }, []);

  const handleLoadReplies = useCallback(async (parentCommentId: string) => {
    if (!publicationId) return;
    const existing = findComment(comments, parentCommentId);
    if (existing?.repliesData && existing.repliesData.length > 0) return;
    try {
      const data = await fetchPublicationComments(publicationId, 50, { parentCommentId });
      const replies = (data.items || []).map(mapComment);
      setComments((current) => setRepliesData(current, parentCommentId, replies));
    } catch {
      /* keep count label; empty replies stay empty */
    }
  }, [comments, publicationId]);

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
      onToggleLike={handleToggleLike}
      onLoadReplies={handleLoadReplies}
    />
  );
};

export default LovableCommentsBridge;
