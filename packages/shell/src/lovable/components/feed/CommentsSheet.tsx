import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@lovable/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@lovable/components/ui/popover';
import { Heart, ImagePlus, MessageSquare, MoreHorizontal, Send, Smile, X, Flag, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { useState, useRef } from 'react';
import type { Comment } from '@doevents/shared';
import MentionText from './MentionText';

const QUICK_EMOJIS = ['😀', '😂', '❤️', '🔥', '👏', '🎉', '😍', '🙌', '💯', '✨', '😊', '🤩', '👍', '😎', '🥳', '💪', '🙏', '😢', '😮', '🤔', '👀', '💙', '🎵', '⚽'];

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  totalComments: number;
  currentUserId?: string;
  onAddComment: (text: string, parentId?: string, imageFiles?: File[]) => void | Promise<void>;
  onReportComment?: (commentId: string) => void | Promise<void>;
  onMentionClick?: (mention: string) => void;
  sending?: boolean;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
}

const CommentItem = ({
  comment,
  depth = 0,
  currentUserId,
  onReply,
  onReport,
  onMentionClick,
}: {
  comment: Comment;
  depth?: number;
  currentUserId?: string;
  onReply: (commentId: string, userName: string) => void;
  onReport?: (commentId: string) => void;
  onMentionClick?: (mention: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const replies = comment.repliesData || [];
  const totalReplies = replies.length || comment.replies;
  const isOwn = Boolean(currentUserId && comment.user.id === currentUserId);

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-border pl-3' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {comment.user.avatarUrl ? (
            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {comment.user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-card-foreground truncate">
                {comment.user.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {comment.timeAgo}
              </span>
            </div>
            {!isOwn && onReport && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="text-muted-foreground shrink-0 p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 z-[200]">
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); onReport(comment.id); }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar comentario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {comment.text ? (
            <MentionText text={comment.text} onMentionClick={onMentionClick} className="mt-1 text-sm text-card-foreground" />
          ) : null}
          {comment.images && comment.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {comment.images.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="max-h-40 max-w-full rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-4">
            <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              {comment.likes > 0 && comment.likes}
            </button>
            <button
              type="button"
              onClick={() => onReply(comment.id, comment.user.name)}
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Responder
            </button>
          </div>
        </div>
      </div>

      {totalReplies > 0 && (
        <button
          type="button"
          onClick={() => setShowReplies(!showReplies)}
          className="ml-11 mt-2 text-xs font-medium text-primary"
        >
          {showReplies
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
              currentUserId={currentUserId}
              onReply={onReply}
              onReport={onReport}
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
  currentUserId,
  onAddComment,
  onReportComment,
  onMentionClick,
  sending = false,
  loading = false,
  loadError = null,
  onRetry,
}: CommentsSheetProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [pendingImages, setPendingImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, name: userName });
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => `${prev}${emoji}`.slice(0, 500));
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = files.slice(0, 3 - pendingImages.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...next].slice(0, 3));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const canSend = Boolean(newComment.trim() || pendingImages.length) && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const text = newComment.trim();
    const files = pendingImages.map((item) => item.file);
    await onAddComment(text, replyTo?.id, files.length ? files : undefined);
    setNewComment('');
    setReplyTo(null);
    pendingImages.forEach((item) => URL.revokeObjectURL(item.preview));
    setPendingImages([]);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="flex items-center gap-2 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <DrawerTitle className="text-xl font-bold">
              ¡Comentarios!{totalComments > 0 ? ` (${totalComments})` : ''}
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[50vh] overflow-y-auto px-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-sm font-semibold text-foreground">No se pudieron cargar los comentarios</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">{loadError}</p>
                {onRetry && (
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onRetry}>
                    Reintentar
                  </Button>
                )}
              </div>
            ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onReport={onReportComment}
                  onMentionClick={onMentionClick}
                />
              ))}
              {comments.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <MessageSquare className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Sé el primero en comentar</p>
                  <p className="text-xs text-muted-foreground max-w-[220px] text-center">
                    Comparte tu opinión sobre esta publicación.
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {replyTo && (
            <div className="flex items-center gap-2 border-t border-border px-4 pt-2">
              <span className="text-xs text-muted-foreground">
                Respondiendo a{' '}
                <span className="font-semibold text-primary">{replyTo.name}</span>
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

          {pendingImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 pt-2">
              {pendingImages.map((item, index) => (
                <div key={item.preview} className="relative shrink-0">
                  <img src={item.preview} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 border-t border-border px-3 py-3">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="Insertar emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-64 p-2 z-[200]">
                <div className="grid grid-cols-8 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="rounded-md p-1 text-lg hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={pendingImages.length >= 3}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
              aria-label="Adjuntar imagen"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagePick}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={replyTo ? `Responder a ${replyTo.name}...` : 'Agrega tu comentario...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
              maxLength={500}
              className="min-w-0 flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CommentsSheet;
