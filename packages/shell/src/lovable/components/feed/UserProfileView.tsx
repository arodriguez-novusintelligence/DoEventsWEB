import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Heart,
  Megaphone,
  MapPin,
  ArrowLeft,
  Shield,
  UserPlus,
  Check,
  Camera,
  Lock,
  Clock,
  PartyPopper,
  TrendingUp,
  Send,
  Calendar,
  ChevronLeft,
  X,
  ChevronRight,
  Users,
  Briefcase,
  DollarSign,
  CalendarDays,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import { Drawer, DrawerContent } from '@lovable/components/ui/drawer';
import type { User, Post } from '@lovable/data/mockData';
import { toast } from 'sonner';
import { isUserPrivate } from '@lovable/contexts/PrivacyContext';
import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';
import photo1 from '@lovable/assets/gallery/photo-1.jpg';
import photo2 from '@lovable/assets/gallery/photo-2.jpg';
import photo3 from '@lovable/assets/gallery/photo-3.jpg';
import photo4 from '@lovable/assets/gallery/photo-4.jpg';
import photo5 from '@lovable/assets/gallery/photo-5.jpg';
import photo6 from '@lovable/assets/gallery/photo-6.jpg';
import { cn } from '@lovable/lib/utils';


interface UserProfileViewProps {
  user: User;
  posts: Post[];
  isFollowed: boolean;
  onBack: () => void;
  onFollow: () => void;
  onRequestFollow?: () => void;
  requestPending?: boolean;
  onOpenEventDetail?: (event: { id?: string; title: string; image: string; date?: string; location?: string; description?: string }) => void;
  onOpenVenueByIndex?: (idx: number) => void;
  onOpenServiceByIndex?: (idx: number) => void;
  onOpenPrivateChat?: (user: User) => void;
}

type SubView = null | 'publications' | 'events' | 'venues' | 'services' | 'comments' | 'photos' | 'chat';

// Deterministic pseudo-random based on string seed
const seedFrom = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const IMG_POOL = [dessertFestival, modernKitchen, outdoorDining, vintageCars, photo1, photo2, photo3, photo4, photo5, photo6];

interface MockReview {
  user: string;
  initials: string;
  date: string;
  rating: number;
  comment?: string;
}

const REVIEW_POOL: MockReview[] = [
  { user: 'Carlos M.', initials: 'CM', date: '02 jun 2026, 18:30', rating: 5, comment: 'Excelente experiencia, todo impecable y muy bien organizado.' },
  { user: 'Laura P.', initials: 'LP', date: '28 may 2026, 21:10', rating: 4, comment: 'Muy buena atención, lo recomendaría sin duda.' },
  { user: 'Andrés R.', initials: 'AR', date: '20 may 2026, 14:05', rating: 5, comment: 'Repetiría sin dudar, todo salió perfecto.' },
  { user: 'Sofía G.', initials: 'SG', date: '10 may 2026, 11:42', rating: 4 },
  { user: 'Daniel A.', initials: 'DA', date: '03 may 2026, 09:20', rating: 3, comment: 'Buena experiencia general, mejoraría algunos detalles.' },
];

const buildMock = (user: User) => {
  const seed = seedFrom(user.id || user.name);
  const pick = (n: number, offset = 0) => IMG_POOL[(seed + offset + n) % IMG_POOL.length];
  const reviewsFor = (id: string) => {
    const s = seedFrom(id);
    return REVIEW_POOL.slice(0, (s % 4) + 1);
  };

  const EVENT_STATUSES = ['finalizado', 'activo', 'inactivo', 'reagendado'] as const;
  const events = Array.from({ length: 4 }).map((_, i) => {
    const id = `${user.id}-ev-${i}`;
    return {
      id,
      title: ['Festival Cultural', 'Cata de Vinos Premium', 'Concierto al Aire Libre', 'Noche de Jazz'][i],
      date: ['12/07/2026', '24/08/2026', '03/09/2026', '15/10/2026'][i],
      location: ['Bogotá, Colombia', 'Medellín, Colombia', 'Cartagena, Colombia', 'Cali, Colombia'][i],
      description: ['Festival con artistas locales', 'Cata guiada de 8 etiquetas', 'Show con orquesta sinfónica', 'Velada musical en vivo'][i],
      image: pick(i, 1),
      status: EVENT_STATUSES[i],
      reviews: reviewsFor(id),
    };
  });

  const publications = Array.from({ length: 4 }).map((_, i) => ({
    id: `${user.id}-pub-${i}`,
    title: ['Detrás de cámaras', 'Mi último evento', 'Recomendaciones del mes', 'Gracias por venir'][i],
    description: 'Compartiendo momentos especiales con la comunidad Do•events.',
    image: pick(i, 5),
    likes: 12 + ((seed + i * 7) % 80),
    comments: 2 + ((seed + i) % 18),
    timeAgo: ['hace 2 h', 'hace 1 d', 'hace 4 d', 'hace 1 sem'][i],
  }));

  const venues = Array.from({ length: 3 }).map((_, i) => {
    const id = `${user.id}-ve-${i}`;
    return {
      id,
      name: ['Terraza Skyline', 'Salón Boutique', 'Eco Lodge Montaña'][i],
      address: ['Cra 15 #93-47, Bogotá', 'Calle 10 #4-22, Cartagena', 'Km 12 vía al mar'][i],
      type: ['Terraza', 'Salón social', 'Hotel campestre'][i],
      capacity: [80, 120, 200][i],
      image: pick(i, 9),
      reviews: reviewsFor(id),
    };
  });

  const services = Array.from({ length: 4 }).map((_, i) => {
    const id = `${user.id}-sv-${i}`;
    return {
      id,
      sector: ['Catering', 'Entretenimiento', 'Multimedia', 'Logística'][i],
      activities: [3, 2, 3, 2][i],
      price: ['Desde COP 180,000', 'Desde USD 450', 'Desde COP 800,000', 'Desde COP 110,000'][i],
      image: pick(i, 3),
      reviews: reviewsFor(id),
    };
  });

  const commentsList = [
    { id: 'c1', name: 'Ana López', initials: 'AL', text: '¡Eres increíble! Siempre me inspiras 💜', timeAgo: 'hace 2 h', likes: 14 },
    { id: 'c2', name: 'Carlos Restrepo', initials: 'CR', text: 'Tu último evento estuvo espectacular 🔥', timeAgo: 'hace 1 d', likes: 9 },
    { id: 'c3', name: 'Laura Mejía', initials: 'LM', text: '¿Cuándo es el próximo? 😋', timeAgo: 'hace 2 d', likes: 5 },
  ];
  const photos = IMG_POOL.slice(0, 9).map((src, i) => ({ id: `ph-${i}`, src }));
  const initialChat = [
    { id: 'm1', text: '¡Hola! ¿Cómo estás?', isOwn: false, time: '10:12' },
    { id: 'm2', text: '¡Muy bien! Vi tu último evento, estuvo genial 🎉', isOwn: true, time: '10:14' },
    { id: 'm3', text: '¡Gracias! Pronto viene uno nuevo, te aviso', isOwn: false, time: '10:15' },
  ];
  return { events, publications, venues, services, commentsList, photos, initialChat };
};

const STATUS_STYLES: Record<string, { label: string; className: string; grayscale?: boolean }> = {
  activo:     { label: 'activo',     className: 'bg-primary text-primary-foreground' },
  finalizado: { label: 'Finalizado', className: 'bg-primary text-primary-foreground' },
  inactivo:   { label: 'inactivo',   className: 'bg-muted text-muted-foreground', grayscale: true },
  reagendado: { label: 'Reagendado', className: 'bg-amber-100 text-amber-700' },
};

const StarsRow = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map((i) => (
      <Star key={i} style={{ width: size, height: size }}
        className={i <= Math.round(value) ? 'fill-primary text-primary' : 'text-primary'} strokeWidth={2} />
    ))}
  </div>
);


const UserProfileView = ({ user, posts, isFollowed, onBack, onFollow, onRequestFollow, requestPending, onOpenEventDetail, onOpenVenueByIndex, onOpenServiceByIndex, onOpenPrivateChat }: UserProfileViewProps) => {
  const userPosts = posts.filter((p) => p.user.id === user.id);
  const isPrivate = isUserPrivate(user.id);
  const username = user.name.toLowerCase().replace(/\s+/g, '');
  const canView = !isPrivate || isFollowed;
  const mock = useMemo(() => buildMock(user), [user]);

  const [subView, setSubView] = useState<SubView>(null);
  const [chatMsgs, setChatMsgs] = useState(mock.initialChat);
  const [chatInput, setChatInput] = useState('');
  const [comments, setComments] = useState(mock.commentsList);
  const [newComment, setNewComment] = useState('');
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);
  const [reviewsFor, setReviewsFor] = useState<{ title: string; reviews: MockReview[] } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subView === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, subView]);

  const totalLikes = mock.publications.reduce((s, p) => s + p.likes, 0);

  const requireAccess = (fn: () => void) => {
    if (!canView) {
      toast('Sigue a este perfil para ver su contenido');
      return;
    }
    fn();
  };

  // ====== SUB VIEWS ======
  if (subView) {
    const SubHeader = ({ title }: { title: string }) => (
      <div className="sticky top-0 z-10 -mx-4 mb-3 flex items-center gap-2 bg-secondary/95 backdrop-blur px-4 py-3 border-b border-border">
        <button onClick={() => setSubView(null)} className="flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronLeft className="h-5 w-5" />
          Volver
        </button>
        <h2 className="ml-2 text-base font-bold text-foreground truncate">{title}</h2>
      </div>
    );

    const ReviewsDrawer = (
      <Drawer open={!!reviewsFor} onOpenChange={(o) => !o && setReviewsFor(null)}>
        <DrawerContent className="max-h-[85vh]">
          {reviewsFor && (() => {
            const rs = reviewsFor.reviews;
            const avg = rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0;
            return (
              <div className="mx-auto w-full max-w-lg px-4 pb-6">
                <p className="mt-1 text-center text-xs text-muted-foreground">Arrastra hacia arriba para expandir</p>
                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary">Comentarios</h2>
                    <p className="mt-1 text-sm text-foreground">{reviewsFor.title}</p>
                  </div>
                  <button onClick={() => setReviewsFor(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 border-t border-border" />
                <div className="mt-4 rounded-2xl bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary">Estadísticas de Calificaciones</h3>
                    <span className="text-2xl font-extrabold text-primary">{avg.toFixed(1)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{rs.length} calificaciónes</p>
                    <StarsRow value={avg} size={18} />
                  </div>
                </div>
                <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto">
                  {rs.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay comentarios.</p>
                  )}
                  {rs.map((r, i) => (
                    <div key={i} className="rounded-2xl bg-primary/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                            {r.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary leading-tight">{r.user}</p>
                            <p className="text-xs text-muted-foreground">{r.date}</p>
                          </div>
                        </div>
                        <StarsRow value={r.rating} size={16} />
                      </div>
                      {r.comment && <p className="mt-2 text-sm font-medium text-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    );


    if (subView === 'chat') {
      const handleSend = () => {
        const text = chatInput.trim();
        if (!text) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMsgs((prev) => [...prev, { id: `me-${Date.now()}`, text, isOwn: true, time: now }]);
        setChatInput('');
        // Simulate a reply
        setTimeout(() => {
          const replies = ['¡Qué bueno saber de ti! 🙌', 'Te respondo enseguida ✨', 'Gracias por escribir 💜', 'Cuéntame más 😊'];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          setChatMsgs((prev) => [...prev, {
            id: `r-${Date.now()}`, text: reply, isOwn: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
        }, 900);
      };
      return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary px-4 pt-4 pb-32">
          <SubHeader title={`Chat con ${user.name}`} />
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary font-semibold">{user.initials}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-bold text-foreground">{user.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">En línea</span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3 pt-4">
            {chatMsgs.map((m) => (
              <div key={m.id} className={cn('flex', m.isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                  m.isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card text-foreground rounded-bl-md'
                )}>
                  <p className="text-sm">{m.text}</p>
                  <p className={cn('mt-1 text-[10px] text-right', m.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-border bg-card px-4 py-3">
            <div className="mx-auto flex max-w-lg items-center gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleSend} disabled={!chatInput.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (subView === 'photos') {
      return (
        <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
          <SubHeader title={`Fotos de ${user.name}`} />
          <div className="grid grid-cols-3 gap-2">
            {mock.photos.map((p, i) => (
              <button key={p.id} onClick={() => setPhotoIdx(i)}
                className="aspect-square overflow-hidden rounded-xl bg-card shadow-sm active:scale-95 transition">
                <img src={p.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          {photoIdx !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setPhotoIdx(null)}>
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(null); }}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <X className="h-5 w-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx - 1 + mock.photos.length) % mock.photos.length); }}
                className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <img src={mock.photos[photoIdx].src} alt="" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx + 1) % mock.photos.length); }}
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (subView === 'comments') {
      const handleAdd = () => {
        const text = newComment.trim();
        if (!text) return;
        setComments((prev) => [{ id: `nc-${Date.now()}`, name: 'Tú', initials: 'TU', text, timeAgo: 'justo ahora', likes: 0 }, ...prev]);
        setNewComment('');
        toast.success('Comentario publicado');
      };
      return (
        <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
          <SubHeader title={`Comentarios sobre ${user.name}`} />
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={`Escribe a ${user.name}…`}
                className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleAdd} disabled={!newComment.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-sm">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{c.initials}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <span className="text-[11px] text-muted-foreground">{c.timeAgo}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground">{c.text}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {c.likes}</span>
                    <button className="hover:text-primary">Responder</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (subView === 'publications') {
      return (
        <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
          <SubHeader title={`Publicaciones de ${user.name}`} />
          <div className="space-y-3">
            {mock.publications.map((p) => (
              <div key={p.id} className="rounded-2xl bg-card shadow-sm overflow-hidden">
                <img src={p.image} alt="" className="h-44 w-full object-cover" />
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.timeAgo}</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.likes}</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {p.comments}</span>
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
        <>
        <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
          <SubHeader title={`Eventos de ${user.name}`} />

          <div className="grid grid-cols-2 gap-3">
            {mock.events.map((ev) => {
              const s = STATUS_STYLES[ev.status];
              const avg = ev.reviews.length ? ev.reviews.reduce((a, r) => a + r.rating, 0) / ev.reviews.length : 0;
              const cCount = ev.reviews.filter((r) => r.comment).length;
              const isFinalizado = ev.status === 'finalizado';
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onOpenEventDetail?.({ id: ev.id, title: ev.title, image: ev.image, date: ev.date, location: ev.location, description: ev.description })}
                  className="text-left overflow-hidden rounded-2xl bg-card shadow-sm border border-border/40 transition active:scale-[0.98]"
                >
                  <div className="relative h-32">
                    <img src={ev.image} alt={ev.title} className={cn('h-full w-full object-cover', s.grayscale && 'grayscale')} />
                    <span className={cn('absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', s.className)}>
                      {s.label}
                    </span>
                    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
                      <Heart className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{ev.title}</h3>
                    <p className="mt-1.5 text-sm font-semibold text-foreground">{ev.date}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{ev.location}</p>
                    <p className="mt-1.5 text-xs text-foreground/80 line-clamp-2">{ev.description}</p>
                    {isFinalizado && (
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="h-4 w-4 fill-primary" strokeWidth={2} />
                          <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
                        </div>
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setReviewsFor({ title: ev.title, reviews: ev.reviews }); }}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-primary"
                        >
                          <MessageSquare className="h-4 w-4" strokeWidth={2} />
                          <span className="text-sm font-semibold">{cCount}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {ReviewsDrawer}
        </>
      );
    }

    if (subView === 'venues') {
      return (
        <>
        <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
          <SubHeader title={`Lugares de ${user.name}`} />
          <div className="grid grid-cols-2 gap-3">

            {mock.venues.map((v, idx) => {
              const avg = v.reviews.reduce((a, r) => a + r.rating, 0) / v.reviews.length;
              const cCount = v.reviews.filter((r) => r.comment).length;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onOpenVenueByIndex?.(idx)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border/50 text-left transition active:scale-[0.98]"
                >
                  <div className="relative h-32 w-full overflow-hidden">
                    <img src={v.image} alt={v.name} className="h-full w-full object-cover" />
                    <span className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Heart className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2">{v.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{v.address}</p>
                    <div className="mt-auto flex items-center justify-between pt-2 text-[10px] text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5 line-clamp-1">{v.type}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.capacity}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary" strokeWidth={2} />
                        <span className="text-xs font-bold">{avg.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">({v.reviews.length})</span>
                      </div>
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setReviewsFor({ title: v.name, reviews: v.reviews }); }}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-primary"
                      >
                        <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                        <span className="text-xs font-semibold">{cCount}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {ReviewsDrawer}
        </>
      );
    }

    if (subView === 'services') {
      return (
        <>
        <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
          <SubHeader title={`Servicios de ${user.name}`} />
          <div className="grid grid-cols-2 gap-3">

            {mock.services.map((s, idx) => {
              const avg = s.reviews.reduce((a, r) => a + r.rating, 0) / s.reviews.length;
              const cCount = s.reviews.filter((r) => r.comment).length;
              return (
                <div key={s.id} className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => onOpenServiceByIndex?.(idx)}
                    className="text-left"
                  >
                    <div className="relative h-28 w-full overflow-hidden bg-muted">
                      <img src={s.image} alt={s.sector} className="h-full w-full object-cover" />
                      <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{s.sector}</p>
                      <p className="text-[11px] text-muted-foreground">{s.activities} actividad(es)</p>
                      <p className="mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                        <DollarSign className="h-3 w-3" />
                        {s.price}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-semibold text-foreground">{avg.toFixed(1)}</span>
                    </div>
                    <button
                      onClick={() => setReviewsFor({ title: s.sector, reviews: s.reviews })}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground"
                    >
                      <MessageSquare className="h-3 w-3" />
                      {cCount}
                    </button>
                  </div>
                  <div className="border-t border-border">
                    <button
                      onClick={() => onOpenServiceByIndex?.(idx)}
                      className="flex w-full items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      <CalendarDays className="h-3 w-3" />
                      Reservar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {ReviewsDrawer}
        </>
      );
    }

  }

  // ====== MAIN PROFILE VIEW ======
  return (
    <div className="mx-auto max-w-lg space-y-3 px-4 pt-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="h-24 bg-gradient-to-br from-accent via-primary/60 to-primary" />
        <div className="relative px-5 pb-5">
          <div className="relative -mt-12 mb-3">
            <Avatar className="h-20 w-20 border-4 border-card shadow-lg ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{user.initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-foreground truncate">{user.name}</h2>
                <Shield className="h-4 w-4 text-primary shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
            <Button
              variant={isFollowed || requestPending ? 'outline' : 'default'}
              size="sm"
              className="shrink-0 rounded-full gap-1.5"
              onClick={() => {
                if (isFollowed) onFollow();
                else if (requestPending) toast('Solicitud pendiente');
                else if (isPrivate) onRequestFollow?.();
                else onFollow();
              }}
            >
              {isFollowed ? (<><Check className="h-3.5 w-3.5" />Siguiendo</>)
              : requestPending ? (<><Clock className="h-3.5 w-3.5" />Solicitado</>)
              : isPrivate ? (<><Lock className="h-3.5 w-3.5" />Solicitar</>)
              : (<><UserPlus className="h-3.5 w-3.5" />Seguir</>)}
            </Button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Miembro activo de la comunidad Do•events 🎉
          </p>

          <div className="mt-4 flex items-center gap-5">
            <div className="text-left">
              <p className="text-base font-bold text-foreground leading-none">{Math.max(1, mock.publications.length * 3)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seguidores</p>
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-foreground leading-none">{mock.publications.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seguidos</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-base font-bold text-foreground leading-none">{totalLikes}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Likes</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => requireAccess(() => setSubView('photos'))}
              className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
            >
              <Camera className="h-4 w-4" />
              Ver Fotos
            </button>
            <button
              onClick={() => {
                if (onOpenPrivateChat) onOpenPrivateChat(user);
                else setSubView('chat');
              }}
              className="group flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-[0.97]"
            >
              <MessageSquare className="h-4 w-4" />
              Mensaje
            </button>
          </div>
        </div>
      </div>

      {!canView ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Este perfil es privado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sigue a @{username} para ver sus publicaciones, estadísticas y actividad.
            </p>
          </div>
          {!requestPending ? (
            <Button size="sm" className="rounded-full gap-1.5 mt-1" onClick={() => onRequestFollow?.()}>
              <Lock className="h-3.5 w-3.5" />
              Solicitar seguimiento
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Solicitud pendiente de aprobación
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Experiencia de servicio */}
          {mock.events.length > 0 && (
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-5">Experiencia de servicio</h3>
              <div className="relative pt-3">
                <div className="absolute -top-1 right-0 w-2/5 flex justify-center">
                  <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="h-1.5 flex-1 rounded-full bg-rose-200" />
                  <div className="h-2 flex-1 rounded-full bg-orange-200" />
                  <div className="h-3 flex-1 rounded-full bg-amber-200" />
                  <div className="h-4 flex-1 rounded-full bg-emerald-300" />
                </div>
                <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                  Eventos {mock.events.length}+
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground leading-none">4.8</span>
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">Calificación</span>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground leading-none">3</span>
                    <span className="text-xs text-muted-foreground">meses</span>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">De Eventer</span>
                </div>
                <button onClick={() => setSubView('comments')} className="flex flex-col items-start active:scale-95 transition-transform">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <span className="mt-1 text-xs font-semibold text-primary">Comentarios</span>
                </button>
              </div>
            </div>
          )}

          {/* Mis publicaciones */}
          <button
            onClick={() => setSubView('publications')}
            className="flex w-full flex-col rounded-2xl bg-card p-4 shadow-sm text-left transition active:scale-[0.99]"
          >
            <h3 className="text-base font-bold text-foreground">Mis publicaciones</h3>
            <div className="mt-6 flex items-end justify-between">
              <Megaphone className="h-7 w-7 text-orange-500" />
              <span className="text-2xl font-bold text-muted-foreground">{mock.publications.length}</span>
            </div>
          </button>

          {/* Grid 2-col */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSubView('events')}
              className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-card p-4 shadow-sm text-left transition active:scale-[0.99]"
            >
              <h4 className="text-sm font-bold text-foreground leading-tight">Eventos Creados</h4>
              <div className="flex items-end justify-between">
                <PartyPopper className="h-7 w-7 text-primary" strokeWidth={2.2} />
                <span className="text-xl font-bold text-muted-foreground">{mock.events.length}</span>
              </div>
            </button>
            <button
              onClick={() => setSubView('venues')}
              className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-card p-4 shadow-sm text-left transition active:scale-[0.99]"
            >
              <h4 className="text-sm font-bold text-foreground leading-tight">Mis lugares de eventos</h4>
              <div className="flex items-end justify-between">
                <MapPin className="h-7 w-7 text-sky-500" strokeWidth={2.2} />
                <span className="text-xl font-bold text-muted-foreground">{mock.venues.length}</span>
              </div>
            </button>
          </div>

          {/* Mis servicios */}
          <button
            onClick={() => setSubView('services')}
            className="flex w-full flex-col rounded-2xl bg-card p-4 shadow-sm text-left transition active:scale-[0.99]"
          >
            <h3 className="text-base font-bold text-foreground">Mis servicios</h3>
            <div className="mt-6 flex items-end justify-between">
              <TrendingUp className="h-7 w-7 text-emerald-600" />
              <span className="text-2xl font-bold text-muted-foreground">{mock.services.length}</span>
            </div>
          </button>
        </>
      )}
    </div>
  );
};

export default UserProfileView;
