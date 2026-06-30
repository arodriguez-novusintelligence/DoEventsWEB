import { useState, useCallback, useEffect, useRef } from 'react';
import { mockPosts, Post, Comment, User, bannerEvents, myFollowers } from '@lovable/data/mockData';
import { mockInvitations } from '@lovable/data/invitationsData';
import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import { mockChatRooms, EventChatRoom, ChatMessage, mockPrivateChats, PrivateChat } from '@lovable/data/chatData';
import UserProfileView from '@lovable/components/feed/UserProfileView';
import PostCard from '@lovable/components/feed/PostCard';
import CommentsSheet from '@lovable/components/feed/CommentsSheet';
import RepostSheet from '@lovable/components/feed/RepostSheet';
import InteractionsSheet from '@lovable/components/feed/InteractionsSheet';
import CreateFAB from '@lovable/components/feed/CreateFAB';
import CreatePostSheet from '@lovable/components/feed/CreatePostSheet';
import EditPostSheet from '@lovable/components/feed/EditPostSheet';
import ReportPostDialog, { ReportTarget } from '@lovable/components/feed/ReportPostDialog';
import BottomNav from '@lovable/components/feed/BottomNav';
import FeedHero from '@lovable/components/feed/FeedHero';
import FeedServicesCarousel from '@lovable/components/feed/FeedServicesCarousel';
import FeedBanner from '@lovable/components/feed/FeedBanner';
import MapView from '@lovable/components/feed/MapView';
import EventsView from '@lovable/components/feed/EventsView';
import ProfileView from '@lovable/components/feed/ProfileView';
import MyEventsView, { MyEventItem } from '@lovable/components/feed/MyEventsView';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';
import TopHeader from '@lovable/components/feed/TopHeader';
import MessagesListView from '@lovable/components/chat/MessagesListView';
import ChatRoomView from '@lovable/components/chat/ChatRoomView';
import PrivateChatView from '@lovable/components/chat/PrivateChatView';
import MyServicesView from '@lovable/components/services/MyServicesView';
import MyVenuesView from '@lovable/components/venues/MyVenuesView';
import MyPurchasesView from '@lovable/components/purchases/MyPurchasesView';
import MyInvitationsView from '@lovable/components/invitations/MyInvitationsView';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import CreateEventView from '@lovable/components/events/CreateEventView';
import EventDetailView from '@lovable/components/events/EventDetailView';
import VenueDetailReservation from '@lovable/components/venues/VenueDetailReservation';
import ServiceDetailView from '@lovable/components/services/ServiceDetailView';
import { mockCompleteEvent, EventFormData } from '@lovable/data/eventFormData';
import { setPublishedEvent, getPublishedEvent } from '@lovable/data/publishedEventsStore';
import {
  FIFA_EVENT_FORM,
  FIFA_EVENT_ID,
  FIFA_EVENT_LIST_ITEM,
} from '@lovable/data/mockFifaEvent';
import {
  publishEventToDb,
  publishVenueToDb,
  publishServiceToDb,
  loadMyEvents,
  loadMyVenues,
  loadMyServices,
  loadAllEvents,
  loadAllVenues,
  loadAllServices,
} from '@lovable/lib/publishedStore';
import StatsEventListView from '@lovable/components/stats/StatsEventListView';
import GuestManagementView from '@lovable/components/guests/GuestManagementView';
import AccessControlListView from '@lovable/components/access/AccessControlListView';
import AdminPanelView from '@lovable/components/admin/AdminPanelView';
import AIAssistantView from '@lovable/components/ai/AIAssistantView';
import AIAssistantFAB from '@lovable/components/ai/AIAssistantFAB';
import SideMenu from '@lovable/components/feed/SideMenu';

import { ServiceFormData } from '@lovable/data/servicesData';
import { MOCK_SERVICES } from '@lovable/data/mockServices';
import { MOCK_VENUES } from '@lovable/data/mockVenues';
import { useNotifications } from '@lovable/contexts/NotificationsContext';
import { isUserPrivate } from '@lovable/contexts/PrivacyContext';
import { toast } from 'sonner';

import { useNearbyVenues } from '../lovable-bridge/useNearbyVenues';
import { CreatePostSheet } from '@doevents/shared';
import { LovablePostCardBridge } from '../lovable-bridge/LovablePostCardBridge';
import { LovableCommentsBridge } from '../lovable-bridge/LovableCommentsBridge';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import { filterAndSortMyPublishedEvents } from '../lovable-bridge/discoverEventFilters';
import { useFeedStories } from '../lovable-bridge/useFeedStories';
export const SocialWallTab: React.FC = () => {
const serviceSectorImage = (sector: string): string => {
  const map: Record<string, string> = {
    'Catering': modernKitchen,
    'Entretenimiento': outdoorDining,
    'Multimedia': dessertFestival,
    'Logística': vintageCars,
    'Seguridad': outdoorDining,
    'Servicio de transporte': vintageCars,
    'Marketing/publicidad': dessertFestival,
    'Maestro Ceremonia/presentador': modernKitchen,
  };
  return map[sector] || modernKitchen;
};

const Index = () => {
  const { addNotification } = useNotifications();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>(mockPosts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [pendingFollowRequests, setPendingFollowRequests] = useState<Set<string>>(new Set());
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const [activeSheet, setActiveSheet] = useState<{
    type: 'comments' | 'repost' | 'interactions';
    postId: string;
    interactionsTab?: 'likes' | 'reposts';
  } | null>(null);
  const [activeTab, setActiveTab] = useState('wall');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventFormData | null>(null);
  const [editingStep, setEditingStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [servicesInitialCreate, setServicesInitialCreate] = useState(false);
  const [publishedServices, setPublishedServices] = useState<ServiceFormData[]>(SERVICES);
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [showMyVenues, setShowMyVenues] = useState(false);
  const [venuesInitialCreate, setVenuesInitialCreate] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showMyInvitations, setShowMyInvitations] = useState(false);
  const [detailEvent, setDetailEvent] = useState<{ id?: string; title: string; image: string; date?: string; location?: string; description?: string } | null>(null);
  const [detailVenue, setDetailVenue] = useState<PublishedVenueDraft | null>(null);
  const [detailService, setDetailService] = useState<ServiceFormData | null>(null);
  const [publishedVenues, setPublishedVenues] = useState<PublishedVenueDraft[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<MyEventItem[]>(() => {
    // Register the FIFA mock in the rich event store so the detail view has full data
    setPublishedEvent(FIFA_EVENT_ID, FIFA_EVENT_FORM);
    return [
      FIFA_EVENT_LIST_ITEM,
      { id: 'me-1', image: outdoorDining, title: 'PHANTOM OF THE OPERA', date: '09/06/2026', location: 'C Manuel de Jesús Troncoso', description: 'Test1', status: 'finalizado' },
      { id: 'me-2', image: vintageCars, title: 'Ballet Santo Domingo', date: '15/06/2026', location: 'F37P+88F, Santo Domingo', description: 'Presentacion de Ballet en Santo Domingo', status: 'inactivo' },
      { id: 'me-3', image: modernKitchen, title: 'Celebracion Cumpleanos JUA...', date: '24/06/2026', location: 'Bogota - Colombia', description: 'Bienvenidos a la fiesta', status: 'activo' },
      { id: 'me-4', image: outdoorDining, title: 'Copia de Celebracion Cum...', date: '30/06/2026', location: 'Bogota - Colombia', description: 'Bienvenidos a la fiesta', status: 'reagendado' },
      { id: 'me-5', image: vintageCars, title: 'Copia de Celebracion Cum...', date: '30/06/2026', location: 'Bogota - Colombia', description: 'Bienvenidos a la fiesta', status: 'cancelado' },
      { id: 'me-6', image: modernKitchen, title: 'Dia de la madre RD', date: '08/03/2026', location: 'Bogota - Colombia', description: 'Celebracion del dia de la madre', status: 'finalizado' },
      { id: 'me-7', image: outdoorDining, title: 'Noche de Jazz', date: '12/07/2026', location: 'Medellin - Colombia', description: 'Velada musical de jazz en vivo', status: 'inactivo' },
    ];
  });
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [profileReturnTab, setProfileReturnTab] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<EventChatRoom[]>(mockChatRooms);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>(mockPrivateChats);
  const [activePrivateChatId, setActivePrivateChatId] = useState<string | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Close every full-screen sub-view so navegación desde el SideMenu/BottomNav siempre funcione.
  const resetAllViews = useCallback(() => {
    setShowCreateEvent(false);
    setEditingEvent(null);
    setShowServices(false);
    setServicesInitialCreate(false);
    setShowMyEvents(false);
    setShowMyVenues(false);
    setVenuesInitialCreate(false);
    setShowMyTickets(false);
    setShowMyInvitations(false);
    setDetailEvent(null);
    setDetailVenue(null);
    setDetailService(null);
    setViewingUser(null);
    setActiveChatId(null);
    setActivePrivateChatId(null);
  }, []);

  // Navegación directa desde BottomNav: cualquier tab cierra overlays.
  const handleTabChange = useCallback((tab: string) => {
    resetAllViews();
    setActiveTab(tab);
  }, [resetAllViews]);

  const handleSideMenuNavigate = useCallback((section: string) => {
    resetAllViews();
    const tabMap: Record<string, string> = {
      feed: 'wall',
      mensajes: 'mensajes',
      mapa: 'mapa',
      eventos: 'eventos',
      perfil: 'perfil',
      invitados: 'invitados',
      'control-accesos': 'control-accesos',
      'panel-admin': 'panel-admin',
      'ai-assistant': 'ai-assistant',
    };
    if (tabMap[section]) setActiveTab(tabMap[section]);
  }, [resetAllViews]);

  const handleSideMenuTickets = useCallback(() => {
    resetAllViews();
    setActiveTab('perfil');
    setShowMyTickets(true);
  }, [resetAllViews]);

  // Lista priorizada de overlays para el manejo del botón "Atrás" del navegador
  const overlayClosers = [
    { open: !!activeChatId, close: () => setActiveChatId(null) },
    { open: !!activePrivateChatId, close: () => setActivePrivateChatId(null) },
    { open: !!viewingUser, close: () => setViewingUser(null) },
    { open: !!detailEvent, close: () => setDetailEvent(null) },
    { open: !!detailVenue, close: () => setDetailVenue(null) },
    { open: !!detailService, close: () => setDetailService(null) },
    { open: showCreateEvent, close: () => { setShowCreateEvent(false); setEditingEvent(null); } },
    { open: showServices, close: () => { setShowServices(false); setServicesInitialCreate(false); } },
    { open: showMyEvents, close: () => setShowMyEvents(false) },
    { open: showMyVenues, close: () => { setShowMyVenues(false); setVenuesInitialCreate(false); } },
    { open: showMyTickets, close: () => setShowMyTickets(false) },
    { open: showMyInvitations, close: () => setShowMyInvitations(false) },
  ];
  const overlayDepth = overlayClosers.filter((o) => o.open).length;

  // Integración con el botón "Atrás" del navegador: cierra el overlay superior
  const closersRef = useRef(overlayClosers);
  closersRef.current = overlayClosers;
  useEffect(() => {
    if (overlayDepth === 0) return;
    window.history.pushState({ lovOverlay: overlayDepth }, '');
    const handler = () => {
      const topmost = closersRef.current.find((o) => o.open);
      topmost?.close();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [overlayDepth]);



  // Hidratar publicaciones del usuario desde Lovable Cloud al cargar.
  // Si no hay sesión, las funciones devuelven [] y la UI mantiene los mocks.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [myEv, myVe, mySv, allEv, allVe, allSv] = await Promise.all([
        loadMyEvents(), loadMyVenues(), loadMyServices(),
        loadAllEvents(), loadAllVenues(), loadAllServices(),
      ]);
      if (cancelled) return;

      // Mis eventos -> sección Mis Eventos (perfil)
      if (myEv.length) {
        setPublishedEvents((prev) => {
          const have = new Set(prev.map((e) => e.id));
          const mapped: MyEventItem[] = myEv
            .filter((r) => !have.has(r.id))
            .map((r) => {
              const d = r.payload || ({} as EventFormData);
              const cover = r.cover_url || d.images?.[0] || outdoorDining;
              const dt = r.start_date || '';
              const [y, m, day] = dt.split('-');
              return {
                id: r.id,
                image: cover,
                title: r.name,
                date: y && m && day ? `${day}/${m}/${y}` : dt,
                location: d.location?.customName || d.location?.customAddress || r.city || '',
                description: d.description || '',
                status: 'activo',
              };
            });
          return [...mapped, ...prev];
        });
        // alimenta el store para EventDetailView
        myEv.forEach((r) => setPublishedEvent(r.id, r.payload as EventFormData));
      }

      // Mis lugares
      if (myVe.length) {
        setPublishedVenues((prev) => {
          const have = new Set(prev.map((v) => v.id));
          const mapped: PublishedVenueDraft[] = myVe
            .filter((r) => !have.has(r.id))
            .map((r) => {
              const p = (r.payload || {}) as PublishedVenueDraft;
              return {
                id: r.id,
                name: r.name,
                link: p.link ?? `https://eventers.app/lugar/${r.id}`,
                address: p.address ?? r.city ?? '',
                type: p.type ?? 'Lugar',
                capacity: p.capacity ?? 0,
                image: r.cover_url || p.image || '',
                sector: p.sector,
                description: p.description,
              };
            });
          return [...mapped, ...prev];
        });
      }

      // Mis servicios
      if (mySv.length) {
        setPublishedServices((prev) => {
          const have = new Set(prev.map((s) => (s as ServiceFormData & { id?: string }).id));
          const mapped: ServiceFormData[] = mySv
            .filter((r) => !have.has(r.id))
            .map((r) => ({ ...(r.payload as ServiceFormData), id: r.id } as ServiceFormData));
          return [...mapped, ...prev];
        });
      }

      // Feed global / Descubre: publicaciones de OTROS usuarios como posts adicionales
      const otherEvents = allEv.filter((r) => !myEv.some((m) => m.id === r.id));
      const otherVenues = allVe.filter((r) => !myVe.some((m) => m.id === r.id));
      const otherServices = allSv.filter((r) => !mySv.some((m) => m.id === r.id));

      if (otherEvents.length || otherVenues.length || otherServices.length) {
        const extraPosts: Post[] = [];
        otherEvents.forEach((r) => {
          const d = (r.payload || {}) as EventFormData;
          extraPosts.push({
            id: r.id,
            user: { id: r.owner_id, name: 'Organizador', initials: 'OR' },
            timeAgo: 'Reciente',
            images: d.images?.length ? d.images : [r.cover_url || dessertFestival],
            title: r.name,
            date: `${r.start_date || ''} ${d.startTime || ''}`.trim(),
            location: d.location?.customName || d.location?.customAddress || r.city || '',
            tags: d.tags ?? [],
            description: d.description || '',
            likes: 0, likedBy: [], comments: [], reposts: 0, repostedBy: [],
            type: 'evento',
            visibility: 'public',
          });
          setPublishedEvent(r.id, d);
        });
        otherVenues.forEach((r) => {
          const p = (r.payload || {}) as PublishedVenueDraft;
          extraPosts.push({
            id: `venue-post-${r.id}`,
            user: { id: r.owner_id, name: 'Propietario', initials: 'PR' },
            timeAgo: 'Reciente',
            images: [r.cover_url || p.image || outdoorDining],
            title: r.name,
            date: '',
            location: p.address || r.city || '',
            tags: ['Lugar', p.type || ''].filter(Boolean),
            description: p.description || `${p.type || 'Lugar'} con capacidad para ${p.capacity || '—'} personas.`,
            likes: 0, likedBy: [], comments: [], reposts: 0, repostedBy: [],
            type: 'lugar',
            visibility: 'public',
          });
        });
        otherServices.forEach((r) => {
          const s = (r.payload || {}) as ServiceFormData;
          const sector = s.sectors?.[0] || 'Servicio';
          extraPosts.push({
            id: `service-post-${r.id}`,
            user: { id: r.owner_id, name: 'Profesional', initials: 'PF' },
            timeAgo: 'Reciente',
            images: [r.cover_url || serviceSectorImage(sector)],
            title: r.name,
            date: '',
            location: r.city || 'Disponible en tu ciudad',
            tags: ['Servicio', sector],
            description: `Servicio publicado en la plataforma. Sector: ${sector}.`,
            likes: 0, likedBy: [], comments: [], reposts: 0, repostedBy: [],
            type: 'servicio',
            visibility: 'public',
          });
        });
        setFeedPosts((prev) => {
          const have = new Set(prev.map((p) => p.id));
          return [...extraPosts.filter((p) => !have.has(p.id)), ...prev];
        });

        // Mezclar también en EventsView/Mapa
        if (otherEvents.length) {
          setPublishedEvents((prev) => {
            const have = new Set(prev.map((e) => e.id));
            const mapped: MyEventItem[] = otherEvents
              .filter((r) => !have.has(r.id))
              .map((r) => {
                const d = (r.payload || {}) as EventFormData;
                return {
                  id: r.id,
                  image: r.cover_url || d.images?.[0] || outdoorDining,
                  title: r.name,
                  date: r.start_date || '',
                  location: d.location?.customName || d.location?.customAddress || r.city || '',
                  description: d.description || '',
                  status: 'activo',
                };
              });
            return [...prev, ...mapped];
          });
        }
        if (otherVenues.length) {
          setPublishedVenues((prev) => {
            const have = new Set(prev.map((v) => v.id));
            const mapped: PublishedVenueDraft[] = otherVenues
              .filter((r) => !have.has(r.id))
              .map((r) => {
                const p = (r.payload || {}) as PublishedVenueDraft;
                return {
                  id: r.id, name: r.name, link: p.link ?? `https://eventers.app/lugar/${r.id}`,
                  address: p.address ?? r.city ?? '', type: p.type ?? 'Lugar',
                  capacity: p.capacity ?? 0, image: r.cover_url || p.image || '',
                  sector: p.sector, description: p.description,
                };
              });
            return [...prev, ...mapped];
          });
        }
        if (otherServices.length) {
          setPublishedServices((prev) => {
            const have = new Set(prev.map((s) => (s as ServiceFormData & { id?: string }).id));
            const mapped = otherServices
              .filter((r) => !have.has(r.id))
              .map((r) => ({ ...(r.payload as ServiceFormData), id: r.id }));
            return [...prev, ...mapped];
          });
        }
      }
    })().catch((e) => console.warn('[Index] hidratación falló', e));
    return () => { cancelled = true; };
  }, []);

  const handleUpdateChatMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    setChatRooms(prev => prev.map(room => room.id === chatId ? { ...room, messages, lastMessage: messages[messages.length - 1]?.text || '', lastMessageTime: 'Ahora' } : room));
  }, []);

  const handleUpdatePrivateChatMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    setPrivateChats(prev => prev.map(c => c.id === chatId ? { ...c, messages, lastMessage: messages[messages.length - 1]?.text || '', lastMessageTime: 'Ahora' } : c));
  }, []);

  const allPosts = [...userPosts, ...feedPosts];

  // Fan-out notifications to creator + simulated followers (push + bell)
  const notifyFollowers = (
    kind: 'post' | 'repost' | 'comment' | 'story' | 'live',
    title?: string,
  ) => {
    const label =
      kind === 'post' ? 'tu publicación' :
      kind === 'repost' ? 'tu repost' :
      kind === 'comment' ? 'tu comentario' :
      kind === 'story' ? 'tu historia' : 'tu transmisión en vivo';
    const type =
      kind === 'story' ? 'story_published' :
      kind === 'live' ? 'live_started' : 'own_publication';
    // Creator confirmation (bell on creator)
    addNotification({
      type,
      fromUser: { id: 'me', name: 'Tú', initials: 'TU' },
      postTitle: title,
      message: `Se enviaron notificaciones a tus ${myFollowers.length} seguidores sobre ${label}`,
    });
    // Simulated push to each follower
    myFollowers.forEach((f) => {
      addNotification({
        type: kind === 'comment' ? 'followed_post' : type,
        fromUser: { id: 'me', name: 'Tú', initials: 'TU' },
        postTitle: title,
        message:
          kind === 'story' ? 'publicó una nueva historia' :
          kind === 'live' ? 'inició una transmisión en vivo' :
          kind === 'repost' ? 'publicó un repost' :
          kind === 'comment' ? 'comentó en una publicación' :
          'publicó algo nuevo',
      });
    });
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Notificación enviada', {
          body: `Se notificó a ${myFollowers.length} seguidores sobre ${label}.`,
        });
      } catch {}
    }
  };


  const processMentions = (text: string, fromUser: { name: string; initials: string }, postId?: string) => {
    const mentionRegex = /@([\wáéíóúñüÁÉÍÓÚÑÜ][\wáéíóúñüÁÉÍÓÚÑÜ\-]*)/gi;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const mention = match[1].toLowerCase();
      const mentionedUser = allPosts.find(
        (p) => p.user.name.toLowerCase().replace(/\s+/g, '') === mention || 
               p.user.name.toLowerCase() === mention
      )?.user;
      if (mentionedUser && mentionedUser.id !== 'me') {
        addNotification({
          type: 'user_mention',
          fromUser,
          message: 'te mencionó en una publicación',
          postId,
        });
      }
      const mentionedEvent = allPosts.find(
        (p) => p.title.toLowerCase().replace(/\s+/g, '-') === mention ||
               p.title.toLowerCase().replace(/\s+/g, '') === mention
      );
      if (mentionedEvent && mentionedEvent.user.id !== 'me') {
        addNotification({
          type: 'event_mention',
          fromUser,
          eventName: mentionedEvent.title,
          message: `mencionó tu evento`,
          postId,
        });
      }
    }
  };

  const handleMentionClick = (mention: string) => {
    // Try to find user
    const user = allPosts.find(
      (p) => p.user.name.toLowerCase().replace(/\s+/g, '') === mention.toLowerCase() ||
             p.user.name.toLowerCase() === mention.toLowerCase()
    )?.user;
    if (user) {
      handleViewProfile(user);
      return;
    }
    // Try to find event
    const event = allPosts.find(
      (p) => p.title.toLowerCase().replace(/\s+/g, '-') === mention.toLowerCase() ||
             p.title.toLowerCase().replace(/\s+/g, '') === mention.toLowerCase()
    );
    if (event) {
      setActiveTab('eventos');
      toast(`Navegando al evento: ${event.title}`);
      return;
    }
    toast(`@${mention}`);
  };

  const handleCreatePost = (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'reposts'>) => {
    const newPost: Post = {
      ...postData,
      id: `user-${Date.now()}`,
      likes: 0,
      comments: [],
      reposts: 0,
    };
    setUserPosts((prev) => [newPost, ...prev]);
    // Process mentions in title and description
    processMentions(`${postData.title} ${postData.description}`, { name: 'Tú', initials: 'TU' }, newPost.id);
    // Fan-out push + bell to creator and followers
    notifyFollowers(postData.repostOf ? 'repost' : 'post', postData.title || postData.description.slice(0, 60));
    toast(postData.repostOf ? '¡Repost publicado!' : '¡Publicación creada!');
  };

  const handleEditPost = (postId: string, updates: { title: string; description: string; location: string; images: string[] }) => {
    const updatePost = (posts: Post[]) =>
      posts.map((p) => (p.id === postId ? { ...p, ...updates } : p));
    setUserPosts(updatePost);
    setFeedPosts(updatePost);
    toast('¡Publicación actualizada!');
  };

  const toggleLike = (postId: string) => {
    const post = allPosts.find((p) => p.id === postId);
    const alreadyLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    // Notify if liking (not unliking) a post owned by "me"
    if (!alreadyLiked && post && post.user.id !== 'me') {
      addNotification({
        type: 'like',
        fromUser: { name: post.user.name, initials: post.user.initials },
        postTitle: post.title,
      });
    }
  };

  const toggleFollow = (userId: string) => {
    const alreadyFollowed = followedUsers.has(userId);
    const user = allPosts.find((p) => p.user.id === userId)?.user;

    // Private user → send follow request instead of following directly
    if (!alreadyFollowed && isUserPrivate(userId)) {
      if (pendingFollowRequests.has(userId)) {
        toast('Solicitud ya enviada');
        return;
      }
      setPendingFollowRequests((prev) => new Set(prev).add(userId));
      if (user) {
        addNotification({
          type: 'follow_request',
          fromUser: { id: user.id, name: user.name, initials: user.initials },
          message: 'quiere seguirte',
          actionable: true,
        });
      }
      toast.success('Solicitud de seguimiento enviada');
      return;
    }

    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    if (!alreadyFollowed && user) {
      addNotification({
        type: 'follow',
        fromUser: { id: user.id, name: user.name, initials: user.initials },
        message: 'te empezó a seguir',
      });
    }
  };

  const hidePost = (postId: string) => {
    setHiddenPosts((prev) => new Set(prev).add(postId));
    toast('Post ocultado');
  };

  const handleShare = (postId: string) => {
    const post = allPosts.find((p) => p.id === postId);
    toast('Enlace copiado al portapapeles');
    if (post && post.user.id !== 'me') {
      addNotification({
        type: 'share',
        fromUser: { name: 'Tú', initials: 'TU' },
        postTitle: post.title,
      });
    }
  };

  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const openReport = (postId: string) => {
    const post = allPosts.find((p) => p.id === postId);
    setReportTarget({
      targetType: 'post',
      postId,
      postTitle: post?.title,
      postAuthor: post?.user.name,
    });
  };

  const openProfileReport = (user: User) => {
    setReportTarget({
      targetType: 'profile',
      profileId: user.id,
      profileName: user.name,
      profileUsername: `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
    });
  };

  const handleReported = ({ adminsNotified }: { adminsNotified: number }) => {
    // Campana local (en una app real, llegaría sólo a admins por su sesión)
    addNotification({
      type: 'own_publication',
      fromUser: { id: 'me', name: 'Tú', initials: 'TU' },
      message: `Tu denuncia fue enviada a ${adminsNotified || 'los'} administradores`,
    });
  };

  const handleAddComment = (postId: string, text: string, parentId?: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      user: { id: 'me', name: 'Tú', initials: 'TU' },
      text,
      timeAgo: 'Justo ahora',
      likes: 0,
      replies: 0,
      repliesData: [],
    };

    const addReplyToComment = (comments: Comment[]): Comment[] =>
      comments.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: (c.repliesData?.length || 0) + 1,
            repliesData: [...(c.repliesData || []), newComment],
          };
        }
        if (c.repliesData?.length) {
          return { ...c, repliesData: addReplyToComment(c.repliesData) };
        }
        return c;
      });

    const updateComments = (posts: Post[]) =>
      posts.map((p) => {
        if (p.id !== postId) return p;
        if (parentId) {
          return { ...p, comments: addReplyToComment(p.comments) };
        }
        return { ...p, comments: [...p.comments, newComment] };
      });

    setUserPosts(updateComments);
    setFeedPosts(updateComments);
    const post = allPosts.find((p) => p.id === postId);
    if (post && post.user.id !== 'me') {
      addNotification({
        type: 'comment',
        fromUser: { name: 'Tú', initials: 'TU' },
        postTitle: post.title,
      });
    }
    // Process mentions in comment text
    processMentions(text, { name: 'Tú', initials: 'TU' });
    // Fan-out push + bell to creator (me) and followers
    notifyFollowers('comment', post?.title);
    toast(parentId ? '¡Respuesta agregada!' : '¡Comentario agregado!');
  };

  const handleDeletePost = useCallback((postId: string) => {
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
    toast('Publicación eliminada');
  }, []);

  const handleViewProfile = (user: User | { name: string; initials: string }) => {
    // Find the full User object if we only have partial data (from notifications)
    const fullUser: User = 'id' in user
      ? user
      : allPosts.find((p) => p.user.initials === user.initials)?.user || { id: `u-${user.initials}`, ...user };
    setProfileReturnTab(activeTab);
    setViewingUser(fullUser);
    setActiveSheet(null); // Close any open sheets
  };

  const handleGoToPost = useCallback((postId: string) => {
    // Switch to feed tab and close any profile view
    setViewingUser(null);
    setActiveTab('wall');
    // Small delay to let the feed render, then scroll to the post
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all');
        }, 2000);
      }
    }, 300);
  }, []);

  const visiblePosts = allPosts.filter((p) => !hiddenPosts.has(p.id));
  const activePost = activeSheet
    ? allPosts.find((p) => p.id === activeSheet.postId)
    : null;

  return (
    <div className="min-h-screen bg-secondary pb-32">
      <TopHeader
        onViewProfile={handleViewProfile}
        onGoToEvent={() => handleTabChange('eventos')}
        onGoToTickets={() => { resetAllViews(); setActiveTab('perfil'); setShowMyTickets(true); }}
        onGoToPost={handleGoToPost}
        onNavigate={handleTabChange}
      />
      {showCreateEvent ? (
        <CreateEventView
          onBack={() => { setShowCreateEvent(false); setEditingEvent(null); setEditingStep(null); }}
          onCreated={() => toast(editingEvent ? 'Cambios guardados' : 'Información principal guardada')}
          initialData={editingEvent ?? undefined}
          initialStep={editingStep ?? (editingEvent ? 7 : 1)}
          onGoToStats={() => { setShowCreateEvent(false); setEditingEvent(null); setActiveTab('estadisticas'); }}
          onPublish={(data) => {
            const heroImg = data.images[0] || dessertFestival;
            const eventId = `event-${Date.now()}`;
            // Persist the full wizard data so every UX (feed, EventsView,
            // MyEvents, EventDetailView, etc.) can resolve the complete info.
            setPublishedEvent(eventId, data);
            const newPost: Post = {
              id: eventId,
              user: { id: 'me', name: 'Tú', initials: 'TU' },
              timeAgo: 'Justo ahora',
              images: data.images.length ? data.images : [heroImg],
              title: data.name,
              date: `${data.startDate} - ${data.startTime}`,
              location: data.location.customName || data.location.customAddress || data.location.detectedCity || '',
              tags: data.tags,
              description: data.description,
              likes: 0,
              likedBy: [],
              comments: [],
              reposts: 0,
              repostedBy: [],
              type: 'evento',
              visibility: data.eventClass === 'private' ? 'private' : 'public',
            };
            setUserPosts((prev) => [newPost, ...prev]);
            const fmtDate = (d: string) => {
              if (!d) return '';
              const [y, m, day] = d.split('-');
              return y && m && day ? `${day}/${m}/${y}` : d;
            };
            setPublishedEvents((prev) => [
              {
                id: newPost.id,
                image: heroImg,
                title: data.name,
                date: fmtDate(data.startDate),
                location: data.location.customName || data.location.customAddress || data.location.detectedCity || '',
                description: data.description,
                status: 'activo',
              },
              ...prev,
            ]);
            // Persistir en Lovable Cloud (si hay sesión). No bloquea la UX.
            publishEventToDb(data)
              .then((id) => { if (id) toast.success('Evento guardado en la nube'); })
              .catch(() => {/* silencioso */});
            setShowCreateEvent(false);
            setEditingEvent(null);
            setActiveTab('wall');
          }}
        />
      ) : showServices ? (
        <MyServicesView
          initialCreate={servicesInitialCreate}
          onBack={() => { setShowServices(false); setServicesInitialCreate(false); }}
          onPublish={(data) => setPublishedServices(data)}
          onServicePublished={(service) => {
            const sector = service.sectors[0] || 'Servicio';
            const activities = service.sectors.flatMap((s) => service.activities[s] || []).slice(0, 3);
            const allActivities = service.sectors.flatMap((s) =>
              (service.activities[s] || []).map((act) => ({ sector: s, activity: act }))
            );
            const lowestPricing = allActivities.reduce<{ cost: number; currency: string } | null>((best, { sector, activity }) => {
              const p = service.activityPricing[`${sector}::${activity}`];
              if (!p || !p.cost) return best;
              const num = Number(p.cost);
              return !best || num < best.cost ? { cost: num, currency: p.currency } : best;
            }, null);
            const priceText = lowestPricing && lowestPricing.cost > 0
              ? `Desde ${lowestPricing.currency} ${lowestPricing.cost.toLocaleString()}`
              : '';
            const newPost: Post = {
              id: `service-post-${Date.now()}`,
              user: { id: 'me', name: 'Tú', initials: 'TU' },
              timeAgo: 'Ahora',
              images: [serviceSectorImage(sector)],
              title: sector,
              date: new Date().toLocaleDateString('es-CO'),
              location: 'Disponible en tu ciudad',
              tags: ['Servicio', sector, ...activities],
              description: `¡Acabo de publicar un servicio de ${sector}! Actividades: ${activities.join(', ')}. ${priceText}. Disponible de ${service.globalStartTime} a ${service.globalEndTime}.`,
              likes: 0,
              likedBy: [],
              comments: [],
              reposts: 0,
              repostedBy: [],
              type: 'servicio',
              visibility: 'public',
            };
            setUserPosts((prev) => [newPost, ...prev]);
            publishServiceToDb(service)
              .then((id) => { if (id) toast.success('Servicio guardado en la nube'); })
              .catch(() => {});
            toast.success('¡Servicio publicado en el wall y en Eventos!');
          }}
          publishedServices={publishedServices}
        />
      ) : (
      <>

      {detailEvent ? (
        <EventDetailView
          event={detailEvent}
          onBack={() => setDetailEvent(null)}
          onSuccess={() => {
            setDetailEvent(null);
            setActiveTab('wall');
          }}
          onPurchaseStart={() => setHideBottomNav(true)}
          onPurchaseEnd={() => setHideBottomNav(false)}
          onViewProfile={(person, role) => {
            const initials = person.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
            handleViewProfile({ name: person.name, initials });
          }}
        />
      ) : detailVenue ? (
        <VenueDetailReservation
          venue={detailVenue}
          onBack={() => setDetailVenue(null)}
          onFinish={() => setDetailVenue(null)}
          onViewProfile={handleViewProfile}
        />
      ) : detailService ? (
        <ServiceDetailView service={detailService} onBack={() => setDetailService(null)} onViewProfile={handleViewProfile} />
        ) : activeTab === 'perfil' ? (
        showMyTickets ? (
          <MyPurchasesView
            onBack={() => setShowMyTickets(false)}
            initialSelectedTicketId={selectedTicketId}
            onSelectedTicketChange={setSelectedTicketId}
            onViewVenueDetail={() => {
              const v = publishedVenues[0] ?? {
                id: 'mock-venue-1',
                name: 'Hacienda Los Naranjos',
                link: '#',
                address: 'Vía Llanogrande Km 4, Rionegro',
                type: 'Hacienda',
                capacity: 300,
                image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=70',
              } as PublishedVenueDraft;
              setDetailVenue(v);
            }}
            onViewServiceDetail={() => {
              setDetailService(publishedServices[0] || SERVICES[0]);
            }}
            onViewEventDetail={(eventId, ticket) => {
              const inv = mockInvitations.find((i) => i.id === eventId);
              if (inv) {
                setDetailEvent({
                  id: inv.id,
                  title: inv.title,
                  image: inv.image,
                  date: inv.startDate,
                  location: inv.venue.address,
                  description: inv.description,
                });
                return;
              }
              setDetailEvent({
                id: ticket.eventId || ticket.id,
                title: ticket.eventTitle,
                image: ticket.eventImage,
                date: ticket.eventDate,
                location: ticket.entrance || 'Recinto del evento',
                description: `Boleta ${ticket.category} · ${ticket.seat}. Disfruta de la experiencia completa de ${ticket.eventTitle}.`,
              });
            }}
          />

        ) : showMyInvitations ? (
          <MyInvitationsView
            onBack={() => setShowMyInvitations(false)}
            onViewProfile={(person) => {
              const initials = person.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
              handleViewProfile({ name: person.name, initials });
            }}
          />
        ) : showMyVenues ? (
          <MyVenuesView
            initialCreate={venuesInitialCreate}
            onBack={() => { setShowMyVenues(false); setVenuesInitialCreate(false); }}
            onVenuePublished={(v) => {
              setPublishedVenues((prev) => [v, ...prev]);
              // Crear post automático en el feed
              const newPost: Post = {
                id: `venue-post-${v.id}`,
                user: { id: 'me', name: 'Tú', initials: 'TU' },
                timeAgo: 'Ahora',
                images: [v.image],
                title: v.name,
                date: new Date().toLocaleDateString('es-CO'),
                location: v.address,
                tags: ['Lugar', v.type],
                description: `¡Acabo de publicar mi lugar para eventos! ${v.name} — ${v.type} con capacidad para ${v.capacity} personas. Reserva en: ${v.link}`,
                likes: 0,
                likedBy: [],
                comments: [],
                reposts: 0,
                repostedBy: [],
                type: 'lugar',
                visibility: 'public',
              };
              setUserPosts((prev) => [newPost, ...prev]);
              publishVenueToDb(v)
                .then((id) => { if (id) toast.success('Lugar guardado en la nube'); })
                .catch(() => {});
              toast.success('¡Lugar publicado en el wall y en Eventos!');
            }}
            onGoToWall={() => {
              setShowMyVenues(false);
              setActiveTab('wall');
            }}
          />
        ) : showMyEvents ? (
          <MyEventsView
            events={publishedEvents}
            onBack={() => setShowMyEvents(false)}
            onDuplicate={(ev) => {
              const copy: MyEventItem = {
                ...ev,
                id: `${ev.id}-copy-${Date.now()}`,
                title: `Copia de ${ev.title}`,
                status: 'inactivo',
              };
              setPublishedEvents((prev) => [copy, ...prev]);
            }}
            onDelete={(id) => setPublishedEvents((prev) => prev.filter((e) => e.id !== id))}
            onEdit={(ev) => {
              const stored = getPublishedEvent(ev.id);
              setEditingEvent(stored ?? mockCompleteEvent);
              setShowMyEvents(false);
              setShowCreateEvent(true);
            }}
            onCreate={() => {
              setShowMyEvents(false);
              setShowCreateEvent(true);
            }}
            onOpenDetail={(e) => setDetailEvent({ id: e.id, title: e.title, image: e.image, date: e.date, location: e.location, description: e.description })}
          />

        ) : (
          <ProfileView
            onOpenServices={() => setShowServices(true)}
            publishedServices={publishedServices}
            onNavigateStats={() => setActiveTab('estadisticas')}
            onNavigateMessages={() => setActiveTab('mensajes')}
            onOpenMyEvents={() => setShowMyEvents(true)}
            onOpenMyVenues={() => setShowMyVenues(true)}
            onOpenMyTickets={() => setShowMyTickets(true)}
            onOpenMyInvitations={() => setShowMyInvitations(true)}
            onOpenGuests={() => setActiveTab('invitados')}
            onViewProfile={handleViewProfile}
            myEventsCount={publishedEvents.length}
          />
        )
      ) : activeTab === 'eventos' ? (
        <EventsView
          publishedEvents={publishedEvents}
          publishedVenues={publishedVenues}
          publishedServices={publishedServices}
          onOpenEvent={(e) => setDetailEvent({ id: e.id, title: e.title, image: e.image, date: e.date, location: e.location, description: e.description })}
          onOpenVenue={(v) => setDetailVenue(v)}
          onOpenService={(s) => setDetailService(s)}
        />
      ) : activeTab === 'mensajes' ? (
        activeChatId ? (
          <ChatRoomView
            chatRoom={chatRooms.find(r => r.id === activeChatId)!}
            onBack={() => setActiveChatId(null)}
            onUpdateMessages={handleUpdateChatMessages}
          />
        ) : activePrivateChatId ? (
          <PrivateChatView
            chat={privateChats.find(c => c.id === activePrivateChatId)!}
            onBack={() => setActivePrivateChatId(null)}
            onUpdateMessages={handleUpdatePrivateChatMessages}
          />
        ) : (
          <MessagesListView chatRooms={chatRooms} onOpenChat={setActiveChatId} onDeleteChat={(id) => setChatRooms(prev => prev.filter(r => r.id !== id))} onOpenPrivateChat={setActivePrivateChatId} onBack={() => setActiveTab('wall')} />
        )
      ) : activeTab === 'estadisticas' ? (
        <StatsEventListView events={chatRooms} onBack={() => setActiveTab('wall')} onViewProfile={handleViewProfile} />
      ) : activeTab === 'mapa' ? (
        <MapView
          onOpenEvent={(p) => setDetailEvent({ id: p.id, title: p.title, image: p.images[0], date: p.date, location: p.location, description: p.description })}
          onOpenVenue={(v) => setDetailVenue(v)}
          onOpenService={(s) => setDetailService(s)}
        />
      ) : activeTab === 'invitados' ? (
        <GuestManagementView onBack={() => setActiveTab('wall')} />
      ) : activeTab === 'control-accesos' ? (
        <AccessControlListView
          onBack={() => setActiveTab('wall')}
          onConfigure={(eventId) => {
            const stored = eventId ? getPublishedEvent(eventId) : null;
            setEditingEvent(stored ?? mockCompleteEvent);
            setEditingStep(3);
            setActiveTab('wall');
            setShowCreateEvent(true);
          }}
          onViewOrganizer={(org) => {
            setProfileReturnTab('control-accesos');
            setViewingUser({ id: org.id, name: org.name, initials: org.initials });
            setActiveTab('wall');
          }}
          onViewEvent={(ev) => {
            setDetailEvent({
              id: ev.id,
              title: ev.title,
              image: '',
              date: `${ev.date} - ${ev.time}`,
              location: ev.location,
              description: '',
            });
            setActiveTab('wall');
          }}
        />

      ) : activeTab === 'panel-admin' ? (
        <AdminPanelView onBack={() => setActiveTab('wall')} />
      ) : activeTab === 'ai-assistant' ? (
        <AIAssistantView
          onBack={() => setActiveTab('wall')}
          onUseDraft={(draft) => {
            toast.success(`Borrador "${draft.title ?? 'Evento IA'}" listo. Abriendo creador...`);
            setActiveTab('wall');
            setShowCreateEvent(true);
          }}
        />
      ) : (
        <>
          <FeedHero />
          <div className="mx-auto max-w-lg">
            <FeedServicesCarousel
              onOpenService={() => setDetailService(publishedServices[0] || SERVICES[0])}
            />
            <FeedBanner />
            {visiblePosts.map((post) => (
              <div key={post.id} id={`post-${post.id}`}>
              <PostCard
                post={post}
                liked={likedPosts.has(post.id)}
                followed={followedUsers.has(post.user.id)}
                isOwner={post.user.id === 'me'}
                onLike={() => toggleLike(post.id)}
                onFollow={() => toggleFollow(post.user.id)}
                onComment={() =>
                  setActiveSheet({ type: 'comments', postId: post.id })
                }
                onRepost={() =>
                  setActiveSheet({ type: 'repost', postId: post.id })
                }
                onShare={() => handleShare(post.id)}
                onHide={() => hidePost(post.id)}
                onNotInterested={() => hidePost(post.id)}
                onBlock={() => hidePost(post.id)}
                onReport={() => openReport(post.id)}
                onEdit={() => setEditingPost(post)}
                onDelete={() => handleDeletePost(post.id)}
                onViewLikes={() =>
                  setActiveSheet({ type: 'interactions', postId: post.id, interactionsTab: 'likes' })
                }
                onViewReposts={() =>
                  setActiveSheet({ type: 'interactions', postId: post.id, interactionsTab: 'reposts' })
                }
                onViewProfile={handleViewProfile}
                onMentionClick={handleMentionClick}
                onOpenDetail={(p) => {
                  if (p.type === 'evento') {
                    setDetailEvent({ id: p.id, title: p.title, image: p.images[0], date: p.date, location: p.location, description: p.description });
                  } else if (p.type === 'lugar') {
                    setDetailVenue({
                      id: p.id,
                      name: p.title,
                      link: '#',
                      address: p.location || 'Ubicación no especificada',
                      type: 'Lugar',
                      capacity: 200,
                      image: p.images[0],
                    });
                  } else if (p.type === 'servicio') {
                    setDetailService(publishedServices[0] || SERVICES[0]);
                  }
                }}
              />
              </div>
            ))}

            {visiblePosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-lg font-semibold text-muted-foreground">
                  No hay publicaciones para mostrar
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ¡Sigue a más personas para ver su contenido!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments Drawer */}
      {activePost && activeSheet?.type === 'comments' && (
        <CommentsSheet
          open
          onOpenChange={(open) => !open && setActiveSheet(null)}
          comments={activePost.comments}
          totalComments={activePost.comments.length}
          onAddComment={(text, parentId) => handleAddComment(activeSheet.postId, text, parentId)}
          onMentionClick={handleMentionClick}
        />
      )}

      {/* Repost Drawer */}
      {activePost && activeSheet?.type === 'repost' && (
        <RepostSheet
          open
          onOpenChange={(open) => !open && setActiveSheet(null)}
          post={activePost}
          onPublishRepost={handleCreatePost}
        />
      )}

      {/* Interactions Drawer */}
      {activePost && activeSheet?.type === 'interactions' && (
        <InteractionsSheet
          open
          onOpenChange={(open) => !open && setActiveSheet(null)}
          likedBy={activePost.likedBy}
          repostedBy={activePost.repostedBy}
          defaultTab={activeSheet.interactionsTab}
          onViewProfile={handleViewProfile}
        />
      )}

      <CreatePostSheet
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        onPublish={handleCreatePost}
      />

      {editingPost && (
        <EditPostSheet
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          post={editingPost}
          onSave={handleEditPost}
        />
      )}

      <ReportPostDialog
        open={!!reportTarget}
        onOpenChange={(v) => { if (!v) setReportTarget(null); }}
        target={reportTarget}
        onReported={handleReported}
      />

      </>
      )}

      {/* Bottom nav y FAB de creación: visibles en TODAS las vistas para navegación directa */}
      <CreateFAB
        open={fabOpen}
        onOpenChange={setFabOpen}
        onCreatePost={() => setShowCreatePost(true)}
        onCreateEvent={() => { resetAllViews(); setShowCreateEvent(true); }}
        onPublishVenue={() => { resetAllViews(); setActiveTab('perfil'); setVenuesInitialCreate(true); setShowMyVenues(true); }}
        onOfferService={() => { resetAllViews(); setActiveTab('perfil'); setServicesInitialCreate(true); setShowServices(true); }}
      />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onCreate={() => setFabOpen(true)} forceHidden={hideBottomNav} />

      {/* FAB Asistente IA — visible en todas las vistas excepto en el propio asistente */}
      {activeTab !== 'ai-assistant' && !hideBottomNav && (
        <AIAssistantFAB onClick={() => { resetAllViews(); setActiveTab('ai-assistant'); }} />
      )}


      {/* UserProfileView overlay: persiste por encima de cualquier vista (detalle de evento, invitaciones, etc.) */}
      {viewingUser && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
          <UserProfileView
            user={viewingUser}
            posts={allPosts}
            isFollowed={followedUsers.has(viewingUser.id)}
            requestPending={pendingFollowRequests.has(viewingUser.id)}
            onBack={() => {
              setViewingUser(null);
              if (profileReturnTab) {
                setActiveTab(profileReturnTab);
                setProfileReturnTab(null);
              }
            }}
            onFollow={() => toggleFollow(viewingUser.id)}
            onRequestFollow={() => toggleFollow(viewingUser.id)}
            onOpenEventDetail={(ev) => {
              setViewingUser(null);
              setDetailEvent(ev);
            }}
            onOpenVenueByIndex={(idx) => {
              const v = VENUES[idx % VENUES.length];
              if (v) { setViewingUser(null); setDetailVenue(v); }
            }}
            onOpenServiceByIndex={(idx) => {
              const s = SERVICES[idx % SERVICES.length];
              if (s) { setViewingUser(null); setDetailService(s); }
            }}
            onOpenPrivateChat={(u) => {
              const existing = privateChats.find((c) => c.user.id === u.id || c.id === `dm-${u.id}`);
              let chatId: string;
              if (existing) {
                chatId = existing.id;
              } else {
                chatId = `dm-${u.id}`;
                const newChat: PrivateChat = {
                  id: chatId,
                  user: { id: u.id, name: u.name, initials: u.initials, isAdmin: false, isOnline: false },
                  lastMessage: 'Sin mensajes recientes',
                  lastMessageTime: '',
                  unreadCount: 0,
                  messages: [],
                };
                setPrivateChats((prev) => [newChat, ...prev]);
              }
              setViewingUser(null);
              setActiveTab('mensajes');
              setActiveChatId(null);
              setActivePrivateChatId(chatId);
            }}
            onReportProfile={() => openProfileReport(viewingUser)}
          />
        </div>
      )}


      {/* SideMenu global: disponible desde cualquier vista de la app */}
      <SideMenu
        open={sideMenuOpen}
        onOpenChange={setSideMenuOpen}
        onNavigate={handleSideMenuNavigate}
        onGoToTickets={handleSideMenuTickets}
      />
    </div>
  );
};

export default Index;