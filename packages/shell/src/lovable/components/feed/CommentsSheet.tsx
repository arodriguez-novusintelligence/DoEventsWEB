import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Flag, Heart, MessageSquare, MoreHorizontal, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { users, bannerEvents } from '@lovable/data/mockData';
import MentionText from './MentionText';
import MentionAutocomplete, { type MentionOption } from './MentionAutocomplete';
import type { Comment } from '@doevents/shared';

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  totalComments: number;
  currentUserId?: string;
  sending?: boolean;
  onAddComment: (text: string, parentId?: string, imageFiles?: File[]) => void;
  onMentionClick?: (mention: string) => void;
  onReportComment?: (commentId: string) => Promise<void>;
  onToggleLike?: (commentId: string, liked: boolean) => void;
  onLoadReplies?: (parentCommentId: string) => void | Promise<void>;
}

const CommentItem = ({
  comment,
  depth = 0,
  onReply,
  onMentionClick,
  onToggleLike,
  onReportComment,
  onLoadReplies,
}: {
  comment: Comment;
  depth?: number;
  onReply: (commentId: string, userName: string) => void;
  onMentionClick?: (mention: string) => void;
  onToggleLike?: (commentId: string, liked: boolean) => void;
  onReportComment?: (commentId: string) => Promise<void>;
  onLoadReplies?: (parentCommentId: string) => void | Promise<void>;
}) => {
  const replies = comment.repliesData || [];
  const totalReplies = Math.max(replies.length, Number(comment.replies || 0));
  const [showReplies, setShowReplies] = useState(totalReplies > 0 && replies.length > 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (replies.length > 0 && totalReplies > 0) {
      setShowReplies(true);
    }
  }, [replies.length, totalReplies]);

  const handleToggleReplies = async () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && replies.length === 0 && totalReplies > 0 && onLoadReplies) {
      setLoadingReplies(true);
      try {
        await onLoadReplies(comment.id);
      } finally {
        setLoadingReplies(false);
      }
    }
  };

  const handleReport = async () => {
    if (!onReportComment || reporting) return;
    setReporting(true);
    try {
      await onReportComment(comment.id);
      setMenuOpen(false);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-border pl-3' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {comment.user.avatarUrl ? (
            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
          ) : null}
          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {comment.user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-xs font-semibold text-card-foreground">
                {comment.user.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {comment.timeAgo}
              </span>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Opciones del comentario"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 min-w-[160px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                  {onReportComment ? (
                    <button
                      type="button"
                      disabled={reporting}
                      onClick={() => void handleReport()}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {reporting ? 'Reportando…' : 'Reportar'}
                    </button>
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      Inicia sesión para reportar
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <MentionText text={comment.text} onMentionClick={onMentionClick} className="mt-1 text-sm text-card-foreground" />
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => onToggleLike?.(comment.id, !comment.liked)}
              className="flex items-center gap-1 text-xs text-muted-foreground"
              aria-label={comment.liked ? 'Quitar like del comentario' : 'Dar like al comentario'}
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={comment.liked ? 'currentColor' : 'none'}
              />
              {comment.likes > 0 && comment.likes}
            </button>
            {depth < 2 && (
              <button
                type="button"
                onClick={() => onReply(comment.id, comment.user.name)}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Responder
              </button>
            )}
          </div>
        </div>
      </div>

      {totalReplies > 0 && (
        <button
          type="button"
          onClick={() => void handleToggleReplies()}
          className="ml-11 mt-2 text-xs font-medium text-primary"
        >
          {loadingReplies
            ? 'Cargando respuestas…'
            : showReplies
              ? 'Ocultar respuestas'
              : `Ver ${totalReplies} respuesta${totalReplies > 1 ? 's' : ''}`}
        </button>
      )}

      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onMentionClick={onMentionClick}
              onToggleLike={onToggleLike}
              onReportComment={onReportComment}
              onLoadReplies={onLoadReplies}
            />
          ))}
        </div>
      )}

      {showReplies && !loadingReplies && replies.length === 0 && totalReplies > 0 && (
        <p className="ml-11 mt-2 text-xs text-muted-foreground">
          No se pudieron cargar las respuestas.
        </p>
      )}
    </div>
  );
};

const CommentsSheet = ({
  open,
  onOpenChange,
  comments,
  onAddComment,
  onMentionClick,
  onToggleLike,
  onReportComment,
  onLoadReplies,
}: CommentsSheetProps) => {
  const [newComment, setNewComment] = useState('');
  const [cursor, setCursor] = useState(0);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mentionOptions = useMemo<MentionOption[]>(() => {
    const userOpts: MentionOption[] = users
      .filter((u) => u.id !== 'me')
      .map((u) => ({ id: u.id, name: u.name, initials: u.initials, type: 'user' as const }));
    const eventOpts: MentionOption[] = bannerEvents.map((e) => ({
      id: e.id,
      name: e.title,
      initials: e.title.slice(0, 2).toUpperCase(),
      type: 'event' as const,
    }));
    return [...userOpts, ...eventOpts];
  }, []);

  const handleMentionSelect = (option: MentionOption, mentionStart: number, mentionEnd: number) => {
    const mentionTag = `@${option.name.replace(/\s+/g, '')}`;
    const next = newComment.slice(0, mentionStart) + mentionTag + ' ' + newComment.slice(mentionEnd);
    setNewComment(next);
    const newCursor = mentionStart + mentionTag.length + 1;
    setCursor(newCursor);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, name: userName });
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const text = newComment.trim();
    if (!text) return;
    onAddComment(text, replyTo?.id);
    setNewComment('');
    setReplyTo(null);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-bold">
              ¡Comentarios!
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[50vh] overflow-y-auto px-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onMentionClick={onMentionClick}
                  onToggleLike={onToggleLike}
                  onReportComment={onReportComment}
                  onLoadReplies={onLoadReplies}
                />
              ))}
              {comments.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sé el primero en comentar
                </p>
              )}
            </div>
          </div>

          {replyTo && (
            <div className="flex items-center gap-2 border-t border-border px-4 pt-2">
              <span className="text-xs text-muted-foreground">
                Respondiendo a{' '}
                <span className="font-semibold text-primary">
                  {replyTo.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  replyTo
                    ? `Responder a ${replyTo.name}... usa @`
                    : 'Agrega tu comentario... usa @ para mencionar'
                }
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  setCursor(e.target.selectionStart || 0);
                }}
                onSelect={(e) => setCursor((e.target as HTMLInputElement).selectionStart || 0)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                maxLength={500}
                className="w-full rounded-full bg-muted px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
              />
              <MentionAutocomplete
                options={mentionOptions}
                inputValue={newComment}
                cursorPosition={cursor}
                onSelect={handleMentionSelect}
                anchorRef={inputRef}
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!newComment.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CommentsSheet;
