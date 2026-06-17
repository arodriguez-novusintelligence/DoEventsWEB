import { Heart, MessageSquare, Repeat2, Share2 } from 'lucide-react';
import { cn } from '@lovable/lib/utils';

interface PostActionsProps {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare: () => void;
  onViewLikes?: () => void;
  onViewReposts?: () => void;
}

const CountBubble = ({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-2 text-xs font-semibold text-primary"
  >
    {count}
  </button>
);

const PostActions = ({
  liked,
  likesCount,
  commentsCount,
  repostsCount,
  onLike,
  onComment,
  onRepost,
  onShare,
  onViewLikes,
  onViewReposts,
}: PostActionsProps) => {
  return (
    <div className="flex items-center gap-5 px-4 pb-4 pt-3">
      <div className="flex items-center gap-1.5">
        <button onClick={onLike} className="group">
          <Heart
            className={cn(
              'h-[22px] w-[22px] transition-all',
              liked
                ? 'text-primary animate-like-pop'
                : 'text-primary group-hover:opacity-80'
            )}
            fill={liked ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        </button>
        <CountBubble count={likesCount} onClick={onViewLikes} />
      </div>

      <button onClick={onComment} className="flex items-center gap-1.5">
        <MessageSquare className="h-[22px] w-[22px] text-primary" strokeWidth={2} />
        <span className="text-xs font-semibold text-muted-foreground">{commentsCount}</span>
      </button>

      <div className="flex items-center gap-1.5">
        <button onClick={onRepost}>
          <Repeat2 className="h-[22px] w-[22px] text-primary" strokeWidth={2} />
        </button>
        <button
          onClick={onViewReposts}
          className="text-xs font-semibold text-muted-foreground"
        >
          {repostsCount}
        </button>
      </div>

      <button onClick={onShare} className="ml-auto flex items-center gap-1.5">
        <Share2 className="h-[22px] w-[22px] text-primary" strokeWidth={2} />
        <span className="text-xs font-semibold text-muted-foreground">0</span>
      </button>
    </div>
  );
};

export default PostActions;
