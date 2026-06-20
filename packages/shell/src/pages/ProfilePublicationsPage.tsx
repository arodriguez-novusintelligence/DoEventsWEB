import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  deletePublication,
  fetchUserPublications,
  resolvePublicationDetailPath,
  RootState,
  type FeedPublication,
} from '@doevents/shared';
import MyPostsView from '@lovable/components/feed/MyPostsView';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import type { Post } from '@doevents/shared';

export const ProfilePublicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publications, setPublications] = useState<FeedPublication[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const reload = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const items = await fetchUserPublications(userId);
      const feedPosts = items.filter((pub) => pub.type !== 'story');
      setPublications(feedPosts);
      setPosts(feedPosts.map(feedPublicationToLovablePost));
    } catch (err) {
      setPublications([]);
      setPosts([]);
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar tus publicaciones');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <MyPostsView
      onBack={() => navigate('/profile')}
      posts={posts}
      loading={loading}
      loadError={loadError}
      onRetry={() => void reload()}
      onDeletePost={async (postId) => {
        await deletePublication(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setPublications((prev) => prev.filter((p) => p.id !== postId));
      }}
      onOpenDetail={(post) => {
        const pub = publications.find((p) => p.id === post.id);
        if (!pub) return;
        const path = resolvePublicationDetailPath(pub);
        if (path) navigate(path);
      }}
    />
  );
};

export default ProfilePublicationsPage;
