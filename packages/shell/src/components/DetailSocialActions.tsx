import { Heart, MessageSquare, Reply, Share2 } from 'lucide-react';

export interface DetailSocialActionsProps {
  onLike?: () => void;
  onChat?: () => void;
  onReply?: () => void;
  onShare?: () => void;
  liked?: boolean;
  className?: string;
}

const actionBtnClass =
  'flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary';

export const DetailSocialActions = ({
  onLike,
  onChat,
  onReply,
  onShare,
  liked = false,
  className = '',
}) => (
  <div className={`flex items-center justify-end gap-3 ${className}`}>
    <button type="button" onClick={onLike} className={actionBtnClass} aria-label="Me gusta">
      <Heart className={`h-5 w-5 ${liked ? 'fill-primary' : ''}`} />
    </button>
    <button type="button" onClick={onChat} className={actionBtnClass} aria-label="Comentarios">
      <MessageSquare className="h-5 w-5" />
    </button>
    <button type="button" onClick={onReply} className={actionBtnClass} aria-label="Repostear">
      <Reply className="h-5 w-5" />
    </button>
    <button type="button" onClick={onShare} className={actionBtnClass} aria-label="Compartir">
      <Share2 className="h-5 w-5" />
    </button>
  </div>
);

export default DetailSocialActions;
