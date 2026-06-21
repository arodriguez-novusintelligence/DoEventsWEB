import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { cn } from '@lovable/lib/utils';
import type { Post, User } from '@lovable/data/';
import ImageCarousel from './ImageCarousel';
import PostActions from './PostActions';
import PostMenu from './PostMenu';
import MentionText from './MentionText';
import type { FeedUiPost as Post, FeedUiUser as User } from '@doevents/shared';

interface PostCardProps {
  post: Post;
  liked: boolean;
  followed: boolean;
  isOwner?: boolean;
  onLike: () => void;
  onFollow: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare: () => void;
  onHide: () => void;
  onNotInterested: () => void;
  onBlock: () => void;
  onReport: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewLikes?: () => void;
  onViewReposts?: () => void;
  onViewProfile?: (user: User) => void;
  onMentionClick?: (mention: string) => void;
  onOpenDetail?: (post: Post) => void;
}

const typeLabel = (type: Post['type']) => {
  switch (type) {
    case 'evento':
      return 'Evento';
    case 'servicio':
      return 'Servicio';
    case 'lugar':
      return 'Lugar';
    default:
      return 'Publicación';
  }
};

const PostCard = ({
  post,
  liked,
  followed,
  isOwner,
  onLike,
  onFollow,
  onComment,
  onRepost,
  onShare,
  onHide,
  onNotInterested,
  onBlock,
  onReport,
  onEdit,
  onDelete,
  onViewLikes,
  onViewReposts,
  onViewProfile,
  onMentionClick,
  onOpenDetail,
}: PostCardProps) => {
  const isRepost = !!post.repostOf;
  const badge = isRepost ? 'Publicación' : typeLabel(post.type);
  const canOpen = !isRepost && !!onOpenDetail && (post.type === 'evento' || post.type === 'lugar' || post.type === 'servicio');

  return (
    <article className="mx-4 my-5" aria-label="Tarjeta de publicación">
      {/* Header (outside the white card) */}
      <div className="flex items-center justify-between px-1 pb-2.5">
        <div className="flex items-center gap-2.5">
          <button onClick={() => onViewProfile?.(post.user)} className="shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
                {post.user.initials}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="leading-tight">
            <button
              onClick={() => onViewProfile?.(post.user)}
              className="block text-[15px] font-semibold text-foreground hover:underline"
            >
              {post.user.name}
            </button>
            <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onFollow}
            className={cn(
              'rounded-full border px-4 py-1 text-xs font-semibold transition-colors',
              followed
                ? 'border-muted-foreground/30 text-muted-foreground'
                : 'border-primary text-primary hover:bg-primary/5'
            )}
          >
            {followed ? 'Siguiendo' : 'Seguir'}
          </button>
          <PostMenu
            isOwner={isOwner}
            onEdit={onEdit}
            onDelete={onDelete}
            onHide={onHide}
            onNotInterested={onNotInterested}
            onBlock={onBlock}
            onReport={onReport}
          />
        </div>
      </div>

      {/* White card */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {/* Type badge */}
        <div className="px-4 pt-3">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
            {badge}
          </span>
        </div>

        {isRepost ? (
          <>
            {(post.title || post.description) && (
              <div className="px-4 pt-2.5">
                {post.title && (
                  <p className="text-sm font-semibold text-card-foreground">{post.title}</p>
                )}
                {post.description && (
                  <MentionText
                    text={post.description}
                    onMentionClick={onMentionClick}
                    className="mt-1 text-sm leading-relaxed text-card-foreground"
                  />
                )}
              </div>
            )}

            {/* Repost's own images */}
            {post.images && post.images.length > 0 && (
              <div className="px-4 pt-3">
                <ImageCarousel images={post.images} className="aspect-[16/10] rounded-xl" />
              </div>
            )}



            {/* Embedded original post */}
            <div className="mx-4 my-3 overflow-hidden rounded-xl border border-border">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                    {post.repostOf!.user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-card-foreground">
                    {post.repostOf!.user.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {post.repostOf!.timeAgo}
                  </span>
                </div>
              </div>
              <ImageCarousel images={post.repostOf!.images} className="aspect-[4/3]" />
              <div className="px-3 py-3">
                <h3 className="text-sm font-bold text-card-foreground">
                  {post.repostOf!.title}
                </h3>
                <MentionText
                  text={post.repostOf!.description}
                  onMentionClick={onMentionClick}
                  className="mt-1 text-sm leading-relaxed text-card-foreground"
                />
                {post.repostOf!.tags.length > 0 && (
                  <p className="mt-2 text-sm text-primary">{post.repostOf!.tags.join('  ')}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Image */}
            <div
              className={`px-4 pt-3 ${canOpen ? 'cursor-pointer' : ''}`}
              onClick={canOpen ? () => onOpenDetail!(post) : undefined}
            >
              <ImageCarousel images={post.images} className="aspect-[16/10] rounded-xl" />
            </div>

            {/* Content */}
            <div
              className={`px-4 pt-3 ${canOpen ? 'cursor-pointer' : ''}`}
              onClick={canOpen ? () => onOpenDetail!(post) : undefined}
            >
              <h2 className="text-[15px] font-bold leading-tight text-card-foreground hover:text-primary transition-colors">
                {post.title}
              </h2>
              {post.date && (
                <p className="mt-1.5 text-xs font-semibold text-card-foreground">{post.date}</p>
              )}
              {post.location && (
                <p className="mt-0.5 text-xs text-muted-foreground">{post.location}</p>
              )}
              {post.description && (
                <MentionText
                  text={post.description}
                  onMentionClick={onMentionClick}
                  className="mt-2 text-sm leading-relaxed text-card-foreground"
                />
              )}
              {post.tags.length > 0 && (
                <p className="mt-2 text-sm text-primary">{post.tags.join('  ')}</p>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <PostActions
          liked={liked}
          likesCount={post.likes + (liked ? 1 : 0)}
          commentsCount={post.comments.length}
          repostsCount={post.reposts}
          onLike={onLike}
          onComment={onComment}
          onRepost={onRepost}
          onShare={onShare}
          onViewLikes={onViewLikes}
          onViewReposts={onViewReposts}
        />
      </div>
    </article>
  );
};

export default PostCard;