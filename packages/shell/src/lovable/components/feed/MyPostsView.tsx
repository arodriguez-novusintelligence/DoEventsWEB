import { useState } from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import PostCard from './PostCard';
import { toast } from 'sonner';
import type { Post, User } from '@lovable/data/mockData';
import { users } from '@lovable/data/mockData';
import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';

import type { FeedUiPost as Post } from '@doevents/shared';
interface MyPostsViewProps {
  onBack: () => void;
}

const me: User = users.find((u) => u.id === 'me')!;

const initialMyPosts: Post[] = [
  {
    id: 'my-1',
    user: me,
    timeAgo: 'hace 36 día(s)',
    images: [outdoorDining, modernKitchen],
    title: 'Lunes festivo en RD',
    date: 'Mar 03 del 2026 - 11:00 A.M',
    location: 'Santo Domingo - República Dominicana',
    tags: ['@Jeison Visbal Gomez', '@Kodeefy Development', '@Bart simpson'],
    description:
      '¡Aprovechando el lunes festivo en RD! Compartiendo con amigos y disfrutando la jornada. @Jeison Visbal Gomez @Kodeefy Development @Bart simpson',
    likes: 3,
    likedBy: [users[0], users[1], users[2]],
    comments: [],
    reposts: 0,
    repostedBy: [],
    type: 'evento',
    visibility: 'public',
  },
  {
    id: 'my-2',
    user: me,
    timeAgo: 'hace 61 día(s)',
    images: [modernKitchen, outdoorDining],
    title: 'Pizza time',
    date: 'Ene 06 del 2026 - 8:00 P.M',
    location: 'Apt. 4-A, Edificio Silvia, C. Salvador Sturla 27, Santo Domingo',
    tags: ['@Bart simpson'],
    description:
      'Noche de pizza con amigos. El mejor plan para cerrar la semana. @Bart simpson',
    likes: 12,
    likedBy: [users[0], users[3], users[5]],
    comments: [],
    reposts: 1,
    repostedBy: [users[2]],
    type: 'lugar',
    visibility: 'public',
  },
  {
    id: 'my-3',
    user: me,
    timeAgo: 'hace 72 día(s)',
    images: [vintageCars],
    title: 'Recorrido de carros clásicos',
    date: 'Dic 18 del 2025 - 10:00 A.M',
    location: 'Zona Colonial - Santo Domingo',
    tags: ['@carrosclasicos'],
    description: 'Increíble jornada con autos clásicos por la zona colonial. 🚗✨',
    likes: 27,
    likedBy: [users[1], users[2], users[6]],
    comments: [],
    reposts: 4,
    repostedBy: [users[1], users[3]],
    type: 'evento',
    visibility: 'public',
  },
  {
    id: 'my-4',
    user: me,
    timeAgo: 'hace 90 día(s)',
    images: [dessertFestival],
    title: 'Postres caseros para compartir',
    date: 'Nov 30 del 2025 - 5:00 P.M',
    location: 'Mi cocina - Santo Domingo',
    tags: ['@postres', '@home'],
    description: 'Tarde de repostería en casa. ¿Cuál es tu postre favorito?',
    likes: 18,
    likedBy: [users[0], users[2], users[4]],
    comments: [],
    reposts: 2,
    repostedBy: [users[0]],
    type: 'servicio',
    visibility: 'private',
  },
];

const MyPostsView = ({ onBack }: MyPostsViewProps) => {
  const [posts, setPosts] = useState<Post[]>(initialMyPosts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      const wasLiked = next.has(postId);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      setPosts((ps) =>
        ps.map((p) =>
          p.id === postId
            ? { ...p, likes: p.likes + (wasLiked ? -1 : 1) }
            : p,
        ),
      );
      return next;
    });
  };

  const handleDelete = (postId: string) => {
    setPosts((ps) => ps.filter((p) => p.id !== postId));
    toast.success('Publicación eliminada');
  };

  const noop = () => {};

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="mx-auto max-w-lg">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10 rounded-b-3xl">
          <div className="flex items-center justify-between gap-2">
            <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 rounded-lg px-2 py-1 -ml-2 transition">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-primary-foreground leading-tight truncate">Mis publicaciones</h1>
              <p className="text-[11px] text-primary-foreground/80">{posts.length} Publicaciones</p>
            </div>
          </div>
        </div>

      <div className="px-4 pt-4">


        {posts.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-sm">
            Aún no has publicado nada.
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedPosts.has(post.id)}
              followed={false}
              isOwner
              onLike={() => toggleLike(post.id)}
              onFollow={noop}
              onComment={() => toast('Comentarios')}
              onRepost={() => toast('Repostear')}
              onShare={() => toast.success('Enlace copiado')}
              onHide={noop}
              onNotInterested={noop}
              onBlock={noop}
              onReport={() => toast('Reporte enviado')}
              onEdit={() => toast('Editar publicación')}
              onDelete={() => handleDelete(post.id)}
              onViewLikes={noop}
              onViewReposts={noop}
              onViewProfile={noop}
              onMentionClick={noop}
              onOpenDetail={noop}
            />
          ))
        )}
      </div>
      </div>
    </div>

  );
};

export default MyPostsView;