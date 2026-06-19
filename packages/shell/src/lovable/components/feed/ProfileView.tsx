import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Pencil,
  Heart,
  Users,
  Megaphone,
  MapPin,
  BarChart3,
  Ticket,
  CalendarDays,
  ChevronRight,
  Camera,
  Shield,
  Briefcase,
  DollarSign,
  PartyPopper,
  TrendingUp,
  LogOut,
  Gift,
  Crown,
} from 'lucide-react';
import SubscriptionPlanSheet from '@lovable/components/feed/SubscriptionPlanSheet';
import PlanDetailView, { type PlanId } from '@lovable/components/legal/PlanDetailView';
import FavoritesView, { type FavEventItem, type FavPlaceItem } from '@lovable/components/feed/FavoritesView';
import MyPostsView from '@lovable/components/feed/MyPostsView';
import type { Post } from '@doevents/shared';
import type { ProfileCommentItem } from '@lovable/components/feed/ProfileCommentsView';
import FollowersSheet, { type ProfileListUser } from '@lovable/components/feed/FollowersSheet';
import { Button } from '@lovable/components/ui/button';
import profileAvatar from '@lovable/assets/profile-avatar.jpg';
import profileCover from '@lovable/assets/profile-cover-desserts.jpg';
import { ServiceFormData } from '@lovable/data/servicesData';
import BookingSheet from '@lovable/components/services/BookingSheet';
import PaymentGatewaySheet from '@lovable/components/services/PaymentGatewaySheet';
import { BookingData } from '@lovable/components/services/BookingSheet';
import { toast } from 'sonner';
import EditProfileView from '@lovable/components/feed/EditProfileView';
import ProfileCommentsView from '@lovable/components/feed/ProfileCommentsView';
import { useKyc } from '@lovable/contexts/KycContext';
import { StoryAvatar } from '../../../components/StoryAvatar';

interface ProfileViewProps {
  userId?: string;
  profileName?: string;
  profileUsername?: string;
  profileAvatar?: string;
  profileCover?: string;
  profileBio?: string;
  profileEmail?: string;
  profilePhone?: string;
  profileDocument?: string;
  profileCity?: string;
  profileAddress?: string;
  followersCount?: number;
  followingCount?: number;
  profileLikes?: number;
  onOpenServices?: () => void;
  publishedServices?: ServiceFormData[];
  onNavigateStats?: () => void;
  onNavigateMessages?: () => void;
  onOpenMyEvents?: () => void;
  onOpenMyVenues?: () => void;
  onOpenMyTickets?: () => void;
  onOpenMyInvitations?: () => void;
  onOpenGuests?: () => void;
  onOpenGallery?: () => void;
  onOpenPlan?: () => void;
  onOpenPlansCatalog?: () => void;
  onOpenMyPosts?: () => void;
  onAvatarClick?: () => void;
  onOpenStory?: () => void;
  onCreateStory?: () => void;
  onCoverClick?: () => void;
  onViewProfile?: (user: ProfileListUser) => void;
  followersList?: ProfileListUser[];
  followingList?: ProfileListUser[];
  favoriteEvents?: FavEventItem[];
  favoritePosts?: Post[];
  favoritePlaces?: FavPlaceItem[];
  favoriteProfiles?: ProfileListUser[];
  profileComments?: ProfileCommentItem[];
  profileCommentsLoading?: boolean;
  profileCommentsError?: string | null;
  onRetryComments?: () => void;
  myPosts?: Post[];
  onDeletePost?: (postId: string) => Promise<void>;
  onSaveContact?: (data: {
    nombres: string;
    apellidos: string;
    phone: string;
    username: string;
    bio: string;
  }) => Promise<void>;
  myEventsCount?: number;
  myVenuesCount?: number;
  myServicesCount?: number;
  myInvitationsCount?: number;
  myTicketsCount?: number;
  myGuestsCount?: number;
  myPostsCount?: number;
  favEventsCount?: number;
  favPostsCount?: number;
  favPlacesCount?: number;
  favProfilesCount?: number;
  experienceLabel?: string;
  experienceSegment?: number;
  tenureLabel?: string;
  rating?: number;
  commentsCount?: number;
  currentPlan?: PlanId;
  uploadingMedia?: boolean;
  onLogout?: () => void;
  onOpenFavoriteEvent?: (eventId: string) => void;
  onToggleEventFavorite?: (eventId: string) => void;
}

const ProfileView = ({
  userId,
  profileName = '',
  profileUsername = '',
  profileAvatar: profileAvatarProp,
  profileCover: profileCoverProp,
  profileBio = '',
  profileEmail,
  profilePhone,
  profileDocument,
  profileCity,
  profileAddress,
  followersCount: followersCountProp = 0,
  followingCount: followingCountProp = 0,
  profileLikes: profileLikesProp = 0,
  onOpenServices,
  publishedServices,
  onNavigateStats,
  onNavigateMessages,
  onOpenMyEvents,
  onOpenMyVenues,
  onOpenMyTickets,
  onOpenMyInvitations,
  onOpenGuests,
  onOpenGallery,
  onOpenPlan,
  onOpenPlansCatalog,
  onOpenMyPosts,
  onAvatarClick,
  onOpenStory,
  onCreateStory,
  onCoverClick,
  onViewProfile,
  followersList = [],
  followingList = [],
  favoriteEvents = [],
  favoritePosts = [],
  favoritePlaces = [],
  favoriteProfiles = [],
  profileComments = [],
  profileCommentsLoading = false,
  profileCommentsError = null,
  onRetryComments,
  myPosts = [],
  onDeletePost,
  onSaveContact,
  myEventsCount = 0,
  myVenuesCount = 0,
  myServicesCount = 0,
  myInvitationsCount = 0,
  myTicketsCount = 0,
  myGuestsCount = 0,
  myPostsCount = 0,
  favEventsCount = 0,
  favPostsCount = 0,
  favPlacesCount = 0,
  favProfilesCount = 0,
  experienceLabel = 'Sin eventos',
  experienceSegment = 0,
  tenureLabel = '—',
  rating = 0,
  commentsCount = 0,
  currentPlan: currentPlanProp = 'free',
  uploadingMedia = false,
  onLogout,
  onOpenFavoriteEvent,
  onToggleEventFavorite,
}: ProfileViewProps) => {
  const [bookingService, setBookingService] = useState<ServiceFormData | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const avatarSrc = profileAvatarProp || profileAvatar;
  const coverSrc = profileCoverProp || profileCover;
  const initials = profileName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE';
  const displayFollowers = followersCountProp;
  const displayFollowing = followingCountProp;
  const [profileLiked, setProfileLiked] = useState(false);
  const [profileLikes, setProfileLikes] = useState(profileLikesProp);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<'followers' | 'following' | 'requests'>('followers');
  const [currentPlan, setCurrentPlan] = useState<PlanId>(currentPlanProp);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { isCertified } = useKyc();

  useEffect(() => {
    setProfileLikes(profileLikesProp);
  }, [profileLikesProp]);

  const tenureParts = (() => {
    if (!tenureLabel || tenureLabel === '—') return { primary: '—', secondary: '' };
    if (tenureLabel === 'Nuevo') return { primary: 'Nuevo', secondary: '' };
    const match = tenureLabel.match(/^(\d+)\s+(.+)$/);
    if (match) return { primary: match[1], secondary: match[2] };
    return { primary: tenureLabel, secondary: '' };
  })();

  const experienceArrowLeft = experienceSegment > 0
    ? `${((experienceSegment - 0.5) / 4) * 100}%`
    : '12.5%';

  const toggleProfileLike = () => {
    setProfileLiked((prev) => !prev);
    setProfileLikes((prev) => (profileLiked ? prev - 1 : prev + 1));
  };

  const handleProceedToPayment = (data: BookingData) => {
    setBookingData(data);
    setBookingService(null);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('¡Reserva confirmada! Revisa tu correo.', { duration: 4000 });
    setShowPayment(false);
    setBookingData(null);
  };

  if (showGallery) {
    if (onOpenGallery) {
      onOpenGallery();
      setShowGallery(false);
      return null;
    }
    return null;
  }

  if (showPlanDetail) {
    return (
      <PlanDetailView
        planId={currentPlan}
        onBack={() => setShowPlanDetail(false)}
        onUpgrade={() => {
          setCurrentPlan('pro');
          setShowPlanDetail(false);
        }}
      />
    );
  }

  if (showFavorites) {
    return (
      <FavoritesView
        onBack={() => setShowFavorites(false)}
        favoriteEvents={favoriteEvents}
        favoritePosts={favoritePosts}
        favoritePlaces={favoritePlaces}
        favoriteProfiles={favoriteProfiles}
        onViewProfile={onViewProfile}
        onOpenEvent={onOpenFavoriteEvent}
        onToggleEventFavorite={onToggleEventFavorite}
      />
    );
  }

  if (showMyPosts) {
    return (
      <MyPostsView
        onBack={() => setShowMyPosts(false)}
        posts={myPosts}
        onDeletePost={onDeletePost}
        onOpenDetail={(post) => {
          if (post.detailPath) navigate(post.detailPath);
        }}
      />
    );
  }

  if (showEditProfile) {
    return (
      <EditProfileView
        onBack={() => setShowEditProfile(false)}
        currentPlan={currentPlan}
        profileName={profileName}
        profileEmail={profileEmail}
        profilePhone={profilePhone}
        profileDocument={profileDocument}
        profileBio={profileBio}
        profileUsername={profileUsername.replace(/^@/, '')}
        onSaveContact={onSaveContact}
        onUpgradePlan={() => { setShowEditProfile(false); onOpenPlan?.() || setPlanSheetOpen(true); }}
      />
    );
  }

  if (showComments) {
    return (
      <ProfileCommentsView
        onBack={() => setShowComments(false)}
        comments={profileComments}
        loading={profileCommentsLoading}
        error={profileCommentsError}
        onRetry={onRetryComments}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 px-4 pt-4 pb-24">
      {/* Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm">
        {/* Cover */}
        <button
          type="button"
          onClick={onCoverClick}
          disabled={uploadingMedia}
          key={`cover-${coverSrc}`}
          className="block h-24 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${coverSrc})` }}
          aria-label="Cambiar portada"
        />

        {/* Avatar overlapping cover */}
        <div className="relative px-5 pb-5">
          <div className="relative -mt-12 mb-3">
            <div className="relative inline-block rounded-full ring-4 ring-card shadow-lg">
              <StoryAvatar
                userId={userId}
                name={profileName}
                imageUrl={avatarSrc}
                size={80}
                isOwn
                onCreateStory={onCreateStory}
                onClick={onOpenStory}
              />
              <button
                type="button"
                onClick={onAvatarClick}
                disabled={uploadingMedia}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md z-20"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground truncate">{profileName}</h2>
                {isCertified && <Shield className="h-4 w-4 text-primary shrink-0" aria-label="Certificado" />}
              </div>
              <p className="text-sm text-muted-foreground">{profileUsername}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditProfile(true)}
              className="shrink-0 rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Editar perfil
            </Button>
          </div>

          {profileBio && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profileBio}</p>
          )}

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-5">
            <button
              onClick={() => { setFollowersTab('followers'); setFollowersOpen(true); }}
              className="text-left active:scale-95 transition-transform"
            >
              <p className="text-base font-bold text-foreground leading-none">
                {displayFollowers >= 1000 ? `${(displayFollowers / 1000).toFixed(1)}K` : displayFollowers}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seguidores</p>
            </button>
            <button
              onClick={() => { setFollowersTab('following'); setFollowersOpen(true); }}
              className="text-left active:scale-95 transition-transform"
            >
              <p className="text-base font-bold text-foreground leading-none">{displayFollowing}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seguidos</p>
            </button>
            <button
              onClick={toggleProfileLike}
              className="flex items-center gap-1.5 transition-transform active:scale-90"
            >
              <Heart
                className={`h-5 w-5 transition-all ${profileLiked ? 'text-destructive animate-like-pop' : 'text-muted-foreground hover:text-destructive'}`}
                fill={profileLiked ? 'currentColor' : 'none'}
              />
              <div className="text-left">
                <p className="text-base font-bold text-foreground leading-none">{profileLikes.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Likes</p>
              </div>
            </button>
          </div>

          {/* Quick links — modern pill buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowGallery(true)}
              className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
            >
              <Camera className="h-4 w-4" />
              Mis Fotos
            </button>
            <button
              onClick={onNavigateMessages}
              className="group flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.97]"
            >
              <MessageSquare className="h-4 w-4" />
              Mis Mensajes
            </button>
          </div>
        </div>
      </div>

      {/* Card de Experiencia de servicio — solo si tiene eventos publicados */}
      {(myEventsCount ?? 0) > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-5">Experiencia de servicio</h3>
          <div className="relative pt-3">
            <div
              className="absolute -top-1 flex w-2/5 -translate-x-1/2 justify-center"
              style={{ left: experienceArrowLeft }}
            >
              <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-1.5 flex-1 rounded-full bg-rose-200" />
              <div className="h-2 flex-1 rounded-full bg-orange-200" />
              <div className="h-3 flex-1 rounded-full bg-amber-200" />
              <div className="h-4 flex-1 rounded-full bg-emerald-300" />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
              {experienceLabel}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground leading-none">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                <Star className="h-4 w-4 fill-primary text-primary" />
              </div>
              <span className="mt-1 text-xs text-muted-foreground">Calificación</span>
            </div>

            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground leading-none">{tenureParts.primary}</span>
                {tenureParts.secondary && (
                  <span className="text-xs text-muted-foreground">{tenureParts.secondary}</span>
                )}
              </div>
              <span className="mt-1 text-xs text-muted-foreground">De Eventer</span>
            </div>

            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col items-start active:scale-95 transition-transform"
            >
              <div className="relative">
                <MessageSquare className="h-6 w-6 text-primary" />
                {commentsCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {commentsCount > 99 ? '99+' : commentsCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-xs font-semibold text-primary">Comentarios</span>
            </button>
          </div>
        </div>
      )}

      {/* Plan de Suscripción */}
      {(() => {
        const isPro = currentPlan === 'pro';
        const openDetail = () => {
          if (onOpenPlan) onOpenPlan();
          else setPlanSheetOpen(true);
        };
        const openCatalog = () => {
          if (onOpenPlansCatalog) onOpenPlansCatalog();
          else if (onOpenPlan) onOpenPlan();
          else setPlanSheetOpen(true);
        };
        return (
          <div
            className={`w-full rounded-2xl p-4 shadow-sm border ${
              isPro
                ? 'bg-amber-100 border-amber-300'
                : 'bg-primary/5 border-primary/20'
            }`}
          >
            <button
              type="button"
              onClick={openDetail}
              className="w-full text-left transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                      isPro ? 'bg-amber-50 border-amber-300' : 'bg-card border-primary/30'
                    }`}
                  >
                    {isPro ? (
                      <Crown className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Gift className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground">Plan de Suscripción</h3>
                </div>
                {isPro && (
                  <span className="rounded-full bg-amber-200 text-amber-800 text-xs font-semibold px-3 py-1">
                    Activo
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Plan actual</p>
                  <p
                    className={`text-base font-extrabold ${
                      isPro ? 'text-amber-900' : 'text-primary'
                    }`}
                  >
                    {isPro ? 'PRO' : 'Gratuito'}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isPro ? 'text-amber-900' : 'text-primary'
                  }`}
                >
                  Ver detalle
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={openCatalog}
              className={`mt-3 w-full rounded-full py-2.5 text-sm font-semibold ${
                isPro
                  ? 'bg-amber-200/80 text-amber-900'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              Ver todos los planes
            </button>
          </div>
        );
      })()}

      {/* Favoritos — full width */}
      <button
        type="button"
        onClick={() => setShowFavorites(true)}
        className="w-full text-left rounded-2xl bg-card p-4 shadow-sm transition active:scale-[0.99]"
      >
        <h3 className="text-base font-bold text-foreground">Favoritos</h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Eventos: <span className="font-bold text-foreground">{favEventsCount}</span></span>
          <span>Post: <span className="font-bold text-foreground">{favPostsCount}</span></span>
          <span>Lugares: <span className="font-bold text-foreground">{favPlacesCount}</span></span>
          <span>Perfiles: <span className="font-bold text-foreground">{favProfilesCount}</span></span>
        </div>
        <Heart className="mt-3 h-6 w-6 text-primary" />
      </button>

      {/* Mis publicaciones — full width */}
      <button
        type="button"
        onClick={() => {
          if (onOpenMyPosts) onOpenMyPosts();
          else setShowMyPosts(true);
        }}
        className="flex w-full flex-col rounded-2xl bg-card p-4 shadow-sm text-left transition active:scale-[0.99]"
      >
        <h3 className="text-base font-bold text-foreground">Mis publicaciones</h3>
        <div className="mt-6 flex items-end justify-between">
          <Megaphone className="h-7 w-7 text-orange-500" />
          <span className="text-2xl font-bold text-muted-foreground">{myPostsCount}</span>
        </div>
      </button>

      {/* Gestión de invitados — full width */}
      <button onClick={onOpenGuests} className="flex w-full flex-col rounded-2xl bg-card p-4 shadow-sm text-left transition-colors hover:bg-accent/50 active:scale-[0.99]">
        <h3 className="text-base font-bold text-foreground">Gestión de invitados</h3>
        <div className="mt-6 flex items-end justify-between">
          <Users className="h-7 w-7 text-foreground" />
          <span className="text-2xl font-bold text-muted-foreground">{myGuestsCount}</span>
        </div>
      </button>

      {/* Grid 2-col cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'Mis Eventos', icon: PartyPopper, count: myEventsCount, color: 'text-primary', action: onOpenMyEvents },
          { title: 'Mis lugares de eventos', icon: MapPin, count: myVenuesCount, color: 'text-sky-500', action: onOpenMyVenues },
          { title: 'Mis Estadísticas', icon: BarChart3, count: myEventsCount, color: 'text-destructive', action: onNavigateStats },
          { title: 'Mis servicios', icon: TrendingUp, count: myServicesCount || publishedServices?.length || 0, color: 'text-emerald-600', action: onOpenServices },
          { title: 'Mis invitaciones a eventos', icon: Ticket, count: myInvitationsCount, color: 'text-amber-500', action: onOpenMyInvitations },
          { title: 'Mis Boletos', icon: DollarSign, count: myTicketsCount, color: 'text-emerald-500', action: onOpenMyTickets },
        ].map((item) => (
          <button
            key={item.title}
            onClick={item.action}
            className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-card p-4 shadow-sm text-left transition-colors hover:bg-accent/50"
          >
            <h4 className="text-sm font-bold text-foreground leading-tight">{item.title}</h4>
            <div className="flex items-end justify-between">
              <item.icon className={`h-7 w-7 ${item.color}`} strokeWidth={2.2} />
              <span className="text-xl font-bold text-muted-foreground">{item.count}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Cerrar sesión */}
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>

      {/* Booking sheet */}
      {bookingService && (
        <BookingSheet
          open={!!bookingService}
          onOpenChange={(o) => !o && setBookingService(null)}
          service={bookingService}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* Payment gateway */}
      <PaymentGatewaySheet
        open={showPayment}
        onOpenChange={(o) => { setShowPayment(o); if (!o) setBookingData(null); }}
        booking={bookingData}
        onSuccess={handlePaymentSuccess}
      />
      <FollowersSheet
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        defaultTab={followersTab}
        followersList={followersList}
        followingList={followingList}
        currentUserId={userId}
        onViewProfile={(u) => onViewProfile?.(u)}
      />
      <SubscriptionPlanSheet
        open={planSheetOpen}
        onOpenChange={setPlanSheetOpen}
        planId={currentPlan}
        onViewDetails={() => {
          setPlanSheetOpen(false);
          setShowPlanDetail(true);
        }}
        onUpgrade={() => {
          setCurrentPlan('pro');
          setPlanSheetOpen(false);
        }}
      />
    </div>
  );
};

export default ProfileView;
