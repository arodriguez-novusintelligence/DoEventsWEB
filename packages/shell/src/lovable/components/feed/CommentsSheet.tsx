import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Heart, MessageSquare, MoreHorizontal, Send, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Comment } from '@lovable/data/mockData';
import { users, bannerEvents } from '@lovable/data/mockData';
import MentionText from './MentionText';
import MentionAutocomplete, { type MentionOption } from './MentionAutocomplete';
import type { Comment } from '@doevents/shared';

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  totalComments: number;
  onAddComment: (text: string, parentId?: string) => void;
  onMentionClick?: (mention: string) => void;
}

const CommentItem = ({
  comment,
  depth = 0,
  onReply,
  onMentionClick,
}: {
  comment: Comment;
  depth?: number;
  onReply: (commentId: string, userName: string) => void;
  onMentionClick?: (mention: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const replies = comment.repliesData || [];
  const totalReplies = replies.length || comment.replies;

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-border pl-3' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {comment.user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-card-foreground">
                {comment.user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {comment.timeAgo}
              </span>
            </div>
            <button className="text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <MentionText text={comment.text} onMentionClick={onMentionClick} className="mt-1 text-sm text-card-foreground" />
          <div className="mt-2 flex items-center gap-4">
            <button className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              {comment.likes > 0 && comment.likes}
            </button>
            <button
              onClick={() => onReply(comment.id, comment.user.name)}
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Responder
            </button>
          </div>
        </div>
      </div>

      {/* Show/hide replies toggle */}
      {totalReplies > 0 && (
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="ml-11 mt-2 text-xs font-medium text-primary"
        >
          {showReplies
            ? 'Ocultar respuestas'
            : `Ver ${totalReplies} respuesta${totalReplies > 1 ? 's' : ''}`}
        </button>
      )}

      {/* Nested replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onMentionClick={onMentionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentsSheet = ({
  open,
  onOpenChange,
  comments,
  totalComments,
  onAddComment,
  onMentionClick,
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
                />
              ))}
              {comments.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sé el primero en comentar
                </p>
              )}
            </div>
          </div>

          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 border-t border-border px-4 pt-2">
              <span className="text-xs text-muted-foreground">
                Respondiendo a{' '}
                <span className="font-semibold text-primary">
                  {replyTo.name}
                </span>
              </span>
              <button
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