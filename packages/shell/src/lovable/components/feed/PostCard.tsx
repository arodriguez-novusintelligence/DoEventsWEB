import { cn } from '@lovable/lib/utils';
import type { FeedUiPost as Post, FeedUiUser as User } from '@doevents/shared';
import PostActions from './PostActions';
import PostMenu from './PostMenu';
import MentionText from './MentionText';
import EntityFeedBody, { postToEntityContent, repostOfToEntityContent } from './EntityFeedBody';
import { feedTopBadgeTheme, isEntityFeedType, publicationFeedTheme } from './entityFeedTheme';
import ImageCarousel from './ImageCarousel';
import { StoryAvatar } from '../../../components/StoryAvatar';
import { useActiveStoryAuthors } from '../../../contexts/StoriesContext';

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
  onOpenStory?: (userId: string) => void;
}

const typeLabel = (type: Post['type']) => {
  switch (type) {
    case 'evento':
      return 'Evento';
    case 'servicio':
      return 'Servicio';
    case 'lugar':
      return 'Lugar';
    case 'publicacion':
      return 'Publicación';
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
  onOpenStory,
}: PostCardProps) => {
  const { hasActiveStory } = useActiveStoryAuthors();
  const isRepost = !!post.repostOf;
  const contentType = isRepost ? (post.repostOf!.type ?? 'publicacion') : post.type;
  const badge = typeLabel(contentType);
  const entityContent = !isRepost ? postToEntityContent(post) : null;
  const repostEntityContent = isRepost ? repostOfToEntityContent(post.repostOf!) : null;
  const isEntityPost = Boolean(entityContent);
  const isEntityRepost = Boolean(repostEntityContent);
  const entityBorder = entityContent
    ? feedTopBadgeTheme(entityContent.topBadge).cardBorder
    : isEntityRepost && repostEntityContent
      ? feedTopBadgeTheme(repostEntityContent.topBadge).cardBorder
      : post.isUserPublication
        ? publicationFeedTheme.cardBorder
        : '';
  const canOpen = !!onOpenDetail;

  return (
    <article className="mx-4 my-5" aria-label="Tarjeta de publicación">
      <div className="flex items-center justify-between px-1 pb-2.5">
        <div className="flex items-center gap-2.5">
          <StoryAvatar
            userId={post.user.id}
            name={post.user.name}
            imageUrl={post.user.avatarUrl}
            size={36}
            onClick={() => {
              if (post.user.id && hasActiveStory(post.user.id) && onOpenStory) {
                onOpenStory(post.user.id);
                return;
              }
              onViewProfile?.(post.user);
            }}
          />
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
          {!isOwner && (
            <button
              onClick={onFollow}
              className={cn(
                'rounded-full border px-4 py-1 text-xs font-semibold transition-colors',
                followed
                  ? 'border-muted-foreground/30 text-muted-foreground'
                  : 'border-primary text-primary hover:bg-primary/5',
              )}
            >
              {followed ? 'SEGUIDO' : 'Seguir'}
            </button>
          )}
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

      <div
        className={cn(
          'overflow-hidden rounded-2xl bg-card shadow-sm',
          isEntityPost || isEntityRepost ? entityBorder : 'border border-border/60 ring-2 ring-primary/20',
        )}
      >
        {!isEntityPost && !isEntityRepost && (
          <div className="px-4 pt-3">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {badge}
            </span>
          </div>
        )}

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

            <div
              className={cn(
                'mx-4 my-3 overflow-hidden rounded-xl border border-border/60 shadow-sm',
                isEntityRepost ? '' : canOpen && 'cursor-pointer',
              )}
              onClick={!isEntityRepost && canOpen ? () => onOpenDetail!(post) : undefined}
            >
              {isEntityRepost && repostEntityContent ? (
                <EntityFeedBody
                  content={repostEntityContent}
                  compact
                  canOpen={canOpen}
                  onOpenDetail={onOpenDetail}
                  postForOpen={post}
                  onMentionClick={onMentionClick}
                />
              ) : (
                <>
                  {isEntityFeedType(post.repostOf?.type) ? null : (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <StoryAvatar
                        userId={post.repostOf!.user.id}
                        name={post.repostOf!.user.name}
                        imageUrl={post.repostOf!.user.avatarUrl}
                        size={32}
                        onClick={() => onViewProfile?.(post.repostOf!.user)}
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-card-foreground">
                          {post.repostOf!.user.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {post.repostOf!.timeAgo}
                        </span>
                      </div>
                    </div>
                  )}

                  <ImageCarousel images={post.repostOf!.images} className="aspect-[4/3]" />
                  <div className="px-3 py-3">
                    <h3 className="text-sm font-bold text-card-foreground">
                      {post.repostOf!.title}
                    </h3>
                    {post.repostOf!.date ? (
                      <p className="mt-1 text-xs font-semibold text-card-foreground">{post.repostOf!.date}</p>
                    ) : null}
                    {post.repostOf!.location ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{post.repostOf!.location}</p>
                    ) : null}
                    <MentionText
                      text={post.repostOf!.description}
                      onMentionClick={onMentionClick}
                      className="mt-1 text-sm leading-relaxed text-card-foreground"
                    />
                    {post.repostOf!.tags.length > 0 && (
                      <p className="mt-2 text-sm text-primary">{post.repostOf!.tags.join('  ')}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : isEntityPost && entityContent ? (
          <EntityFeedBody
            content={entityContent}
            canOpen={canOpen}
            onOpenDetail={onOpenDetail}
            postForOpen={post}
            onMentionClick={onMentionClick}
          />
        ) : post.isUserPublication ? (
          <EntityFeedBody
            content={{
              topBadge: 'publicacion',
              showSummaryCard: false,
              images: post.images,
              title: post.title,
              date: post.date,
              location: post.location,
              description: post.description,
              tags: post.tags,
            }}
            canOpen={canOpen}
            onOpenDetail={onOpenDetail}
            postForOpen={post}
            onMentionClick={onMentionClick}
          />
        ) : (
          <>
            <div
              className={cn('px-4 pt-3', canOpen && 'cursor-pointer')}
              onClick={canOpen ? () => onOpenDetail!(post) : undefined}
            >
              <ImageCarousel images={post.images} className="aspect-[16/10] rounded-xl" />
            </div>

            <div
              className={cn('px-4 pt-3', canOpen && 'cursor-pointer')}
              onClick={canOpen ? () => onOpenDetail!(post) : undefined}
            >
              <h2 className="text-[15px] font-bold leading-tight text-card-foreground transition-colors hover:text-primary">
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

        <PostActions
          liked={liked}
          likesCount={post.likes}
          commentsCount={post.commentsCount ?? post.comments.length}
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
