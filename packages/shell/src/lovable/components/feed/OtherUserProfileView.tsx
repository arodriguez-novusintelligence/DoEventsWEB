import { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronLeft,
  Clock,
  Heart,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Shield,
  Star,
  TrendingUp,
  UserPlus,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import ProfileCommentsView, { type ProfileCommentItem } from '@lovable/components/feed/ProfileCommentsView';
import FollowersSheet from '@lovable/components/feed/FollowersSheet';
import type { ProfileListUser } from '@lovable/components/feed/FollowersSheet';
import type { Post } from '@doevents/shared';

const EXPERIENCE_BARS = [
  { height: 'h-1.5', color: 'bg-rose-200' },
  { height: 'h-2', color: 'bg-orange-200' },
  { height: 'h-3', color: 'bg-amber-200' },
  { height: 'h-4', color: 'bg-emerald-300' },
] as const;

export interface OtherUserEventItem {
  id: string;
  title: string;
  date?: string;
  location?: string;
  description?: string;
  image?: string;
  status?: string;
}

export interface OtherUserVenueItem {
  id: string;
  name: string;
  address?: string;
  type?: string;
  capacity?: number;
  image?: string;
}

export interface OtherUserServiceItem {
  id: string;
  title: string;
  activities?: number;
  priceLabel?: string;
  image?: string;
}

interface OtherUserProfileViewProps {
  displayName: string;
  username?: string;
  initials: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  cityLabel?: string;
  canViewContent: boolean;
  isPrivateProfile: boolean;
  isFollowing: boolean;
  followPending: boolean;
  followBusy: boolean;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  experienceLabel: string;
  experienceSegment: number;
  tenureLabel: string;
  rating: number;
  commentsCount: number;
  publicationsCount: number;
  eventsCount: number;
  venuesCount: number;
  servicesCount: number;
  publications: Post[];
  events: OtherUserEventItem[];
  venues: OtherUserVenueItem[];
  services: OtherUserServiceItem[];
  galleryPhotos: string[];
  galleryLoading: boolean;
  profileComments: ProfileCommentItem[];
  profileCommentsLoading?: boolean;
  profileCommentsError?: string | null;
  viewerId?: string;
  profileUserId: string;
  followersList?: ProfileListUser[];
  followingList?: ProfileListUser[];
  onBack: () => void;
  onFollowAction: () => void;
  onOpenGallery: () => void | Promise<void>;
  onOpenChat: () => void;
  onOpenEvent: (eventId: string) => void;
  onOpenVenue: (venueId: string) => void;
  onOpenService: (serviceId: string) => void;
  onOpenServicesPage: () => void;
  onRetryComments?: () => void;
}

type SubView = null | 'publications' | 'events' | 'venues' | 'services' | 'comments' | 'photos';

function parseTenureParts(tenureLabel: string) {
  if (!tenureLabel || tenureLabel === '—') return { primary: '—', secondary: '' };
  if (tenureLabel === 'Nuevo') return { primary: 'Nuevo', secondary: '' };
  const match = tenureLabel.match(/^(\d+)\s+(.+)$/);
  if (match) return { primary: match[1], secondary: match[2] };
  return { primary: tenureLabel, secondary: '' };
}

const StarsRow = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={i <= Math.round(value) ? 'fill-primary text-primary' : 'text-primary'}
        strokeWidth={2}
      />
    ))}
  </div>
);

function ServiceExperienceCard({
  experienceLabel,
  experienceSegment,
  rating,
  tenureLabel,
  commentsCount,
  onOpenComments,
}: {
  experienceLabel: string;
  experienceSegment: number;
  rating: number;
  tenureLabel: string;
  commentsCount: number;
  onOpenComments?: () => void;
}) {
  const tenureParts = parseTenureParts(tenureLabel);
  const experienceArrowLeft = experienceSegment > 0
    ? `${((Math.min(experienceSegment, 4) - 0.5) / 4) * 100}%`
    : '12.5%';

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h3 className="mb-5 text-base font-bold text-foreground">Experiencia de servicio</h3>
      <div className="relative pt-3">
        <div
          className="absolute -top-1 flex -translate-x-1/2 justify-center"
          style={{ left: experienceArrowLeft }}
        >
          <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
        </div>
        <div className="flex items-center gap-2">
          {EXPERIENCE_BARS.map((bar) => (
            <div key={bar.color} className={`flex-1 rounded-full ${bar.height} ${bar.color}`} />
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
          {experienceLabel}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex flex-col items-start">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold leading-none text-foreground">
              {rating > 0 ? rating.toFixed(1) : '0.0'}
            </span>
            <Star className="h-4 w-4 fill-primary text-primary" />
          </div>
          <span className="mt-1 text-xs text-muted-foreground">Calificación</span>
        </div>

        <div className="flex flex-col items-start">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold leading-none text-foreground">{tenureParts.primary}</span>
            {tenureParts.secondary && (
              <span className="text-xs text-muted-foreground">{tenureParts.secondary}</span>
            )}
          </div>
          <span className="mt-1 text-xs text-muted-foreground">De Eventer</span>
        </div>

        <button
          type="button"
          onClick={onOpenComments}
          disabled={!onOpenComments}
          className="flex flex-col items-start transition-transform active:scale-95 disabled:opacity-60"
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-primary" />
            {commentsCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {commentsCount > 99 ? '99+' : commentsCount}
              </span>
            )}
          </div>
          <span className="mt-1 text-xs font-semibold text-primary">Comentarios</span>
        </button>
      </div>
    </div>
  );
}

export function OtherUserProfileView({
  displayName,
  username,
  initials,
  avatarUrl,
  coverUrl,
  bio,
  cityLabel,
  canViewContent,
  isPrivateProfile,
  isFollowing,
  followPending,
  followBusy,
  followersCount,
  followingCount,
  likesCount,
  experienceLabel,
  experienceSegment,
  tenureLabel,
  rating,
  commentsCount,
  publicationsCount,
  eventsCount,
  venuesCount,
  servicesCount,
  publications,
  events,
  venues,
  services,
  galleryPhotos,
  galleryLoading,
  profileComments,
  profileCommentsLoading,
  profileCommentsError,
  viewerId,
  profileUserId,
  followersList = [],
  followingList = [],
  onBack,
  onFollowAction,
  onOpenGallery,
  onOpenChat,
  onOpenEvent,
  onOpenVenue,
  onOpenService,
  onOpenServicesPage,
  onRetryComments,
}: OtherUserProfileViewProps) {
  const [subView, setSubView] = useState<SubView>(null);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<'followers' | 'following'>('followers');

  const followButtonLabel = isFollowing
    ? 'Siguiendo'
    : followPending
      ? 'Solicitado'
      : isPrivateProfile
        ? 'Solicitar'
        : 'Seguir';

  const requireAccess = (fn: () => void) => {
    if (!canViewContent) return;
    fn();
  };

  const showExperienceCard = true;

  if (subView === 'comments') {
    return (
      <ProfileCommentsView
        comments={profileComments}
        loading={profileCommentsLoading}
        error={profileCommentsError}
        onRetry={onRetryComments}
        onBack={() => setSubView(null)}
      />
    );
  }

  if (subView) {
    const SubHeader = ({ title }: { title: string }) => (
      <div className="sticky top-0 z-10 -mx-4 mb-3 flex items-center gap-2 border-b border-border bg-secondary/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Volver
        </button>
        <h2 className="ml-2 truncate text-base font-bold text-foreground">{title}</h2>
      </div>
    );

    if (subView === 'photos') {
      return (
        <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
          <SubHeader title={`Fotos de ${displayName}`} />
          {galleryLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Cargando fotos…</p>
          ) : galleryPhotos.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 py-16 text-center text-muted-foreground">
              <Camera className="h-10 w-10 text-primary/60" />
              <p className="text-sm font-semibold text-foreground">Este usuario aún no tiene fotos en su galería</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {galleryPhotos.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setPhotoIdx(index)}
                  className="aspect-square overflow-hidden rounded-xl bg-card shadow-sm transition active:scale-95"
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {photoIdx !== null && galleryPhotos[photoIdx] && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setPhotoIdx(null)}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPhotoIdx(null); }}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={galleryPhotos[photoIdx]} alt="" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
            </div>
          )}
        </div>
      );
    }

    if (subView === 'publications') {
      return (
        <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
          <SubHeader title={`Publicaciones de ${displayName}`} />
          <div className="space-y-3">
            {publications.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin publicaciones.</p>
            )}
            {publications.map((post) => (
              <div key={post.id} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                {post.image && (
                  <img src={post.image} alt="" className="h-44 w-full object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground">{post.content || post.caption || 'Publicación'}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.timeAgo || ''}</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> {post.likes ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> {post.comments ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (subView === 'events') {
      return (
        <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
          <SubHeader title={`Eventos de ${displayName}`} />
          <div className="grid grid-cols-2 gap-3">
            {events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => onOpenEvent(ev.id)}
                className="overflow-hidden rounded-2xl border border-border/40 bg-card text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="relative h-32">
                  {ev.image ? (
                    <img src={ev.image} alt={ev.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                      <PartyPopper className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{ev.title}</h3>
                  {ev.date && <p className="mt-1.5 text-sm font-semibold text-foreground">{ev.date}</p>}
                  {ev.location && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{ev.location}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (subView === 'venues') {
      return (
        <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
          <SubHeader title={`Lugares de ${displayName}`} />
          <div className="grid grid-cols-2 gap-3">
            {venues.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => onOpenVenue(venue.id)}
                className="overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="relative h-32 w-full overflow-hidden">
                  {venue.image ? (
                    <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-sky-50">
                      <MapPin className="h-8 w-8 text-sky-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{venue.name}</h3>
                  {venue.address && <p className="line-clamp-1 text-[11px] text-muted-foreground">{venue.address}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (subView === 'services') {
      return (
        <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
          <SubHeader title={`Servicios de ${displayName}`} />
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => onOpenService(service.id)}
                className="overflow-hidden rounded-2xl bg-card text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="relative h-28 w-full overflow-hidden bg-muted">
                  {service.image ? (
                    <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                      <TrendingUp className="h-7 w-7 text-emerald-600" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{service.title}</p>
                  {service.priceLabel && (
                    <p className="mt-1 text-[11px] font-semibold text-primary">{service.priceLabel}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 px-4 pb-24 pt-4">
      <button type="button" onClick={onBack} className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {coverUrl ? (
          <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} />
        ) : (
          <div className="h-24 bg-gradient-to-br from-accent via-primary/60 to-primary" />
        )}
        <div className="relative px-5 pb-5">
          <div className="relative -mt-12 mb-3">
            <Avatar className="h-20 w-20 border-4 border-card shadow-lg ring-2 ring-primary/20">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-extrabold text-foreground">{displayName}</h2>
                <Shield className="h-4 w-4 shrink-0 text-primary" />
              </div>
              {username && <p className="text-sm text-muted-foreground">@{username.replace(/^@/, '')}</p>}
              {cityLabel && <p className="mt-0.5 text-sm text-muted-foreground">{cityLabel}</p>}
            </div>
            {viewerId && viewerId !== profileUserId && (
              <Button
                variant={isFollowing || followPending ? 'outline' : 'default'}
                size="sm"
                className="shrink-0 gap-1.5 rounded-full"
                disabled={followBusy}
                title={followPending ? 'Toca para cancelar la solicitud' : undefined}
                onClick={onFollowAction}
              >
                {isFollowing ? (<><Check className="h-3.5 w-3.5" />Siguiendo</>)
                  : followPending ? (<><Clock className="h-3.5 w-3.5" />Solicitado</>)
                  : isPrivateProfile ? (<><Lock className="h-3.5 w-3.5" />Solicitar</>)
                  : (<><UserPlus className="h-3.5 w-3.5" />Seguir</>)}
              </Button>
            )}
          </div>

          {canViewContent && bio && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio}</p>
          )}

          {canViewContent && (
            <>
              <div className="mt-4 flex items-center gap-5">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => { setFollowersTab('followers'); setFollowersOpen(true); }}
                >
                  <p className="text-base font-bold leading-none text-foreground">{followersCount}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Seguidores</p>
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => { setFollowersTab('following'); setFollowersOpen(true); }}
                >
                  <p className="text-base font-bold leading-none text-foreground">{followingCount}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Seguidos</p>
                </button>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-base font-bold leading-none text-foreground">{likesCount}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Likes</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void Promise.resolve(onOpenGallery()).then(() => setSubView('photos'));
                  }}
                  className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
                >
                  <Camera className="h-4 w-4" />
                  Ver Fotos
                </button>
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="group flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.97]"
                >
                  <MessageSquare className="h-4 w-4" />
                  Mensaje
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showExperienceCard && (
        <ServiceExperienceCard
          experienceLabel={experienceLabel}
          experienceSegment={experienceSegment}
          rating={rating}
          tenureLabel={tenureLabel}
          commentsCount={commentsCount}
          onOpenComments={canViewContent ? () => setSubView('comments') : undefined}
        />
      )}

      {!canViewContent ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Este perfil es privado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sigue a {username ? `@${username.replace(/^@/, '')}` : displayName} para ver sus publicaciones, eventos, lugares y servicios.
            </p>
          </div>
          {viewerId && !followPending && (
            <Button size="sm" className="mt-1 gap-1.5 rounded-full" onClick={onFollowAction} disabled={followBusy}>
              <Lock className="h-3.5 w-3.5" />
              {followButtonLabel === 'Solicitar' ? 'Solicitar seguimiento' : followButtonLabel}
            </Button>
          )}
          {followPending && (
            <Button
              size="sm"
              variant="outline"
              className="mt-1 gap-1.5 rounded-full"
              disabled={followBusy}
              title="Toca para cancelar la solicitud"
              onClick={onFollowAction}
            >
              <Clock className="h-3.5 w-3.5" />
              Cancelar solicitud
            </Button>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => requireAccess(() => setSubView('publications'))}
            className="flex w-full flex-col rounded-2xl bg-card p-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <h3 className="text-base font-bold text-foreground">Publicaciones</h3>
            <div className="mt-6 flex items-end justify-between">
              <Megaphone className="h-7 w-7 text-orange-500" />
              <span className="text-2xl font-bold text-muted-foreground">{publicationsCount}</span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => requireAccess(() => setSubView('events'))}
              className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-card p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <h4 className="text-sm font-bold leading-tight text-foreground">Eventos Creados</h4>
              <div className="flex items-end justify-between">
                <PartyPopper className="h-7 w-7 text-primary" strokeWidth={2.2} />
                <span className="text-xl font-bold text-muted-foreground">{eventsCount}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => requireAccess(() => setSubView('venues'))}
              className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-card p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <h4 className="text-sm font-bold leading-tight text-foreground">Lugares de eventos</h4>
              <div className="flex items-end justify-between">
                <MapPin className="h-7 w-7 text-sky-500" strokeWidth={2.2} />
                <span className="text-xl font-bold text-muted-foreground">{venuesCount}</span>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => requireAccess(() => (servicesCount > 0 ? setSubView('services') : onOpenServicesPage()))}
            className="flex w-full flex-col rounded-2xl bg-card p-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <h3 className="text-base font-bold text-foreground">Servicios</h3>
            <div className="mt-6 flex items-end justify-between">
              <TrendingUp className="h-7 w-7 text-emerald-600" />
              <span className="text-2xl font-bold text-muted-foreground">{servicesCount}</span>
            </div>
          </button>
        </>
      )}

      <FollowersSheet
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        defaultTab={followersTab}
        followersList={followersList}
        followingList={followingList}
        currentUserId={viewerId}
      />
    </div>
  );
}

export default OtherUserProfileView;
