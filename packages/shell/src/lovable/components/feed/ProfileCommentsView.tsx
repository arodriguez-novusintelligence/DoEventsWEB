import { useMemo, useState } from 'react';
import { ChevronLeft, Heart, MessageCircle, Send, Trash2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { toast } from 'sonner';
import profileAvatar from '@lovable/assets/profile-avatar.jpg';

import { UserAvatar } from '@doevents/shared';
export type ProfileCommentItem = {
  id: string;
const CURRENT_USER = {
  id: 'me',
  name: 'Tatiana Muñoz',
  username: '@tattis',
  avatar: profileAvatar,
};

interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  liked: boolean;
}

interface Comment extends Reply {
  replies: Reply[];
}

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'c1',
    authorId: 'u-ana',
    authorName: 'Ana López',
    authorUsername: '@analopez',
    authorAvatar: anaAvatar,
    content: '¡Tatiana, me encantan los eventos que organizas! Siempre son únicos 💜',
    createdAt: 'hace 2 h',
    likes: 12,
    liked: false,
    replies: [
      {
        id: 'r1',
        authorId: 'me',
        authorName: 'Tatiana Muñoz',
        authorUsername: '@tattis',
        authorAvatar: profileAvatar,
        content: '¡Gracias Ana! Pronto viene uno nuevo 🎉',
        createdAt: 'hace 1 h',
        likes: 3,
        liked: true,
      },
    ],
  },
  {
    id: 'c2',
    authorId: 'u-carlos',
    authorName: 'Carlos Restrepo',
    authorUsername: '@crestrepo',
    authorAvatar: carlosAvatar,
    content: 'La cata de vinos del mes pasado estuvo espectacular 🍷',
    createdAt: 'hace 1 d',
    likes: 8,
    liked: false,
    replies: [],
  },
  {
    id: 'c3',
    authorId: 'u-laura',
    authorName: 'Laura Mejía',
    authorUsername: '@lmejia',
    authorAvatar: lauraAvatar,
    content: '¿Cuándo es el próximo evento gastronómico? 😋',
    createdAt: 'hace 2 d',
    likes: 4,
    liked: false,
    replies: [],
  },
];

interface Props {
  onBack: () => void;
}

const ProfileCommentsView = ({ onBack }: Props) => {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const total = useMemo(
    () => comments.reduce((acc, c) => acc + 1 + c.replies.length, 0),
    [comments]
  );

  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const c: Comment = {
      id: `c-${Date.now()}`,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      authorUsername: CURRENT_USER.username,
      authorAvatar: CURRENT_USER.avatar,
      content: text,
      createdAt: 'ahora',
      likes: 0,
      liked: false,
      replies: [],
    };
    setComments((prev) => [c, ...prev]);
    setNewComment('');
    toast.success('Comentario publicado');
  };

  const handleAddReply = (commentId: string) => {
    const text = replyText.trim();
    if (!text) return;
    const r: Reply = {
      id: `r-${Date.now()}`,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      authorUsername: CURRENT_USER.username,
      authorAvatar: CURRENT_USER.avatar,
      content: text,
      createdAt: 'ahora',
      likes: 0,
      liked: false,
    };
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, r] } : c))
    );
    setReplyText('');
    setReplyingTo(null);
    toast.success('Respuesta publicada');
  };

  const toggleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
          : c
      )
    );
  };

  const toggleLikeReply = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId
                  ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) }
                  : r
              ),
            }
          : c
      )
    );
  };

  const deleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success('Comentario eliminado');
  };

  const deleteReply = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
          : c
      )
    );
    toast.success('Respuesta eliminada');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-4 pt-4 text-primary font-medium"
        >
          <ChevronLeft className="h-5 w-5" />
          Atrás
        </button>
        <div className="px-4 pt-3 pb-4">
          <h1 className="text-2xl font-extrabold text-primary">Comentarios</h1>
          <p className="text-sm text-muted-foreground">{total} comentarios</p>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center pt-24">
            <MessageSquare className="h-14 w-14 text-foreground/70 mb-4" strokeWidth={1.5} />
            <p className="font-semibold text-foreground">Sin comentarios aún</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-[260px]">
              Los comentarios que otros usuarios dejen en tu perfil aparecerán aquí
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl bg-card p-3 shadow-sm border border-border/50">
                <CommentRow
                  comment={c}
                  isOwn={c.authorId === CURRENT_USER.id}
                  onLike={() => toggleLikeComment(c.id)}
                  onReply={() =>
                    setReplyingTo((prev) => (prev === c.id ? null : c.id))
                  }
                  onDelete={() => deleteComment(c.id)}
                />

                {/* Replies */}
                {c.replies.length > 0 && (
                  <ul className="mt-3 ml-10 space-y-3 border-l-2 border-border pl-3">
                    {c.replies.map((r) => (
                      <li key={r.id}>
                        <ReplyRow
                          reply={r}
                          isOwn={r.authorId === CURRENT_USER.id}
                          onLike={() => toggleLikeReply(c.id, r.id)}
                          onDelete={() => deleteReply(c.id, r.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* Reply composer */}
                {replyingTo === c.id && (
                  <div className="mt-3 ml-10 flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={CURRENT_USER.avatar} />
                      <AvatarFallback>TM</AvatarFallback>
                    </Avatar>
                    <input
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddReply(c.id);
                      }}
                      placeholder={`Responder a ${c.authorName.split(' ')[0]}...`}
                      className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      onClick={() => handleAddReply(c.id)}
                      disabled={!replyText.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom composer */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4">
        <div className="mx-auto max-w-lg flex items-center gap-2 rounded-full bg-card border border-border px-3 py-2 shadow-lg">
          <Avatar className="h-8 w-8">
            <AvatarImage src={CURRENT_USER.avatar} />
            <AvatarFallback>TM</AvatarFallback>
          </Avatar>
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddComment();
            }}
            placeholder="Agregar un comentario..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 active:scale-95 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface RowProps {
  comment: Comment;
  isOwn: boolean;
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
}

const CommentRow = ({ comment, isOwn, onLike, onReply, onDelete }: RowProps) => (
  <div className="flex gap-3">
    <Avatar className="h-9 w-9 shrink-0">
      <AvatarImage src={comment.authorAvatar} />
      <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground truncate">{comment.authorName}</span>
        <span className="text-xs text-muted-foreground truncate">{comment.authorUsername}</span>
      </div>
      <p className="text-sm text-foreground/90 mt-0.5 break-words">{comment.content}</p>
      <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{comment.createdAt}</span>
        <button onClick={onLike} className="flex items-center gap-1 active:scale-95 transition">
          <Heart
            className={`h-3.5 w-3.5 ${comment.liked ? 'fill-destructive text-destructive' : ''}`}
          />
          <span>{comment.likes}</span>
        </button>
        <button onClick={onReply} className="flex items-center gap-1 active:scale-95 transition">
          <MessageCircle className="h-3.5 w-3.5" />
          Responder
        </button>
        {isOwn && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-destructive active:scale-95 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        )}
      </div>
    </div>
  </div>
);

interface ReplyRowProps {
  reply: Reply;
  isOwn: boolean;
  onLike: () => void;
  onDelete: () => void;
}

const ReplyRow = ({ reply, isOwn, onLike, onDelete }: ReplyRowProps) => (
  <div className="flex gap-2">
    <Avatar className="h-7 w-7 shrink-0">
      <AvatarImage src={reply.authorAvatar} />
      <AvatarFallback>{reply.authorName[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground truncate">{reply.authorName}</span>
        <span className="text-[11px] text-muted-foreground truncate">{reply.authorUsername}</span>
      </div>
      <p className="text-sm text-foreground/90 mt-0.5 break-words">{reply.content}</p>
      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{reply.createdAt}</span>
        <button onClick={onLike} className="flex items-center gap-1 active:scale-95 transition">
          <Heart
            className={`h-3.5 w-3.5 ${reply.liked ? 'fill-destructive text-destructive' : ''}`}
          />
          <span>{reply.likes}</span>
        </button>
        {isOwn && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-destructive active:scale-95 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ProfileCommentsView;