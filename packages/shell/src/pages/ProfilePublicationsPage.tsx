import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  deletePublication,
  fetchUserPublications,
  Loader,
  resolvePublicationDetailPath,
  RootState,
  type FeedPublication,
} from '@doevents/shared';
import MyPostsView from '@lovable/components/feed/MyPostsView';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import type { Post } from '@lovable/data/mockData';

export const ProfilePublicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<FeedPublication[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const reload = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await fetchUserPublications(userId);
      const feedPosts = items.filter((pub) => pub.type !== 'story');
      setPublications(feedPosts);
      setPosts(feedPosts.map(feedPublicationToLovablePost));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  return (
    <MyPostsView
      onBack={() => navigate('/profile')}
      posts={posts}
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
