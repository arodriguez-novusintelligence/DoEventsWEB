import React, { useState } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);

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
        onClose={() => setViewerUserId(null)}
      />
    </>
  );
};

export default ChatStoriesStrip;
