import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userIdsMatch } from '@doevents/shared';
import FeedStoriesSection from './FeedStoriesSection';
import { CreateStorySheet } from './CreateStorySheet';
import { StoryViewer } from './StoryViewer';

interface ChatStoriesStripProps {
  currentUserId?: string | null;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export const ChatStoriesStrip: React.FC<ChatStoriesStripProps> = ({
  currentUserId,
  currentUserName,
  currentUserAvatar,
}) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);

  const openAuthorProfile = useCallback((targetUserId: string) => {
    if (!targetUserId) return;
    if (currentUserId && userIdsMatch(targetUserId, currentUserId)) {
      navigate('/profile');
      return;
    }
    navigate(`/users/${encodeURIComponent(targetUserId)}`);
  }, [currentUserId, navigate]);

  return (
    <>
      <FeedStoriesSection
        refreshKey={refreshKey}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        onCreateStory={() => setCreateOpen(true)}
        onOpenStory={(authorId) => setViewerUserId(authorId)}
      />
      <CreateStorySheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setRefreshKey((k) => k + 1);
          setCreateOpen(false);
        }}
      />
      <StoryViewer
        open={Boolean(viewerUserId)}
        authorUserId={viewerUserId}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
        onClose={() => setViewerUserId(null)}
        onOpenProfile={openAuthorProfile}
      />
    </>
  );
};

export default ChatStoriesStrip;
